# Oakie API

The authoritative reference is the OpenAPI schema served by a running backend at
`/docs` (`/api/v1/openapi.json`). The endpoint map and conventions are in
[`docs/architecture.md`](../docs/architecture.md#api-surface-apiv1).

Conventions:

- Base path `/api/v1`, JSON with `snake_case` fields, ISO-8601 UTC timestamps.
- `Authorization: Bearer <token>` (Cognito access token; a local dev token when `AUTH_MODE=local`).
- Errors: `{"detail": "human-readable message", "code": "not_found" | "forbidden" | "conflict" | ...}`.
  Validation errors use FastAPI's 422 shape.
- Lists: `{"items": [...], "next_cursor": "opaque" | null}`; pass `cursor` and `limit` to continue.
- Toggles (like, follow) are idempotent `PUT`/`DELETE` returning 204.
