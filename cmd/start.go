package cmd

import (
	"sync"

	webmail "github.com/federizer/fedemail/webmail"
	"github.com/sirupsen/logrus"
	"github.com/spf13/cobra"
)

var startCmd = &cobra.Command{
	Use: "start",
	Run: func(cmd *cobra.Command, args []string) {
		var wg sync.WaitGroup

		err := webmail.Start(&wg, config)
		if err != nil {
			logrus.WithError(err).Fatal("unable to start the webmail server")
		}
		wg.Wait()
	},
}
