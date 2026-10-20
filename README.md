# Multi-Tenant SaaS Project Management Platform

A production-minded, full-stack Multi-Tenant SaaS application built on the **PERN stack** (PostgreSQL, Express.js, React, Node.js). Designed with strict tenant isolation, granular role-based access control (RBAC), database-level integrity constraints, and modern responsive UI.

---

## Key Features

- **Strict Multi-Tenant Isolation**: Shared database architecture where every tenant-owned resource is isolated. Verified across 10 security test assertions.
- **Composite Database Constraints**: Relational foreign keys enforcing that child entities (such as tasks) can never belong to a project in another organization.
- **Enterprise RBAC**: Three default system roles (`Admin`, `Manager`, `Member`) spanning 16 granular permissions, plus support for tenant-scoped custom roles.
- **Privilege Escalation Protection**: Prevents self-promotion, unauthorized role assignment, and demotion of the sole active administrator.
- **JWT & Session Authentication**: Secure password hashing with `bcryptjs`, short-lived tokens, generic error responses to prevent user enumeration.
- **Real-Time Tenant Metrics**: Aggregated SQL counts and velocity metrics calculated strictly per tenant.
- **Audit Logging**: Atomically records security and administrative actions in `audit_logs`.
- **Modern Responsive UI**: Built with React 18, Vite, Material UI (MUI), sleek dark theme, glassmorphism, responsive drawers, and empty/loading states.
- **Automated Testing Suite**: 28 automated tests covering health checks, relational constraints, auth flows, and security isolation.
- **Interactive Swagger Documentation**: OpenAPI 3.0 specification available at `/api/docs`.

---

## Technology Stack

- **Frontend**: React 18, Vite, JavaScript (JSX), React Router, Axios, Material UI (MUI), React Context
- **Backend**: Node.js (v22), Express.js (ES modules), PostgreSQL (`pg`), `bcryptjs`, `jsonwebtoken`, `zod`, `helmet`, `cors`, `express-rate-limit`, `cookie-parser`, `dotenv`
- **Database**: PostgreSQL 16 (running via Docker on mapped port `2002`)
- **Testing**: Vitest, Supertest
- **Documentation**: Swagger UI Express, OpenAPI 3.0

---

## Architecture Overview

```mermaid
graph TD
    User([End User / Browser])
    
    subgraph Frontend["React 18 + Vite + MUI Client (Port 5173)"]
        AuthCtx[Auth Context & Org Switcher]
        AxiosClient[Axios Interceptors: Bearer + X-Organization-Id]
        Pages[Dashboard / Projects / Tasks / Team / Roles / Settings]
    end

    subgraph Backend["Express REST API (Port 5001)"]
        Security[Helmet, CORS, RateLimiter]
        AuthMW[JWT Authentication Middleware]
        TenantMW[Tenant Context Resolution]
        RBACMW[RBAC Permission Guard]
        Modules[Auth, Organizations, Projects, Tasks, Roles, Dashboard]
        Audit[Transaction-bound Audit Logging]
    end

    subgraph Database["PostgreSQL 16 (Port 2002)"]
        Tables[(users, organizations, memberships, roles, permissions, projects, tasks, audit_logs)]
    end

    User --> Frontend
    Pages --> AxiosClient
    AxiosClient --> Security
    Security --> AuthMW
    AuthMW --> TenantMW
    TenantMW --> RBACMW
    RBACMW --> Modules
    Modules --> Audit
    Modules -->|Parameterized SQL| Tables
```

---

## Repository Structure

```
Saas-application/
├── client/                     # React Frontend
│   ├── public/
│   ├── src/
│   │   ├── api/client.js       # Axios client with token/tenant interceptors
│   │   ├── components/         # Navbar, Sidebar, AppLayout, PermissionGate, etc.
│   │   ├── context/            # AuthContext (auth, tenant state, permissions)
│   │   ├── pages/
│   │   │   ├── auth/           # Login, Register
│   │   │   ├── dashboard/      # Dashboard metrics & activity
│   │   │   ├── projects/       # Project list, details & modals
│   │   │   ├── tasks/          # Task management & board
│   │   │   ├── team/           # Team member management
│   │   │   ├── roles/          # Roles & permissions matrix
│   │   │   └── settings/       # Organization settings
│   │   ├── App.jsx             # React Router routing table
│   │   ├── theme.js            # Material UI dark theme tokens
│   │   └── main.jsx
│   ├── .env.example
│   └── package.json
│
├── server/                     # Express REST Backend
│   ├── src/
│   │   ├── config/             # DB pool & environment validation
│   │   ├── database/
│   │   │   ├── migrate.js      # Migration runner
│   │   │   ├── migrations/     # SQL schema migrations
│   │   │   └── seeds/          # Permission & system role seeder
│   │   ├── docs/swagger.json   # OpenAPI 3.0 specification
│   │   ├── middleware/         # auth, tenant resolution, rbac, errorHandler
│   │   ├── modules/            # auth, organizations, projects, tasks, roles, dashboard
│   │   ├── utils/              # errors, response helpers, password, jwt
│   │   ├── app.js              # Express app definition
│   │   └── server.js           # Server bootstrap & graceful shutdown
│   ├── tests/
│   │   ├── unit/               # Health and DB schema integrity tests
│   │   ├── integration/        # Auth integration tests
│   │   └── security/           # Tenant isolation & RBAC security tests
│   ├── .env.example
│   └── package.json
│
├── docs/                       # Technical & Architectural Documentation
│   ├── architecture.md
│   ├── database-schema.md
│   ├── api-documentation.md
│   └── security.md
├── docker-compose.yml          # PostgreSQL 16 container mapping port 2002
├── package.json                # Root workspace orchestration
└── README.md
```

