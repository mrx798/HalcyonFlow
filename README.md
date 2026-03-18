# ⚡ HalcyonFlow — Workflow Automation Platform

> Design workflows. Define rules. Execute processes. Track every step.

HalcyonFlow is a full-stack enterprise workflow automation platform built for the **Halleyx Full Stack Engineer Challenge 2026**. It enables teams to visually design multi-step business processes, define conditional routing rules using a custom expression engine, execute workflows with real input data, and audit every decision with detailed logs — all without writing code.



### Rule Engine in Action

[Step 1] Initial Check
Rules evaluated:
  ✅ amount > 100 && country == 'INDIA' → true
  ❌ DEFAULT → false
Next Step: Manager Approval
Status: completed
Duration: 00:00:00

[Step 2] Manager Approval  
Rules evaluated:
  ✅ DEFAULT → true
Next Step: Finance Notification
Status: COMPLETED
Approver: shah
Duration: 00:00:01
```

## 🧩 Problem Statement

Modern businesses run on processes — expense approvals, employee onboarding, content reviews, customer refunds. These processes involve multiple people, multiple systems, and multiple conditions. Most teams manage them through emails, spreadsheets, and manual follow-ups — leading to delays, missed steps, wrong approvals, and zero visibility into what happened.

**HalcyonFlow solves this by giving teams:**
- A visual way to design any business process as a workflow
- A rule engine to define conditional routing — if amount > 100 AND country is US, go to Manager Approval; otherwise, go to Rejection
- An execution engine that runs the workflow automatically, pauses for human decisions, and continues
- A complete audit trail of every rule evaluated, every decision made, and every step taken

---

## ✨ Features

### Core Features
- **Visual Workflow Editor** — List-based step builder with input schema management
- **Custom Rule Engine** — Evaluates conditions like `amount > 100 && country == 'US'` at runtime with full AND/OR/comparison support
- **Three Step Types** — Task (automated), Approval (human-in-the-loop), Notification (alerts)
- **Dynamic Execution Forms** — Auto-generated from workflow input schema with field validation
- **Live Execution Progress** — Real-time step tracking with current step highlighting
- **Human Approval Flow** — Execution pauses at approval steps, resumes on Approve/Reject
- **Execution Logs** — Every rule evaluated with TRUE/FALSE result, selected next step, approver, duration
- **Audit Log** — Complete execution history for compliance and debugging

### Technical Features
- **JWT Authentication** — Access token + refresh token with BCrypt password hashing
- **Async Execution Engine** — Java 21 Virtual Threads for concurrent workflow processing
- **Workflow Versioning** — Every update creates a new version; running executions are never broken
- **Retry Logic** — Retry only the failed step, not the entire workflow
- **Rule Validation** — Syntax validation before saving conditions
- **DEFAULT Rule** — Required fallback when no condition matches
- **OpenAPI/Swagger** — Auto-generated API documentation
- **Flyway Migrations** — Database schema versioned and tracked

### Bonus Features
- Real-time Dashboard with execution trends and statistics
- Notifications system for execution events and approvals
- Workflow statistics (total runs, success rate, average runtime)
- Postman collection with 28 pre-configured requests
- Docker one-command setup

---

## 🧪 Running Tests
```bash
cd backend

# Run all tests
mvn test

# Run rule engine tests only
mvn test -Dtest=RuleEngineTest,ExpressionParserTest

