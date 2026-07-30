import os
import json
import urllib.request
import urllib.error
import traceback
from datetime import datetime

API_KEY = os.environ["GEMINI_API_KEY"]

url = (
    "https://generativelanguage.googleapis.com/"
    "v1beta/models/gemini-1.5-flash:generateContent"
    f"?key={API_KEY}"
)

payload = {
    "contents": [
        {
            "parts": [
                {
                    "text": "Write one sentence about the semiconductor market."
                }
            ]
        }
    ]
}

try:
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST"
    )

    with urllib.request.urlopen(req, timeout=60) as response:
        raw = response.read().decode("utf-8")
        parsed = json.loads(raw)

        commentary = parsed["candidates"][0]["content"]["parts"][0]["text"]

except Exception as e:
    commentary = (
        f"ERROR\n\n"
        f"{str(e)}\n\n"
        f"{traceback.format_exc()}"
    )

output = {
    "updated_at_utc": datetime.utcnow().isoformat() + "Z",
    "commentary": commentary
}

with open("commentary.json", "w", encoding="utf-8") as f:
    json.dump(output, f, indent=2)

print("done")
