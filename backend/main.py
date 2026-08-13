import os

from dotenv import load_dotenv
from ag_ui_langgraph import add_langgraph_fastapi_endpoint
from copilotkit import LangGraphAGUIAgent
from fastapi import FastAPI
from langgraph.graph import END, START, MessagesState, StateGraph
from langgraph.prebuilt import ToolNode, tools_condition
from langchain_core.messages import AIMessage, SystemMessage, ToolMessage
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI
from langgraph.checkpoint.memory import MemorySaver
import uvicorn
load_dotenv()

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


async def mock_llm(state: MessagesState):
  model = ChatOpenAI(model="gpt-4.1-mini").bind_tools(tools)
  system_message = SystemMessage(content="You are a helpful assistant.")
  response = await model.ainvoke(
    [
      system_message,
      *answer_dangling_tool_calls(state["messages"]),
    ]
  )
  return {"messages": response}


graph = StateGraph(MessagesState)
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