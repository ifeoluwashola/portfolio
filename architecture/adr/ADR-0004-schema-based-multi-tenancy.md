# ADR-0004 — Use PostgreSQL Schema-Based Multi-Tenancy

## Status

Accepted

---

# Context

Kybern operates multiple domains:

- Academy
- Consulting
- Billing
- Identity

Strong data isolation is required.

---

# Decision

Use PostgreSQL schemas:

```
database

├── auth
├── academy
├── billing
├── consulting
└── admin
```

---

# Reasons

Provides:

- Logical isolation
- Lower cost
- Easier operations
- Future migration flexibility

---

# Alternatives Considered

## Database Per Service

Rejected initially.

Reason:

Too much operational overhead.

---

## Database Per Tenant

Rejected.

Reason:

Too expensive and difficult to manage.

---

# Consequences

Positive:

- Simple migrations
- Clear ownership

Negative:

- Requires strict database permissions
- Shared database dependency