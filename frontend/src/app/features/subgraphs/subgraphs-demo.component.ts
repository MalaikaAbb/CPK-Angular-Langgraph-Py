/**
 * Harness wrapper mounting the Subgraphs guide's state view beside a chat on
 * the same `sample_agent`, so subgraph state updates can be watched live.
 */
import { Component } from '@angular/core';
import { CopilotChat } from '@copilotkit/angular';

import { AgentStatusComponent } from './agent-status.component';

@Component({
  selector: 'app-subgraphs-demo',
  imports: [CopilotChat, AgentStatusComponent],
  template: `
    <div class="flex h-full gap-4 p-4">
      <section
        class="w-96 shrink-0 overflow-y-auto rounded-lg border border-slate-200 bg-white p-4"
      >
        <h2 class="mb-2 text-sm font-semibold text-slate-900">injectAgentStore — agent state</h2>
        <app-agent-status />
      </section>
      <div class="min-w-0 flex-1">
        <copilot-chat agentId="sample_agent" />
      </div>
    </div>
  `,
})
export class SubgraphsDemoComponent {}
