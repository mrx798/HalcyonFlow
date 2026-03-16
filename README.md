# FlowForge — Workflow Automation Platform

FlowForge is a robust, full-stack workflow automation platform designed for enterprise scalability. It enables users to define complex workflows, set conditional rules with a custom expression engine, and execute tasks with real-time feedback.

## 🚀 Features

- **Dynamic Workflow Builder**: Create and manage multi-step workflows.
- **Advanced Rule Engine**: Define logic using complex conditions (e.g., `amount > 5000 AND department == 'Sales'`).
- **Real-time Execution**: Async processing with detailed logging and state management.
- **Secure Authentication**: JWT-based security with Role-Based Access Control (RBAC).
- **Comprehensive Dashboard**: Monitor stats, recent executions, and notifications.

## 🛠️ Tech Stack

- **Backend**: Spring Boot 3.2, Java 21, JPA/Hibernate, PostgreSQL, Flyway.
- **Frontend**: React 18, TypeScript, Vite, TailwindCSS, Lucide Icons.
- **Infrastructure**: Docker & Docker Compose.
- **Testing**: JUnit 5, Mockito, MockMvc, H2.

## 📦 Quick Start

### Prerequisites
- Docker & Docker Compose
- Java 21 (for manual build)
- Node 20 (for manual build)

### 1. Using Docker (Recommended)
```bash
docker-compose up --build
```
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8080/api/v1`
- Swagger Docs: `http://localhost:8080/swagger-ui.html`

### 2. Manual Setup
**Backend:**
```bash
cd backend
mvn clean install
mvn spring-boot:run
```
**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## 🧪 Running Tests
```bash
cd backend
mvn test
```
Includes 20+ unit tests for the Rule Engine and full integration tests for Workflow CRUD.

## 📂 Project Structure
- `backend/`: Spring Boot application.
- `frontend/`: React application.
- `samples/`: Sample workflow JSON definitions.
- `postman/`: Postman collection for API testing.

## 🔑 Default Credentials
- **Email**: `admin@flowforge.com`
- **Password**: `admin123` (Note: Register a new user via the UI/API for first-time use).

---
Developed for the Company Placement Challenge.
