# Oakie AI brief

Oakie (搭搭岛 / DadaIsland) connects students and young creators across disciplines
(engineering, quant finance, media, design, events) so they can form teams, build
real projects and earn verifiable contribution records.

Read these before changing code:

- [`docs/architecture.md`](../docs/architecture.md): layers, data model, auth, API surface, how to run.
- [`docs/design-system.md`](../docs/design-system.md): tokens, type, interaction rules for any UI work.
- [`project-timeline.md`](./project-timeline.md): what is built and what is next.

## Rules

- **Backend**: Python 3.11, FastAPI on Lambda (Mangum), DynamoDB single table, Cognito, S3, SAM.
  Routers stay thin; rules go in `app/services/`; only `app/repositories/` knows the table layout;
  only `app/db/table.py` calls boto3 for DynamoDB.
- **API models**: Pydantic v2. Put shared fields in a `*Base` model and extend it
  (`ProjectBase` → `ProjectCreate`, `ProjectPublic`). Update models never accept ids, owners or counters.
- **Errors**: raise the domain errors in `app/core/errors.py`, not `HTTPException`.
- **New entity or access pattern**: add it to the key table in `app/db/schema.py` first.
- **Frontend**: screens use hooks from `src/lib/queries.ts`, primitives from `src/components/ui/`,
  and semantic colour tokens only. Types in `src/lib/types.ts` mirror the API's snake_case.
- **Tests**: `python -m pytest` from the repo root (moto, no Docker). Add a test with every backend rule.
- **Checks before finishing**: `ruff check . && ruff format --check .`, `pytest`,
  and in `frontend/`: `npm run lint && npm run build`.
