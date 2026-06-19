(() => {
  function buildEncouragement({ wordCount, issueCount, wordsUsedCount, totalWords, elapsedSeconds }) {
    const minutes = elapsedSeconds / 60;
    const pace = minutes > 0 ? Math.round(wordCount / minutes) : wordCount;
    const issueRate = wordCount > 0 ? issueCount / wordCount : 0;

    let headline;
    let detail;

    if (issueCount === 0) {
      headline = "Clean copy.";
      detail = `Not one spelling, grammar, or style issue turned up across ${wordCount} words.`;
    } else if (issueRate < 0.03) {
      headline = "Tight writing, a couple of loose threads.";
      detail = `${issueCount} small issue${issueCount === 1 ? "" : "s"} across ${wordCount} words — easy fixes, strong draft.`;
    } else if (issueRate < 0.08) {
      headline = "Solid draft with room to tighten.";
      detail = `${issueCount} issues turned up in ${wordCount} words. Work through the list below and the next pass will read cleaner.`;
    } else {
      headline = "Good instinct to just keep writing.";
      detail = `${issueCount} issues across ${wordCount} words — that's normal at full speed. Slow down on the next pass and check each one.`;
    }

    let usageNote = "";
    if (totalWords > 0) {
      if (wordsUsedCount === totalWords) {
        usageNote = `You worked in every one of the ${totalWords} assigned words.`;
      } else if (wordsUsedCount / totalWords >= 0.7) {
        usageNote = `You used ${wordsUsedCount} of ${totalWords} assigned words — a strong showing.`;
      } else {
        usageNote = `You used ${wordsUsedCount} of ${totalWords} assigned words. Try working in a few more next time.`;
      }
    }

    const paceNote = wordCount > 0 ? `Pace: roughly ${pace} words per minute.` : "";

    return { headline, detail, usageNote, paceNote };
  }

  function renderEncouragement(container, encouragement) {
    container.textContent = "";

    const headline = document.createElement("p");
    headline.className = "encouragement-headline";
    headline.textContent = encouragement.headline;
    container.appendChild(headline);

    const detail = document.createElement("p");
    detail.className = "encouragement-detail";
    detail.textContent = encouragement.detail;
    container.appendChild(detail);

    if (encouragement.usageNote) {
      const usage = document.createElement("p");
      usage.className = "encouragement-note";
      usage.textContent = encouragement.usageNote;
      container.appendChild(usage);
    }

    if (encouragement.paceNote) {
      const pace = document.createElement("p");
      pace.className = "encouragement-note encouragement-pace";
      pace.textContent = encouragement.paceNote;
      container.appendChild(pace);
    }
  }

  window.WP = window.WP || {};
  Object.assign(window.WP, { buildEncouragement, renderEncouragement });
})();
