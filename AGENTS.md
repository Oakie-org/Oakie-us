# DadaIsland (Oakie) — Agent Guide

Concise context for working in this repo.

## Product

- Platform for students/young creators to publish projects, recruit teammates, and collaborate.

## Repo Layout

- `serverless_backend/`: FastAPI backend for AWS Lambda (SAM), DynamoDB, Cognito.
- `frontend/`: React + TypeScript + Vite SPA.
- `docs_for_ai/`: internal briefs/specs.
- `docs/`: longer guides.
- `archived_java_impl/`: legacy Java (avoid unless requested).
- Generated: `serverless_backend/venv/`, `frontend/node_modules/`, `.aws-sam/`.

## Backend Architecture

- Single FastAPI Lambda via Mangum + API Gateway (SAM-defined).
- Cognito User Pool with PostConfirmation trigger.
- DynamoDB uses separate tables for users and projects.
- S3 uploads use presigned POSTs.
- Config is in `serverless_backend/app/core/config.py` (env-driven).
- Import path rule: run from `serverless_backend/` or set `PYTHONPATH=serverless_backend`.

## API Conventions

- Prefix: `/api/v1`, JSON `snake_case`.
- Auth: `Authorization: Bearer <Cognito JWT>`.
- Pagination: `page`/`page_size` (and some cursor endpoints).
- Core domains: projects, users, uploads; projects include visibility/ownership fields.

## Frontend

- React + Vite + TypeScript.
- TailwindCSS v4 + shadcn/ui + CSS Modules.
- Alias: `@/*` -> `frontend/src/*`.
- Tailwind v4 CSS var syntax: `w-(--var)`.

## AWS SAM

- Template: `serverless_backend/template.yaml`.
- Deploy defaults: `serverless_backend/samconfig.toml`.

## Working Rules

- Keep changes minimal and follow existing patterns.
- API modeling: use a `*Base` model for shared fields, then extend.
- Avoid generated folders.
- Avoid `archived_java_impl/` unless requested.
- If dev workflow changes, update `README.md` or `scripts/setup-dev.sh`.
