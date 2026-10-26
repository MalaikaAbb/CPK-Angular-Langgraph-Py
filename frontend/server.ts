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
 * `subagents`, `sample_agent`, and `guardrails` are the graphs from the
 * Sub-Agents, Subgraphs, and Guardrails guides, each mounted by backend/main.py
 * on its own path. `subagents` is the id the Angular Showcase uses for the
 * sub-agents demo; `sample_agent` is the id the Subgraphs guide's
 * `injectAgentStore("sample_agent")` snippet reads.
 *
 * `a2ui: {}` enables A2UIMiddleware for every registered agent, per
 * https://docs.copilotkit.ai/angular/langgraph-python/guides/a2ui
 */
import { createServer } from "node:http";
import { CopilotKitIntelligence, CopilotRuntime } from "@copilotkit/runtime/v2";
import { createCopilotNodeListener } from "@copilotkit/runtime/v2/node";
import { LangGraphHttpAgent } from "@ag-ui/langgraph";

// The LangGraph agent binds port 8123. Start it from backend/ with:
//   uv run main.py
// The path is the one `add_langgraph_fastapi_endpoint(..., path="/")` mounts.
const agentUrl = process.env["LANGGRAPH_AGENT_URL"] ?? "http://localhost:8123/";

// Create the Intelligence client with your project API key. Keep this key on the server.
const intelligence = new CopilotKitIntelligence({
  apiKey: process.env["CPK_INTELLIGENCE_API_KEY"]!,
});

async function authenticateApplicationUser(
  _request: Request,
): Promise<{ id: string; name: string } | null> {
  return { id: "local-user", name: "Local user" };
}

const runtime = new CopilotRuntime({
  agents: {
    default: new LangGraphHttpAgent({ url: agentUrl }),
    support: new LangGraphHttpAgent({ url: agentUrl }),
    subagents: new LangGraphHttpAgent({
      url: new URL("subagents", agentUrl).href,
    }),
    sample_agent: new LangGraphHttpAgent({
      url: new URL("subgraphs", agentUrl).href,
    }),
    guardrails: new LangGraphHttpAgent({
      url: new URL("guardrails", agentUrl).href,
    }),
  },
  a2ui: {},
  intelligence,
  // Identify the user from a verified session or token
  identifyUser: async (request) => {
    const user = await authenticateApplicationUser(request);
    if (!user) throw new Error("Unauthorized");
    return { id: user.id, name: user.name };
  },
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
