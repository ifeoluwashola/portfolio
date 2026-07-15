# Kybern Nexus Limited — System Design

## Document Information

| Field | Value |
|---|---|
| Document | System Design |
| Version | 1.0 |
| Status | Draft |
| Owner | Lead Software Architect |
| Backend | Go Modular Monolith |
| Database | PostgreSQL |
| Cache | Redis |
| Cloud | AWS |

---

# 1. Executive Summary

This document defines the detailed system design for Kybern Nexus V2.

The system follows the approved enterprise and software architecture decisions:

- Modular Monolith
- Domain Driven Design
- Hexagonal Architecture
- PostgreSQL schema isolation
- Event-driven workflows using Database Outbox Pattern
- AWS managed infrastructure

The platform consists of five primary business domains:

1. Identity & IAM
2. Academy
3. Consulting
4. Billing
5. Admin

Each domain owns:

- Business logic
- Data model
- APIs
- Events
- Workflows

---

# 2. System Context

```
                    Users

                      |
                      v

               Next.js Applications

        +-------------+-------------+

        |             |             |

     Academy       Nexus          Admin


                      |

                      v

              Kybern API Core

          Go Modular Monolith


        +-------------+-------------+

        |             |             |

      Auth        Academy       Billing

        |             |             |

      DB Schema Isolation + Outbox


                      |

                      v

              Aurora PostgreSQL

                      |

                      v

                Redis Cache
```

---

# 3. Domain: Identity & IAM

## 3.1 Responsibility

The Identity domain provides centralized authentication and authorization for all Kybern applications.

---

## Responsibilities

- User registration
- Login
- Logout
- Session management
- Role management
- Permissions
- Account lifecycle

---

## Database Ownership

Schema:

```
auth
```

---

## Tables

## users

```sql
users

id UUID PRIMARY KEY

email VARCHAR UNIQUE

password_hash TEXT

status VARCHAR

created_at TIMESTAMP

updated_at TIMESTAMP
```

---

## roles

```sql
roles

id UUID

name VARCHAR

permissions JSONB

created_at TIMESTAMP
```

---

## user_roles

```sql
user_roles

user_id UUID

role_id UUID
```

---

## sessions

```sql
sessions

id UUID

user_id UUID

refresh_token_hash TEXT

expires_at TIMESTAMP
```

---

# API Design

## Login

```
POST /api/v2/auth/login
```

Request:

```json
{
 "email":"user@example.com",
 "password":"password"
}
```

Response:

```json
{
 "user":{
   "id":"uuid",
   "email":"user@example.com"
 }
}
```

Authentication token:

```
Secure HttpOnly Cookie
```

---

## Logout

```
POST /api/v2/auth/logout
```

---

## Current User

```
GET /api/v2/auth/me
```

---

# Events

## Published

```
UserCreated

UserRoleUpdated

UserSuspended
```

---

# Security Design

Password hashing:

```
Argon2id
```

Token storage:

```
Redis blacklist

jwt:blacklist:{token_id}
```

---

# 4. Domain: Academy

## Responsibility

The Academy domain powers the B2C learning platform.

---

## Responsibilities

- Courses
- Cohorts
- Enrollment
- Students
- Instructors
- Break-It Labs
- Threads
- Mentorship

---

# Database Schema

Schema:

```
academy
```

---

# Tables

## courses

```sql
courses

id UUID

title VARCHAR

slug VARCHAR

status VARCHAR
```

---

## cohorts

```sql
cohorts

id UUID

course_id UUID

start_date DATE

status VARCHAR
```

---

## enrollments

```sql
enrollments

id UUID

user_id UUID

cohort_id UUID

status VARCHAR
```

---

## labs

```sql
labs

id UUID

title VARCHAR

scenario JSONB

is_public BOOLEAN
```

---

## submissions

```sql
lab_submissions

id UUID

lab_id UUID

student_id UUID

solution JSONB

status VARCHAR
```

---

# APIs

## Public Labs

```
GET /api/v2/academy/labs/public
```

Purpose:

Public Break-It Labs.

Caching:

```
Redis TTL 1 hour
```

---

## Submit Lab

```
POST /api/v2/academy/labs/{id}/submit
```

---

## Verify Submission

```
POST /api/v2/academy/submissions/{id}/verify
```

---

# Events

Published:

```
LabSubmitted

LabVerified

ThreadCreated
```

Consumed:

```
PaymentReceived
```

---

# 5. Domain: Consulting

## Responsibility

B2B enterprise workflows.

---

## Responsibilities

- Lead management
- Enterprise customers
- API keys
- Guardrail CLI
- CMP telemetry

---

# Database Schema

```
consulting
```

---

# Tables

## leads

```sql
leads

id UUID

company_name VARCHAR

email VARCHAR

status VARCHAR
```

---

## api_keys

```sql
api_keys

id UUID

client_id UUID

hashed_key TEXT

scopes JSONB

expires_at TIMESTAMP
```

