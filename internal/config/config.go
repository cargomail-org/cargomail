package config

import (
	_ "embed"
	"log"
	"net/http"
	"os"
	"reflect"
	"regexp"
	"strings"
	"time"

	"gopkg.in/yaml.v2"
)

//go:embed default.yaml
var defaultConfig []byte

var (
	Configuration Config
)

type Config = struct {
	DomainName           string `yaml:"domainName"`
	StoragePath          string `yaml:"storagePath"`
	DatabasePath         string `yaml:"databasePath"`
	ResourcesPath        string `yaml:"resources_path"`
	BlobsFolder          string `yaml:"blobsFolder"`
	FilesFolder          string `yaml:"filesFolder"`
	EmailAddressCertPath string `yaml:"emailAddressCertPath"`
	EmailAddressKeyPath  string `yaml:"emailAddressKeyPath"`
	EmailAddressBind     string `yaml:"emailAddressBind"`
	EmailAddressBindTLS  string `yaml:"emailAddressBindTLS"`
	MailboxCertPath      string `yaml:"mailboxCertPath"`
	MailboxKeyPath       string `yaml:"mailboxKeyPath"`
	MailboxBind          string `yaml:"mailboxBind"`
	MailboxBindTLS       string `yaml:"mailboxBindTLS"`
	CookieSameSite       string `yaml:"cookieSameSite"`
	Stage                string `yaml:"stage"`
	// SessionTTL       time.Duration
}

const (
	DefaultBlobsFolder    = "blobs"
	DefaultFilesFolder    = "files"
	DefaultCookieSameSite = http.SameSiteStrictMode
	DefaultSessionTTL     = 24 * time.Hour
	DefaultMaxUploadSize  = 1024 // MB
	DefaultMaxBodySize    = 1    // MB
)

func newConfig() Config {
	c := Config{}

	setDefaults(&c)
	loadConfig(&c)

	if len(c.BlobsFolder) == 0 {
		c.BlobsFolder = DefaultBlobsFolder
	}

	if len(c.FilesFolder) == 0 {
		c.FilesFolder = DefaultFilesFolder
	}

	// c.SessionTTL = DefaultSessionTTL

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
			reflect.ValueOf(c).Elem().FieldByName(field.Name).Set(reflect.ValueOf(os.Getenv(strings.ToUpper(toSnakeCase(value)))))
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

var matchFirstCap = regexp.MustCompile("(.)([A-Z][a-z]+)")
var matchAllCap = regexp.MustCompile("([a-z0-9])([A-Z])")

func toSnakeCase(str string) string {
	snake := matchFirstCap.ReplaceAllString(str, "${1}_${2}")
	snake = matchAllCap.ReplaceAllString(snake, "${1}_${2}")
	return strings.ToLower(snake)
}

func DevStage() bool {
	return strings.EqualFold(Configuration.Stage, "dev")
}

func CookieSameSite() http.SameSite {
	cookieSameSite := strings.ToUpper(Configuration.CookieSameSite)

	switch cookieSameSite {
	case "STRICT":
		return http.SameSiteStrictMode
	case "LAX":
		return http.SameSiteLaxMode
	case "NONE":
		return http.SameSiteNoneMode
	default:
		return DefaultCookieSameSite
	}
}

func init() {
	Configuration = newConfig()
}
