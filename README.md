# FlowForge — Advanced Workflow Automation Platform

FlowForge is a high-performance, full-stack workflow automation engine built for the **Halleyx Full Stack Engineer Challenge 2026**. It allows users to design, validate, and execute complex multi-step processes with conditional logic and real-time monitoring.

## ✨ 2026 Challenge Features (Recently Completed)

- **Audit Log System**: Precision tracking of every execution with detailed status, timestamps, and triggered users.
- **Visual Workflow Editor**: Stateful ReactFlow canvas with drag-and-drop mechanics and auto-layout.
- **Infinite Loop Protection**: Smart engine tracking that prevents cycles by enforcing per-step execution limits.
- **Workflow Validation**: Integrated "dry-run" validation that checks for logical gaps, unreachable steps, and missing configurations before execution.
- **Paginated Management**: Server-side pagination and debounced search for efficient handling of large workflow repositories.
- **Elastic Rule Engine**: Custom expression evaluator supporting relational operators (`>`, `<`, `==`) and complex data schemas.

## 🛠️ Technical Architecture

- **Backend**: Spring Boot 3.2 (Java 21) | JPA | PostgreSQL | Flyway Migrations | Swagger/OAS 3.0.
- **Frontend**: React 18 (TypeScript) | Vite | TailwindCSS | ReactFlow | TanStack Query v5.
- **Security**: Stateless JWT Authentication with custom UserDetails and Secure Context management.

## 📂 Project Structure

- `backend/`: Core logic, REST APIs, and the Workflow Rule Engine.
- `frontend/`: Modern responsive UI for workflow design and execution.
- `docs/sample-workflows/`: Pre-configured JSON templates (Employee Onboarding, Expense Approval).

## 🚀 Getting Started

### Prerequisites
- Docker & Docker Compose
- Java 21 (optional for local build)
- Node 20+ (optional for local build)

### Quick Run (Docker)
```bash
docker-compose up --build
```
- **Login**: `admin@flowforge.com` / `password123` (or register a new account).

## 🔑 Key Endpoints
- **Swagger UI**: `http://localhost:8080/swagger-ui/index.html`
- **Audit Logs**: `GET /api/v1/executions` (Paginated)
- **Validation**: `POST /api/v1/workflows/{id}/validate`

---
*Developed for the Halleyx Challenge by Antigravity (Advanced Agentic Coding).*

