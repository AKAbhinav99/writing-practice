(() => {
  const ENDPOINT_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
  const MODEL = "gemini-2.5-flash";
  const STORAGE_KEY = "wp_gemini_api_key";
  const TIMEOUT_MS = 30000;

  const RESPONSE_SCHEMA = {
    type: "ARRAY",
    items: {
      type: "OBJECT",
      properties: {
        quote: { type: "STRING" },
        category: { type: "STRING", enum: ["spelling", "grammar", "style"] },
        message: { type: "STRING" },
        replacement: { type: "STRING" },
      },
      required: ["quote", "category", "message"],
    },
  };

  function getGeminiApiKey() {
    return (localStorage.getItem(STORAGE_KEY) || "").trim();
  }

  function setGeminiApiKey(key) {
    localStorage.setItem(STORAGE_KEY, key.trim());
  }

  function clearGeminiApiKey() {
    localStorage.removeItem(STORAGE_KEY);
  }

  function hasGeminiKey() {
    return getGeminiApiKey().length > 0;
  }

  function buildPrompt(text) {
    return [
      "You are a careful writing tutor. Read the text below and find every spelling mistake, grammar error, and sentence-structure problem: comma splices, run-on sentences, sentence fragments, subject-verb agreement, dangling or misplaced modifiers, pronoun agreement, redundant or doubled conjunctions, and awkward phrasing.",
      "",
      "For each issue, report:",
      '- quote: the exact verbatim snippet from the text (copy it exactly, same capitalization and punctuation) that contains the issue. Keep it as short as possible while still uniquely pinpointing the spot — usually 1 to 6 words.',
      '- category: "spelling", "grammar", or "style".',
      "- message: one short, specific, friendly sentence explaining the issue and how to fix it.",
      "- replacement: a corrected version of the quoted snippet, if there is a direct fix. Omit it if there isn't one.",
      "",
      "Only report real issues — do not invent ones that aren't there. If the text has no issues, return an empty array.",
      "",
      "TEXT TO CHECK:",
      text,
    ].join("\n");
  }

  function extractResponseText(data) {
    const candidate = data && Array.isArray(data.candidates) ? data.candidates[0] : null;
    const part = candidate && candidate.content && Array.isArray(candidate.content.parts) ? candidate.content.parts[0] : null;
    return part && typeof part.text === "string" ? part.text : "";
  }

  function locateQuote(text, quote) {
    const exact = text.indexOf(quote);
    if (exact !== -1) return exact;
    return text.toLowerCase().indexOf(quote.toLowerCase());
  }

  function toMatch(text, issue) {
    if (!issue || typeof issue.quote !== "string" || !issue.quote.trim()) return null;
    const offset = locateQuote(text, issue.quote);
    if (offset === -1) return null;

    const category = ["spelling", "grammar", "style"].includes(issue.category) ? issue.category : "style";
    return {
      offset,
      length: issue.quote.length,
      message: issue.message || "Possible issue flagged by AI review.",
      replacements: issue.replacement ? [{ value: issue.replacement }] : [],
      rule: {
        issueType: category === "spelling" ? "misspelling" : category === "grammar" ? "grammar" : "uncategorized",
        category: { id: category.toUpperCase() },
      },
    };
  }

  async function checkTextWithGemini(text) {
    const apiKey = getGeminiApiKey();
    if (!apiKey) throw new Error("No Gemini API key configured.");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
    let data;

    try {
      const response = await fetch(`${ENDPOINT_BASE}/${MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: buildPrompt(text) }] }],
          generationConfig: { responseMimeType: "application/json", responseSchema: RESPONSE_SCHEMA },
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        const detail = errorBody && errorBody.error && errorBody.error.message ? errorBody.error.message : `status ${response.status}`;
        throw new Error(`Gemini request failed: ${detail}`);
      }

      data = await response.json();
    } finally {
      clearTimeout(timeoutId);
    }

    const rawText = extractResponseText(data);
    if (!rawText) return [];

    let issues;
    try {
      issues = JSON.parse(rawText);
    } catch (error) {
      throw new Error("Gemini returned a response that couldn't be parsed.");
    }
    if (!Array.isArray(issues)) return [];

    return issues.map((issue) => toMatch(text, issue)).filter((match) => match !== null);
  }

  window.WP = window.WP || {};
  Object.assign(window.WP, {
    getGeminiApiKey,
    setGeminiApiKey,
    clearGeminiApiKey,
    hasGeminiKey,
    checkTextWithGemini,
  });
})();
