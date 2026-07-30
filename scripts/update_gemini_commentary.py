import os
import json
import traceback
from datetime import datetime
from google import genai

MODELS = [
    "gemini-3.6-flash",
    "gemini-3.5-flash-lite",
    "gemini-2.5-flash-lite",
    "gemini-2.5-flash"
]

PROMPT = """
Kirjoita lyhyt markkinakommentti suomeksi.

Käsittele:
- Nvidia
- AMD
- TSMC
- Broadcom
- ASML
- Micron
- Microsoft AI CAPEX
- Meta AI CAPEX
- Amazon AI CAPEX

Muoto:

YHTEENVETO

NOUSUA TUKEVAT TEKIJÄT

RISKIT

JOHTOPÄÄTÖS

Älä anna sijoitusneuvoja.
"""

used_model = None
commentary = ""

try:
    client = genai.Client(
        api_key=os.environ["GEMINI_API_KEY"]
    )

    last_error = ""

    for model in MODELS:
        try:
            response = client.models.generate_content(
                model=model,
                contents=PROMPT
            )

            commentary = response.text
            used_model = model
            break

        except Exception as model_error:
            last_error = str(model_error)

    if used_model is None:
        raise Exception(last_error)

except Exception as e:
    commentary = (
        "ERROR\n\n"
        + str(e)
        + "\n\n"
        + traceback.format_exc()
    )
    used_model = "NONE"

output = {
    "updated_at_utc": datetime.utcnow().isoformat() + "Z",
    "source": "Gemini",
    "model": used_model,
    "commentary": commentary
}

with open("commentary.json", "w", encoding="utf-8") as f:
    json.dump(output, f, ensure_ascii=False, indent=2)

print("commentary.json updated")
