package config

import (
	_ "embed"
	"log"
	"net/http"
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
	DomainName       string        `yaml:"domain_name"`
	StoragePath      string        `yaml:"storage_path"`
	DatabasePath     string        `yaml:"database_path"`
	ResourcesPath    string        `yaml:"resources_path"`
	BodiesFolder     string        `yaml:"bodies_folder"`
	FilesFolder      string        `yaml:"files_folder"`
	TransferCertPath string        `yaml:"transfer_cert_path"`
	TransferKeyPath  string        `yaml:"transfer_key_path"`
	ProviderBind     string        `yaml:"provider_bind"`
	TransferBind     string        `yaml:"transfer_bind"`
	CookieSameSite   http.SameSite `yaml:"cookie_same_site"`
	Stage            string        `yaml:"stage"`
}

const (
	DefaultBodiesFolder   = "bodies"
	DefaultFilesFolder    = "files"
	DefaultCookieSameSite = http.SameSiteStrictMode
)

func newConfig() Config {
	c := Config{}

	setDefaults(&c)
	loadConfig(&c)

	if len(c.BodiesFolder) == 0 {
		c.BodiesFolder = DefaultBodiesFolder
	}

	if len(c.FilesFolder) == 0 {
		c.FilesFolder = DefaultFilesFolder
	}

	if c.CookieSameSite == 0 {
		c.CookieSameSite = DefaultCookieSameSite
	}

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
			if value == "cookie_same_site" {
				var sameSite http.SameSite

				envValue := os.Getenv(strings.ToUpper(value))

				switch envValue {
				case "STRICT":
					sameSite = http.SameSiteStrictMode
				case "LAX":
					sameSite = http.SameSiteLaxMode
				case "NONE":
					sameSite = http.SameSiteNoneMode
				default:
					sameSite = DefaultCookieSameSite
				}

				reflect.ValueOf(c).Elem().FieldByName(field.Name).Set(reflect.ValueOf(sameSite))
			} else {
				reflect.ValueOf(c).Elem().FieldByName(field.Name).Set(reflect.ValueOf(os.Getenv(strings.ToUpper(value))))
			}
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
