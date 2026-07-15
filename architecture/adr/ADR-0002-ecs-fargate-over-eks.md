# ADR-0002 — Use AWS ECS Fargate Instead of EKS

## Status

Accepted

---

# Context

The platform requires containerized deployment.

Possible AWS solutions:

- ECS Fargate
- EKS Kubernetes
- EC2 based containers

Although Kubernetes provides extensive flexibility, running EKS introduces additional operational responsibilities:

- Cluster upgrades
- Node management
- Networking configuration
- Add-on management
- Security patches

The current objective is business velocity.

---

# Decision

Deploy applications using:

- Amazon ECS
- AWS Fargate
- Docker containers

Architecture:

```
Application Load Balancer

        |

ECS Service

        |

Fargate Tasks
```

---

# Reasons

## Reduced Operational Complexity

AWS manages:

- Servers
- Nodes
- Scaling infrastructure

---

## Cost Efficiency

Avoids:

- Kubernetes control plane management
- Dedicated platform engineering effort

---

## Better Team Alignment

Allows engineers to focus on:

- Product development
- Application reliability
- Business features

---

# Alternatives Considered

## Amazon EKS

Rejected initially.

Reason:

Operational complexity exceeds current requirements.

---

## EC2 Auto Scaling

Rejected.

Reason:

Requires server management.

---

# Consequences

## Positive

- Faster deployments
- Lower maintenance
- Native AWS integration

---

## Negative

- Less Kubernetes flexibility
- Less ecosystem portability

---

# Future Consideration

Migration to EKS can happen if:

- Platform team grows
- Kubernetes-specific workloads appear
- Multi-cloud becomes required