# ARCHITECTURE.MD: DevOps Consultant Portfolio & Platform

## 1. Executive Summary

**Owner:** Ifeoluwa (Senior DevOps & Cloud Engineer)  
**Project Goal:** To build a high-performance personal brand platform that showcases professional projects, hosts technical articles, and serves as a lead-generation tool for DevOps consulting (Workflow Optimization, Automation, and Cost Reduction).

---

## 2. Core Personas & Value Proposition

* **The DevOps Consultant:** Focuses on helping companies optimize ROI, automate manual processes, and build secure, scalable cloud infrastructure.
* **The Engineer (Builder):** Showcases high-quality tools like **Guardrail** (Go CLI) and **MartsPlaza** (Digital Marketplace).
* **The Thought Leader:** Publishes deep-dive articles on Kubernetes, Go, and Platform Engineering via a Git-based blog.

---

## 3. Technical Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui |
| **Backend** | Go (Golang) 1.23+ following Hexagonal/Clean Architecture |
| **Database** | PostgreSQL (Supabase) |
| **Content** | MDX (Markdown for Blog) |
| **Infrastructure** | Terraform (IaC), Docker, Kubernetes (EKS/GKE) |
| **CI/CD** | GitHub Actions |
| **Observability** | Prometheus/Grafana (Embedded "Live Metrics" dashboard) |

---

## 4. System Components

### `apps/web` (Frontend)

* **Hero Section:** Value-driven headline: *"Optimizing Cloud ROI through DevOps Automation."*
* **Consulting Services:** - **Infrastructure Audit:** Cost reduction and performance tuning.
     **CI/CD Pipeline Hardening:** Automating secure deployment workflows.
     **Cloud Migration:** Scalable architecture design (AWS/GCP/Azure).
* **Projects Showcase:** Dynamic cards fetching data for **Guardrail** and **MartsPlaza**.
* **The Lab (Blog):** SEO-optimized technical writing platform using MDX.

### `apps/api` (Backend)

* **Architecture:** Standard Go layout (`/cmd`, `/internal`, `/pkg`).
* **Functionality:** - Contact form processing & lead capturing.
     GitHub API integration for live project stats.
     Health check and Prometheus metrics endpoints.

### `infra/` (DevOps)

* **Terraform:** Modular IaC for provisioning cloud resources.
* **K8s/Helm:** Deployment manifests for a containerized environment.
* **Workflows:** GitHub Actions for linting, testing, and multi-stage deployment.

---

## 5. Implementation Principles (For Antigravity Agents)

1. **Modular Design:** Keep frontend components (shadcn) separate from business logic.
2. **Performance First:** Prioritize server-side rendering (SSR) for the blog and SEO.
3. **Security:** Implement least-privilege principles in all infrastructure code.
4. **Clean Code:** Use Go best practices (interfaces for dependency injection) in the API.

---

## 6. Project Roadmap

* [ ] Phase 1: Workspace Initialization (Monorepo setup).
* [ ] Phase 2: Backend API scaffolding (Go).
* [ ] Phase 3: Frontend UI/UX development (Next.js).
* [ ] Phase 4: Blog & Content Integration (MDX).
* [ ] Phase 5: Infrastructure & CI/CD Setup.
