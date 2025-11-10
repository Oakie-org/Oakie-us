# DadaIsland Progress Report

## ✅ Completed So Far

- **Project foundation** – Spring Boot 3 backend with security, validation, MyBatis, RocketMQ starter, Flyway, Docker tooling, and Gradle build all wired up (`build.gradle.kts`, `Dockerfile`, `compose.yaml`).
- **Database schema** – Initial Flyway migration creates full MVP tables for users, projects, contributions, approvals, tags, notifications, and outbox processing (`src/main/resources/db/migration/V1__init_schema.sql`).
- **Authentication groundwork** – Registration flow validates input, hashes passwords, generates numeric user IDs, issues JWT access/refresh tokens, and persists hashed refresh tokens (`src/main/java/com/phz/dadaIsland/service/impl/AuthServiceImpl.java`).
- **Security pipeline** – Stateless JWT filter, entry point, and custom user details service in place to protect future APIs (`src/main/java/com/phz/dadaIsland/security`).
- **Domain contracts** – Core DTOs, mappers, enums, and service interfaces defined for projects, contributions, notifications, users, and events.
- **Product design reference** – High-fidelity mobile prototypes covering discovery, collaboration, messaging, and proof experiences (`prototypes/` gallery).
- **Auth enhancements** – Login flow, controller responses, documentation, and unit tests implemented, plus clarified Redis-first caching strategy in README.
- **OTP enforcement** – Registration now requires a phone OTP: `sendRegistrationOtp()` rate-limits per phone, persists a Redis token, and `register()` verifies the submitted code before issuing JWTs.

## 🚧 In Progress / Open Gaps

- **Auth login** – Service and controller still return HTTP 501; credential verification and token issuance are not implemented yet.
- **Business services** – Project, contribution, and notification service implementations are placeholders and ignore authenticated context.
- **Persistence layer** – Only user and refresh-token mappers have SQL; remaining mappers lack corresponding MyBatis XML files.
- **Event publishing** – RocketMQ publisher and outbox processing hooks are stubs; no integration with the outbox table.
- **API responses** – Controllers respond with 501 status codes and static placeholders instead of real data.
- **Testing & docs** – No automated tests and README stops before the project structure section; onboarding instructions are incomplete.
- **Dev data** – MySQL init directory is empty; no seed data for tags/users to ease local testing.
- **OTP delivery channel** – Generated OTPs are only stored server-side; SMS/email integrations (or at least a temporary echo) are required so users can complete registration.

## 🗓️ Next To-Do Items

1. Integrate Redis: add starter/config, establish connection management, and define caching/rate-limiting policies for auth & discovery flows.
   - Longer-term: explore moving refresh-token rotation to Redis (or hybrid Redis+MySQL) to reduce DB churn; postponed while we focus on feature delivery.
2. Wire up OTP delivery: integrate an SMS/email provider (or temporary debug response) so `sendRegistrationOtp()` returns/delivers the generated code.
3. Use the security context to derive the current user, and finish project creation/list/detail operations backed by MyBatis.
4. Flesh out contribution submission, approval, and notification read workflows, publishing domain events through RocketMQ.
5. Create MyBatis XML mappings for projects, contributions, memberships, tags, skills, and outbox entities.
6. Hook the outbox to RocketMQ (poller, publisher implementations, retry logic) to make event delivery functional.
7. Restore meaningful HTTP responses in controllers once service logic is complete.
8. Add unit/integration tests around auth and project flows; document project structure and local setup in the README.
9. Provide optional seed scripts under `docker/mysql/init` to bootstrap reference data for development.