# Run with coverage report
mvn test jacoco:report
```
Expected output:
```
Tests run: 20+, Failures: 0, Errors: 0
BUILD SUCCESS
```
## 🔄 How The Process Works — Step by Step

### Step 1: Design Your Workflow

Open HalcyonFlow, click **New Workflow**, and give it a name like "Expense Approval".

Define the **Input Schema** — what data this workflow needs:
```
amount     → number  → required
country    → string  → required
department → string  → optional
priority   → string  → required  → allowed: 1,2,3,......
```

### Step 2: Add Steps

Add steps to define what happens in the workflow. Each step has a type:

| Type | Icon | Purpose |
|------|------|---------|
| Task | ⚙ | Automated action — runs instantly |
| Approval | ✓ | Pauses and waits for a human to approve or reject |
| Notification | 🔔 | Sends a notification and continues |

Example steps for Expense Approval:
```
1. Initial Check      (Task)         ← evaluates rules, routes to next step
2. Manager Approval   (Approval)     ← pauses, human must approve
3. Finance Notification (Notification) ← sends notification, continues
4. CEO Approval       (Approval)     ← pauses, human must approve
5. Task Rejection     (Task)         ← end of rejection path
```

### Step 3: Define Rules

Click the **Rules** badge on any step to add routing rules. Rules decide which step runs next based on the input data.

Example rules on **Initial Check**:
```
Priority 1: amount > 100 && country == 'INDIA'  →  Manager Approval
Priority 2: DEFAULT                              →  Task Rejection
```

Rules are evaluated in priority order. The **first rule that evaluates to TRUE** wins. If no rule matches, the **DEFAULT** rule fires.

**Supported operators:**
```
Comparison:  ==  !=  <  >  <=  >=
Logical:     &&  (AND)    ||  (OR)
String:      contains(field, "value")
             startsWith(field, "prefix")
             endsWith(field, "suffix")
Special:     DEFAULT  (always matches, always evaluated last)
```

### Step 4: Publish The Workflow

Click **Publish** to set the workflow status from DRAFT to ACTIVE. Only active workflows can be executed.

### Step 5: Execute The Workflow

Click **Test Run** on any workflow. A form auto-generates from the input schema:
```
amount:   [250]
country:  [INDIA]
priority: [High ▼]
```

Click **Start Execution**. The engine:
1. Evaluates rules for the first step
2. Routes to the matching next step
3. If APPROVAL step → pauses and shows Approve/Reject buttons
4. Human clicks Approve or Reject
5. Execution continues to the next step
6. Repeats until workflow reaches End

### Step 6: View Execution Logs

After execution completes, view the complete log showing:
```
[Step 1] Initial Check
  ✅ amount > 100 && country == 'INDIA' → TRUE
  ❌ DEFAULT → FALSE
  Next Step: Manager Approval
  Duration: 00:00:00

[Step 2] Manager Approval
  ✅ DEFAULT → TRUE
  Next Step: Finance Notification
  Approver: shah
  Duration: 00:00:05
```

---

## 🛠️ Tech Stack

### Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| Java | 21 | Language with Virtual Threads |
| Spring Boot | 3.2 | Backend framework |
| Spring Security | 6 | JWT authentication |
| Spring Data JPA | 3.2 | Database ORM |
| PostgreSQL | 15 | Primary database |
| Flyway | 9 | Database migrations |
| MapStruct | 1.5.5 | DTO mapping |
| Lombok | 1.18 | Boilerplate reduction |
| JUnit 5 | 5.10 | Unit testing |
| Mockito | 5 | Mocking for tests |
| Swagger/OpenAPI | 2.3 | API documentation |

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 18 | UI framework |
| TypeScript | 5 | Type safety |
| Vite | 5 | Build tool |
| TailwindCSS | 3 | Styling |
| Zustand | 4 | State management |
| React Query | 5 | Server state |
| Axios | 1.6 | HTTP client |
| Sonner | 1 | Toast notifications |
| Recharts | 2 | Dashboard charts |

---

## 🏗️ System Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                    Browser (React + TypeScript)              │
│   Login │ Dashboard │ Workflow Editor │ Execution │ Audit   │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTPS + JWT Bearer Token
┌─────────────────────────▼───────────────────────────────────┐
│              Spring Boot 3.2  (Port 8080)                   │
│                                                             │
│  JwtAuthFilter → Spring Security → REST Controllers         │
│         ↓                                                   │
│  WorkflowService  StepService  RuleService  ExecutionService│
│         ↓                                                   │
│  ┌──────────────────────────────────────┐                   │
│  │       Execution Engine (Async)       │                   │
│  │                                      │                   │
│  │  WorkflowExecutionEngine             │                   │
│  │       ↓                              │                   │
│  │  RuleEngine                          │                   │
│  │       ↓                              │                   │
│  │  ExpressionParser                    │                   │
│  │    evaluates: amount > 100 && ...    │                   │
│  │       ↓                              │                   │
│  │  StepExecutor                        │                   │
│  │    TASK → execute and continue       │                   │
│  │    APPROVAL → pause, wait for human  │                   │
│  │    NOTIFICATION → notify and continue│                   │
│  └──────────────────────────────────────┘                   │
│         ↓                                                   │
│  Logs written to PostgreSQL (JSONB)                        │
└─────────────────────────┬───────────────────────────────────┘
                          │ JDBC
┌─────────────────────────▼───────────────────────────────────┐
│                PostgreSQL 15  (Port 5432)                   │
│  users │ workflows │ steps │ rules │ executions │ notif     │
└─────────────────────────────────────────────────────────────┘
```

