package mailbox

import (
	"context"
	"fmt"
	"net"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"sync"
	"syscall"
	"time"

	imta "github.com/cargomail-org/cargomail/imta"
	cfg "github.com/cargomail-org/cargomail/internal/config"
	"github.com/cargomail-org/cargomail/internal/database"
	"github.com/cargomail-org/cargomail/mailbox/filestore"
	"github.com/rs/cors"
	"github.com/sirupsen/logrus"
	"github.com/zitadel/oidc/pkg/client/rs"
	"golang.org/x/net/http2"
	"golang.org/x/net/http2/h2c"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/health/grpc_health_v1"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"

	"github.com/improbable-eng/grpc-web/go/grpcweb"

	emailv1 "github.com/cargomail-org/cargomail/generated/proto/email/v1"
	peoplev1 "github.com/cargomail-org/cargomail/generated/proto/people/v1"
	emailRepository "github.com/cargomail-org/cargomail/internal/repository/email/v1"
	peopleRepository "github.com/cargomail-org/cargomail/internal/repository/people/v1"
	emailHandler "github.com/cargomail-org/cargomail/pkg/api/email/v1"
	peopleHandler "github.com/cargomail-org/cargomail/pkg/api/people/v1"
)

type AuthIterceptor struct {
	AuthService rs.ResourceServer
}

func Start(wg *sync.WaitGroup, config *cfg.Config) error {
	ctx := context.Background()

	db, err := database.ConnectAsUser(config)
	if err != nil {
		logrus.WithError(err).Fatal("could not connect to db: %v", err)
	} else {
		logrus.Info("connected to db")
	}
	defer db.Close()

	httpPort := fmt.Sprintf("%d", config.Mailbox.Port)

	provider, err := rs.NewResourceServerFromKeyFile(config.Issuer, config.KeyPath)
	if err != nil {
		logrus.Fatalf("error creating provider %s", err.Error())
	}

	auth := AuthIterceptor{AuthService: provider}

	grpcServer := grpc.NewServer(grpc.UnaryInterceptor(auth.UnaryInterceptor))

	grpc_health_v1.RegisterHealthServer(grpcServer, &GrpcHealthService{})
	peoplev1.RegisterPeopleServer(grpcServer, peopleHandler.NewHandler(peopleRepository.NewRepository(db)))
	repo := emailRepository.NewRepository(db)
	emailv1.RegisterEmailServer(grpcServer, emailHandler.NewHandler(repo))

	httpMux := http.NewServeMux()

	grpcWebServer := grpcweb.WrapServer(grpcServer)

	mixedHandler := newCorsHandler(config, auth.newHTTPandGRPCMux(httpMux, grpcServer, grpcWebServer))
	http2Server := &http2.Server{}

	http1Server := &http.Server{Handler: h2c.NewHandler(mixedHandler, http2Server)}
	lis, err := net.Listen("tcp", ":"+httpPort)
	if err != nil {
		logrus.Fatalf("tcp listener on %s failed: %w", httpPort, err)
	}

	filestore.Run(httpMux, repo, config)

	imta.Start(wg, config)
	errCh := make(chan error, 1)
	wg.Add(1)

	go func() {
		defer wg.Done()

		logrus.Infof("mailbox server is listening on %s", lis.Addr().String())
		errCh <- http1Server.Serve(lis)
	}()

	shutdown := make(chan os.Signal, 1)
	signal.Notify(shutdown, os.Interrupt, syscall.SIGTERM)

	select {
	case err := <-errCh:
		return fmt.Errorf("error starting server: %w", err)
	case <-shutdown:
		ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
		defer cancel()
		return shutdownServer(ctx, http1Server)
	case <-ctx.Done():
		return shutdownServer(ctx, http1Server)
	}
}

type GrpcHealthService struct {
	grpc_health_v1.UnimplementedHealthServer
}

func (m *GrpcHealthService) Check(_ context.Context, _ *grpc_health_v1.HealthCheckRequest) (*grpc_health_v1.HealthCheckResponse, error) {
	return &grpc_health_v1.HealthCheckResponse{Status: grpc_health_v1.HealthCheckResponse_SERVING}, nil
}

