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
      "Also flag flow and coherence problems: a sentence or idea that doesn't logically follow from the one before it, an event sequence that's confusing or out of order, an unclear pronoun reference that makes the passage hard to follow, or a transition between ideas that feels abrupt or missing.",
      "",
      "For each issue, report:",
      '- quote: the exact verbatim snippet from the text (copy it exactly, same capitalization and punctuation) that contains the issue. Keep it as short as possible while still uniquely pinpointing the spot — usually 1 to 6 words.',
      '- category: "spelling", "grammar", or "style". Use "style" for flow/coherence issues.',
      "- message: one short, specific, friendly sentence explaining the issue and how to fix it.",
      "- replacement: a corrected version of the quoted snippet, if there is a direct fix. Omit it if there isn't one.",
      '- topic: a short (2-5 word), lowercase label for the general writing skill or rule this issue falls under, e.g. "comma splice", "subject-verb agreement", "passive voice", "misplaced modifier", "flow and coherence", "spelling". Reuse the exact same label for every issue of the same kind so they can be grouped.',
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

  // Asks for one plain-text line per topic instead of JSON: Gemini's Google
  // Search grounding metadata only ever exposes real source URLs through
  // citations (groundingChunks/groundingSupports), never as text the model
  // can copy — so a prior version that asked Gemini to *type out* a
  // youtube.com URL itself was just guessing plausible-looking video IDs
  // that don't exist. This version never trusts a model-written URL; it
  // only uses the URL Google's search backend actually attached as a
  // citation for that line (see resolveVideoForLine below).
  function buildVideoPrompt(topics) {
    return [
      "You are helping a writing student find one real YouTube video for each writing-mistake topic below.",
      "Use Google Search to find a specific, real, currently available video that clearly explains or helps fix each topic. Only recommend a video you actually found through search.",
      "",
      "Reply in plain text only — no markdown, no JSON, no code fences. Write exactly one line per topic, in this exact format:",
      "TOPIC: <topic copied exactly from the list below> :: <the video's title> — <one short clause on why it helps>",
      "",
      "If you can't find a real, relevant video for a topic, write that topic's line as:",
      "TOPIC: <topic> :: NONE",
      "",
      "Topics:",
      ...topics.map((topic) => `- ${topic}`),
    ].join("\n");
  }

  const TOPIC_LINE_RE = /^\s*TOPIC:\s*(.+?)\s*::\s*(.+?)\s*$/i;

  function parseTopicLines(rawText, topics) {
    const byLowerTopic = new Map(topics.map((topic) => [topic.toLowerCase(), topic]));
    const lines = [];
    rawText.split("\n").forEach((line) => {
      const match = line.match(TOPIC_LINE_RE);
      if (!match) return;
      const topic = byLowerTopic.get(match[1].trim().toLowerCase());
      const label = match[2].trim();
      if (!topic || /^none$/i.test(label)) return;
      lines.push({ topic, label, line });
    });
    return lines;
  }

  function isYouTubeChunk(chunk) {
    const web = chunk && chunk.web;
    const title = web && typeof web.title === "string" ? web.title.toLowerCase() : "";
    const uri = web && typeof web.uri === "string" ? web.uri : "";
    return title.includes("youtube") && /^https:\/\//.test(uri);
  }

  // Finds the real citation URL Google's search backend attached to a given
  // topic's recommendation line, by matching each grounding support's exact
  // (API-provided) segment text against that line — never by trusting any
  // URL text the model itself produced.
  function resolveVideoForLine(lineText, supports, chunks) {
    const lowerLine = lineText.toLowerCase();
    for (const support of supports) {
      const segmentText = support && support.segment && typeof support.segment.text === "string" ? support.segment.text.trim() : "";
      if (!segmentText || !lowerLine.includes(segmentText.toLowerCase())) continue;

      const indices = Array.isArray(support.groundingChunkIndices) ? support.groundingChunkIndices : [];
      for (const index of indices) {
        const chunk = chunks[index];
        if (isYouTubeChunk(chunk)) return chunk.web.uri;
      }
    }
    return null;
  }

  // Looks up, per writing-mistake topic, a real YouTube video found via
  // Gemini's Google Search grounding tool. Returns a map of lowercase topic
  // -> [{ title, url }], where every url is a verified citation link Google's
  // search backend actually returned for that exact recommendation — not
  // text Gemini typed itself. Never throws — callers should treat a missing
  // or empty result as "no AI suggestion available" and fall back to a
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

    const candidate = Array.isArray(data.candidates) ? data.candidates[0] : null;
    const metadata = candidate && candidate.groundingMetadata;
    const chunks = metadata && Array.isArray(metadata.groundingChunks) ? metadata.groundingChunks : [];
    const supports = metadata && Array.isArray(metadata.groundingSupports) ? metadata.groundingSupports : [];
    if (chunks.length === 0 || supports.length === 0) return {};

    const result = {};
    parseTopicLines(rawText, topics).forEach(({ topic, label, line }) => {
      const url = resolveVideoForLine(line, supports, chunks);
      if (url) result[topic.toLowerCase()] = [{ title: label, url }];
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
