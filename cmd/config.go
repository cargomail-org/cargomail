package cmd

import (
	"log"

	"github.com/heirko/go-contrib/logrusHelper"
	"github.com/sirupsen/logrus"
	"github.com/spf13/viper"
)

type Config struct {
	MDA Server
	MTA Server
}

type Server struct {
	Port int32
}

var config *Config

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

