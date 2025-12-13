# DadaIsland (Oakie) — Single-File Context for AI Agents

This file is intended to be the _only_ Markdown an AI agent needs to get productive in this repo.

## 1) Product snapshot

**DadaIsland** (UI copy often says **Oakie**) is a platform for students/young creators to:

- publish/host projects, recruit teammates, and collaborate,
- match across skills/schools/cities,
- eventually build “verifiable contribution records” and co-found ventures.

## 2) Repo layout (what to touch)

- `serverless_backend/`: Python FastAPI backend for AWS Lambda + API Gateway + DynamoDB + Cognito (AWS SAM).
- `frontend/`: React + TypeScript + Vite SPA (most pages are still mock-driven).
- `docs_for_ai/`: concise internal briefs/specs (summarized below).
- `docs/`: longer developer guides (summarized below).
- `archived_java_impl/`: legacy Java/Spring app (avoid unless explicitly requested).

Generated/uncommitted:

- `serverless_backend/venv/`, `frontend/node_modules/`, `.aws-sam/` are generated—don’t edit.

## 3) Current backend reality (serverless “monolith” + trigger)

Even though some docs talk about microservices, the current SAM template deploys:

- **One FastAPI Lambda** (monolith) via `Mangum`:
  - App entry: `serverless_backend/app/main.py`
  - Lambda handler: `app.main.handler`
- **One Cognito PostConfirmation trigger Lambda**:
  - `serverless_backend/app/triggers/post_confirmation.py`
  - Syncs confirmed Cognito users into DynamoDB
- **One DynamoDB table** (users in template today) and **Cognito User Pool + Client + Domain**
  - Defined in: `serverless_backend/template.yaml`

Config/env:

- `serverless_backend/app/core/config.py` loads env vars (and `.env` locally).
- DynamoDB wrapper: `serverless_backend/app/db/dynamodb.py`

### Import-path rule (critical)

Backend uses absolute imports like `from app...`.
This works when `serverless_backend/` is the import root:

- In Lambda/SAM: `CodeUri: .` with handler `app.*` makes this true.
- Locally: run from `serverless_backend/` **or** set `PYTHONPATH=serverless_backend`.

## 4) API conventions + expected endpoints (spec summary)

Conventions (expected):

- Base prefix: `/api/v1`
- JSON: `snake_case`
- Auth header: `Authorization: Bearer <Cognito JWT>`
- Pagination: `page`, `page_size`, response `{ items, total, page }` (where relevant)

Auth:

- Frontend typically talks to Cognito (Hosted UI/Amplify) for signup/login/refresh.
- Backend endpoints should rely on API Gateway JWT authorizer and use JWT `sub` to fetch profile.
- Implemented now: `GET /api/v1/auth/me` (placeholder behavior in code).

Domains planned (MVP direction):

- Projects: `GET /projects`, `POST /projects`, `GET/PATCH /projects/{id}`, roles under `/projects/{id}/positions`
- Users: `GET /users/{id}`, `GET/PATCH /users/me`, `GET /users/{id}/projects`
- Meta/stats/uploads: `/meta/*`, `/stats`, `POST /uploads/sign`

## 5) Execution roadmap (timeline summary)

Week 0 (current focus):

- End-to-end loop: Register/Login → browse projects → create project → view/update profile

Week 1:

- Applications (apply/approve/reject) + talent directory

Week 2:

- Messaging + notifications/activity feed

Week 3:

- Search, caching, async/event-driven notifications

## 6) Frontend architecture + design rules (brief summary)

Stack:

- React (Vite) + TypeScript
- Styling: TailwindCSS + `shadcn/ui` primitives **plus** CSS Modules for page/layout styles
- Icons: `lucide-react`

Key files:

- Routing: `frontend/src/App.tsx`
- Layout shell: `frontend/src/components/common/AppLayout.tsx` (sidebar + header)
- Explore page (mock data + “smart sticky filter”): `frontend/src/pages/Projects.tsx`

Style rules:

- Prefer `shadcn/ui` primitives in `frontend/src/components/ui/*` for shared UI building blocks (buttons, inputs, cards, select, avatar, etc.).
- Use **CSS Modules** (`*.module.css`) for page/layout composition and bespoke styling (keep the current “premium & airy” look).
- When styling shadcn components, prefer existing design tokens (`--color-*`, `--shadow-*`, `--radius-*`, `--spacing-*`) to keep visuals consistent.
- Keep UI “premium & airy”: large radius (≈24px), soft shadow, glassmorphism, generous spacing.
- Frontend import alias: `@/*` maps to `frontend/src/*` (use for `@/components/ui/...`).

## 7) Local dev (fast path)

One-shot setup:

- `./scripts/setup-dev.sh`
  - Creates/uses `serverless_backend/venv`
  - Installs Python deps (`requirements.txt` + `requirements-dev.txt`)
  - Installs frontend deps (`npm install`)
  - Installs git hooks (`pre-commit install`) when `.git/` exists

Backend:

- `cd serverless_backend && source venv/bin/activate`
- `uvicorn app.main:app --reload` (docs: `http://127.0.0.1:8000/docs`)

Frontend:

- `cd frontend && npm run dev` (Vite: `http://localhost:5173`)

## 8) Tooling / quality gates (formatting + type checking)

### Pre-commit (format on `git commit`)

- Config: `.pre-commit-config.yaml`
- Install once: `pre-commit install`
- Python hooks: `absolufy-imports` → `ruff check --fix` → `ruff format`
- Frontend hooks: `prettier` + `eslint` (runs `cd frontend && npm run lint`)

### Type checking (Python)

- Config: `pyrightconfig.json` (BasedPyright/Pyright-style)
  - Points at `serverless_backend/venv` and adds `serverless_backend` to import paths.
- boto3 typing:
  - Lambda runtime provides `boto3`, but for local typing we install `boto3-stubs[dynamodb]` in dev deps.
  - Runtime deps should stay in `serverless_backend/requirements.txt`; dev-only in `serverless_backend/requirements-dev.txt`.

## 9) AWS SAM deploy defaults (what’s “configured”)

- Template: `serverless_backend/template.yaml` (what gets built/deployed)
- Deploy defaults: `serverless_backend/samconfig.toml` (stack name/region/etc.)

Typical:

- `cd serverless_backend && sam build`
- `sam deploy --guided` (first time), then `sam deploy`
- `sam sync --watch` for faster iteration

## 10) Agent working rules (repo-specific)

- Keep changes minimal and aligned with existing patterns (FastAPI routers, shadcn primitives + Tailwind, CSS Modules for layouts, etc.).
- Don’t touch generated folders (`serverless_backend/venv/`, `frontend/node_modules/`, `.aws-sam/`).
- Avoid `archived_java_impl/` unless explicitly requested.
- If you change dev workflow, update `README.md` and/or `scripts/setup-dev.sh`.
