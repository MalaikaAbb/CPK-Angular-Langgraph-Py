# CopilotKit + LangGraph (Python) — Angular

A navigable test harness for the Angular section of the CopilotKit LangGraph Python documentation. Each guide in the sidebar is a route that runs the thing its doc page teaches, rather than restating it.

Tracks **<https://docs.copilotkit.ai/angular/langgraph-python>**.

| | |
|---|---|
| **Frontend** | Angular 22.1 · TypeScript 6.0 · Tailwind 4 · zoneless |
| **CopilotKit** | `@copilotkit/angular` 0.3.1 · `@copilotkit/runtime` 1.67.1 |
| **AG-UI** | `@ag-ui/langgraph` 0.0.42 · `@ag-ui/client` 0.0.57 |
| **Backend** | Python 3.13 · `langgraph` 1.2.11 · `ag-ui-langgraph` 0.0.42 · FastAPI 0.141.1 |
| **Model** | `gpt-4.1-mini` |

---

## Architecture

Three processes, not two. Angular has no server route to host the Copilot Runtime, so the runtime is its own Node process sitting between the browser and the agent.

```
Browser (Angular 22, zoneless)  ·  localhost:4200
  │  @copilotkit/angular — provideCopilotKit, <copilot-chat>, signal APIs
  │  POST http://localhost:8200/api/copilotkit
  ▼
Copilot Runtime  ·  localhost:8200          ← Node, frontend/server.ts
  │  agents: { default, support } → new LangGraphHttpAgent({ url })
  │  a2ui: {}  → A2UIMiddleware
  │  POST http://localhost:8123/
  ▼
LangGraph agent  ·  localhost:8123          ← Python, backend/main.py
  │  StateGraph(MessagesState) → mock_llm ⇄ ToolNode([getWeather])
  │  served by LangGraphAGUIAgent("sample_agent") on FastAPI + uvicorn
  ▼
OpenAI  (gpt-4.1-mini)
```

The backend **serves itself**. `backend/main.py` compiles the graph and mounts it with `add_langgraph_fastapi_endpoint(app=app, agent=LangGraphAGUIAgent(...), path="/")`, so the graph is already exposed over HTTP as an AG-UI endpoint — there is no `langgraph.json` and no LangGraph platform dev server involved. That is why the runtime binds it with **`LangGraphHttpAgent({ url })`** — a plain URL — rather than by `deploymentUrl` + `graphId`.

**Why two agent ids.** `default` and `support` both resolve to the same agent. `default` is what CopilotKit's prebuilt components use with no configuration; `support` exists so the Chat UI and Threads guide snippets — written as `agentId="support"` — run exactly as published.

**The model key never reaches the browser**, and never reaches the runtime either. Only the Python process holds it.

---

## Prerequisites

