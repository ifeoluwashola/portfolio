# ADR-0006 — Adopt Next.js Multi-App Architecture with Shared Design System

## Status

Accepted

## Date

2026-07-15

## Decision Owner

Lead Software Architect

---

# Context

Kybern Nexus Limited consists of multiple products and user experiences:

- Kybern Academy (B2C learning platform)
- Kybern Nexus (B2B consulting platform)
- Main Kybern public website
- Future enterprise products and platforms

Each product has different:

- User journeys
- Business workflows
- Release requirements
- Feature priorities

A single frontend application would create unnecessary coupling between independent business domains.

However, completely separate frontend applications would introduce duplication across:

- UI components
- Branding
- Authentication flows
- Form patterns
- User experience standards

A balance is required between product independence and engineering consistency.

---

# Decision

Kybern will adopt a **multi-application Next.js architecture** with a shared internal design system.

Each product will maintain its own frontend application while consuming shared packages.

The architecture will follow:

```
Frontend Ecosystem

                    @kybern/ui

                         |

        +----------------+----------------+

        |                |                |

 kybern-web     kybern-academy-web   kybern-nexus-web

```

---

# Application Ownership

## Kybern Academy Web Application

Responsible for:

- Student experience
- Course discovery
- Cohort management
- Learning workflows
- Break-It Labs
- Student dashboards
- Instructor workflows

---

## Kybern Nexus Web Application

Responsible for:

- Enterprise client experience
- Consulting workflows
- Guardrail CLI dashboards
- CMP dashboards
- Enterprise reporting

---

## Main Kybern Website

Responsible for:

- Marketing pages
- Public documentation
- Product information
- Company information

---

# Shared Design System

A dedicated repository will be created:

```
kybern-ui
```

This package becomes the single source of truth for shared frontend standards.

The package will contain:

- UI components
- Design tokens
- Typography
- Theme configuration
- Form components
- Layout primitives
- Navigation components
- Accessibility standards

Example usage:

```bash
npm install @kybern/ui
```

---

# Package Distribution

The shared package will be distributed using one of:

- AWS CodeArtifact
- GitHub Packages
- Private npm registry

The final choice will depend on repository strategy and operational preference.

---

# Reasons for Decision

## 1. Product Independence

Each application can:

- Deploy independently
- Scale independently
- Release independently
- Adopt product-specific workflows

---

## 2. Engineering Consistency

The shared design system ensures:

- Consistent Kybern branding
- Reusable components
- Reduced duplication
- Faster frontend development

---

## 3. Team Scalability

Different engineering teams can own different applications without creating frontend fragmentation.

Example:

```
Academy Team

        |

kybern-academy-web


Nexus Team

        |

kybern-nexus-web

```

---

# Alternatives Considered

## Alternative 1 — Single Next.js Application

### Decision

Rejected.

### Reason

A single application would create:

- Tight coupling between unrelated products
- Larger deployment surface
- Increased regression risk
- Difficult ownership boundaries

---

## Alternative 2 — Completely Independent Frontend Applications

### Decision

Rejected.

### Reason

Would create:

- Duplicate components
- Inconsistent UX
- Multiple implementations of the same patterns
- Increased maintenance cost

---

# Consequences

## Positive Consequences

- Independent product development
- Better ownership boundaries
- Reusable frontend infrastructure
- Consistent user experience
- Faster feature delivery

---

## Negative Consequences

- Multiple frontend deployments
- Additional package management
- Requires design system governance
- Requires versioning strategy

---

# Future Considerations

The shared frontend ecosystem may expand into additional internal packages:

```
@kybern/ui

@kybern/auth

@kybern/sdk

@kybern/config

@kybern/api-client

```

This creates a reusable internal frontend platform.

---

# Related Decisions

- ADR-0001 — Modular Monolith Architecture
- ADR-0007 — Redis Usage Strategy