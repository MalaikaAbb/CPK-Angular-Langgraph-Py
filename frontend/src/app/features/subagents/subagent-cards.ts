/**
 * Sub-agent transcript card and delegation log for
 * https://docs.copilotkit.ai/angular/langgraph-python/multi-agent/subagents
 *
 * The page renders these without showing them. This is the sub-agent half of
 * the Angular Showcase's features/agent-state/agent-state-cards.ts, unchanged;
 * the planner card belongs to a different demo and is left out.
 */
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from "@angular/core";
import type { AngularToolCall } from "@copilotkit/angular";

import type { Delegation, SubAgentName } from "./subagent-model";

const SUB_AGENT_META: Readonly<
  Record<
    SubAgentName,
    {
      label: string;
      testId: string;
      delegationTestId: string;
      action: string;
    }
  >
> = {
  research_agent: {
    label: "Researcher",
    testId: "subagent-card-researcher",
    delegationTestId: "subagent-delegation-researcher",
    action: "gathering facts",
  },
  writing_agent: {
    label: "Writer",
    testId: "subagent-card-writer",
    delegationTestId: "subagent-delegation-writer",
    action: "drafting prose",
  },
  critique_agent: {
    label: "Critic",
    testId: "subagent-card-critic",
    delegationTestId: "subagent-delegation-critic",
    action: "reviewing the draft",
  },
};

@Component({
  selector: "showcase-subagent-activity-card",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article
      class="subagent-card"
      [attr.data-testid]="meta().testId"
      [attr.data-sub-agent]="subAgent()"
      [attr.data-status]="toolCall().status"
    >
      <header>
        <strong>{{ meta().label }}</strong>
        <span>{{ complete() ? "Complete" : "Working" }}</span>
      </header>
      <p><b>Task:</b> {{ toolCall().args.task || "Receiving task…" }}</p>
      @if (complete()) {
        <p data-testid="subagent-result"><b>Result:</b> {{ toolCall().result }}</p>
      } @else {
        <p>{{ meta().label }} is {{ meta().action }}…</p>
      }
    </article>
  `,
  styles: `
    :host {
      display: block;
      margin: 0.75rem 0;
    }
    .subagent-card {
      overflow: hidden;
      border: 1px solid #c7d2fe;
      border-radius: 1rem;
      color: #18253a;
      background: #f8faff;
      box-shadow: 0 6px 20px rgb(49 46 129 / 8%);
    }
    header {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.7rem 0.9rem;
      border-bottom: 1px solid #dbe3f0;
      background: #eef2ff;
    }
    header span {
      color: #475569;
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    p {
      margin: 0;
      padding: 0.7rem 0.9rem;
      white-space: pre-wrap;
      font-size: 0.8rem;
      line-height: 1.5;
    }
    p + p {
      padding-top: 0;
    }
  `,
})
export class SubAgentActivityCard {
  readonly toolCall = input.required<AngularToolCall<{ task: string }>>();
  protected readonly subAgent = computed(() => {
    const name = this.toolCall().name;
    return isSubAgentName(name) ? name : "research_agent";
  });
  protected readonly meta = computed(() => SUB_AGENT_META[this.subAgent()]);
  protected readonly complete = computed(
    () => this.toolCall().status === "complete",
  );
}

function isSubAgentName(value: unknown): value is SubAgentName {
  return (
    value === "research_agent" ||
    value === "writing_agent" ||
    value === "critique_agent"
  );
}

@Component({
  selector: "showcase-delegation-log",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="delegation-log" data-testid="delegation-log">
      <header>
        <div>
          <p>Supervisor</p>
          <h1>Sub-agent delegations</h1>
        </div>
        <span data-testid="delegation-count">{{ delegations().length }} calls</span>
      </header>
      <div class="role-row" aria-label="Available sub-agents">
        @for (role of roles; track role.subAgent) {
          <span [attr.data-fired]="called(role.subAgent)">{{ role.label }}</span>
        }
      </div>
      @if (delegations().length === 0) {
        <p class="empty">
          Ask the supervisor to research, write, and critique a task.
        </p>
      } @else {
        <ol>
          @for (
            delegation of delegations();
            track delegation.id;
            let index = $index
          ) {
            <li
              [attr.data-testid]="testIdFor(delegation.subAgent)"
              [attr.data-status]="delegation.status"
            >
              <strong>{{ index + 1 }}. {{ labelFor(delegation.subAgent) }}</strong>
              <span>{{ delegation.status }}</span>
              <p>{{ delegation.task }}</p>
              <blockquote>{{ delegation.result }}</blockquote>
            </li>
          }
        </ol>
      }
    </section>
  `,
  styles: `
    :host {
      display: block;
      min-width: 0;
    }
    .delegation-log {
      overflow: hidden;
      border: 1px solid #d8e0ea;
      border-radius: 1rem;
      background: #fff;
      box-shadow: 0 12px 34px rgb(30 49 73 / 8%);
    }
    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 1rem;
      border-bottom: 1px solid #e2e8f0;
    }
    header p,
    header h1 {
      margin: 0;
    }
    header p {
      color: #6366f1;
      font-size: 0.7rem;
      font-weight: 750;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }
    header h1 {
      margin-top: 0.2rem;
      color: #152238;
      font-size: 1.1rem;
    }
    header span {
      color: #64748b;
      font-size: 0.75rem;
    }
    .role-row {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      border-bottom: 1px solid #e2e8f0;
    }
    .role-row span {
      padding: 0.3rem 0.55rem;
      border: 1px solid #cbd5e1;
      border-radius: 999px;
      color: #64748b;
      font-size: 0.72rem;
    }
    .role-row span[data-fired="true"] {
      border-color: #818cf8;
      color: #3730a3;
      background: #eef2ff;
    }
    .empty {
      margin: 0;
      padding: 1rem;
      color: #64748b;
      font-size: 0.85rem;
    }
    ol {
      display: grid;
      gap: 0.75rem;
      margin: 0;
      padding: 1rem;
      list-style: none;
    }
    li {
      padding: 0.8rem;
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
      background: #f8fafc;
    }
    li > span {
      float: right;
      color: #15803d;
      font-size: 0.7rem;
      text-transform: uppercase;
    }
    li p,
    blockquote {
      margin: 0.5rem 0 0;
      color: #475569;
      font-size: 0.78rem;
      line-height: 1.45;
    }
    blockquote {
      padding: 0.65rem;
      border-radius: 0.5rem;
      background: #fff;
    }
  `,
})
export class DelegationLogComponent {
  readonly delegations = input.required<Delegation[]>();
  protected readonly roles = [
    { subAgent: "research_agent" as const, label: "Researcher" },
    { subAgent: "writing_agent" as const, label: "Writer" },
    { subAgent: "critique_agent" as const, label: "Critic" },
  ];

  protected called(subAgent: SubAgentName): boolean {
    return this.delegations().some(
      (delegation) => delegation.subAgent === subAgent,
    );
  }

  protected labelFor(subAgent: SubAgentName): string {
    return SUB_AGENT_META[subAgent].label;
  }

  /** Resolve a delegation-log identity distinct from transcript tool cards. */
  protected testIdFor(subAgent: SubAgentName): string {
    return SUB_AGENT_META[subAgent].delegationTestId;
  }
}
