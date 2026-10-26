/**
 * Delegation-log model for
 * https://docs.copilotkit.ai/angular/langgraph-python/multi-agent/subagents
 *
 * The page uses `readDelegations` and `SubAgentName` without showing them.
 * This is the sub-agent half of the Angular Showcase's
 * features/agent-state/agent-state-model.ts, unchanged; the planner (`steps`)
 * half belongs to a different demo and is left out.
 */
export type SubAgentName =
  | "research_agent"
  | "writing_agent"
  | "critique_agent";

export interface Delegation {
  id: string;
  subAgent: SubAgentName;
  task: string;
  status: "completed";
  result: string;
}

/** Read completed supervisor delegations from append-only agent state. */
export function readDelegations(state: unknown): Delegation[] {
  const delegations = readArraySlot(state, "delegations");
  return delegations.flatMap((candidate) => {
    if (!isRecord(candidate)) return [];
    const { id, sub_agent: subAgent, task, status, result } = candidate;
    if (
      typeof id !== "string" ||
      !isSubAgentName(subAgent) ||
      typeof task !== "string" ||
      status !== "completed" ||
      typeof result !== "string"
    ) {
      return [];
    }
    return [{ id, subAgent, task, status, result }];
  });
}

function readArraySlot(state: unknown, slot: string): unknown[] {
  if (!isRecord(state)) return [];
  const value = state[slot];
  return Array.isArray(value) ? value : [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isSubAgentName(value: unknown): value is SubAgentName {
  return (
    value === "research_agent" ||
    value === "writing_agent" ||
    value === "critique_agent"
  );
}
