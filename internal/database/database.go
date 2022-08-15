package database

import (
	"database/sql"
	"strings"

	"github.com/lib/pq"
	_ "github.com/lib/pq"
	"github.com/sirupsen/logrus"

	cfg "github.com/umalabs/fedemail/internal/config"
)

const (
	sslDisabledMode = "disable"
)

func getDbConfig(config *cfg.Config) string {
	fields := []string{
		"host=" + config.Host,
		"port=" + config.Port,
		"sslmode=" + config.SSL.Mode,
	}
	if !strings.EqualFold(config.Database.SSL.Mode, sslDisabledMode) {
		fields = append(fields, "sslrootcert="+config.SSL.RootCert)
		if config.SSL.Cert != "" {
			fields = append(fields, "sslcert="+config.SSL.Cert)
		}
		if config.SSL.Key != "" {
			fields = append(fields, "sslkey="+config.SSL.Key)
		}
	}

	return strings.Join(fields, " ")
}

func getAdminConfig(config *cfg.Config) string {
	fields := []string{
		"user=" + config.Admin.Username,
		"password=" + config.Admin.Password,
	}

	return strings.Join(fields, " ")
}

func getUserConfig(config *cfg.Config) string {
	fields := []string{
		"user=" + config.User.Username,
		"password=" + config.User.Password,
	}

	return strings.Join(fields, " ")
}

func ConnectAsAdmin(config *cfg.Config) (*sql.DB, error) {
	c := getDbConfig(config) + " " + getAdminConfig(config)
	return connect(c, int(config.MaxOpenConns))
}

func ConnectAsUser(config *cfg.Config) (*sql.DB, error) {
	c := getDbConfig(config) + " " + getUserConfig(config)
	return connect(c, int(config.MaxOpenConns))
}

func connect(databaseURL string, maxOpenConns int) (*sql.DB, error) {
	client, err := sql.Open("postgres", databaseURL)
	if err != nil {
		return nil, err
	}

	client.SetMaxOpenConns(maxOpenConns)

	if err := client.Ping(); err != nil {
		return nil, err
	}

	baseConn, err := pq.NewConnector(databaseURL)
	if err != nil {
		return nil, err
	}

	loggingConn := pq.ConnectorWithNoticeHandler(baseConn, func(e *pq.Error) {
		switch e.Severity {
		case "WARNING":
			logrus.Warning(e.Message)
		default:
			logrus.Debug(e.Message)
		}
	})

	db := sql.OpenDB(loggingConn)

	return db, nil
}
