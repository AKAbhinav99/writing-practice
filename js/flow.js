(() => {
  // Thresholds are deliberately generous — these are structural smell tests,
  // not strict rules, so false positives stay rare on genuine short drafts.
  const MIN_WORDS_FOR_PARAGRAPH_CHECK = 120;
  const MAX_SHORT_SENTENCE_WORDS = 6;
  const REPEATED_START_THRESHOLD = 3;

  function splitIntoSentences(text) {
    const matches = text.match(/[^.!?]+[.!?]+(?:["')\]]*\s*|$)|[^.!?]+$/g);
    return (matches || []).map((sentence) => sentence.trim()).filter(Boolean);
  }

  function splitIntoParagraphs(text) {
    return text
      .split(/\n\s*\n+/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean);
  }

  function firstWord(sentence) {
    const match = sentence.match(/^[A-Za-z']+/);
    return match ? match[0].toLowerCase() : "";
  }

  // Flags runs of 3+ consecutive sentences that open with the same word
  // (e.g. "I woke up... I made coffee... I left.") — a common sign that a
  // paragraph is marching through events rather than flowing between them.
  function findRepeatedSentenceStarts(sentences) {
    const repeats = [];
    let runStart = 0;
    for (let i = 1; i <= sentences.length; i++) {
      const word = firstWord(sentences[runStart]);
      const continuesRun = i < sentences.length && word && firstWord(sentences[i]) === word;
      if (!continuesRun) {
        const runLength = i - runStart;
        if (runLength >= REPEATED_START_THRESHOLD && word) {
          repeats.push({ word, count: runLength });
        }
        runStart = i;
      }
    }
    return repeats;
  }

  function analyzeFlow(text) {
    const trimmed = text.trim();
    const sentences = splitIntoSentences(trimmed);
    const paragraphs = splitIntoParagraphs(trimmed);
    const wordCount = window.WP.countWords(trimmed);
    const sentenceLengths = sentences.map((sentence) => window.WP.countWords(sentence));
    const avgSentenceLength = sentenceLengths.length
      ? sentenceLengths.reduce((sum, n) => sum + n, 0) / sentenceLengths.length
      : 0;

    const formatNotes = [];
    if (trimmed && !/^[A-Z"'(“]/.test(trimmed)) {
      formatNotes.push("Start with a capital letter — the first sentence currently doesn't.");
    }
    if (trimmed && !/[.!?]["')\]”]?$/.test(trimmed)) {
      formatNotes.push('The last sentence is missing closing punctuation (a period, "!", or "?").');
    }
    if (/ {2,}/.test(trimmed)) {
      formatNotes.push("There are a few double spaces worth cleaning up.");
    }
    if (wordCount >= MIN_WORDS_FOR_PARAGRAPH_CHECK && paragraphs.length === 1) {
      formatNotes.push("This reads as one long paragraph — consider a break where the topic or moment shifts.");
    }

    const flowNotes = [];
    findRepeatedSentenceStarts(sentences).forEach(({ word, count }) => {
      const display = word === "i" ? "I" : word;
      flowNotes.push(`${count} sentences in a row start with "${display}" — vary your sentence openers so it doesn't feel repetitive.`);
    });
    if (sentences.length >= 4 && sentenceLengths.every((n) => n > 0 && n <= MAX_SHORT_SENTENCE_WORDS)) {
      flowNotes.push("Every sentence is short and similar in length — combine a couple with a comma or conjunction so the rhythm varies.");
    }

    return {
      sentenceCount: sentences.length,
      paragraphCount: paragraphs.length,
      avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
      formatNotes,
      flowNotes,
    };
  }

  function renderFlowReport(container, report) {
    container.textContent = "";

    const heading = document.createElement("h3");
    heading.className = "flow-heading";
    heading.textContent = "Flow & Format";
    container.appendChild(heading);

    const stats = document.createElement("p");
    stats.className = "flow-stats";
    stats.textContent = `${report.paragraphCount} paragraph${report.paragraphCount === 1 ? "" : "s"} · ${report.sentenceCount} sentence${report.sentenceCount === 1 ? "" : "s"} · avg ${report.avgSentenceLength} words/sentence`;
    container.appendChild(stats);

    const notes = [...report.formatNotes, ...report.flowNotes];
    if (notes.length === 0) {
      const ok = document.createElement("p");
      ok.className = "flow-note-ok";
      ok.textContent = "Reads smoothly — clear sequence, varied sentences, and clean formatting.";
      container.appendChild(ok);
      return;
    }

    const list = document.createElement("ul");
    list.className = "flow-note-list";
    notes.forEach((note) => {
      const item = document.createElement("li");
      item.textContent = note;
      list.appendChild(item);
    });
    container.appendChild(list);
  }

  window.WP = window.WP || {};
  Object.assign(window.WP, { analyzeFlow, renderFlowReport });
})();
