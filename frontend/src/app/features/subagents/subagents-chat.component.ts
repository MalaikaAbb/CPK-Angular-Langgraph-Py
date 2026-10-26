/**
 * "Rendering a live delegation log", from
 * https://docs.copilotkit.ai/angular/langgraph-python/multi-agent/subagents
 *
 * The class members are the guide's snippet. Two showcase-only details are
 * resolved here: `this.agentId` is `subagents`, which is what the Angular
 * Showcase's agentIdForCurrentIntegration("subagents") resolves to and the key
 * server.ts registers for the supervisor; and the `feature === "subagents"`
 * guard is dropped, since this component serves only the sub-agents demo. Template
 * and layout come from the Angular Showcase's agent-state-feature.component.ts,
 * with its showcase chat host replaced by a plain copilot-chat.
 */
import { Component, computed } from "@angular/core";
import {
  CopilotChat,
  injectAgentStore,
  registerRenderToolCall,
} from "@copilotkit/angular";

import { DelegationLogComponent } from "./subagent-cards";
import type { SubAgentName } from "./subagent-model";
import { readDelegations } from "./subagent-model";
import { subAgentRendererConfig } from "./subagent-renderer-config";

@Component({
  selector: "app-subagents-chat",
  imports: [CopilotChat, DelegationLogComponent],
  template: `
    <main class="subagents">
      <aside aria-label="Live supervisor delegation state">
        <showcase-delegation-log [delegations]="delegations()" />
      </aside>
      <section class="chat-surface" aria-label="CopilotKit assistant">
        <copilot-chat agentId="subagents" />
      </section>
    </main>
  `,
  styles: `
    :host {
      display: block;
      height: 100%;
    }
    .chat-surface {
      min-width: 0;
      height: 100%;
      background: #fff;
    }
    .subagents {
      display: grid;
      height: 100%;
      grid-template-columns: minmax(18rem, 0.85fr) minmax(0, 1.35fr);
      gap: 1rem;
      padding: 1rem;
      background: #eef3f7;
    }
    .subagents aside {
      min-width: 0;
      overflow: auto;
    }
    .subagents .chat-surface {
      overflow: hidden;
      border: 1px solid #d8e0ea;
      border-radius: 1rem;
    }
    @media (max-width: 52rem) {
      .subagents {
        grid-template-columns: 1fr;
        grid-template-rows: auto minmax(30rem, 55vh);
        overflow: auto;
      }
    }
  `,
})
export class SubagentsChatComponent {
  private readonly agentStore = injectAgentStore("subagents");
  protected readonly delegations = computed(() =>
    readDelegations(this.agentStore().state()),
  );

  constructor() {
    this.registerSubAgent("research_agent");
    this.registerSubAgent("writing_agent");
    this.registerSubAgent("critique_agent");
  }

  private registerSubAgent(name: SubAgentName): void {
    registerRenderToolCall(subAgentRendererConfig(name));
  }
}
