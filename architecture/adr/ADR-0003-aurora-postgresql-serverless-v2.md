# ADR-0003 — Adopt Aurora PostgreSQL Serverless v2

## Status

Accepted

---

# Context

Kybern Nexus requires a relational database supporting:

- Transactional workloads
- Financial records
- User management
- Learning workflows

Traffic patterns are expected to fluctuate:

- Cohort launches
- Training events
- Normal idle periods

---

# Decision

Use:

Amazon Aurora PostgreSQL Serverless v2

---

# Reasons

Provides:

- PostgreSQL compatibility
- Automatic scaling
- High availability
- Managed backups
- Read replicas

---

# Alternatives Considered

## Standard RDS PostgreSQL

Rejected initially.

Reason:

Requires manual capacity planning.

---

## DynamoDB

Rejected.

Reason:

Relational workflows and transactions are dominant.

---

# Consequences

Positive:

- Managed operations
- Scaling flexibility
- PostgreSQL ecosystem

Negative:

- Higher baseline cost
- Requires ACU tuning