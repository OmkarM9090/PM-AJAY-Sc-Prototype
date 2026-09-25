import os
from openai import OpenAI
import json

api_key = os.environ.get("OPENAI_API_KEY")
client = OpenAI(api_key=api_key) if api_key else None

# If API key is missing, we will use a fallback mock generator to not crash the demo
def get_llm_response(messages, tools=None):
    if not os.environ.get("OPENAI_API_KEY"):
        # Fallback Mock logic for when credentials are not configured
        return mock_llm_response(messages)
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            tools=tools,
            temperature=0.4
        )
        return response.choices[0].message
    except Exception as e:
        print(f"LLM Error: {e}")
        return mock_llm_response(messages)

def mock_llm_response(messages):
    class MockMessage:
        def __init__(self, content, tool_calls=None):
            self.content = content
            self.tool_calls = tool_calls

    last_msg = messages[-1]["content"].lower()
    if "marathi" in last_msg:
        return MockMessage("Ho, nakki. Ata apan Marathi madhye boluya. Tumhi kiti shikla ahat?")
    elif "hindi" in last_msg:
        return MockMessage("Theek hai, ab hum Hindi mein baat karenge. Aapki padhai kahan tak hui hai?")
    
    # Mock fallback tool call simulation
    if "electrician" in last_msg or "iti" in last_msg or "business" in last_msg or "5 km" in last_msg:
        class MockToolCall:
            def __init__(self, name, args):
                self.id = "mock_call_1"
                self.function = type('obj', (object,), {'name': name, 'arguments': json.dumps(args)})

        return MockMessage(
            None,
            [MockToolCall("update_profile", {
                "skills": ["Electrical wiring"] if "electrician" in last_msg else [],
                "education": "ITI" if "iti" in last_msg else None,
                "employment_preference": "self-employment" if "business" in last_msg else None,
                "radius": 5 if "5 km" in last_msg else None
            })]
        )

    return MockMessage("Aapke baare mein aur batayein.")

def process_conversation(session_messages, current_profile):
    system_prompt = f"""
You are Livelihood Mitra, a multilingual voice assistant helping beneficiaries find work, training, or self-employment opportunities.
You must speak in the language the user prefers (Hindi, Marathi, or English). Keep your answers short, conversational, and natural for a voice agent.

Current Profile Data:
Education: {current_profile.education or 'Unknown'}
Skills: {', '.join(current_profile.skills) if current_profile.skills else 'Unknown'}
Employment Preference: {current_profile.employment_preference or 'Unknown'}
Radius (km): {current_profile.radius or 'Unknown'}
Location: {current_profile.location_name or 'Unknown'}

Your Goal:
If any of the above fields are 'Unknown', gently ask the user one question to discover it. Do not ask for multiple things at once.
If the user provides information (like "I am an ITI electrician" or "5 km"), use the 'update_profile' tool to record it.
If all fields are known, ask if they want you to search for opportunities now.
If they say yes, use the 'search_opportunities' tool.
"""
    messages = [{"role": "system", "content": system_prompt}]
    for msg in session_messages:
        role = "assistant" if msg.speaker == "agent" else "user"
        if msg.speaker != "system":
            messages.append({"role": role, "content": msg.text})

    tools = [
        {
            "type": "function",
            "function": {
                "name": "update_profile",
                "description": "Extract structured information from the user's speech and update their profile.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "education": {"type": "string", "description": "e.g. 10th, 12th, ITI, Diploma, Graduate, No formal education"},
                        "skills": {"type": "array", "items": {"type": "string"}, "description": "e.g. ['Welding', 'Plumbing', 'Farming']"},
                        "employment_preference": {"type": "string", "enum": ["job", "self-employment", "training"]},
                        "radius": {"type": "number", "description": "Radius in kilometers they are willing to travel"},
                        "location_name": {"type": "string", "description": "City, town, or pincode"}
                    }
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "search_opportunities",
                "description": "Search for opportunities once the profile is complete.",
                "parameters": {
                    "type": "object",
                    "properties": {}
                }
            }
        }
    ]

    response_msg = get_llm_response(messages, tools)
    return response_msg
