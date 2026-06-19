(() => {
  // LanguageTool occasionally returns overlapping matches; keep the first
  // (earliest, highest-priority) match in any overlapping run.
  function dedupeMatches(matches) {
    const sorted = [...matches].sort((a, b) => a.offset - b.offset);
    const result = [];
    let lastEnd = -1;
    for (const match of sorted) {
      if (match.offset >= lastEnd) {
        result.push(match);
        lastEnd = match.offset + match.length;
      }
    }
    return result;
  }

  // Builds the highlighted text purely with createTextNode/createElement so
  // no user-authored text ever passes through innerHTML.
  function renderHighlightedText(container, text, matches) {
    container.textContent = "";
    const clean = dedupeMatches(matches);
    let cursor = 0;

    clean.forEach((match) => {
      if (match.offset > cursor) {
        container.appendChild(document.createTextNode(text.slice(cursor, match.offset)));
      }
      const mark = document.createElement("mark");
      const category = window.WP.categorize(match);
      mark.className = `highlight highlight-${category}`;
      mark.textContent = text.slice(match.offset, match.offset + match.length);
      mark.title = match.message;
      container.appendChild(mark);
      cursor = match.offset + match.length;
    });

    if (cursor < text.length) {
      container.appendChild(document.createTextNode(text.slice(cursor)));
    }
  }

  function renderSuggestions(container, text, matches) {
    container.textContent = "";
    const clean = dedupeMatches(matches);

    if (clean.length === 0) {
      const empty = document.createElement("p");
      empty.className = "suggestions-empty";
      empty.textContent = "No issues found — nothing to list here.";
      container.appendChild(empty);
      return;
    }

    const list = document.createElement("ol");
    list.className = "suggestions-list";

    clean.forEach((match) => {
      const category = window.WP.categorize(match);
      const item = document.createElement("li");
      item.className = "suggestion-item";

      const badge = document.createElement("span");
      badge.className = `badge badge-${category}`;
      badge.textContent = category;

      const snippet = document.createElement("strong");
      snippet.className = "suggestion-snippet";
      snippet.textContent = text.slice(match.offset, match.offset + match.length);

      const head = document.createElement("div");
      head.className = "suggestion-head";
      head.appendChild(badge);
      head.appendChild(snippet);

      const message = document.createElement("p");
      message.className = "suggestion-message";
      message.textContent = match.message;

      item.appendChild(head);
      item.appendChild(message);

      if (match.replacements && match.replacements.length > 0) {
        const suggestionText = match.replacements
          .slice(0, 3)
          .map((replacement) => replacement.value)
          .join(", ");
        const replacementEl = document.createElement("p");
        replacementEl.className = "suggestion-replacement";
        replacementEl.textContent = `Try: ${suggestionText}`;
        item.appendChild(replacementEl);
      }

      list.appendChild(item);
    });

    container.appendChild(list);
  }

  window.WP = window.WP || {};
  Object.assign(window.WP, { dedupeMatches, renderHighlightedText, renderSuggestions });
})();
