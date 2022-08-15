package cmd

import (
	_ "embed"
	"fmt"

	"github.com/sirupsen/logrus"
	"github.com/spf13/cobra"

	cfg "github.com/umalabs/fedemail/internal/config"
	"github.com/umalabs/fedemail/internal/database"
)

var config *cfg.Config

var (
	//go:embed sql/init_database.sql
	initDabaseSql string
)

var initialize = &cobra.Command{
	Use: "init",
	Run: func(cmd *cobra.Command, args []string) {
		err := initDb(config.Database.Admin.Username, config.Database.Admin.Password)
		if err != nil {
			logrus.WithError(err).Fatal("unable to create the database")
		}
    logrus.Info("database created")
	},
}

func initDb(username, password string) error {
	logrus.WithFields(logrus.Fields{"username": username}).Info("init user")

	db, err := database.ConnectAsAdmin(config)
	if err != nil {
		return err
	}
	defer db.Close()

	stmt := fmt.Sprintf(initDabaseSql, config.User.Username, config.User.Password, config.DatabaseName)
	_, err = db.Exec(stmt)
	if err != nil {
		return err
	}

	return nil
}
