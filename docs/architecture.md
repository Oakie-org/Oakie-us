# Oakie architecture

Oakie is a React single-page app talking to one FastAPI application that runs on
AWS Lambda. This document is the map: what lives where, why, and how to run it.

```text
Browser (React SPA)
   │  Authorization: Bearer <Cognito access token>
   ▼
API Gateway (HTTP API, JWT authorizer)
   ▼
Lambda: FastAPI via Mangum ──► DynamoDB (one table, two GSIs)
   │                       └─► S3 (presigned POST uploads)
Cognito User Pool ──PostConfirmation──► Lambda trigger (provisions the profile)
```

## Decisions

- **Serverless instead of the original Java/Spring Boot service** (now in
  `archived_java_impl/`). Lambda, API Gateway (HTTP API) and DynamoDB bill per
  request: the estimate at one million requests a month was under $5, and there
  is no server to operate. The price is a cold start of 1–3 s after idle, so keep
  the dependency bundle small.
- **One Lambda for the whole FastAPI app**, not one per route: one deploy unit
  and one local process, which suits a project this size.
- **One DynamoDB table**, so a project and everything inside it is read from one
  partition and counters change in the same transaction as the item behind them.

## Backend (`serverless_backend/`)

### Layers

Requests flow strictly downward; nothing skips a layer.

| Layer         | Path                    | Responsibility                                                                              |
| ------------- | ----------------------- | ------------------------------------------------------------------------------------------- |
| Routers       | `app/api/v1/endpoints/` | HTTP shape only: paths, status codes, request and response models.                          |
| Services      | `app/services/`         | Business rules, authorization, orchestration, notifications.                                |
| Repositories  | `app/repositories/`     | Item shapes, keys and queries. The only code that knows the table layout.                   |
| Table gateway | `app/db/table.py`       | The single wrapper over boto3: cursors, transactions, number conversion, error translation. |

Supporting modules: `app/core/` (settings, security, errors, ids), `app/models/`
(Pydantic contracts; shared fields live in a `*Base` model), `app/triggers/`
(Cognito PostConfirmation), `app/local/` (dev-only identity provider and seed data).

Services raise domain errors (`NotFound`, `Forbidden`, `Conflict`, `BadRequest`
in `app/core/errors.py`); `app/main.py` turns them into
`{"detail": "...", "code": "..."}` responses.

### Data model: one table

All entities share one DynamoDB table. The full key layout is the docstring of
`app/db/schema.py`, which is also what tests and local development create;
`template.yaml` must declare the same keys.

- `PK`/`SK`: a project and everything inside it (members, applications, timeline,
  tasks, likes, follows) live in the `PROJECT#<id>` partition; a user's profile,
  followers, notifications and inbox live in `USER#<id>`.
- `GSI1`: global listings. Projects sort by `priority`, then recency; users by sign-up time.
- `GSI2`: "everything about this user": memberships, applications, assigned
  tasks, follows, and the inbox ordered by latest message.

Counters (`current_members`, `likes`, `num_followers`, platform stats) are updated in
the same `TransactWriteItems` call as the item that changes them, so they cannot drift.
A team can never exceed `max_members`: the membership write carries the condition
`current_members < max_members`.

Discovery has one definition: `services/projects.ProjectQuery` holds every
listing filter (`q`, `category`, `status`, `skill`, `uni`, `city`, `tag`,
`remote`, `open_only`, `within_days`) and produces the predicate used by the
listing, by `GET /projects/facets` and by `GET /search/suggest`, so the three can
never disagree. Facet counts apply every active filter except the facet's own,
which keeps alternatives to the current choice visible. Facets read the whole
listing partition; that is the first thing to move to a search service.

`GET /users/me/matches` is the same listing read against the caller's profile:
open projects whose roles name one of their skills, best overlap first. It is
what makes listing skills worth a member's time, and like the facets it reads
the whole listing partition.

Every picture the API stores must be the caller's own upload. A profile's
`avatar_url` and `banner_url`, a project's `image_url` and an update's
`media_urls` are accepted only under that member's prefix for that purpose in
the uploads bucket (`services/platform.require_own_upload`), so nothing a
visitor's browser loads can point at someone else's server. A picture already
saved is not checked again when other fields change. Demo pictures are static
files, so the seed attaches them through the repository, below this rule.

Search is a filter over `GSI1` against a denormalised lowercase `search_text`
attribute. `Table.query_page` keeps reading until a page is full and derives the
cursor from the last item returned, so filtered pagination never skips or repeats.
This is right for the current scale; a dedicated search service is the upgrade path.

