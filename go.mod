module github.com/cargomail-org/cargomail

go 1.19

require (
	github.com/rs/cors v1.7.0
	github.com/zitadel/oidc v1.7.0
	google.golang.org/grpc v1.48.0
	google.golang.org/protobuf v1.28.1
)

require (
	github.com/cenkalti/backoff/v4 v4.1.1 // indirect
	github.com/desertbit/timer v0.0.0-20180107155436-c41aec40b27f // indirect
	github.com/fsnotify/fsnotify v1.5.4 // indirect
	github.com/gogap/env_json v0.0.0-20150503135429-86150085ddbe // indirect
	github.com/gogap/env_strings v0.0.1 // indirect
	github.com/gorilla/schema v1.2.0 // indirect
	github.com/gorilla/securecookie v1.1.1 // indirect
	github.com/hashicorp/hcl v1.0.0 // indirect
	github.com/heralight/logrus_mate v1.0.1 // indirect
	github.com/hoisie/redis v0.0.0-20160730154456-b5c6e81454e0 // indirect
	github.com/inconshreveable/mousetrap v1.0.0 // indirect
	github.com/klauspost/compress v1.11.7 // indirect
	github.com/magiconair/properties v1.8.6 // indirect
	github.com/mitchellh/mapstructure v1.5.0 // indirect
	github.com/pelletier/go-toml v1.9.5 // indirect
	github.com/pelletier/go-toml/v2 v2.0.1 // indirect
	github.com/spf13/afero v1.8.2 // indirect
	github.com/spf13/cast v1.5.0 // indirect
	github.com/spf13/jwalterweatherman v1.1.0 // indirect
	github.com/spf13/pflag v1.0.5 // indirect
	github.com/subosito/gotenv v1.3.0 // indirect
	golang.org/x/crypto v0.0.0-20220411220226-7b82a4e95df4 // indirect
	golang.org/x/oauth2 v0.0.0-20220722155238-128564f6959c // indirect
	google.golang.org/appengine v1.6.7 // indirect
	gopkg.in/ini.v1 v1.66.4 // indirect
	gopkg.in/square/go-jose.v2 v2.6.0 // indirect
	gopkg.in/yaml.v2 v2.4.0 // indirect
	gopkg.in/yaml.v3 v3.0.1 // indirect
	nhooyr.io/websocket v1.8.6 // indirect
)

require (
	github.com/emersion/go-message v0.16.0
	github.com/golang/protobuf v1.5.2 // indirect
	github.com/heirko/go-contrib v0.0.0-20200825160048-11fc5e2235fa
	github.com/improbable-eng/grpc-web v0.15.0
	github.com/lib/pq v1.10.6
	github.com/sirupsen/logrus v1.9.0
	github.com/spf13/cobra v1.5.0
	github.com/spf13/viper v1.12.0
	golang.org/x/net v0.0.0-20220624214902-1bab6f366d9e
	golang.org/x/sys v0.0.0-20220715151400-c0bba94af5f8 // indirect
	golang.org/x/text v0.3.7 // indirect
	google.golang.org/genproto v0.0.0-20220805133916-01dd62135a58 // indirect
)

replace github.com/zitadel/zitadel-go/v2 => ../cargomail-zitadel-go

replace github.com/zitadel/oidc => ../cargomail-zitadel-oidc
