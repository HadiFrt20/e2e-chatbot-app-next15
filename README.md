# Databricks Agent Chat Template (Next.js)

Next.js 15 App Router implementation of the Databricks chat template. The UI lives under `/chat`, and the server-side API uses Route Handlers with server-only Databricks credentials and streaming responses.

## Prerequisites

- Node.js >= 18 and npm >= 8
- Databricks workspace with a serving endpoint (`DATABRICKS_SERVING_ENDPOINT`)
- Databricks auth (one of):
  - `DATABRICKS_TOKEN`
  - or `DATABRICKS_CLIENT_ID` + `DATABRICKS_CLIENT_SECRET`
  - or `DATABRICKS_CONFIG_PROFILE` for CLI-based auth
- Optional Postgres/Lakehouse for history:
  - `POSTGRES_URL` **or** `PGHOST`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`, `PGPORT`, `PGSSLMODE`
- Optional: `API_PROXY`, `LOG_SSE_EVENTS`, `DATABRICKS_HOST`

## Setup & Local Development

1) Clone and install:
```bash
npm install
```

2) Create `.env.local` in the repo root with the variables above (Next.js loads it automatically).

3) Run the dev server (Next.js App Router on port 3000 by default):
```bash
npm run dev
```

4) Open http://localhost:3000/chat to start a conversation. `npm run build` and `npm run start` are available for production builds.

## Streaming (SSE)

- `POST /api/chat` returns `text/event-stream` via the Web Streams API (`ReadableStream` + `TransformStream`). The stream is built with Vercel AI SDK UI streams and stays entirely server-side with Databricks credentials.
- Streams are cached so the client can reconnect via `GET /api/chat/[id]/stream` with `X-Resume-Stream-Cursor`.
- The client uses `@ai-sdk/react` with a custom transport to consume the SSE feed incrementally and render tokens as they arrive.
- Attachments are accepted at `POST /api/files/upload`, which echoes back a data URL for quick previews.

## Persistence Modes

- **With DB vars set**: conversations and usage metadata persist to Postgres/Lakehouse; sidebar history is enabled.
- **Without DB vars**: runs in ephemeral mode (no history saved); streaming still works and the UI surfaces the ephemeral state.

## Deployment

- `databricks.yml` remains the deployment source of truth for Databricks Apps/Asset Bundles. Use `databricks bundle validate` and `databricks bundle deploy` as before once env vars are configured.

## Smoke Test Checklist

- Start dev server: `npm run dev` (with `.env.local` in place).
- Visit http://localhost:3000/chat and send a prompt.
- Observe streamed tokens arriving from `/api/chat` without waiting for completion.
- If a database is configured, verify chat history updates in the sidebar; otherwise confirm the ephemeral indicator is shown.
