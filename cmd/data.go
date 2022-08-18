package cmd

import (
	_ "embed"

	cfg "github.com/federizer/fedemail/internal/config"
	"github.com/federizer/fedemail/internal/database"
	"github.com/sirupsen/logrus"
	"github.com/spf13/cobra"
)

var (
	//go:embed sql/data_database.sql
	insertDataStmt string
)

var dataCmd = &cobra.Command{
	Use: "data",
	Run: func(cmd *cobra.Command, args []string) {
		err := insertData(config)
		if err != nil {
			logrus.WithError(err).Fatal("unable to insert data to the database")
		}
		logrus.Info("script finished")
	},
}

func insertData(config *cfg.Config) error {
	db, err := database.ConnectAsUser(config)
	if err != nil {
		return err
	}
	defer db.Close()

	_, err = db.Exec(insertDataStmt)
	if err != nil {
		return err
	}

	return nil
}
