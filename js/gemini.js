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
        topic: { type: "STRING" },
      },
      required: ["quote", "category", "message", "topic"],
    },
  };

  const VIDEO_TIMEOUT_MS = 20000;

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
      '- topic: a short (2-5 word), lowercase label for the general writing skill or rule this issue falls under, e.g. "comma splice", "subject-verb agreement", "passive voice", "misplaced modifier", "spelling". Reuse the exact same label for every issue of the same kind so they can be grouped.',
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
      topic: typeof issue.topic === "string" && issue.topic.trim() ? issue.topic.trim().toLowerCase() : null,
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

  function buildVideoPrompt(topics) {
    return [
      "You are helping a writing student find real YouTube videos that teach how to fix specific writing mistakes.",
      "Use Google Search to find videos that are actually indexed and available right now — never invent or guess a video title or URL.",
      "For each topic below, return up to 2 videos. If you can't find a real, relevant video for a topic, leave it out of the result entirely rather than guessing.",
      "",
      "Respond with ONLY a raw JSON array, no markdown formatting and no code fences, shaped exactly like this:",
      '[{"topic": "<copied exactly from the list below>", "videos": [{"title": "<the video\'s real title>", "url": "<https://www.youtube.com/watch?v=... or https://youtu.be/...>"}]}]',
      "",
      "Topics:",
      ...topics.map((topic) => `- ${topic}`),
    ].join("\n");
  }

  function isYouTubeUrl(url) {
    try {
      const parsed = new URL(url);
      const host = parsed.hostname.replace(/^www\./, "").replace(/^m\./, "");
      if (host === "youtu.be") return parsed.pathname.length > 1;
      if (host === "youtube.com") return parsed.pathname === "/watch" && parsed.searchParams.has("v");
      return false;
    } catch {
      return false;
    }
  }

  // Gemini's JSON-mode response schema isn't available together with the
  // google_search tool, so we ask for raw JSON in the prompt instead and
  // parse it leniently here (stripping any code fences the model adds).
  function parseJsonArrayLeniently(rawText) {
    const stripped = rawText.replace(/```json|```/gi, "").trim();
    const start = stripped.indexOf("[");
    const end = stripped.lastIndexOf("]");
    if (start === -1 || end === -1 || end < start) return null;
    try {
      const parsed = JSON.parse(stripped.slice(start, end + 1));
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  // Looks up, per writing-mistake topic, real YouTube videos found via
  // Gemini's Google Search grounding tool. Returns a map of lowercase topic
  // -> [{ title, url }], omitting any topic Gemini couldn't back with a
  // real-looking YouTube URL. Never throws — callers should treat a missing
  // or empty result as "no AI suggestions available" and fall back to a
  // plain YouTube search link instead.
  async function findVideosForTopics(topics) {
    const apiKey = getGeminiApiKey();
    if (!apiKey || !Array.isArray(topics) || topics.length === 0) return {};

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), VIDEO_TIMEOUT_MS);

    let data;
    try {
      const response = await fetch(`${ENDPOINT_BASE}/${MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: buildVideoPrompt(topics) }] }],
          tools: [{ google_search: {} }],
        }),
        signal: controller.signal,
      });
      if (!response.ok) return {};
      data = await response.json();
    } catch {
      return {};
    } finally {
      clearTimeout(timeoutId);
    }

    const rawText = extractResponseText(data);
    if (!rawText) return {};

    const parsed = parseJsonArrayLeniently(rawText);
    if (!parsed) return {};

    const result = {};
    parsed.forEach((entry) => {
      if (!entry || typeof entry.topic !== "string" || !Array.isArray(entry.videos)) return;
      const videos = entry.videos
        .filter((video) => video && typeof video.url === "string" && isYouTubeUrl(video.url))
        .slice(0, 2)
        .map((video) => ({
          title: typeof video.title === "string" && video.title.trim() ? video.title.trim() : "Watch on YouTube",
          url: video.url,
        }));
      if (videos.length > 0) {
        result[entry.topic.trim().toLowerCase()] = videos;
      }
    });
    return result;
  }

  window.WP = window.WP || {};
  Object.assign(window.WP, {
    getGeminiApiKey,
    setGeminiApiKey,
    clearGeminiApiKey,
    hasGeminiKey,
    checkTextWithGemini,
    findVideosForTopics,
  });
})();