### Rule Engine Design
```
Input Data: { amount: 250, country: "INDIA", priority: "High" }

Step: Initial Check
Rules sorted by priority:
  Priority 1: amount > 100 && country == 'INDIA'
  Priority 2: DEFAULT

Evaluation:
  Rule 1: ExpressionParser.evaluate("amount > 100 && country == 'INDIA'", inputData)
    → Split by &&
    → "amount > 100": inputData.get("amount") = 250, 250 > 100 = TRUE
    → "country == 'INDIA'": inputData.get("country") = "INDIA", "INDIA" == "INDIA" = TRUE
    → TRUE && TRUE = TRUE ✅ MATCH FOUND
    → Return nextStepId for Manager Approval
    → Stop evaluating

Result: Execution routes to Manager Approval
Log: { rule: "amount > 100 && country == 'INDIA'", result: true }
```

---


## 📡 API Documentation

Full interactive documentation: **http://localhost:8080/swagger-ui/index.html**

Click **Authorize** → Enter `Bearer your_access_token` to test authenticated endpoints.

### Authentication

All endpoints except register and login require:
```
Authorization: Bearer <access_token>
```

### Endpoints Reference

#### Auth
```
POST /api/v1/auth/register     Register new user → returns JWT tokens
POST /api/v1/auth/login        Login → returns JWT tokens
POST /api/v1/auth/refresh      Refresh access token
GET  /api/v1/auth/me           Get current user profile
```

#### Workflows
```
POST   /api/v1/workflows              Create workflow
GET    /api/v1/workflows              List all workflows
GET    /api/v1/workflows/:id          Get workflow with steps and rules
PUT    /api/v1/workflows/:id          Update workflow (auto-increments version)
DELETE /api/v1/workflows/:id          Delete workflow
POST   /api/v1/workflows/:id/validate Validate workflow structure
POST   /api/v1/workflows/:id/execute  Start execution
```

#### Steps
```
POST   /api/v1/workflows/:wId/steps         Add step
GET    /api/v1/workflows/:wId/steps         List steps in order
PUT    /api/v1/workflows/:wId/steps/:id     Update step
DELETE /api/v1/workflows/:wId/steps/:id     Delete step
PUT    /api/v1/workflows/:wId/steps/reorder Reorder steps
```

#### Rules
```
POST   /api/v1/steps/:sId/rules             Add rule
GET    /api/v1/steps/:sId/rules             List rules by priority
PUT    /api/v1/steps/:sId/rules/:id         Update rule
DELETE /api/v1/steps/:sId/rules/:id         Delete rule
POST   /api/v1/steps/:sId/rules/validate    Validate condition syntax
```

#### Executions
```
POST /api/v1/workflows/:id/execute    Start execution with input data
GET  /api/v1/executions               List all executions for user
GET  /api/v1/executions/:id           Get status and full logs
POST /api/v1/executions/:id/resume    Approve or reject approval step
POST /api/v1/executions/:id/cancel    Cancel execution
POST /api/v1/executions/:id/retry     Retry failed step only
```

#### Dashboard and Notifications
```
GET  /api/v1/dashboard/stats              Real-time statistics
GET  /api/v1/dashboard/recent-executions  Last 5 executions
GET  /api/v1/dashboard/trends             7-day execution trend data
GET  /api/v1/notifications                User notifications list
POST /api/v1/notifications/read-all       Mark all as read
```

### Example API Calls

**Register and get token:**
```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Sharath","email":"sharath@test.com","password":"password123"}'
```

**Create workflow:**
```bash
curl -X POST http://localhost:8080/api/v1/workflows \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Expense Approval",
    "description": "Multi-step expense approval with conditional routing",
    "inputSchema": {
      "amount": {"type": "number", "required": true},
      "country": {"type": "string", "required": true}
    }
  }'
```

**Execute workflow:**
```bash
curl -X POST http://localhost:8080/api/v1/workflows/WORKFLOW_ID/execute \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "inputData": {
      "amount": 250,
      "country": "INDIA"
    }
  }'
```

