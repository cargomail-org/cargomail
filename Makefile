.PHONY: generate
generate:
	buf generate

.PHONY: bundle
bundle:
	esbuild ./app/src/index.tsx --bundle --minify --sourcemap --outfile=./app/dist/js/bundle.js

.PHONY: install
install:
	go install github.com/bufbuild/buf/cmd/buf@v1.7.0
	go install github.com/evanw/esbuild/cmd/esbuild@v0.15.2
	docker run --rm -v $$(pwd)/frontend:/src --entrypoint /bin/ash node:18.0.0-alpine -c "cd /src && npm install"

.PHONY: serve
serve:
	go run main.go