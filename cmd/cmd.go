package cmd

import (
	"bytes"
	_ "embed"
	"errors"
	"fmt"
	"log"
	"os"

	"github.com/spf13/cobra"
	"github.com/spf13/viper"

	cfg "github.com/federizer/fedemail/internal/config"
)

//go:embed default.yaml
var defaultConfig []byte
var config *cfg.Config

var rootCmd = &cobra.Command{
	Use: "fedemail",
	RunE: func(cmd *cobra.Command, args []string) error {
		return errors.New("no command provided")
	},
}

func Execute() {
	if err := rootCmd.Execute(); err != nil {
		os.Exit(1)
	}
}

func init() {
	// load config
	config = loadConfig()

	// create database cmd
	rootCmd.AddCommand(initializeCmd)

	// create database schema cmd
	rootCmd.AddCommand(setupCmd)

	// create database data cmd
	rootCmd.AddCommand(dataCmd)

	// start cmd
	rootCmd.AddCommand(startCmd)
}

func loadConfig() *cfg.Config {
	fmt.Println("loading config file...")
	viper.SetConfigName("config")
	viper.SetConfigType("yaml")
	viper.AddConfigPath(("."))

	err := viper.ReadInConfig()
	if err == nil {
		fmt.Println("...config loaded")
		return cfg.NewConfig(viper.GetViper())
	}

	fmt.Println("...config file not found, using default config...")
	if err := viper.ReadConfig(bytes.NewBuffer(defaultConfig)); err != nil {
		log.Fatal(err)
	}
	fmt.Println("...default config loaded")
	return cfg.NewConfig(viper.GetViper())
}
