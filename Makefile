.PHONY: build dev test

# ==============================================================================
# Commands for apps/api
# ==============================================================================

build-api:
	cd apps/api && go build -o bin/api cmd/api/main.go

dev-api:
	cd apps/api && go run cmd/api/main.go

test-api:
	cd apps/api && go test -v ./...

# ==============================================================================
# Commands for apps/web
# ==============================================================================

build-web:
	cd apps/web && npm run build

dev-web:
	cd apps/web && npm run dev

test-web:
	cd apps/web && npm run test

# ==============================================================================
# Root Commands
# ==============================================================================

build: build-api build-web
dev:
	@echo "Run 'make dev-api' and 'make dev-web' in separate terminals to start the development environments."

test: test-api test-web
