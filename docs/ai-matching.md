# AI Matching

The engine filters to active opposite-type reports, then calculates weighted similarity across description, category, color, location, and date. Scores are stored with an explanation so users can inspect why a lead surfaced.

When `AI_API_KEY` is configured, the server calls Gemini for each new report. Gemini normalizes the category, color, and location and returns keywords plus a semantic description. These attributes are stored in `Item.aiAttributes` and included in the weighted comparison. The API key remains server-side and is never exposed to the browser.

Without an API key, the deterministic lexical and attribute matcher remains available as a local fallback. Configure `AI_MODEL` to select a Gemini model; it defaults to `gemini-2.0-flash`.
