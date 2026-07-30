import os
import json
import datetime
import urllib.request
import urllib.error

API_KEY = os.environ["GEMINI_API_KEY"]

MODEL = "gemini-2.5-flash"

prompt = """
You are writing a short market commentary for a semiconductor and AI infrastructure dashboard.

Focus on:
- semiconductor market sentiment
- AI data centre spending
- Nvidia, AMD, TSMC, Broadcom, ASML, Micron
- Microsoft, Meta, Amazon and hyperscaler CAPEX
- whether the current move looks bullish, neutral, or bearish

Write in Finnish.
Be concise.

Give:
1. Short summary
2. Bullish factors
3. Bearish risks
4. Final view

Do not give personal financial advice.
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
    ],
    "generationConfig": {
        "temperature": 0.4,
        "maxOutputTokens": 900
    }
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
    text = f"Gemini commentary update failed: {str(e)}"

output = {
    "updated_at_utc": datetime.datetime.utcnow().replace(
        microsecond=0
    ).isoformat() + "Z",
    "source": "Gemini API via GitHub Actions",
    "model": MODEL,
    "commentary": text
}

with open("commentary.json", "w", encoding="utf-8") as f:
    json.dump(output, f, ensure_ascii=False, indent=2)

print("commentary.json updated")
