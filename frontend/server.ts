/**
 * Copilot Runtime for this harness.
 *
 * Shape comes from the Angular quickstart's Node runtime server
 * (https://docs.copilotkit.ai/angular/langgraph-python/quickstart), with the
 * agent bound to the LangGraph backend in `../backend` — the Angular/LangGraph
 * quickstart defers the backend step to "register this backend as the
 * `default` agent".
 *
 * That backend serves itself: backend/main.py compiles a LangGraph
 * `StateGraph` and mounts it on FastAPI with
 * `add_langgraph_fastapi_endpoint(app, LangGraphAGUIAgent(...), path="/")`, so
 * the graph is already exposed over HTTP as an AG-UI endpoint. The binding
 * here is therefore `LangGraphHttpAgent` from `@ag-ui/langgraph` — the client
 * that POSTs a run to that endpoint and consumes the AG-UI event stream
 * (messages, state, tool calls, interrupts) it streams back.
 *
 * `default` and `support` resolve to the same LangGraph agent. `support`
 * exists so the doc snippets that use `agentId="support"` (Chat UI, Threads)
 * run verbatim.
 *
 * `a2ui: {}` enables A2UIMiddleware for every registered agent, per
 * https://docs.copilotkit.ai/angular/langgraph-python/guides/a2ui
 */
import { createServer } from "node:http";
import { CopilotRuntime } from "@copilotkit/runtime/v2";
import { createCopilotNodeListener } from "@copilotkit/runtime/v2/node";
import { LangGraphHttpAgent } from "@ag-ui/langgraph";

// The LangGraph agent binds port 8123. Start it from backend/ with:
//   uv run main.py
// The path is the one `add_langgraph_fastapi_endpoint(..., path="/")` mounts.
const agentUrl = process.env["LANGGRAPH_AGENT_URL"] ?? "http://localhost:8123/";

const runtime = new CopilotRuntime({
  agents: {
    default: new LangGraphHttpAgent({ url: agentUrl }),
    support: new LangGraphHttpAgent({ url: agentUrl }),
  },
  a2ui: {},
});

const port = Number(process.env["PORT"] ?? 8200);

createServer(
  createCopilotNodeListener({
    runtime,
    basePath: "/api/copilotkit",
    cors: true,
  }),
).listen(port, () => {
  console.log(
    `Copilot Runtime listening at http://localhost:${port}/api/copilotkit`,
  );
  console.log(`LangGraph agent: ${agentUrl}`);
});
