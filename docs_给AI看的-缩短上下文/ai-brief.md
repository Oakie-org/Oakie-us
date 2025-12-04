# DadaIsland AI Brief

## Rules & Context
- Apply SRP, lean on established design patterns, and extend shared modules before creating new ones.
- Follow industry security/testing standards, reuse tooling already in the repo, and target production-ready logging/perf practices.
- Favor code reuse + existing helpers (DTOs, mappers, infra) whenever possible to avoid drift.
- Add contextual logs where they aid debugging instead of leaving silent control paths.
- Project: DadaIsland connects students and young creators so they can meet teammates, build internet projects, and earn verifiable contribution records.

## 1. API Essentials
- `/api/v1` prefix, JSON responses shaped as `{data, pagination}` when applicable, ISO-8601 UTC timestamps, form options served via `/meta/*`, signed upload flow for media, OTP-gated registration, and Redis-first caching/rate limiting around auth/discovery.

### Auth & Session
- `POST /auth/send-otp` issue phone OTP with rate-limit metadata.
- `POST /auth/register` validate inputs + OTP, create user, return access/refresh JWT.
- `POST /auth/login` password (or OTP) login with token pair response.
- `POST /auth/token/refresh` rotate access token via valid refresh token.
- `POST /auth/logout` revoke refresh token + cache entries.

### Landing, Discover, Metadata
- `GET /stats/overview` hero counters; `GET /projects/trending`, `GET /projects` (keyword/location/stage/status/skills filters), `GET /projects/search/suggestions`, `GET /tags/popular`.
- `/meta/categories|skills|cities|stages|roles|counters` keep filters/forms synced and cacheable.

### Projects, Membership, Applications
- `GET /projects/{id}`, `/projects/{id}/positions`, `/projects/{id}/team` surface detail, roles, members.
- `POST /projects/{id}/applications`, `GET /projects/{id}/applications/me` manage applicant lifecycle; `POST/DELETE /projects/{id}/follow` toggle following.

### Creation & Management
- `POST /uploads/sign` returns signed URL + `asset_id`; `POST /projects` create; `PATCH /projects/{id}` edit core fields; `POST /projects/{id}/positions` add roles; `PATCH /positions/{positionId}` update/close; `PATCH /projects/{id}/status` change recruiting state; `GET /projects/me` lists owned projects.

### Talent, Profile, Messaging
- `GET /talent`, `GET /talent/{userId}`, `POST /talent/{userId}/ping`, `GET /talent/recommendations`, `POST /projects/{id}/invites` enable matchmaking.
- `/users/{id}`, `/users/{id}/skills`, `/users/{id}/projects`, `/users/{id}/follow`, `/users/me`, `/users/me/skills` cover profile & follow graph.
- `/conversations*` for chat threads/messages; `/notifications*` for bell feed + read states.

## 2. Progress & Goals

### Completed Foundations
- Spring Boot 3 backend wired with security, validation, MyBatis, Flyway, Docker/Gradle toolchain (PROGRESS.md:5).
- Full MVP schema migration for users/projects/contributions/tags/notifications/outbox (PROGRESS.md:6).
- Registration service hashing passwords, issuing JWTs/refresh tokens, enforcing OTP (PROGRESS.md:7,12) plus security filters/config (PROGRESS.md:8) and domain DTO/mappers (PROGRESS.md:9).
- High-fidelity product prototypes available for reference (PROGRESS.md:10).

### Current Gaps
- Login controller/service still return 501; project/contribution/notification services lack real implementations and auth-context usage (PROGRESS.md:16-18).
- Most MyBatis XMLs missing; event/outbox pipeline not wired; controllers emit placeholder responses (PROGRESS.md:19-21).
- Testing/onboarding docs incomplete, no dev seed data, OTP delivery channel absent (PROGRESS.md:21-23).

### Timeline Targets (docs/project-timeline.md)
- **Week 0:** Finish login + refresh rotation, land `/stats/overview` + `/projects` so landing/discover screens use live data.
- **Week 1:** Ship `/projects/{id}` detail plus creation/edit/position/status APIs so creators can publish projects.
- **Week 2:** Implement application workflows and talent directory (`/talent`, invites, owner reviews) to close teaming loop.
- **Week 3:** Deliver profiles, follow graph, and `/meta/*` enums for forms/filters.
- **Week 4:** Stand up messaging (`/conversations*`) and notifications feed with bootstrap endpoint for unread counts.
- **Week 5:** Layer in Redis caching/rate limiting, hook async plumbing, add seed data + README onboarding + broader tests.

## 3. Database Schema Highlights (src/main/resources/db/migration/V1__init_schema.sql)
- **Users & Auth:** `users` table stores phone-first identities with unique phone/email, JSON roles, city/school indexes; `auth_refresh_tokens` keeps hashed refresh tokens with issue/expiry/revocation metadata.
- **Projects & Membership:** `projects` captures owner, slug, visibility, status, location indexes; `project_members` tracks role, membership status, join/leave timestamps with cascading FK rules.
- **Contributions & Approvals:** `contributions` logs submitted artifacts (type, summary, status) tied to project/user; `contribution_approvals` enforces one reviewer decision per contribution.
- **Taxonomy & Skills:** `tags` dictionary feeds `project_tags`, `user_skills`, and `project_skill_requirements` to align requirements and endorsements via shared slugs.
- **Events & Notifications:** `events` outbox table records aggregate events with retry counters and publish status; `notifications` links templates/payloads to users with channel + read tracking.
