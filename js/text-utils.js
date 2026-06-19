(() => {
  function countWords(text) {
    const trimmed = text.trim();
    return trimmed === "" ? 0 : trimmed.split(/\s+/).length;
  }

  function formatTime(totalSeconds) {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  function normalize(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  }

  // Strips a common inflectional suffix so "wander" still matches text that
  // used "wandered" or "wandering" (and undoes the doubled consonant that
  // suffixes like "-ing"/"-ed" leave behind, e.g. "running" -> "run").
  function wordStem(word) {
    const lower = normalize(word);
    const suffixes = ["ing", "ed", "es", "s"];
    for (const suffix of suffixes) {
      if (lower.endsWith(suffix) && lower.length - suffix.length >= 3) {
        let stem = lower.slice(0, lower.length - suffix.length);
        if (stem.length >= 4 && stem[stem.length - 1] === stem[stem.length - 2]) {
          stem = stem.slice(0, -1);
        }
        return stem;
      }
    }
    return lower;
  }

  function isWordUsed(word, normalizedText) {
    const stem = wordStem(word).replace(/[^a-z]/g, "");
    if (!stem) return false;
    const pattern = new RegExp(`\\b${stem}\\w*\\b`, "i");
    return pattern.test(normalizedText);
  }

  function countWordsUsedFromBank(words, text) {
    const normalizedText = normalize(text);
    return words.filter((word) => isWordUsed(word, normalizedText)).length;
  }

  window.WP = window.WP || {};
  Object.assign(window.WP, {
    countWords,
    formatTime,
    normalize,
    wordStem,
    isWordUsed,
    countWordsUsedFromBank,
  });
})();
