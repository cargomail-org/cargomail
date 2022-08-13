package cmd

import (
	"github.com/sirupsen/logrus"
	"github.com/spf13/cobra"
)

var startCmd = &cobra.Command{
  Use: "start",
  Run: func(cmd *cobra.Command, args []string) {
	logrus.Info("HTTP Port: ", config.Port)
  },
}