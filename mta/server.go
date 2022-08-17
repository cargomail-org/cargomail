package mta

import (
	"context"
	"fmt"
	"net"
	"os"
	"os/signal"
	"sync"
	"syscall"

	cfg "github.com/federizer/fedemail/internal/config"
	"github.com/sirupsen/logrus"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/health/grpc_health_v1"
	"google.golang.org/grpc/status"
)

func Start(wg *sync.WaitGroup, config *cfg.Config) {
	grpcServer := grpc.NewServer()

	httpPort := fmt.Sprintf("%d", config.Mta.Port)

	wg.Add(1)
	go func() {
		defer wg.Done()
		
		lis, err := net.Listen("tcp", ":"+httpPort)
		if err != nil {
			logrus.Fatalf("tcp listener on %s failed: %w", httpPort, err)
		}
		logrus.Infof("mta server is listening on %s", lis.Addr().String())
		if err := grpcServer.Serve(lis); err != nil {
			logrus.Fatalf("error starting server: %w", err)
		}
	}()

	svc := &GrpcService{}
	grpc_health_v1.RegisterHealthServer(grpcServer, svc)

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)

	wg.Add(1)
	go func() {
		defer wg.Done()
		
		<-stop
		grpcServer.GracefulStop()
		logrus.Info("mta server shutdown gracefully")
	}()
}

type GrpcService struct {
	grpc_health_v1.UnimplementedHealthServer
}

func (m *GrpcService) Check(_ context.Context, _ *grpc_health_v1.HealthCheckRequest) (*grpc_health_v1.HealthCheckResponse, error) {
	return &grpc_health_v1.HealthCheckResponse{Status: grpc_health_v1.HealthCheckResponse_SERVING}, nil
}

func (m *GrpcService) Watch(req *grpc_health_v1.HealthCheckRequest, stream grpc_health_v1.Health_WatchServer) error {
	return status.Error(codes.Unimplemented, "Watch is not implemented")
}
