FROM golang:1.26-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -o /api ./cmd/api

FROM alpine:latest

RUN addgroup -S kybern && adduser -S kybern -G kybern

WORKDIR /app

COPY --from=builder --chown=kybern:kybern /api /app/api
COPY --from=builder --chown=kybern:kybern /app/internal/database/migrations /app/migrations

USER kybern

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

CMD ["./api"]
