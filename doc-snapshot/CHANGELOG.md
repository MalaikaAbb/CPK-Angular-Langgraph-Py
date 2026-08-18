# Doc drift changelog

What the CopilotKit docs changed under this repo, written by the sync on
`/doc-sync`. Only pages that actually moved are recorded — a sync that finds
everything unchanged writes nothing here at all.

Holds the 3 most recent dated entries. When a change lands on a fourth
date, the oldest entry is dropped. Entries are counted, not aged, so a gap of
weeks between changes does not expire anything.

## 2026-08-18

### 06:51 UTC — 3 pages, highest severity high

**High — Threads** · _local snapshot edit, not an upstream change_

`/angular/langgraph-python/guides/threads-memory-attachments-headless` · routes `/threads`, `/memory`, `/attachments`, `/headless` · under “Resume a specific thread” · in a `ts` block

2 code lines changed.

````diff
+ import { injectThreads } from "@copilotkit/angular";
+ 
````

**Medium — Introduction** · _local snapshot edit, not an upstream change_

`/angular/langgraph-python` · routes `/`, `/doc-sync` · under “Prerequisites”

1 heading changed.

````diff
+ ## Prerequisites
````

**Low — Chat UI and customization** · _local snapshot edit, not an upstream change_

`/angular/langgraph-python/guides/chat-ui` · route `/chat-ui` · under “Choose a chat surface”

2 prose lines changed.

````diff
- | `CopilotChat` | Chat belongs . |
+ | `CopilotChat` | Chat belongs inside an existing page or panel. |
````
