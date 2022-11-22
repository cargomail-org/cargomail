package cmd

import (
	_ "embed"

	cfg "github.com/cargomail-org/cargomail/internal/config"
	"github.com/cargomail-org/cargomail/internal/database"
	"github.com/sirupsen/logrus"
	"github.com/spf13/cobra"
)

var (
	//go:embed sql/setup_database.sql
	setupDabaseStmt string
)

var setupCmd = &cobra.Command{
	Use: "setup",
	Run: func(cmd *cobra.Command, args []string) {
		err := setupDb(config)
		if err != nil {
			logrus.WithError(err).Fatal("unable to setup the database")
		}
		logrus.Info("script finished")
	},
}

func setupDb(config *cfg.Config) error {
	db, err := database.ConnectAsUser(config)
	if err != nil {
		return err
	}
	defer db.Close()

	_, err = db.Exec(setupDabaseStmt)
	if err != nil {
		return err
	}

	return nil
}
