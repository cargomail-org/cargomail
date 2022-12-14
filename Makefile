# regenerate protobuf
.PHONY: generate
generate:
	buf generate

# bundle js
.PHONY: bundle
bundle:
	esbuild ./client/src/index.tsx --bundle --minify --sourcemap --outfile=./client/dist/js/bundle.js

# install tools
.PHONY: install
install:
	go install github.com/bufbuild/buf/cmd/buf@v1.7.0
	go install github.com/evanw/esbuild/cmd/esbuild@v0.15.2
	docker run --rm -v $$(pwd)/frontend:/src --entrypoint /bin/ash node:18.0.0-alpine -c "cd /src && npm install"

# running (serving on http://0.0.0.0:8080)
.PHONY: serve
serve:
	go run main.go