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

var (
	Configuration Config
)

type Config = struct {
	DomainName       string `yaml:"domain_name"`
	StoragePath      string `yaml:"storage_path"`
	DatabasePath     string `yaml:"database_path"`
	BodyPath         string `yaml:"body_path"`
	TagsPath         string `yaml:"tags_path"`
	FilesPath        string `yaml:"files_path"`
	TransferCertPath string `yaml:"transfer_cert_path"`
	TransferKeyPath  string `yaml:"transfer_key_path"`
	ProviderBind     string `yaml:"provider_bind"`
	TransferBind     string `yaml:"transfer_bind"`
	Stage            string `yaml:"stage"`
}

func newConfig() Config {
	c := Config{}

	setDefaults(&c)
	loadConfig(&c)

	return c
}

func setDefaults(c *Config) {
	err := yaml.Unmarshal(defaultConfig, c)
	if err != nil {
		log.Fatal(err)
	}

	for i := 0; i < reflect.TypeOf(*c).NumField(); i++ {
		field := reflect.TypeOf(*c).Field(i)
		if value, ok := field.Tag.Lookup("yaml"); ok {
			reflect.ValueOf(c).Elem().FieldByName(field.Name).Set(reflect.ValueOf(os.Getenv(strings.ToUpper(value))))
		}
	}
}

func loadConfig(c *Config) {
	configFile, err := os.ReadFile("config.yaml")
	if err != nil {
		return
	}

	err = yaml.Unmarshal(configFile, c)
	if err != nil {
		log.Fatal(err)
	}
}

func DevStage() bool {
	return strings.EqualFold(Configuration.Stage, "dev")
}

func init() {
	Configuration = newConfig()
}
