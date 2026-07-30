import os
import json
import traceback
from datetime import datetime
from google import genai

commentary = ""

try:
    client = genai.Client(
        api_key=os.environ["GEMINI_API_KEY"]
    )

    models = client.models.list()

    model_names = []

    for model in models:
        try:
            model_names.append(model.name)
        except Exception:
            pass

    commentary = "\n".join(sorted(model_names))

except Exception as e:
    commentary = (
        "ERROR\n\n"
        + str(e)
        + "\n\n"
        + traceback.format_exc()
    )

output = {
    "updated_at_utc": datetime.utcnow().isoformat() + "Z",
    "source": "Gemini",
    "commentary": commentary
}

with open("commentary.json", "w", encoding="utf-8") as f:
    json.dump(output, f, ensure_ascii=False, indent=2)

print("commentary.json updated")
`