**Approve an execution:**
```bash
curl -X POST http://localhost:8080/api/v1/executions/EXECUTION_ID/resume \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"approved": true, "comment": "Approved by manager"}'
```

---

## 📁 Folder Structure
```
HalcyonFlow/
│
├── backend/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/HalcyonFlow/backend/
│   │   │   │   │
│   │   │   │   ├── config/
│   │   │   │   │   ├── SecurityConfig.java       JWT security config
│   │   │   │   │   ├── AppProperties.java        App config properties
│   │   │   │   │   ├── AsyncConfig.java          Thread pool config
│   │   │   │   │   └── OpenApiConfig.java        Swagger config
│   │   │   │   │
│   │   │   │   ├── controller/
│   │   │   │   │   ├── AuthController.java       Auth endpoints
│   │   │   │   │   ├── WorkflowController.java   Workflow CRUD
│   │   │   │   │   ├── StepController.java       Step CRUD
│   │   │   │   │   ├── RuleController.java       Rule CRUD
│   │   │   │   │   ├── ExecutionController.java  Execution APIs
│   │   │   │   │   ├── DashboardController.java  Dashboard stats
│   │   │   │   │   └── NotificationController.java Notifications
│   │   │   │   │
│   │   │   │   ├── engine/               THE CORE
│   │   │   │   │   ├── ExpressionParser.java     Evaluates conditions
│   │   │   │   │   ├── RuleEngine.java           Selects next step
│   │   │   │   │   ├── StepExecutor.java         Runs each step type
│   │   │   │   │   └── WorkflowExecutionEngine.java  Orchestrates execution
│   │   │   │   │
│   │   │   │   ├── service/
│   │   │   │   │   ├── AuthService.java
│   │   │   │   │   ├── WorkflowService.java
│   │   │   │   │   ├── StepService.java
│   │   │   │   │   ├── RuleService.java
│   │   │   │   │   ├── ExecutionService.java
│   │   │   │   │   └── DashboardService.java
│   │   │   │   │
│   │   │   │   ├── repository/
│   │   │   │   ├── entity/               6 JPA entities
│   │   │   │   ├── dto/                  Request and response DTOs
│   │   │   │   ├── exception/            Global exception handler
│   │   │   │   ├── security/             JWT filter and utilities
│   │   │   │   └── enums/                StepType, ExecutionStatus etc
│   │   │   │
│   │   │   └── resources/
│   │   │       ├── application.yml       Main configuration
│   │   │       └── db/migration/         Flyway SQL migrations V1-V6
│   │   │
│   │   └── test/                         JUnit 5 test suite
│   │       ├── engine/                   20+ rule engine tests
│   │       ├── service/                  Service tests
│   │       └── controller/               API integration tests
│   │
│   ├── Dockerfile
│   └── pom.xml
│
├── frontend/
│   ├── src/
│   │   ├── api/                          API client functions
│   │   │   ├── client.ts                 Axios + interceptors
│   │   │   ├── auth.api.ts
│   │   │   ├── workflow.api.ts
│   │   │   ├── step.api.ts
│   │   │   ├── rule.api.ts
│   │   │   ├── execution.api.ts
│   │   │   └── dashboard.api.ts
│   │   │
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── RegisterPage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── WorkflowListPage.tsx
│   │   │   ├── WorkflowEditorPage.tsx    Main editor
│   │   │   ├── ExecuteWorkflowPage.tsx   Stage 1: Input
│   │   │   ├── ExecutionsPage.tsx        Stage 2: Progress + Stage 3: Logs
│   │   │   ├── AuditLogPage.tsx          Execution history
│   │   │   ├── NotificationsPage.tsx
│   │   │   └── SettingsPage.tsx
│   │   │
│   │   ├── components/layout/            Navbar, Sidebar, AppLayout
│   │   ├── store/authStore.ts            Zustand auth state
│   │   ├── routes/AppRoutes.tsx          All routes
│   │   └── routes/ProtectedRoute.tsx     Auth guard
│   │
│   ├── Dockerfile
│   └── package.json
│
├── docs/
│   └── sample-workflows/
│       ├── expense-approval.json         Complete sample workflow
│       └── employee-onboarding.json      Complete sample workflow
│
├── postman_collection.json               28 importable API requests
├── docker-compose.yml                    One-command setup
└── README.md
```