---

## Getting Started

### Prerequisites

- **Node.js**: v18+ (tested on v22.14.0)
- **Docker & Docker Compose**: (for containerized PostgreSQL on port 2002)

### 1. Database Setup via Docker

Start PostgreSQL on host port `2002`:
```bash
docker compose up -d
```
This automatically initializes:
- Development database: `saas_db`
- Test database: `saas_test_db`

### 2. Environment Configuration

Copy `.env.example` templates:
```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Default local backend configuration (`server/.env`):
```env
NODE_ENV=development
PORT=5001
DATABASE_URL=postgresql://postgres:postgrespassword@localhost:2002/saas_db
TEST_DATABASE_URL=postgresql://postgres:postgrespassword@localhost:2002/saas_test_db
JWT_SECRET=super_secure_multi_tenant_saas_jwt_secret_key_2026_dev
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
COOKIE_SECRET=super_secure_cookie_signing_secret_key_2026_dev
```

### 3. Install Dependencies

Install all root, server, and client packages:
```bash
npm install
```

### 4. Run Migrations & Database Seeds

Apply the relational schema and seed default system roles:
```bash
npm run migrate
npm run seed
```

### 5. Running the Application

Start both the backend server and frontend client concurrently:
```bash
npm run dev
```

- **Frontend Client**: `http://localhost:5173`
- **Backend API**: `http://localhost:5001`
- **Interactive Swagger Docs**: `http://localhost:5001/api/docs`
- **API Health Check**: `http://localhost:5001/api/health`

---

## Automated Test Suite

Run the full automated test suite (all 28 tests):
```bash
npm run test
```

### Targeted Test Suites

- **Unit Tests** (Health check & DB foreign key constraints):
  ```bash
  npm run test:unit
  ```
- **Integration Tests** (Registration, login, JWT verification):
  ```bash
  npm run test:integration
  ```
- **Security Tests** (Tenant isolation & RBAC privilege checks):
  ```bash
  npm run test:security
  ```

---

## Role-Based Permissions Matrix

| Permission Key | Description | Admin | Manager | Member |
| :--- | :--- | :---: | :---: | :---: |
| `organization:read` | View organization details | ✅ | ✅ | ✅ |
| `organization:update` | Update organization settings | ✅ | ❌ | ❌ |
| `user:read` | View team members | ✅ | ✅ | ✅ |
| `user:manage` | Invite, change roles, or suspend members | ✅ | ❌ | ❌ |
| `role:manage` | Create & manage custom roles | ✅ | ❌ | ❌ |
| `project:read` | View projects within organization | ✅ | ✅ | ✅ |
| `project:create` | Create new projects | ✅ | ✅ | ❌ |
| `project:update` | Edit projects | ✅ | ✅ | ❌ |
| `project:delete` | Delete projects | ✅ | ❌ | ❌ |
| `task:read` | View tasks | ✅ | ✅ | ✅ |
| `task:create` | Create new tasks | ✅ | ✅ | ❌ |
| `task:update` | Edit tasks | ✅ | ✅ | Assigned only |
| `task:delete` | Delete tasks | ✅ | ✅ | ❌ |
| `task:assign` | Assign tasks to organization members | ✅ | ✅ | ❌ |
| `dashboard:read` | View dashboard statistics | ✅ | ✅ | ✅ |
| `audit_log:read` | View organization audit logs | ✅ | ❌ | ❌ |

---

## Tenant Isolation Guarantees

1. **Server-Side Verified Context**: The client provides an organization ID selector via `X-Organization-Id` or route params. The server queries `memberships` table using `(user_id, organization_id)` before establishing context. Client-supplied roles or organization claims are never trusted.
2. **Parameterized Scoping**: All database queries parameterize `WHERE organization_id = $x` using the server-verified tenant context.
3. **Defense-in-Depth Composite Foreign Keys**: Tasks reference `(project_id, organization_id)`. Attempting to associate a task with an external project is rejected at the database engine level.
4. **Information Disclosure Prevention**: Inquiries targeting resources belonging to another tenant respond with `404 Not Found` rather than `403 Forbidden`, preventing resource enumeration across tenants.

---

## Deployment Strategy

### Frontend (e.g. Vercel / Netlify)
1. Build the production bundle: `npm run build`
2. Set environment variable: `VITE_API_URL=https://your-api-host.com/api`
3. Configure SPA rewrites to `/index.html`.

### Backend (e.g. Render / Railway / AWS ECS)
1. Set production environment variables (`NODE_ENV=production`, `PORT`, `DATABASE_URL`, `JWT_SECRET`, `CLIENT_URL`).
2. Run database migrations: `npm run migrate`
3. Start the server: `node src/server.js`
4. Health check endpoint `/api/health` enables zero-downtime rolling deploys.

---

## Known Limitations & Future Enhancements

- **Email Invitations**: Currently, administrators add members by specifying the email of an existing registered user. A future release can add signed, expiring invitation tokens delivered via transactional email (SendGrid/Resend).
- **PostgreSQL RLS with Connection Pooling**: RLS policies can be activated alongside `SET LOCAL app.current_organization_id` inside pooled database transactions for an additional layer of isolation.
- **Refresh Token Rotation**: Currently uses 7-day signed JWTs; future iterations can implement Redis-backed refresh token rotation with device fingerprinting.
