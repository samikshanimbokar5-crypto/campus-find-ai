# AI Matching

The current engine filters to active opposite-type reports, then calculates weighted similarity across description, category, color, location, and date. Scores are stored with an explanation so users can inspect why a lead surfaced. This baseline is deterministic and testable; an AI provider can enrich attributes or semantic similarity through a server-side adapter using `AI_API_KEY`.
