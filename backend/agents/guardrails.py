"""
"Start with the built-in PII middleware", from
https://docs.copilotkit.ai/angular/langgraph-python/guardrails

The guide's example, verbatim, except `tools=[...]` is `tools=[]`: the guide
leaves the tool list to the reader and has no demo code to take one from.
"""

from langchain.agents import create_agent
from langchain.agents.middleware import PIIMiddleware
from copilotkit import CopilotKitMiddleware

agent = create_agent(
    model="openai:gpt-4o",
    tools=[],
    middleware=[
        # Redact emails the user sends in.
        PIIMiddleware("email", strategy="redact"),
        # Mask card numbers wherever they appear, including in tool results.
        PIIMiddleware(
            "credit_card",
            strategy="mask",
            apply_to_output=True,
            apply_to_tool_results=True,
        ),
        # Refuse outright if an API key shows up.
        PIIMiddleware("api_key", detector=r"sk-[a-zA-Z0-9]{32}", strategy="block"),
        CopilotKitMiddleware(),
    ],
)