func (m *GrpcHealthService) Watch(req *grpc_health_v1.HealthCheckRequest, stream grpc_health_v1.Health_WatchServer) error {
	ticker := time.NewTicker(1 * time.Second)
	for ; true; <-ticker.C {
		err := stream.Send(&grpc_health_v1.HealthCheckResponse{Status: grpc_health_v1.HealthCheckResponse_SERVING})
		if err != nil {
			return status.Error(codes.Canceled, "stream has been canceled")
		}
	}
	return nil
}

func (s *AuthIterceptor) newHTTPandGRPCMux(httpHand http.Handler, grpcHandler http.Handler, grpcWebHandler http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.ProtoMajor == 1 && strings.HasPrefix(r.Header.Get("content-type"), "application/grpc-web-text") {
			grpcWebHandler.ServeHTTP(w, r)
			return
		} else if r.ProtoMajor == 2 && strings.HasPrefix(r.Header.Get("content-type"), "application/grpc") {
			grpcHandler.ServeHTTP(w, r)
			return
		}
		s.Authenticate(httpHand).ServeHTTP(w, r)
		// httpHand.ServeHTTP(w, r)
	})
}

func newCorsHandler(config *cfg.Config, srv http.Handler) http.Handler {
	if len(config.Mailbox.Cors.AllowedOrigins) == 0 {
		return srv
	}
	c := cors.New(cors.Options{
		AllowedOrigins:   config.Mailbox.Cors.AllowedOrigins,
		AllowedMethods:   config.Mailbox.Cors.AllowedMethods,
		MaxAge:           config.Mailbox.Cors.MaxAge,
		AllowedHeaders:   config.Mailbox.Cors.AllowedHeaders,
		AllowCredentials: config.Mailbox.Cors.AllowCredentials,
	})
	return c.Handler(srv)
}

func shutdownServer(ctx context.Context, server *http.Server) error {
	err := server.Shutdown(ctx)
	if err != nil {
		return fmt.Errorf("mailbox could not shutdown gracefully: %w", err)
	}
	logrus.Info("mailbox server shutdown gracefully")
	return nil
}

func (s *AuthIterceptor) Authenticate(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		r.Header.Del("Username")

		w.Header().Add("Vary", "Authorization")

		authorizationHeader := r.Header.Get("Authorization")
		if authorizationHeader == "" {
			logrus.Errorf("%v: missing authorization token", codes.Unauthenticated)
			w.WriteHeader(http.StatusUnauthorized)
			return
		}
		parts := strings.Split(authorizationHeader, "Bearer ")
		if len(parts) != 2 {
			logrus.Errorf("%v: invalid token", codes.Unauthenticated)
			w.WriteHeader(http.StatusUnauthorized)
			return
		}
		token := parts[1]

		resp, err := rs.Introspect(context.TODO(), s.AuthService, token)
		if err != nil {
			logrus.Errorf("%v: unauthenticated", codes.Unauthenticated)
			w.WriteHeader(http.StatusUnauthorized)
			return
		}
	
		username, ok := resp.GetClaim("username").(string)
		if !ok {
			logrus.Errorf("%v: claim 'username' does't not exists", codes.Unauthenticated)
			w.WriteHeader(http.StatusUnauthorized)
			return
		}

		r.Header.Add("Username", username)

		next.ServeHTTP(w, r)
	})
}

func (s *AuthIterceptor) UnaryInterceptor(ctx context.Context, req interface{}, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (interface{}, error) {
	md, ok := metadata.FromIncomingContext(ctx)
	if !ok {
		return nil, status.Error(codes.Unauthenticated, "missing context metadata")
	}

	values := md["authorization"]
	if len(values) == 0 {
		logrus.Errorf("%v: missing authorization token", codes.Unauthenticated)
		return nil, status.Error(codes.Unauthenticated, "missing authorization token")
	}

	parts := strings.Split(values[0], "Bearer ")
	if len(parts) != 2 {
		logrus.Errorf("%v: invalid token", codes.Unauthenticated)
		return nil, status.Error(codes.Unauthenticated, "invalid token")
	}
	token := parts[1]

	resp, err := rs.Introspect(ctx, s.AuthService, token)
	if err != nil {
		return nil, status.Errorf(codes.Unauthenticated, "unauthenticated: %v", err)
	}

	username, ok := resp.GetClaim("username").(string)
	if !ok {
		return nil, status.Error(codes.Unauthenticated, "claim 'username' does't not exists")
	}

	md.Append("username", username)
	ctx = metadata.NewIncomingContext(ctx, md)

	return handler(ctx, req)
}