### Authentication and authorization

- **Production (`AUTH_MODE=cognito`)**: the SPA signs in against Cognito with
  Amplify and sends the access token. API Gateway's JWT authorizer guards every
  route except the public reads listed in `template.yaml`. The app verifies the
  token again (signature, issuer, `token_use`, client id), because public routes
  with optional auth bypass the gateway authorizer.
- **Local (`AUTH_MODE=local`)**: `app/local/auth.py` stands in for Cognito with
  `/api/v1/dev/auth/{register,login}` and HS256 tokens carrying the same claims.
  Settings refuse to start in this mode on Lambda.
- **Global roles** are Cognito groups (`super_admin` › `admin` › `moderator` ›
  `creator` › `user`). `PROJECT_CREATION_MIN_ROLE` sets who may publish (default `user`).
- **School verification**: a profile is `verified_school` when the address the
  identity provider confirmed is on an academic domain (`.edu`, `.edu.cn`,
  `.ac.uk`, …; see `services/users.is_school_email`). It is set once at
  provisioning and cannot be edited through the API.
- **Project roles** (`owner`, `admin`, `member`) are stored on the membership item.
  `services/projects.load()` returns a `ProjectAccess` that every project
  operation uses for its checks; private projects read as 404 to outsiders.

### Notifications and the event seam

`services/notifications.push()` is the only place domain events become
notifications. It runs inline and is best-effort (a failed notification never
fails the action). When fan-out needs to leave the request path, publish to
EventBridge from that one function.

### API

The endpoint reference is the OpenAPI schema at `/docs` on a running server; it
is generated from the routers, so it cannot go stale. Conventions (pagination,
errors, toggles) are in `AGENTS.md`.

### Running and testing

Commands are in `AGENTS.md`. Tests use in-memory DynamoDB and need no Docker.

`scripts/dev_server.py` starts moto (DynamoDB and S3), creates the table and
bucket, seeds demo data through the real services, and serves the API with local
auth. Data resets on restart. To keep data between runs, point `AWS_ENDPOINT_URL`
at DynamoDB Local or LocalStack instead.

## Frontend (`frontend/`)

React 19, Vite, TypeScript, Tailwind CSS v4, TanStack Query, React Router.

| Path                 | Responsibility                                                                                           |
| -------------------- | -------------------------------------------------------------------------------------------------------- |
| `src/app/`           | Providers, routes, the app shell (top bar, mobile tab bar), theme.                                       |
| `src/auth/`          | `AuthClient` interface with two implementations (Cognito via Amplify, local dev) and the `AuthProvider`. |
| `src/lib/api.ts`     | The HTTP client: bearer token, error normalisation, session expiry.                                      |
| `src/lib/queries.ts` | Every read and write as a TanStack Query hook; cache keys and invalidation in one place.                 |
| `src/lib/types.ts`   | The API contract, mirroring the backend's snake_case JSON.                                               |
| `src/components/ui/` | Design-system primitives (button, field, dialog, menu, toast, …).                                        |
| `src/components/`    | Product components (project and person cards, the masonry feed, record card).                            |
| `src/pages/`         | One file per screen; `pages/project/` holds the project tabs.                                            |

Rules of thumb:

- Screens never call `fetch`; they use hooks from `lib/queries.ts`.
- Server state lives in the query cache. Local component state is for forms and UI only.
- Filters and tabs live in the URL (`?q=`, `?category=`, `?tab=`), so every view is linkable.
- Styling uses semantic tokens (`bg-surface`, `text-ink-soft`, …) defined in
  `src/index.css`; see [design-system.md](./design-system.md).

Amplify is imported dynamically, so local development and guests never download it.

## Deploying to AWS

The template passes `sam validate --lint` but **has not been deployed** since the
rebuild. Before the first deploy:

1. `samconfig.toml` targets a new stack, `oakie-v2`. Do not deploy this template
   over the original `oakie-stack`: it would replace the old tables.
2. Data in the old `Oakie-Users` / `Oakie-Projects-v2` tables is not migrated. The
   old layout cannot be read by the new repositories; write a one-off migration
   or start fresh.
3. Pass your site origin: `sam deploy --parameter-overrides AllowedOrigins=https://your.site`.
4. Copy the stack outputs into `frontend/.env` (`VITE_API_BASE_URL`,
   `VITE_COGNITO_USER_POOL_ID`, `VITE_COGNITO_CLIENT_ID`, `VITE_AUTH_MODE=cognito`).
5. The Hosted UI domain and OAuth flows were removed from the template; the SPA
   signs in with SRP through Amplify and never used them.