---

## telemetry

```sql
cmp_telemetry

id UUID

client_id UUID

payload JSONB

created_at TIMESTAMP
```

---

# APIs

## Create Lead

```
POST /api/v2/consulting/leads
```

---

## Validate CLI Key

```
GET /api/v2/consulting/guardrail/validate
```

---

# Redis Usage

API keys cached:

```
consulting:key:{hash}
```

Purpose:

Fast CLI authentication.

---

# 6. Domain: Billing

## Responsibility

Financial source of truth.

---

## Responsibilities

- Payment initialization
- Payment verification
- Webhooks
- Transactions
- Revenue records

---

# Database Schema

```
billing
```

---

# Tables

## transactions

```sql
transactions

id UUID

reference VARCHAR

amount INTEGER

currency VARCHAR

status VARCHAR
```

---

# Payment Flow

```
User

 |

Academy

 |

Billing

 |

Paystack

 |

Webhook

 |

Billing Transaction

 |

PaymentReceived Event
```

---

# API

Webhook endpoint:

```
POST /api/v2/billing/webhooks/paystack
```

---

# Webhook Handling

Steps:

1. Verify signature
2. Validate payload
3. Begin transaction
4. Save payment
5. Create outbox event
6. Commit
7. Publish signal

---

# Events

Published:

```
PaymentReceived

PaymentFailed

RefundProcessed
```

---

# 7. Domain: Admin

## Responsibility

Global platform control plane.

---

## Responsibilities

- Analytics
- Configuration
- Management tools

---

# Database

Schema:

```
admin
```

---

# Tables

## platform_config

```sql
platform_config

key VARCHAR

value JSONB
```

---

# APIs

Dashboard:

```
GET /api/v2/admin/dashboard
```

---

# 8. Event Architecture

## Database Outbox Pattern

The platform avoids external brokers initially.

---

## Flow

```
Application Transaction

        |

PostgreSQL

+----------------+

Business Data

+

Outbox Event

+----------------+

        |

Worker

        |

Redis Signal

        |

Consumer
```

---

# Outbox Table

Schema:

```
shared
```

Table:

```
outbox_events
```

Fields:

```sql
id UUID

event_type VARCHAR

payload JSONB

status VARCHAR

retry_count INTEGER

created_at TIMESTAMP
```

---

# 9. Payment Sequence Example

```mermaid
sequenceDiagram

actor Student

participant UI as Academy UI

participant API as Go API

participant Billing

participant DB

participant Paystack


Student->>UI:
Checkout

UI->>API:
Create Payment

API->>Billing:
Initialize Payment

Billing->>Paystack:
Create Transaction

Paystack-->>Billing:
Payment URL

Billing-->>UI:
Redirect URL


Paystack->>Billing:
Webhook

Billing->>DB:
Save Transaction

Billing->>DB:
Create Outbox Event

DB-->>Billing:
Commit

Billing->>Academy:
PaymentReceived Event
```

---

# 10. Resilience Strategy

## Database Connection Management

Go configuration:

```
SetMaxOpenConns

SetMaxIdleConns

ConnMaxLifetime
```

---

# External Service Failure

Example:

Paystack unavailable.

Solution:

Circuit breaker:

```
sony/gobreaker
```

Behavior:

```
Request

 |

Circuit Open

 |

Fast Failure

 |

Retry Later
```

---

# 11. Background Processing

Workers handle:

- Emails
- Events
- Notifications
- Cleanup jobs

Implementation:

Go goroutines.

---

# 12. Dead Letter Handling

Failed events:

```
retry_count >= 5
```

Move to:

```
failed
```

Admin can replay manually.

---

# 13. Monitoring Requirements

Every domain exposes:

Metrics:

```
request_count

error_rate

latency

queue_depth

database_connections
```

---

Logs include:

```
trace_id

request_id

domain

user_id

event_type
```

---

# 14. Scaling Strategy

## Horizontal Scaling

ECS tasks scale based on:

- CPU
- Memory
- Request count

---

## Database Scaling

Aurora provides:

- Read replicas
- Storage scaling
- Automated backups

---

## Redis Scaling

Used for:

- Cache
- Sessions
- Rate limits

Never authoritative data.

---

# 15. Future Evolution Path

The architecture allows extraction:

Example:

Today:

```
api-core

 |
 billing module
```

Future:

```
billing-service

 |

billing database
```

Extraction triggers:

- Independent scaling requirement
- Team ownership requirement
- Deployment independence requirement

---

# 16. Final System Design Summary

| Domain | Responsibility |
|-|-|
| Auth | Identity & Access |
| Academy | Education Platform |
| Consulting | B2B Services |
| Billing | Financial System |
| Admin | Platform Control |

---

# Status

This document represents the approved V2 system design baseline.

Implementation should begin only after:

- Architecture review
- Engineering approval
- ADR review
- Sprint planning