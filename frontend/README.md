# Oakie web app

React 19 + TypeScript + Vite + Tailwind CSS v4. Architecture and conventions are in
[`docs/architecture.md`](../docs/architecture.md#frontend-frontend); visual rules in
[`docs/design-system.md`](../docs/design-system.md).

```bash
npm install
npm run dev        # http://localhost:5173, proxies /api to http://127.0.0.1:8000
npm run lint
npm run build      # type-checks, then builds to dist/
```

With no `.env`, the app uses the backend's local sign-in (`AUTH_MODE=local`), so it
runs against `serverless_backend/scripts/dev_server.py` with no AWS account.
Copy `.env.example` to `.env` to point it at a deployed stack.
