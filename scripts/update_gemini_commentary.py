import os
import json
import datetime
import urllib.request
import traceback

API_KEY = os.environ["GEMINI_API_KEY"]

MODEL = "gemini-1.5-flash"

prompt = """
You are writing a market commentary for an AI Semiconductor investment dashboard.

Focus on:
- Nvidia
- AMD
- TSMC
- Broadcom
- ASML
- Micron
- Microsoft AI spending
- Meta AI spending
- Amazon AI spending

Write in Finnish.

Format:

YHTEENVETO
(2-3 sentences)

NOUSUA TUKEVAT TEKIJÄT
- bullet
- bullet

RISKIT
- bullet
- bullet

JOHTOPÄÄTÖS
(one paragraph)

No investment advice.
"""

url = (
    f"https://generativelanguage.googleapis.com/v1beta/models/"
    f"{MODEL}:generateContent?key={API_KEY}"
)

payload = {
    "contents": [
        {
            "parts": [
                {
                    "text": prompt
                }
            ]
        }
    ]
}

data = json.dumps(payload).encode("utf-8")

request = urllib.request.Request(
    url,
    data=data,
    headers={
        "Content-Type": "application/json"
    },
    method="POST"
)

try:
    with urllib.request.urlopen(request, timeout=60) as response:
        raw = response.read().decode("utf-8")
        result = json.loads(raw)

    text = result["candidates"][0]["content"]["parts"][0]["text"]

except Exception as e:
    text = (
        f"Gemini commentary update failed\n\n"
        f"{str(e)}\n\n"
        f"{traceback.format_exc()}"
    )

output = {
    "updated_at_utc": (
        datetime.datetime.utcnow()
        .replace(microsecond=0)
        .isoformat() + "Z"
    ),
    "source": "Gemini API via GitHub Actions",
    "model": MODEL,
    "commentary": text
}

with open("commentary.json", "w", encoding="utf-8") as f:
    json.dump(output, f, ensure_ascii=False, indent=2)

print("commentary.json updated")
``
