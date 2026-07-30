import os
import json
import traceback
from datetime import datetime
from google import genai

commentary = ""

try:
    api_key = os.environ["GEMINI_API_KEY"]

    client = genai.Client(api_key=api_key)

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents="""
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
    )

    commentary = response.text

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
