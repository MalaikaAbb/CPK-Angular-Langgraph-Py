/**
 * "How does CopilotKit support this?", from
 * https://docs.copilotkit.ai/angular/langgraph-python/subgraphs
 *
 * The class body is the guide's snippet. The guide shows the class without a
 * decorator and says only to read `this.store().state()` in the template, so
 * the `@Component` and its template — the state printed as JSON — are the
 * harness's.
 */
import { JsonPipe } from '@angular/common';
import { Component } from '@angular/core';
import { injectAgentStore } from '@copilotkit/angular';

@Component({
  selector: 'app-agent-status',
  imports: [JsonPipe],
  template: `<pre class="text-xs whitespace-pre-wrap text-slate-800">{{ store().state() | json }}</pre>`,
})
export class AgentStatusComponent {
  readonly store = injectAgentStore('sample_agent');

  // Read this.store().state() in the template or another computed signal.
  // Subgraph streaming updates it automatically.
}
