import json

output = {
    "updated_at_utc": "TEST",
    "source": "GitHub Action",
    "model": "TEST",
    "commentary": "GitHub Action toimii."
}

with open("commentary.json", "w", encoding="utf-8") as f:
    json.dump(output, f, ensure_ascii=False, indent=2)

print("OK")
