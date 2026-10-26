/**
 * Harness wrapper: a plain chat on the `guardrails` agent, so the Guardrails
 * guide's PIIMiddleware stack can be exercised. The guide has no frontend code.
 */
import { Component } from '@angular/core';
import { CopilotChat } from '@copilotkit/angular';

@Component({
  selector: 'app-guardrails-chat',
  imports: [CopilotChat],
  template: `
    <div class="h-full p-4">
      <copilot-chat agentId="guardrails" />
    </div>
  `,
})
export class GuardrailsChatComponent {}
