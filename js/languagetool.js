(() => {
  const ENDPOINT = "https://api.languagetool.org/v2/check";
  const TIMEOUT_MS = 15000;

  async function checkText(text) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ text, language: "en-US", level: "picky" }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`LanguageTool responded with status ${response.status}`);
      }

      const data = await response.json();
      return Array.isArray(data.matches) ? data.matches : [];
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // Buckets LanguageTool's many rule categories into the three groups this
  // app surfaces to the user: spelling, grammar, and everything else (style
  // and sentence structure).
  function categorize(match) {
    const issueType = match && match.rule && match.rule.issueType ? match.rule.issueType : "";
    const categoryId = match && match.rule && match.rule.category && match.rule.category.id ? match.rule.category.id : "";
    if (issueType === "misspelling" || categoryId === "TYPOS") return "spelling";
    if (issueType === "grammar" || categoryId === "GRAMMAR") return "grammar";
    return "style";
  }

  window.WP = window.WP || {};
  Object.assign(window.WP, { checkText, categorize });
})();
