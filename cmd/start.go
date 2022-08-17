package cmd

import (
	"sync"

	mda "github.com/federizer/fedemail/mda"
	"github.com/sirupsen/logrus"
	"github.com/spf13/cobra"
)

var startCmd = &cobra.Command{
	Use: "start",
	Run: func(cmd *cobra.Command, args []string) {
		var wg sync.WaitGroup
		
		err := mda.Start(&wg, config)
		if err != nil {
			logrus.WithError(err).Fatal("unable to start mda server")
		}
		wg.Wait()
	},
}