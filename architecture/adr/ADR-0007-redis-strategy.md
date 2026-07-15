# ADR-0007 — Redis Usage Strategy

## Status

Accepted

## Date

2026-07-15

## Decision Owner

Lead Software Architect

---

# Context

Kybern Nexus V2 requires a high-performance temporary data layer for:

- Application caching
- Session management
- Rate limiting
- Event signaling
- Short-lived application state

However, Redis introduces a critical architectural consideration:

Redis is an in-memory system and should not become the authoritative source of business data.

Critical business information such as:

- Payments
- User records
- Enrollment status
- Financial transactions

must always have durable storage.

---

# Decision

Kybern Nexus will use Amazon ElastiCache Redis as a **performance and coordination layer only**.

Redis will support:

- Caching
- Temporary state
- Rate limiting
- Session support
- Event signaling

Redis will not be used as the source of truth for business-critical information.

---

# Approved Redis Usage

## 1. Application Caching

Redis will cache frequently accessed data.

Example:

```
academy:labs:public
```

Purpose:

Cache publicly available Break-It Labs.

Example configuration:

```
TTL: 1 hour
```

Cache invalidation occurs when:

- Content changes
- Related domain events are processed

---

## 2. Authentication Support

Redis will support authentication-related temporary state.

Example:

```
jwt:blacklist:{token_id}
```

Purpose:

Invalidate previously issued tokens.

Use cases:

- Logout
- Account suspension
- Security events

---

## 3. Rate Limiting

Redis will provide distributed rate limiting.

Example:

```
api:rate:{user_id}
```

Use cases:

- API protection
- Abuse prevention
- Brute force protection

---

## 4. Event Signaling

Redis will be used as a lightweight signaling mechanism for the Database Outbox Pattern.

Flow:

```
Business Transaction

        |

PostgreSQL

        |

Outbox Event Created

        |

Redis Pub/Sub Signal

        |

Background Worker

        |

Event Processing

```

Redis only signals that work exists.

The actual event data remains stored in PostgreSQL.

---

# Architectural Rules

## Rule 1 — Redis Is Never the Source of Truth

The following must never exist only in Redis:

- Payment records
- User accounts
- Enrollment records
- Financial transactions
- Audit records

---

## Rule 2 — Every Cache Entry Requires Ownership

Every Redis key must document:

- Owner domain
- Purpose
- TTL
- Invalidation strategy

Example:

```
Key:

academy:labs:public


Owner:

Academy Domain


TTL:

3600 seconds


Invalidation:

LabVerified event

```

---

## Rule 3 — Redis Failure Must Not Corrupt Business State

Application behavior during Redis failure:

Example:

```
Redis unavailable

        |

Fallback to PostgreSQL

        |

Continue operation

```

Where fallback is not possible:

- Fail safely
- Do not write inconsistent data

---

# Alternatives Considered

## Alternative 1 — Kafka

### Decision

Rejected initially.

### Reason

Kafka introduces:

- Operational complexity
- Infrastructure overhead
- Additional monitoring requirements

Current event volume does not justify it.

---

## Alternative 2 — RabbitMQ

### Decision

Rejected initially.

### Reason

Although suitable for messaging workflows, it introduces another infrastructure component to maintain.

The Database Outbox Pattern provides sufficient reliability at current scale.

---

## Alternative 3 — Database-Only Caching

### Decision

Rejected.

### Reason

Would increase:

- Database load
- Query latency
- Infrastructure cost

---

# Consequences

## Positive Consequences

- Reduced database pressure
- Faster application responses
- Simple AWS operational model
- Low infrastructure complexity

---

## Negative Consequences

- Cache invalidation complexity
- Additional monitoring requirement
- Memory limitations

---

# Future Evolution

If event processing requirements grow significantly:

Current:

```
PostgreSQL Outbox

        |

Redis Pub/Sub

        |

Workers

```

Future:

```
PostgreSQL Outbox

        |

Amazon SNS/SQS

        |

Kafka / Amazon MSK

        |

Consumers

```

Migration can happen without changing domain business logic.

---

# Related Decisions

- ADR-0005 — Database Outbox Event Pattern
- ADR-0003 — Aurora PostgreSQL Serverless v2
- ADR-0001 — Modular Monolith Architecture