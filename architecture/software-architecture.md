# Kybern Nexus Limited — Software Architecture

## Document Information

| Field | Value |
|---|---|
| Document | Software Architecture |
| Version | 1.0 |
| Status | Draft |
| Owner | Lead Software Architect |
| Backend Language | Go |
| Frontend Framework | Next.js |
| Architecture Style | Modular Monolith + Domain Driven Design |

---

# 1. Executive Summary

This document defines the internal software architecture standards for Kybern Nexus V2.

The objective is to establish a scalable engineering foundation that enables:

- Fast feature delivery
- Clear ownership boundaries
- Maintainable codebases
- Strong testing practices
- Future service extraction when required

The backend architecture follows:

- Domain Driven Design (DDD)
- Hexagonal Architecture
- Clean Architecture principles
- Modular Monolith design

The frontend architecture follows:

- Next.js App Router
- Feature-based organization
- Shared design system
- API-driven architecture

---

# 2. Backend Architecture

## 2.1 Architectural Decision

The backend will be implemented as a Go Modular Monolith.

High-level structure:

```
Kybern API Core

cmd/
 |
 +-- api/

internal/

 ├── auth/
 ├── academy/
 ├── billing/
 ├── consulting/
 ├── admin/
 └── shared/
```

Each domain behaves as an independent application boundary.

---

# 3. Why Modular Monolith?

## Advantages

### Development Speed

A single deployment:

- Easier local development
- Faster debugging
- Simplified CI/CD

---

### Operational Simplicity

Avoids:

- Multiple services
- Service discovery
- Distributed tracing complexity
- Network failures between services

---

### Future Migration Path

A properly designed module can become:

```
internal/billing

        ↓

billing-service
```

without rewriting business logic.

---

# 4. Hexagonal Architecture

Each domain follows Ports and Adapters.

Example:

```
academy/

├── domain/
│
├── application/
│
├── ports/
│
├── adapters/
│
└── transport/
```

---

# 5. Layer Responsibilities

## Domain Layer

Contains business rules.

Examples:

- Enrollment rules
- Payment rules
- User permissions

Must NOT know:

- Database
- HTTP
- Redis
- AWS

---

## Application Layer

Coordinates business workflows.

Examples:

```
CreateEnrollment()
ProcessPayment()
VerifyLabSubmission()
```

Responsible for:

- Use cases
- Transactions
- Domain orchestration

---

## Infrastructure Layer

Contains external implementations.

Examples:

```
PostgresRepository
RedisCache
PaystackClient
SESClient
```

---

## Transport Layer

Handles external communication.

Examples:

```
HTTP handlers
JSON serialization
Middleware
Authentication
```

---

# 6. Dependency Rules

The dependency direction is:

```
Transport

   ↓

Application

   ↓

Domain


Infrastructure implements interfaces
```

---

## Forbidden Dependency

Example:

```
academy

  ❌ imports

billing database code
```

Domains communicate through:

- Interfaces
- Events

---

# 7. Domain Module Structure

Example:

```
internal/academy/

├── domain/
│   ├── cohort.go
│   ├── enrollment.go
│   └── errors.go
│
├── application/
│   ├── enroll_student.go
│   └── verify_lab.go
│
├── ports/
│   ├── repository.go
│   └── notifier.go
│
├── adapters/
│   ├── postgres/
│   └── redis/
│
└── transport/
    └── http/
```

---

# 8. Dependency Injection

Dependencies should be injected explicitly.

Example:

```go
type AcademyService struct {
    repo EnrollmentRepository
    events EventPublisher
}
```

Construction happens in:

```
cmd/api/main.go
```

---

# 9. Repository Pattern

Database access must not leak into business logic.

Example:

Interface:

```go
type UserRepository interface {

    FindByID(
        ctx context.Context,
        id string,
    ) (*User,error)

    Save(
        ctx context.Context,
        user *User,
    ) error
}
```

Implementation:

```
postgres/UserRepository
```

---

# 10. Unit of Work Pattern

Used where multiple database operations must commit atomically.

Example:

Payment flow:

```
BEGIN TRANSACTION

Insert payment

Insert outbox event

COMMIT
```

---

# 11. Event Architecture

The system uses:

## Database Backed Outbox Pattern

Purpose:

Guarantee reliable event delivery.

---

## Flow