Test coverage includes:
- `ExpressionParserTest` — all operators, edge cases, error handling
- `RuleEngineTest` — priority ordering, DEFAULT fallback, no match case
- `RuleConditionValidatorTest` — syntax validation
- `WorkflowIntegrationTest` — end-to-end API tests

---

## 📊 Sample Workflows

### Expense Approval
```json
{
  "name": "Expense Approval",
  "inputSchema": {
    "amount": {"type": "number", "required": true},
    "country": {"type": "string", "required": true},
    "priority": {"type": "string", "required": true,
                 "allowed_values": ["High", "Medium", "Low"]}
  },
  "steps": [
    {
      "name": "Initial Check",
      "stepType": "TASK",
      "rules": [
        {"condition": "amount > 100 && country == 'INDIA'",
         "nextStep": "Manager Approval", "priority": 1},
        {"condition": "DEFAULT",
         "nextStep": "Task Rejection", "priority": 2}
      ]
    },
    {"name": "Manager Approval", "stepType": "APPROVAL",
     "rules": [{"condition": "DEFAULT", "nextStep": "Finance Notification"}]},
    {"name": "Finance Notification", "stepType": "NOTIFICATION",
     "rules": [{"condition": "DEFAULT", "nextStep": "CEO Approval"}]},
    {"name": "CEO Approval", "stepType": "APPROVAL",
     "rules": [{"condition": "DEFAULT", "nextStep": null}]},
    {"name": "Task Rejection", "stepType": "TASK",
     "rules": [{"condition": "DEFAULT", "nextStep": null}]}
  ]
}
```

Import from `docs/sample-workflows/expense-approval.json` using the workflow import feature.

---

## 📈 Evaluation Matrix

| Criteria | What Was Built | Weight |
|----------|---------------|--------|
| **Backend / APIs** | 30+ REST endpoints — full CRUD for workflows, steps, rules, executions with pagination and search | 20% |
| **Rule Engine** | Custom `ExpressionParser.java` evaluating `&&`, `\|\|`, `==`, `!=`, `<`, `>`, `<=`, `>=`, `contains()`, `startsWith()`, `endsWith()`, DEFAULT — all logged with TRUE/FALSE | 20% |
| **Workflow Execution** | Async execution engine with Java 21 virtual threads — TASK, APPROVAL, NOTIFICATION step types — human approval flow — retry failed step only — complete JSONB logs | 20% |
| **Frontend / UI** | Workflow editor with input schema builder — step list with rule editor — 3-stage execution flow (input → progress → logs) — audit log — dashboard with charts | 15% |
| **Demo Video** | 5-minute walkthrough: create workflow → add steps → configure rules → execute → approve → view logs | 10% |
| **Code Quality** | Layered architecture: Controller → Service → Repository → Entity — DTOs for all requests/responses — Global exception handler — no magic strings | 5% |
| **Documentation** | This README + Swagger UI + Postman collection + sample workflows | 5% |
| **Bonus** | JWT auth — Virtual threads — Dashboard analytics — Notifications — Workflow versioning — Condition syntax validator | 5% |

---

## 🔮 Future Improvements

| Feature | Description |
|---------|-------------|
| Email Integration | Send real emails via SMTP for NOTIFICATION steps |
| Webhook Triggers | Start workflows from external HTTP webhooks |
| Parallel Execution | Run multiple steps simultaneously |
| Loop Support | Steps can route back with configurable max iterations |
| SLA Monitoring | Alert if approval step exceeds deadline hours |
| Team Workflows | Assign workflows to teams, not just individual users |
| Mobile App | React Native app for approving steps on the go |
| SSO Login | Google and GitHub OAuth integration |
| Audit Export | Download execution history as CSV or PDF |
| Workflow Marketplace | Share and import community workflow templates |

---

## 👤 Author

**Sharath**

Full Stack Developer — Java, Spring Boot, React, TypeScript

Built for the Halleyx Full Stack Engineer Challenge 2026.

---

## 📄 License

This project was built as a submission for the Halleyx placement challenge.

---

*"Not just a workflow tool — a complete automation engine built with enterprise-grade architecture, a custom rule evaluator, and a clean product that any team can actually use."*
