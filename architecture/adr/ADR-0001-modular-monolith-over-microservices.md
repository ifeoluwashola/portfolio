# ADR-0001 — Adopt Modular Monolith Architecture

## Status

Accepted

## Date

2026-07-15

## Decision Owner

Lead Software Architect

---

# Context

Kybern Nexus V2 is expected to support multiple business capabilities:

- Kybern Academy
- Kybern Nexus Consulting
- Billing
- Identity
- Administration
- Future enterprise products

A natural architectural approach would be to implement each capability as an independent microservice.

However, the current business and engineering context requires:

- Fast product iteration
- Low operational overhead
- Small engineering team velocity
- Reduced infrastructure complexity

Premature microservices introduce significant complexity:

- Service discovery
- Network failures
- Distributed transactions
- Deployment coordination
- Increased observability requirements

---

# Decision

Kybern Nexus V2 will adopt a **Modular Monolith architecture**.

The backend will be implemented as:

- One Go application
- Multiple isolated business modules
- Strong domain boundaries
- Independent domain ownership

Example:

```
api-core

├── auth
├── academy
├── billing
├── consulting
└── admin
```

---

# Architectural Rules

Each module owns:

- Business logic
- Database schema
- API contracts
- Domain events

Modules cannot directly access another module's:

- Database tables
- Internal implementation
- Domain objects

Communication occurs through:

- Interfaces
- Domain events

---

# Alternatives Considered

## Microservices

Rejected initially.

Reasons:

- Operational overhead
- Increased deployment complexity
- Higher cloud cost
- Requires mature platform engineering practices

---

## Serverless Functions

Rejected.

Reasons:

- Poor fit for domain-heavy workflows
- Increased fragmentation
- Difficult local development

---

## Traditional Monolith

Rejected.

Reasons:

- Weak domain boundaries
- Difficult future extraction
- Increased coupling

---

# Consequences

## Positive

- Faster development
- Easier debugging
- Lower AWS cost
- Simpler deployment
- Easier local environment

---

## Negative

- Requires strong engineering discipline
- Developers must respect boundaries
- Single deployment unit

---

# Future Migration

If a domain requires extraction:

Example:

```
billing module

        |

billing-service
```

Migration path:

1. Extract interfaces
2. Move database ownership
3. Deploy independently
4. Replace internal calls with API/events

---

# References

Related:

- ADR-0005 Database Outbox Pattern
- ADR-0004 Schema-Based Multi-Tenancy