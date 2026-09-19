# ── Stage 1: build ──────────────────────────────────────────────────────────
FROM golang:1.21-alpine AS builder

WORKDIR /app

# Copy dependency manifests first to leverage Docker layer caching.
COPY go.mod go.sum ./
RUN go mod download

# Copy source and compile a statically-linked binary.
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /livepoll ./cmd/main.go

# ── Stage 2: minimal runtime image ──────────────────────────────────────────
FROM alpine:3.19

RUN apk --no-cache add ca-certificates tzdata

WORKDIR /app
COPY --from=builder /livepoll .

EXPOSE 8080

ENTRYPOINT ["/app/livepoll"]
