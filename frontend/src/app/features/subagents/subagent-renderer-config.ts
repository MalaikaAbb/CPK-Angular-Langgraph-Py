/**
 * `subAgentRendererConfig`, used but not shown by
 * https://docs.copilotkit.ai/angular/langgraph-python/multi-agent/subagents
 *
 * Unchanged from the Angular Showcase's
 * features/agent-state/subagent-renderer-config.ts.
 */
import type { RenderToolCallConfig } from "@copilotkit/angular";
import { z } from "zod";

import { SubAgentActivityCard } from "./subagent-cards";
import type { SubAgentName } from "./subagent-model";

/**
 * Build a route-lifetime subagent renderer that also matches runtimes whose
 * assistant messages do not carry an agent identifier.
 */
export function subAgentRendererConfig(
  name: SubAgentName,
): RenderToolCallConfig<{ task: string }> {
  return {
    name,
    args: z.object({ task: z.string() }),
    component: SubAgentActivityCard as unknown as RenderToolCallConfig<{
      task: string;
    }>["component"],
  };
}
