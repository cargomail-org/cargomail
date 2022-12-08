package cmd

import (
	"sync"

	mailbox "github.com/cargomail-org/cargomail/mailbox"
	"github.com/sirupsen/logrus"
	"github.com/spf13/cobra"
)

var startCmd = &cobra.Command{
	Use: "start",
	Run: func(cmd *cobra.Command, args []string) {
		var wg sync.WaitGroup

		err := mailbox.Start(&wg, config)
		if err != nil {
			logrus.WithError(err).Fatal("unable to start the mailbox server")
		}
		wg.Wait()
	},
}
