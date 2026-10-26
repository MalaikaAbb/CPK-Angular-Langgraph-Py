import { Component } from '@angular/core';

import { RouteHeader } from '../components/route-header';
import { Callout, Panel, SourceCode, TryIt } from '../components/ui';

@Component({
  selector: 'app-subagents-page',
  imports: [RouteHeader, Panel, Callout, TryIt, SourceCode],
  template: `
    <app-route-header path="/subagents" />

    <div class="space-y-6">
      <ui-try-it>
        <p class="mt-1 text-slate-700">
          Open the demo and send
          <em
            >Produce a short blog post about the benefits of cold exposure training. Research
            first, then write, then critique.</em
          >
        </p>
        <p class="mt-2 text-slate-700">
          <strong>Pass:</strong> a Researcher, Writer, and Critic card appears in the transcript as
          each sub-agent runs, and the delegation log on the left grows to 3 entries, each carrying
          that sub-agent's output. <strong>Fail:</strong> the cards render but the log stays empty
          — the tools are not writing the <code>delegations</code> slot of shared state.
        </p>
      </ui-try-it>

      <ui-panel heading="Supervisor and sub-agents as tools">
        <p class="mb-3 text-sm text-slate-700">
          The guide's module. Each sub-agent is its own <code>create_agent(...)</code>; each
          delegation tool returns a <code>Command</code> that appends one entry to
          <code>delegations</code> and feeds the result back as a <code>ToolMessage</code>.
        </p>
        <ui-source path="backend/agents/subagents.py" />
      </ui-panel>

      <ui-panel heading="Serving the supervisor">
        <p class="mb-3 text-sm text-slate-700">
          The supervisor gets its own <code>LangGraphAGUIAgent</code>, mounted at
          <code>/subagents</code>, and <code>server.ts</code> registers it under the agent id
          <code>subagents</code>.
        </p>
        <ui-source path="backend/main.py" />
      </ui-panel>

      <ui-panel heading="Rendering a live delegation log">
        <ui-source path="src/app/features/subagents/subagents-chat.component.ts" />
      </ui-panel>

      <ui-panel heading="Reading the delegations slot">
        <ui-source path="src/app/features/subagents/subagent-model.ts" />
      </ui-panel>

      <ui-panel heading="One renderer per sub-agent tool">
        <ui-source path="src/app/features/subagents/subagent-renderer-config.ts" />
      </ui-panel>

      <ui-panel heading="Transcript card and delegation log">
        <ui-source path="src/app/features/subagents/subagent-cards.ts" />
      </ui-panel>

      <ui-callout title="Not in the guide — where the gaps were filled">
        The backend module is the CopilotKit showcase's
        <code>src/agents/subagents.py</code>, which the guide is cut from, with one change:
        <code>HeaderForwardingMiddleware</code> is removed. In the showcase it only forwards aimock
        test headers and depends on other showcase-only modules. How the supervisor is served, its
        checkpointer, and the <code>subagents</code> agent id are this harness's wiring.
        <code>readDelegations</code>, <code>subAgentRendererConfig</code>, and both card
        components come from the Angular Showcase the guide's frontend snippet is taken from.
      </ui-callout>

      <ui-callout tone="warn" title="The guide warns about operator.add — and its code uses it">
        The guide cautions that an <code>Annotated[list, operator.add]</code> reducer can double
        the log when a thread is continued, because the client echoes shared state back as run
        input. The guide's own <code>AgentState</code> uses exactly that reducer. The code is
        followed as published, so continuing a thread may show duplicated entries.
      </ui-callout>
    </div>
  `,
})
export default class SubagentsPage {}