```
Business Transaction

       |

Postgres

 ├── Domain Data

 └── Outbox Event


       |

Worker


       |

External Action
```

---

# 12. API Architecture

## Style

REST JSON API.

Base URL:

```
/api/v2/
```

---

Example:

```
GET

/api/v2/academy/labs
```

---

# 13. API Standards

## Versioning

All APIs must be versioned.

Example:

```
/api/v2/auth/login
```

---

## Response Format

Success:

```json
{
 "data": {},
 "meta": {}
}
```

---

Error:

```json
{
 "error": {
   "code":"INVALID_REQUEST",
   "message":"Invalid email"
 }
}
```

---

# 14. Error Handling

Errors must be:

- Typed
- Traceable
- User-safe

Example:

```
ErrUserNotFound
ErrPermissionDenied
ErrPaymentFailed
```

---

# 15. Logging Standards

Use Go structured logging.

Technology:

```
log/slog
```

Every log entry should contain:

```
{
 trace_id,
 request_id,
 user_id,
 domain,
 action
}
```

---

# 16. Database Architecture

## PostgreSQL

Logical schemas:

```
postgres

├── auth

├── academy

├── billing

├── consulting

└── admin
```

---

# 17. Migration Strategy

Tool:

```
golang-migrate
```

Migration workflow:

```
Developer

 |
Migration file

 |
CI Validation

 |
Deployment

 |
Database Migration

 |
Application Release
```

---

# 18. Database Standards

## Naming

Tables:

```
snake_case_plural
```

Example:

```
user_sessions
payment_transactions
```

---

## Primary Keys

Preferred:

```
UUID
```

---

## Audit Columns

Every table:

```
created_at
updated_at
```

Important entities:

```
deleted_at
```

---

# 19. Soft Delete Strategy

Entities requiring recovery:

```
deleted_at TIMESTAMP
```

Repositories automatically filter:

```
WHERE deleted_at IS NULL
```

---

# 20. Frontend Architecture

## Framework

Next.js App Router.

Applications:

```
academy-web

nexus-web

main-web
```

---

# 21. Frontend Structure

Feature-based architecture.

Example:

```
src/

├── app/

├── features/

│   ├── auth/

│   ├── labs/

│   ├── billing/

│
├── components/

├── hooks/

├── lib/

└── services/
```

---

# 22. Data Fetching

Standard:

- TanStack Query
- Next.js Server Components

---

Usage:

Server Components:

- SEO pages
- Public content

React Query:

- Dashboard
- Dynamic data
- User interactions

---

# 23. Authentication Strategy

Frontend does not own authorization decisions.

Flow:

```
Browser

 |
Cookie

 |
Go API

 |
Permission Check

 |
Response
```

The API decides:

```
401 Unauthorized

403 Forbidden
```

---

# 24. Shared Design System

Multiple applications share:

```
@kybern/ui
```

Repository:

```
kybern-ui
```

Contains:

- Components
- Theme
- Branding
- Forms
- Layouts

Published through:

- AWS CodeArtifact
- GitHub Packages

---

# 25. Testing Strategy

## Backend

Testing pyramid:

```
          E2E

       Integration

     Unit Tests
```

---

Required:

- Unit tests
- Repository tests
- API tests
- Contract tests

---

# 26. Code Quality Standards

Required:

- golangci-lint
- gofmt
- static analysis
- security scanning

CI must fail on:

- lint failures
- architecture violations
- failed tests

---

# 27. Architecture Enforcement

Use automated checks:

Example:

```
academy

cannot import

billing
```

Tools:

- go-arch-lint
- custom CI checks

---

# 28. Engineering Summary

| Area | Standard |
|-|-|
| Backend | Go |
| Architecture | Hexagonal + DDD |
| Deployment | Modular Monolith |
| API | REST JSON |
| Database | PostgreSQL |
| Migration | golang-migrate |
| Cache | Redis |
| Frontend | Next.js |
| State | TanStack Query |
| Logging | slog |
| Testing | Unit + Integration + E2E |
| CI Quality | Automated Architecture Checks |

---

# Next Phase

The next document:

`03-system-design.md`

defines the detailed implementation design for:

- Authentication
- Academy
- Consulting
- Billing
- Admin

Including:

- Database schemas
- API contracts
- Events
- Sequence diagrams
- Failure handling
- Scaling strategy