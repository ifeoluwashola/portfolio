# ADR-0005 — Adopt Database Outbox Event Pattern

## Status

Accepted

---

# Context

The platform requires reliable events:

Examples:

- Payment received
- Lab verified
- User created

Using external brokers introduces unnecessary infrastructure complexity.

---

# Decision

Implement:

Database Outbox Pattern

---

# Flow

```
Business Transaction

        |

PostgreSQL

+----------------+

Business Data

Outbox Event

+----------------+

        |

Worker

        |

Consumer
```

---

# Reasons

Guarantees:

- Atomic data + event creation
- Event recovery
- Reliable processing

---

# Alternatives Considered

## Kafka

Rejected initially.

Reason:

Operational overhead.

---

## RabbitMQ

Rejected initially.

Reason:

Additional infrastructure.

---

# Consequences

Positive:

- Reliable events
- Simple operations

Negative:

- Requires worker implementation
- Event latency slightly higher