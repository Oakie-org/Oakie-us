# Oakie (DadaIsland) — Agent Guide

Concise context for working in this repo. Details: `docs/architecture.md`,
`docs/design-system.md`, `docs_for_ai/ai-brief.md`.

## Product

- Platform for students and young creators to publish projects, recruit teammates
  across disciplines, collaborate, and earn verifiable contribution records.

## Repo layout

- `serverless_backend/`: FastAPI backend for AWS Lambda (SAM), DynamoDB, Cognito, S3.
- `frontend/`: React + TypeScript + Vite SPA.
- `docs/`: architecture and design system. `docs_for_ai/`: brief, API conventions, timeline.
- `prototypes/`, `一个简单的mock网页.html`: early HTML mock-ups, reference only.
- `archived_java_impl/`: legacy Java (avoid unless requested).
- Generated: `serverless_backend/venv/`, `frontend/node_modules/`, `frontend/dist/`, `.aws-sam/`.

## Backend

- One FastAPI Lambda via Mangum behind an HTTP API; Cognito PostConfirmation trigger.
- Layers: `api/v1/endpoints` (HTTP) → `services` (rules) → `repositories` (items, keys) → `db/table.py` (boto3).
- One DynamoDB table with two GSIs; the key layout is documented in `app/db/schema.py`.
- Config is env-driven (`app/core/config.py`); nothing deployment-specific is hardcoded.
- `AUTH_MODE=local` enables a dev-only identity provider; it cannot start on Lambda.
- Run: `python serverless_backend/scripts/dev_server.py` (no AWS account needed).
- Test: `python -m pytest` from the repo root. Lint: `ruff check . && ruff format .`.

## API conventions

- Prefix `/api/v1`, JSON `snake_case`, `Authorization: Bearer <token>`.
- Cursor pagination: `{ items, next_cursor }`.
- Errors: `{ detail, code }`, raised as domain errors from `app/core/errors.py`.
- API modeling: a `*Base` model for shared fields, then extend.

## Frontend

- React 19, Vite, TypeScript, Tailwind CSS v4, TanStack Query, React Router. Alias `@/*` → `frontend/src/*`.
- Screens read and write only through hooks in `src/lib/queries.ts`.
- Use the primitives in `src/components/ui/` and semantic colour tokens from `src/index.css`.
- Tailwind v4 CSS variable syntax: `w-(--var)`.
- Check: `npm run lint && npm run build` in `frontend/`.

## AWS SAM

- Template: `serverless_backend/template.yaml` (keep in sync with `app/db/schema.py`).
- Deploy defaults: `serverless_backend/samconfig.toml` (stack `oakie-v2`; never deploy over `oakie-stack`).

## Working rules

- Follow the layering; do not query DynamoDB from routers or services.
- Add a backend test with every new rule or endpoint.
- Avoid generated folders and `archived_java_impl/`.
- If the dev workflow changes, update `README.md` and `scripts/`.
