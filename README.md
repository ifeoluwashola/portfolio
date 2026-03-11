# DevOps Consultant Portfolio & Platform

This is a monorepo containing the personal brand platform and showcase projects for a DevOps & Cloud Engineer.

## Project Structure

- `apps/api`: Go backend designed with Clean Architecture.
- `apps/web`: Next.js 15 frontend application.
- `infra/`: Terraform, Docker, and Kubernetes configurations.

## Development Environment Setup

### Prerequisites

- [Go 1.23+](https://go.dev/)
- [Node.js](https://nodejs.org/) (latest LTS)
- [Make](https://www.gnu.org/software/make/)

### Getting Started

You can run the frontend and backend applications using the root `Makefile`.

1. **Start the applications:**
   Open two separate terminal windows.
   - Terminal 1 (API): `make dev-api`
   - Terminal 2 (Web): `make dev-web`

2. **Run tests:**
   - Run all tests: `make test`
   - Run API tests: `make test-api`
   - Run Web tests: `make test-web`

3. **Build the projects:**
   - Build all apps: `make build`

See `ARCHITECTURE.md` for more technical details on the monorepo architecture and deployment strategies.
