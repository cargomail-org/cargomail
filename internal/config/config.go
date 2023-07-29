package config

import (
	_ "embed"
	"log"
	"os"
	"reflect"
	"strings"

	"gopkg.in/yaml.v2"
)

//go:embed default.yaml
var defaultConfig []byte

type StartFlags = struct {
	DomainName       string `yaml:"domain_name"`
	StoragePath      string `yaml:"storage_path"`
	DatabasePath     string `yaml:"database_path"`
	FilesPath        string `yaml:"files_path"`
	TransferCertPath string `yaml:"transfer_cert_path"`
	TransferKeyPath  string `yaml:"transfer_key_path"`
	ProviderBind     string `yaml:"provider_bind"`
	TransferBind     string `yaml:"transfer_bind"`
}

func NewStartFlags() StartFlags {
	sf := StartFlags{}

	setDefaults(&sf)
	loadConfig(&sf)

	return sf
}

func setDefaults(sf *StartFlags) {
	err := yaml.Unmarshal(defaultConfig, sf)
	if err != nil {
		log.Fatal(err)
	}

	for i := 0; i < reflect.TypeOf(*sf).NumField(); i++ {
		field := reflect.TypeOf(*sf).Field(i)
		if value, ok := field.Tag.Lookup("yaml"); ok {
			reflect.ValueOf(sf).Elem().FieldByName(field.Name).Set(reflect.ValueOf(os.Getenv(strings.ToUpper(value))))
		}
	}
}

func loadConfig(sf *StartFlags) {
	configFile, err := os.ReadFile("config.yaml")
	if err != nil {
		return
	}

	err = yaml.Unmarshal(configFile, sf)
	if err != nil {
		log.Fatal(err)
	}
}
