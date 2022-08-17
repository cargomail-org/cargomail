package cmd

import (
	cfg "github.com/federizer/fedemail/internal/config"
	"github.com/sirupsen/logrus"
	"github.com/spf13/cobra"
)

var startCmd = &cobra.Command{
	Use: "start",
	Run: func(cmd *cobra.Command, args []string) {
		err := startServer(config)
		if err != nil {
			logrus.WithError(err).Fatal("unable to start server")
		}
		logrus.Info("server started")
	},
}

func startServer(config *cfg.Config) error {
	logrus.Info("MDA Port: ", config.Mda.Port)
	logrus.Info("MTA Port: ", config.Mta.Port)

	return nil
}
