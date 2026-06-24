(() => {
  const MAX_TOPICS = 5;
  const MAX_TOPIC_LENGTH = 60;

  function cleanTopic(raw) {
    if (typeof raw !== "string") return null;
    const trimmed = raw.trim();
    if (!trimmed) return null;
    return trimmed.length > MAX_TOPIC_LENGTH ? `${trimmed.slice(0, MAX_TOPIC_LENGTH - 1)}…` : trimmed;
  }

  // Picks the most frequent distinct mistake topics across a results set so
  // the videos box stays focused on what actually went wrong instead of
  // listing every LanguageTool rule category.
  function collectTopics(matches) {
    const counts = new Map();

    matches.forEach((match) => {
      const topic = cleanTopic(match.topic || (window.WP.deriveTopic && window.WP.deriveTopic(match)));
      if (!topic) return;
      const key = topic.toLowerCase();
      const existing = counts.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        counts.set(key, { label: topic, count: 1 });
      }
    });

    return [...counts.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, MAX_TOPICS)
      .map((entry) => entry.label);
  }

  function searchUrlForTopic(topic) {
    const query = `how to fix ${topic} in writing`;
    return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  }

  function renderVideoSuggestions(container, topics, videosByTopic) {
    container.textContent = "";

    if (topics.length === 0) {
      container.hidden = true;
      return;
    }
    container.hidden = false;

    const heading = document.createElement("h3");
    heading.className = "video-suggestions-heading";
    heading.textContent = "Brush up on these";
    container.appendChild(heading);

    const list = document.createElement("div");
    list.className = "video-topic-list";

    topics.forEach((topic) => {
      const group = document.createElement("div");
      group.className = "video-topic-group";

      const title = document.createElement("p");
      title.className = "video-topic-title";
      title.textContent = topic;
      group.appendChild(title);

      const links = document.createElement("div");
      links.className = "video-links";

      const suggested = (videosByTopic && videosByTopic[topic.toLowerCase()]) || [];
      suggested.forEach((video) => {
        const link = document.createElement("a");
        link.className = "video-link";
        link.href = video.url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = video.title;
        links.appendChild(link);
      });

      const searchLink = document.createElement("a");
      searchLink.className = "video-link video-link-search";
      searchLink.href = searchUrlForTopic(topic);
      searchLink.target = "_blank";
      searchLink.rel = "noopener noreferrer";
      searchLink.textContent = `Search YouTube for "${topic}"`;
      links.appendChild(searchLink);

      group.appendChild(links);
      list.appendChild(group);
    });

    container.appendChild(list);
  }

  // Renders fallback search-query links immediately (deterministic, no
  // network call needed), then — only if a Gemini key is configured —
  // upgrades the box in place with specific videos Gemini found via Google
  // Search grounding. A failed or empty Gemini lookup just leaves the
  // fallback links as-is.
  async function loadVideoSuggestions(container, matches) {
    const topics = collectTopics(matches);
    renderVideoSuggestions(container, topics, null);

    if (topics.length === 0 || !window.WP.hasGeminiKey()) return;

    try {
      const videosByTopic = await window.WP.findVideosForTopics(topics);
      renderVideoSuggestions(container, topics, videosByTopic);
    } catch {
      // Keep the fallback search links already rendered above.
    }
  }

  window.WP = window.WP || {};
  Object.assign(window.WP, { collectTopics, searchUrlForTopic, renderVideoSuggestions, loadVideoSuggestions });
})();
