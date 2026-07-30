<div id="gemini-commentary">Loading Gemini commentary...</div>

<script>
async function loadGeminiCommentary() {
  try {
    const response = await fetch("commentary.json?ts=" + Date.now());
    const data = await response.json();

    document.getElementById("gemini-commentary").innerHTML = `
      <p><strong>Updated:</strong> ${data.updated_at_utc}</p>
      <pre style="white-space: pre-wrap; font-family: inherit;">${data.commentary}</pre>
    `;
  } catch (error) {
    document.getElementById("gemini-commentary").textContent =
      "Could not load Gemini commentary.";
  }
}

loadGeminiCommentary();
</script>
