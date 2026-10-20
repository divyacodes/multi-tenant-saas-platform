# Security & Threat Model

## Executive Summary

The application is engineered to resist multi-tenant data leaks, horizontal privilege escalation (IDOR), vertical privilege escalation, and credential stuffing. Security is enforced strictly on the server; the frontend client never holds authoritative authority over tenant IDs, permissions, or access scope.

---

## Threat Model & Mitigations

### 1. Cross-Tenant Data Access (IDOR Vulnerabilities)
- **Threat**: An authenticated user belonging to Organization A attempts to access, modify, or delete a resource (e.g. project or task) belonging to Organization B by supplying Organization B's resource ID in URL route parameters or payloads.
- **Mitigation**:
  1. The `resolveTenant` middleware verifies that the acting user has an **active** membership in the organization specified by the client (`req.params.organizationId` or `X-Organization-Id`).
  2. If the user is not a member or their membership is suspended, the request terminates immediately with `403 Forbidden`.
  3. Every database query filters by `organization_id = $tenantId` using server-resolved context.
  4. If a resource ID from another organization is requested, the repository returns no rows, and the service responds with `404 Not Found`. This prevents the attacker from learning whether the resource exists in another tenant.

### 2. Header and Parameter Spoofing
- **Threat**: A client modifies the `X-Organization-Id` HTTP header to pretend to act on behalf of another tenant.
- **Mitigation**: The header is treated purely as a *selector*, not as proof of membership. The server looks up `memberships` table in PostgreSQL using `(user_id, organization_id)`. If no active row matches, access is denied.

### 3. Cross-Tenant Foreign Key Manipulation
- **Threat**: An attacker creates a task within Organization A, but passes the `project_id` of a project belonging to Organization B.
- **Mitigation**:
  1. Application validation checks `validateProjectInOrg(projectId, orgId)` before task creation.
  2. **Database Engine Enforcement**: The PostgreSQL schema defines a composite foreign key:
     ```sql
     CONSTRAINT fk_tasks_project_org 
     FOREIGN KEY (project_id, organization_id) 
     REFERENCES projects(id, organization_id) 
     ON DELETE CASCADE;
     ```
     PostgreSQL will reject the query with error code `23503` (foreign key violation) even if application-level checks fail.

### 4. Cross-Tenant User Assignment
- **Threat**: Organization A assigns a task to a user who only belongs to Organization B.
- **Mitigation**: `validateUserInOrg(assignedTo, orgId)` queries the `memberships` table for an active membership in Organization A before allowing assignment.

### 5. Vertical Privilege Escalation
- **Threat**: A standard `Member` or `Manager` attempts to grant themselves `Admin` privileges or modify another user's role.
- **Mitigation**:
  1. The `user:manage` permission is strictly required to modify membership roles.
  2. The service enforces a hard invariant: `if (targetMembership.id === actorMembershipId && roleName) throw new ForbiddenError('You cannot change your own role');`.
  3. Demotion or suspension of the sole active administrator is blocked with `400 Bad Request`.

### 6. System Role Mutation
- **Threat**: An admin tenant attempts to edit the global system roles (`Admin`, `Manager`, `Member`) to escalate or modify permissions globally.
- **Mitigation**: System roles have `organization_id IS NULL`. The `roles` repository only allows mutations on rows where `organization_id = $orgId`. Mutations on system roles are rejected with `403 Forbidden`.

### 7. Credential Protection
- **Password Hashing**: Passwords hashed with `bcryptjs` using a salt work factor of 10. Plaintext passwords are never logged or stored.
- **Zero Credential Exposure**: `password_hash` is explicitly omitted from user objects and never returned in API responses.
- **Generic Auth Errors**: Login failures return a generic `"Invalid email or password"` response to eliminate user enumeration.
- **JWT Claims**: Tokens only store minimal subject identifier `{ sub: user.id, email }`. Permissions and memberships are never trusted from client JWT claims; they are evaluated dynamically on each request against live database state.

### 8. Audit Logging
Every significant operational action (`ORGANIZATION_CREATED`, `MEMBER_ADDED`, `MEMBER_UPDATED`, `PROJECT_CREATED`, `PROJECT_UPDATED`, `PROJECT_DELETED`, `TASK_CREATED`, `TASK_UPDATED`, `TASK_DELETED`) is atomically committed to `audit_logs` within the same database transaction, capturing the actor, entity ID, action, and safe metadata.
