package mta

import (
	"fmt"
	"net"
	"os"
	"os/signal"
	"sync"
	"syscall"

	cfg "github.com/federizer/fedemail/internal/config"
	"github.com/sirupsen/logrus"
	"google.golang.org/grpc"
)

func Start(wg *sync.WaitGroup, config *cfg.Config) {
	server := grpc.NewServer()

	httpPort := fmt.Sprintf("%d", config.Mta.Port)

	wg.Add(1)
	go func() {
		defer wg.Done()
		
		lis, err := net.Listen("tcp", ":"+httpPort)
		if err != nil {
			logrus.Fatalf("tcp listener on %s failed: %w", httpPort, err)
		}
		logrus.Infof("mta server is listening on %s", lis.Addr().String())
		if err := server.Serve(lis); err != nil {
			logrus.Fatalf("error starting server: %w", err)
		}
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)

	wg.Add(1)
	go func() {
		defer wg.Done()
		
		<-stop
		server.GracefulStop()
		logrus.Info("mta server shutdown gracefully")
	}()
}
