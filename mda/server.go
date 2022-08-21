package mda

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

	cfg "github.com/federizer/fedemail/internal/config"
	"github.com/federizer/fedemail/internal/database"
	mta "github.com/federizer/fedemail/mta"
	"github.com/rs/cors"
	"github.com/sirupsen/logrus"
	"golang.org/x/net/http2"
	"golang.org/x/net/http2/h2c"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/health/grpc_health_v1"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"

	"github.com/improbable-eng/grpc-web/go/grpcweb"

	"github.com/federizer/fedemail/generated/proto/fedemail/v1"
	"github.com/federizer/fedemail/generated/proto/people/v1"
	fedemailRepository "github.com/federizer/fedemail/internal/repository/fedemail/v1"
	peopleRepository "github.com/federizer/fedemail/internal/repository/people/v1"
	fedemailHandler "github.com/federizer/fedemail/pkg/api/fedemail/v1"
	peopleHandler "github.com/federizer/fedemail/pkg/api/people/v1"
)

func Start(wg *sync.WaitGroup, config *cfg.Config) error {
	ctx := context.Background()

	db, err := database.ConnectAsUser(config)
	if err != nil {
		logrus.WithError(err).Fatal("could not connect to db: %v", err)
	} else {
		logrus.Info("connected to db")
	}
	defer db.Close()

	httpPort := fmt.Sprintf("%d", config.Mda.Port)

	grpcServer := grpc.NewServer(grpc.UnaryInterceptor(AuthInterceptor))

	grpc_health_v1.RegisterHealthServer(grpcServer, &GrpcHealthService{})
	peoplev1.RegisterPeopleServer(grpcServer, peopleHandler.NewHandler(peopleRepository.NewRepository(db)))
	fedemailv1.RegisterFedemailServer(grpcServer, fedemailHandler.NewHandler(fedemailRepository.NewRepository(db)))

	httpMux := http.NewServeMux()

	grpcWebServer := grpcweb.WrapServer(grpcServer)

	mixedHandler := newCorsHandler(config, newHTTPandGRPCMux(httpMux, grpcServer, grpcWebServer))
	http2Server := &http2.Server{}

	http1Server := &http.Server{Handler: h2c.NewHandler(mixedHandler, http2Server)}
	lis, err := net.Listen("tcp", ":"+httpPort)
	if err != nil {
		logrus.Fatalf("tcp listener on %s failed: %w", httpPort, err)
	}

	mta.Start(wg, config)

	errCh := make(chan error, 1)

	wg.Add(1)
	go func() {
		defer wg.Done()

		logrus.Infof("mda server is listening on %s", lis.Addr().String())
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

func newHTTPandGRPCMux(httpHand http.Handler, grpcHandler http.Handler, grpcWebHandler http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.ProtoMajor == 1 && strings.HasPrefix(r.Header.Get("content-type"), "application/grpc-web-text") {
			grpcWebHandler.ServeHTTP(w, r)
			return
		} else if r.ProtoMajor == 2 && strings.HasPrefix(r.Header.Get("content-type"), "application/grpc") {
			grpcHandler.ServeHTTP(w, r)
			return
		}
		httpHand.ServeHTTP(w, r)
	})
}

func newCorsHandler(config *cfg.Config, srv http.Handler) http.Handler {
	if len(config.Mda.Cors.AllowedOrigins) == 0 {
		return srv
	}
	c := cors.New(cors.Options{
		AllowedOrigins:   config.Mda.Cors.AllowedOrigins,
		AllowedMethods:   config.Mda.Cors.AllowedMethods,
		MaxAge:           config.Mda.Cors.MaxAge,
		AllowedHeaders:   config.Mda.Cors.AllowedHeaders,
		AllowCredentials: config.Mda.Cors.AllowCredentials,
	})
	return c.Handler(srv)
}

func shutdownServer(ctx context.Context, server *http.Server) error {
	err := server.Shutdown(ctx)
	if err != nil {
		return fmt.Errorf("mda could not shutdown gracefully: %w", err)
	}
	logrus.Info("mda server shutdown gracefully")
	return nil
}

func AuthInterceptor(ctx context.Context, req interface{}, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (interface{}, error) {
	meta, ok := metadata.FromIncomingContext(ctx)
	if !ok {
		return nil, status.Error(codes.Unauthenticated, "missing context metadata")
	}
	if len(meta["authorization"]) != 1 {
		return nil, status.Error(codes.Unauthenticated, "missing authorization token")
	}
	return handler(ctx, req)
}
