# API Documentation

## Overview

Base URL: `/api`  
Interactive Swagger UI: `http://localhost:5001/api/docs`

All requests to protected endpoints require:
- `Authorization: Bearer <JWT_TOKEN>` (or signed `access_token` cookie)
- `X-Organization-Id: <ORGANIZATION_UUID>` (for tenant-scoped operations)

---

## 1. Authentication (`/api/auth`)

### Register
- **Endpoint**: `POST /api/auth/register`
- **Access**: Public
- **Request Body**:
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "Password123!",
    "organizationName": "Acme Global"
  }
  ```
- **Response** (`201 Created`):
  ```json
  {
    "success": true,
    "message": "Account and organization created successfully",
    "data": {
      "user": { "id": "...", "name": "Jane Doe", "email": "jane@example.com" },
      "organization": { "id": "...", "name": "Acme Global", "slug": "acme-global-x9a2" },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```

### Login
- **Endpoint**: `POST /api/auth/login`
- **Access**: Public
- **Request Body**:
  ```json
  {
    "email": "jane@example.com",
    "password": "Password123!"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "user": { "id": "...", "name": "Jane Doe", "email": "jane@example.com" },
      "organizations": [
        { "id": "...", "name": "Acme Global", "slug": "...", "role_name": "Admin" }
      ],
      "token": "..."
    }
  }
  ```

### Current User Profile
- **Endpoint**: `GET /api/auth/me`
- **Access**: Authenticated

### Logout
- **Endpoint**: `POST /api/auth/logout`
- **Access**: Public

---

## 2. Organizations (`/api/organizations`)

| Method | Endpoint | Description | Required Permission |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/organizations` | List organizations user belongs to | Authenticated |
| `POST` | `/api/organizations` | Create a new organization | Authenticated |
| `GET` | `/api/organizations/:organizationId` | View organization details | `organization:read` |
| `PATCH` | `/api/organizations/:organizationId` | Update organization name | `organization:update` |
| `GET` | `/api/organizations/:organizationId/members` | List organization team members | `user:read` |
| `POST` | `/api/organizations/:organizationId/members` | Add member by email and role | `user:manage` |
| `PATCH` | `/api/organizations/:organizationId/members/:membershipId` | Update member role or status | `user:manage` |

---

## 3. Projects (`/api/projects`)

Headers required: `Authorization: Bearer <token>`, `X-Organization-Id: <uuid>`

| Method | Endpoint | Description | Required Permission |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/projects` | List tenant projects (supports `page`, `limit`, `search`, `status`, `sortBy`) | `project:read` |
| `POST` | `/api/projects` | Create a project in active organization | `project:create` |
| `GET` | `/api/projects/:projectId` | View project details and task progress | `project:read` |
| `PATCH` | `/api/projects/:projectId` | Update project name, description, or status | `project:update` |
| `DELETE` | `/api/projects/:projectId` | Delete project and cascade tasks | `project:delete` |

---

## 4. Tasks (`/api/tasks`)

Headers required: `Authorization: Bearer <token>`, `X-Organization-Id: <uuid>`

| Method | Endpoint | Description | Required Permission |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/tasks` | List tasks (supports `projectId`, `assignedTo`, `status`, `priority`, `page`, `limit`) | `task:read` |
| `POST` | `/api/tasks` | Create task (validates same-tenant project and assignee) | `task:create` |
| `GET` | `/api/tasks/:taskId` | View task details | `task:read` |
| `PATCH` | `/api/tasks/:taskId` | Update task status, priority, or assignee | `task:update` |
| `DELETE` | `/api/tasks/:taskId` | Delete task | `task:delete` |

---

## 5. Dashboard & Analytics (`/api/dashboard`)

| Method | Endpoint | Description | Required Permission |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/dashboard/stats` | Aggregated project & task statistics | `dashboard:read` |
| `GET` | `/api/dashboard/activity` | Reverse-chronological tenant audit log | `dashboard:read` |

---

## 6. Roles & Permissions (`/api/organizations/:organizationId/roles`)

| Method | Endpoint | Description | Required Permission |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/permissions` | List all 16 platform permissions | Authenticated |
| `GET` | `/api/organizations/:organizationId/roles` | List system & tenant custom roles | `organization:read` |
| `POST` | `/api/organizations/:organizationId/roles` | Create tenant-specific custom role | `role:manage` |
| `PATCH` | `/api/organizations/:organizationId/roles/:roleId` | Update custom role permissions | `role:manage` |