| Requirement | Version used here | Notes |
|---|---|---|
| Node.js | 24.16.0 | Angular 22 requires `^22.22.3 \|\| ^24.15.0 \|\| >=26` |
| npm | 12.0.1 | |
| Python | 3.13 | pinned in `backend/.python-version` |
| [uv](https://docs.astral.sh/uv/) | 0.11+ | manages the Python env |
| OpenAI API key | — | the agent runs `gpt-4.1-mini` |

---

## Setup

### 1. Backend

```bash
cd backend
uv sync
```

Create `backend/.env` with your key — `main.py` calls `load_dotenv()` on import, which fills in `OPENAI_API_KEY` only if it is not already set in the environment:

```bash
echo "OPENAI_API_KEY=sk-..." > .env
```

### 2. Frontend

```bash
cd frontend
npm install
```

---

## Run

Two terminals. Start the backend first — the runtime only connects on its first request, so the order is not enforced, but the chat will not stream until both are up.

**Terminal 1 — the LangGraph agent, on :8123**

```bash
cd backend
uv run main.py
```

Wait for `Uvicorn running on http://0.0.0.0:8123`. The server runs with `reload=True`, so edits to `main.py` restart it.

**Terminal 2 — the Copilot Runtime (:8200) and Angular (:4200)**

```bash
cd frontend
npm run dev
```

`npm run dev` runs both under `concurrently`. To run them separately instead:

```bash
npm run runtime   # Copilot Runtime on :8200
npm start         # Angular dev server on :4200
```

Then open **<http://localhost:4200/>**. The Introduction route has a live connection check for both backend processes.

---

## Verify it works

1. **The agent is up** — `curl -o /dev/null -w '%{http_code}\n' http://localhost:8123/` answers **405**. That is the healthy response: the AG-UI endpoint is POST-only, so any answer at all proves the process is listening.
2. **The agent reports itself** — note the double slash; `add_langgraph_fastapi_endpoint` mounts health at `<path>/health`, and `path` is `/`:
   ```bash
   curl http://localhost:8123//health
   # {"status":"ok","agent":{"name":"sample_agent"}}
   ```
3. **The runtime sees both agents** — `curl http://localhost:8200/api/copilotkit/info` lists `default` and `support`. This is the one check the quickstart's troubleshooting box prescribes.
4. **End to end, without the browser** — a run streams AG-UI events back through the runtime:
   ```bash
   curl -N -X POST http://localhost:8200/api/copilotkit/agent/default/run \
     -H 'content-type: application/json' -H 'accept: text/event-stream' \
     -d '{"threadId":"t1","runId":"r1","state":{},"messages":[{"id":"m1","role":"user","content":"Weather in Paris?"}],"tools":[],"context":[],"forwardedProps":{}}'
   ```
   Expect `RUN_STARTED`, a `TOOL_CALL_START` for `getWeather`, a `TOOL_CALL_RESULT`, then streamed `TEXT_MESSAGE_CONTENT`.
5. **In the browser** — open `/quickstart` and send *Can you tell me a joke?* Tokens should stream in one at a time and render as markdown.

---

## Ports and environment variables

| Port | Process | Started by |
|---|---|---|
| 4200 | Angular dev server | `npm start` |
| 8200 | Copilot Runtime | `npm run runtime` |
| 8123 | LangGraph agent | `uv run main.py` |

| Variable | Read by | Default |
|---|---|---|
| `OPENAI_API_KEY` | `backend/.env` → the agent | — (required) |
| `LANGGRAPH_AGENT_URL` | `frontend/server.ts` | `http://localhost:8123/` |
| `PORT` | `frontend/server.ts` | `8200` |

The agent's port is set in `backend/main.py` (`uvicorn.run(..., port=8123)`). Change it there and in `LANGGRAPH_AGENT_URL`, or the runtime will not find it.

---

## Project layout

```
backend/
  main.py           the graph, the getWeather tool, and the FastAPI AG-UI endpoint
  pyproject.toml    Python dependencies (uv)
frontend/
  server.ts         Copilot Runtime — the one file that ties CopilotKit to LangGraph
  src/app/app.config.ts        provideCopilotKit at the application root
  src/app/features/            one folder per guide; the code the routes display and run
  src/app/pages/               the doc routes themselves
  src/app/lib/nav-config.ts    routes, doc links, and per-route status
  scripts/generate-sources.ts  prestart/prebuild step that snapshots source for display
```

Routes render their own source off disk, so what a page shows is byte-identical to what runs. `npm start` and `npm run build` regenerate that snapshot automatically; run `npm run gen:sources` by hand if you edit a feature file while the dev server is up.

---

## Troubleshooting

**`ModuleNotFoundError: No module named 'uvicorn'`.** Your environment predates uvicorn being added to `pyproject.toml`. Run `uv sync` from `backend/`.

**Nothing streams in the chat.** One of the two backend processes is down. The Introduction route probes both and shows which.

**The runtime logs `ECONNREFUSED 127.0.0.1:8123`.** The agent is not running, or is on another port. Start it, or point the runtime elsewhere with `LANGGRAPH_AGENT_URL`.

**`EADDRINUSE` on 8200.** Another Copilot Runtime is already listening. Stop it, or start this one on a different port with `PORT=8201 npm run runtime` — and update `runtimeUrl` in `src/app/app.config.ts` to match.

**`openai.BadRequestError: ... tool_call_ids did not have response messages`.** A run on that thread ended between a tool call and its result — stopping generation, reloading the page, or a dropped stream — and `MemorySaver` replays the gap on every later turn. `answer_dangling_tool_calls` in `backend/main.py` repairs the history before it reaches the model, so this should no longer surface; starting a new conversation also sidesteps a thread that predates the fix.

**Threads and memory routes render a locked or empty state.** Expected. Those endpoints come from the CopilotKit Enterprise Intelligence Platform; without a license key there is nothing to list. See the per-route status notes.

**Microphone records but transcription fails.** Expected. This runtime has no transcription service configured.

---

## Known gaps

- **`getWeather` argument mismatch.** The agent declares `getWeather(location: str)`, but the frontend renderer in `src/app/features/tools/` is written against `{ city }`. The tool call still runs and the agent still answers — you just get plain text where the weather card should be. Aligning the two names fixes it.
- **The agent serves no CORS headers.** FastAPI here adds no CORS middleware, so the browser cannot read a response from `:8123` directly. The Introduction route's connection check works around this by probing with `mode: 'no-cors'`; add `CORSMiddleware` in `backend/main.py` if you want the browser to talk to the agent for anything else. Normal chat traffic is unaffected — it goes through the runtime, which is server-side.
- **A2UI is inert.** `/info` reports `a2uiEnabled: true`, but supplying `a2ui.catalog` is what actually registers the `render_a2ui` renderer, and the guide's catalog snippet is not self-contained. Tracked on the `/a2ui` route.
