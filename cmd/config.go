package cmd

import (
	"github.com/heirko/go-contrib/logrusHelper"
	"github.com/sirupsen/logrus"
	"github.com/spf13/viper"
)

type Config struct {
	Port        uint16
}

var config *Config

func NewConfig(v *viper.Viper) *Config {
	config := new(Config)
	err := v.Unmarshal(config)
	if err != nil {
		logrus.WithError(err).Fatal("unable to load configuration")
	}

	var c = logrusHelper.UnmarshalConfiguration(v.Sub("logging"))
	logrusHelper.SetConfig(logrus.StandardLogger(), c)
	if err != nil {
		logrus.WithError(err).Fatal("unable to set logger")
	}

	return config
}