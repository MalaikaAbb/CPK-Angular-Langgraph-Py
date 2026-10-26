import os
from typing import Literal

from dotenv import load_dotenv
from ag_ui_langgraph import add_langgraph_fastapi_endpoint
from copilotkit import CopilotKitState, LangGraphAGUIAgent
from fastapi import FastAPI
from langgraph.graph import END, START, StateGraph
from langgraph.prebuilt import ToolNode, tools_condition
from langchain_core.messages import AIMessage, SystemMessage, ToolMessage
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI
from langgraph.checkpoint.memory import MemorySaver
import uvicorn
load_dotenv()

# The AG-UI dojo's FastAPI server sets this before importing its agents; the
# subgraphs agent reads it to compile with a MemorySaver checkpointer.
os.environ["LANGGRAPH_FAST_API"] = "true"

# Imported after load_dotenv(): these modules build their models at import time.
from agents.guardrails import agent as guardrails_graph
from agents.subagents import graph as subagents_graph
from agents.subgraphs import graph as subgraphs_graph


class AgentState(CopilotKitState):
  """Shared state with the frontend. LangGraph drops undeclared keys, so
  every key the frontend reads or writes must be listed here."""
  priority: Literal["low", "normal", "high"]


@tool
def getWeather(location: str) -> dict:
    """Get the current weather for a given location."""
    return {
        "city": location,
        "temperature": 68,
        "humidity": 55,
        "wind_speed": 10,
        "conditions": "Sunny",
    }


tools = [getWeather]


def answer_dangling_tool_calls(messages):
  """Give every tool call in the history a result.

  OpenAI rejects a request where an assistant message with `tool_calls` is not
  followed by a tool message for each call id. A run that ends between the tool
  call and the tool node leaves exactly that gap in the thread's checkpoint —
  stopping generation, reloading the page, or a dropped stream all do it — and
  because MemorySaver replays the thread, every later turn would fail with
  "tool_call_ids did not have response messages".

  Answering the orphans keeps the conversation usable instead of poisoning the
  thread. The history in the checkpoint is left as it is; only the list handed
  to the model is repaired.
  """
  answered = {
    message.tool_call_id
    for message in messages
    if isinstance(message, ToolMessage)
  }

  repaired = []
  for message in messages:
    repaired.append(message)
    if not isinstance(message, AIMessage):
      continue
    for tool_call in message.tool_calls:
      if tool_call["id"] not in answered:
        repaired.append(
          ToolMessage(
            tool_call_id=tool_call["id"],
            content="No result: the previous run ended before this tool ran.",
          )
        )
  return repaired


async def mock_llm(state: AgentState):
  model = ChatOpenAI(model="gpt-4.1-mini").bind_tools(tools)
  system_message = SystemMessage(
    content=(
      "You are a helpful assistant.\n"
      f"Current priority: {state.get('priority', 'normal')}\n"
    )
  )
  response = await model.ainvoke(
    [
      system_message,
      *answer_dangling_tool_calls(state["messages"]),
    ]
  )
  return {"messages": response}


graph = StateGraph(AgentState)
graph.add_node(mock_llm)
graph.add_node("tools", ToolNode(tools))
graph.add_edge(START, "mock_llm")
graph.add_conditional_edges("mock_llm", tools_condition, {"tools": "tools", END: END})
graph.add_edge("tools", "mock_llm")
graph = graph.compile(
  checkpointer=MemorySaver()
)

app = FastAPI()

add_langgraph_fastapi_endpoint(
  app=app,
  agent=LangGraphAGUIAgent(
    name="sample_agent",
    description="An example agent to use as a starting point for your own agent.",
    graph=graph,
  ),
  path="/",
)

# The guides below define their graphs but not how they are served. Each gets
# its own endpoint, mounted at /<demo name>, and server.ts registers it under
# its own agent id.
#
# Served over FastAPI, a graph needs a checkpointer (ag_ui_langgraph reads the
# thread state). The guides' create_agent graphs are written for LangGraph
# Platform, which supplies one, so it is attached here — the same MemorySaver
# the AG-UI dojo's FastAPI examples pass to create_agent.

# https://docs.copilotkit.ai/angular/langgraph-python/multi-agent/subagents
subagents_graph.checkpointer = MemorySaver()
add_langgraph_fastapi_endpoint(
  app=app,
  agent=LangGraphAGUIAgent(
    name="subagents",
    description="A supervisor delegating to research, writing, and critique sub-agents.",
    graph=subagents_graph,
  ),
  path="/subagents",
)

# https://docs.copilotkit.ai/angular/langgraph-python/subgraphs
# The AG-UI dojo's subgraphs agent; it compiles its own MemorySaver.
add_langgraph_fastapi_endpoint(
  app=app,
  agent=LangGraphAGUIAgent(
    name="subgraphs",
    description="A demo of LangGraph subgraphs using a Game Character Creator.",
    graph=subgraphs_graph,
  ),
  path="/subgraphs",
)

# https://docs.copilotkit.ai/angular/langgraph-python/guardrails
guardrails_graph.checkpointer = MemorySaver()
add_langgraph_fastapi_endpoint(
  app=app,
  agent=LangGraphAGUIAgent(
    name="guardrails",
    description="An agent screened by PIIMiddleware ahead of CopilotKitMiddleware.",
    graph=guardrails_graph,
  ),
  path="/guardrails",
)

def main():
  """Run the uvicorn server."""
  uvicorn.run(
    "main:app",
    host="0.0.0.0",
    port=8123,
    reload=True,
  )

if __name__ == "__main__":
  main()