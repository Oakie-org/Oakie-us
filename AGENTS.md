# Oakie (DadaIsland) — Agent Guide

What an agent cannot work out from the code. Why things are built the way they
are: `docs/architecture.md`. Visual and interaction rules: `docs/design-system.md`.

## Product

- Oakie (搭搭岛) lets people publish projects, recruit teammates across
  disciplines, collaborate, and earn verifiable contribution records.
- It is not bound to school. Anyone can use it; a school, company or club is an
  optional "community", never a headline, a requirement or a ranking signal.

## Commands

Run from the repo root. `./scripts/setup-dev.sh` creates the venv and installs both sides.

| Task            | Command                                                             |
| --------------- | ------------------------------------------------------------------- |
| Run everything  | `./scripts/dev.sh` (API :8000, web :5173, no AWS account needed)    |
| Backend tests   | `serverless_backend/venv/bin/python -m pytest`                      |
| Backend lint    | `serverless_backend/venv/bin/python -m ruff check .`                |
| Backend format  | `serverless_backend/venv/bin/python -m ruff format .`               |
| Frontend checks | `npm --prefix frontend run lint && npm --prefix frontend run build` |

- In the Claude desktop app, `.claude/launch.json` defines `oakie-api` and `oakie-web`.
- Sign in locally with the "Fill in the demo account" button. Data is in memory
  and resets when the backend restarts.

## Done means

- Backend change: tests and ruff pass, and every new rule or endpoint has a test.
- Frontend change: lint and build pass (the build type-checks).
- UI change: also open the changed screen in the browser, at phone and desktop
  width, in light and dark.
- Report what was not verified instead of implying it was.

## Backend

- One FastAPI Lambda via Mangum behind an HTTP API; Cognito PostConfirmation trigger.
- Layers: `api/v1/endpoints` (HTTP) → `services` (rules) → `repositories` (items, keys) → `db/table.py` (boto3).
  Nothing skips a layer: no DynamoDB access from routers or services.
- One DynamoDB table with two GSIs. The key layout is the docstring of
  `app/db/schema.py`; add a new entity or access pattern there first, and keep
  `template.yaml` in sync with it.
- Config is env-driven (`app/core/config.py`); nothing deployment-specific is hardcoded.
- `AUTH_MODE=local` enables a dev-only identity provider; it cannot start on Lambda.
- Raise the domain errors in `app/core/errors.py`, not `HTTPException`.

## API conventions

- Prefix `/api/v1`, JSON `snake_case`, ISO-8601 UTC timestamps, `Authorization: Bearer <token>`.
- Lists: `{ items, next_cursor }`; continue with `cursor` and `limit`.
- Errors: `{ detail, code }`. Validation errors keep FastAPI's 422 shape.
- Toggles (like, follow) are idempotent `PUT`/`DELETE` returning 204.
- Models: shared fields in a `*Base` model, then extend. Update models never
  accept ids, owners or counters.
- The endpoint reference is the OpenAPI schema at `/docs` on a running backend.

## Frontend

- React 19, Vite, TypeScript, Tailwind CSS v4, TanStack Query, React Router. Alias `@/*` → `frontend/src/*`.
- Screens read and write only through hooks in `src/lib/queries.ts`; they never call `fetch`.
- `src/lib/types.ts` mirrors the API's `snake_case` JSON.
- Use the primitives in `src/components/ui/` and the semantic colour tokens from
  `src/index.css`, never raw hex values.
- Tailwind v4 CSS variable syntax: `w-(--var)`.

## Design rules

The full set is in `docs/design-system.md`. The ones that are easy to get wrong:

- Pictures are content. No generated covers, placeholders or decorative imagery;
  a project without an upload is a text post.
- Information first. A visitor scanning a list should learn what exists and what
  they can join; text and colour must not compete with that.
- Long forms are split into short steps with autosave.
- Decide the interaction before the API: the backend serves the frontend.
- Before building a new flow, look up how comparable products handle it.

## AWS

- Template: `serverless_backend/template.yaml`. Deploy defaults: `serverless_backend/samconfig.toml`.
- The stack is `oakie-v2`. Never deploy over `oakie-stack`: it would replace the old tables.

## Git

- Pre-commit runs ruff, prettier and eslint. Prettier may rewrite files and fail
  the first attempt: restage and commit again. Never use `--no-verify`.
- Avoid generated folders (`serverless_backend/venv/`, `frontend/node_modules/`,
  `frontend/dist/`, `.aws-sam/`) and `archived_java_impl/` (legacy Java).

## Docs

- Do not document what the code already states: file trees, endpoint lists, status reports.
- A decision and its reason go in `docs/architecture.md`; a UI rule in
  `docs/design-system.md`; the roadmap is the checklist in `README.md`.
- For a feature that spans several files, agree a short plan first (goal,
  non-goals, how it will be checked). If it is written down, put it in
  `docs/specs/` and delete it when the feature ships.
- Add a rule to this file only when an agent got something wrong without it.
- If the dev workflow changes, update this file, `README.md` and `scripts/`.
