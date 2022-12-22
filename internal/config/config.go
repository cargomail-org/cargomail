package config

import (
	"log"

	"github.com/heirko/go-contrib/logrusHelper"
	"github.com/sirupsen/logrus"
	"github.com/spf13/viper"
)

type Config struct {
	Mailbox Server
	IMTA    Server // should be iMTA
	Database
	OIDC
	Filestore
}

type Server struct {
	Uri  string
	Port int
	Cors
}

type Cors struct {
	AllowedOrigins   []string `mapstructure:"allowed_origins"`
	AllowedMethods   []string `mapstructure:"allowed_methods"`
	AllowedHeaders   []string `mapstructure:"allowed_headers"`
	MaxAge           int      `mapstructure:"max_age"`
	AllowCredentials bool     `mapstructure:"allow_credentials"`
}

type Database struct {
	Host         string
	Port         string
	MaxOpenConns int `mapstructure:"max_open_conns"`
	Admin
	User
	SSL
}

type SSL struct {
	Mode     string
	RootCert string `mapstructure:"root_cert"`
	Cert     string
	Key      string
}

type Admin struct {
	DatabaseName string `mapstructure:"database_name"`
	Username     string
	Password     string
}

type User struct {
	DatabaseName string `mapstructure:"database_name"`
	Username     string
	Password     string
}

type OIDC struct {
	Issuer  string
	KeyPath string `mapstructure:"key_path"`
}

type Filestore struct {
	Path     string
	BasePath string `mapstructure:"base_path"`
}

func NewConfig(v *viper.Viper) *Config {
	config := new(Config)
	err := v.Unmarshal(config)
	if err != nil {
		log.Fatal("unable to load logger configuration: ", err)
	}

	var c = logrusHelper.UnmarshalConfiguration(v.Sub("logging"))
	logrusHelper.SetConfig(logrus.StandardLogger(), c)
	if err != nil {
		log.Fatal("unable to set logger: ", err)
	}

	return config
}
