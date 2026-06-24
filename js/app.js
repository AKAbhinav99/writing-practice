(() => {
  const MIN_WORDS = 40;
  const MAX_CHARS = 3000;
  const SUBMIT_PASSWORD = "1905";

  const browseScreen = document.getElementById("browseScreen");
  const surpriseBtn = document.getElementById("surpriseBtn");
  const customBtn = document.getElementById("customBtn");
  const filterRow = document.getElementById("filterRow");
  const setGrid = document.getElementById("setGrid");

  const practiceScreen = document.getElementById("practiceScreen");
  const backToBrowseBtn = document.getElementById("backToBrowseBtn");
  const practiceTitle = document.getElementById("practiceTitle");
  const practicePrompt = document.getElementById("practicePrompt");
  const wordBankBlock = document.getElementById("wordBankBlock");
  const wordBank = document.getElementById("wordBank");
  const timerChip = document.getElementById("timerChip");
  const wordCountChip = document.getElementById("wordCountChip");
  const startWritingBtn = document.getElementById("startWritingBtn");
  const writingForm = document.getElementById("writingForm");
  const writingInput = document.getElementById("writingInput");
  const charCounter = document.getElementById("charCounter");
  const submitPassword = document.getElementById("submitPassword");
  const submitBtn = document.getElementById("submitBtn");
  const formError = document.getElementById("formError");

  const resultsScreen = document.getElementById("resultsScreen");
  const resultTime = document.getElementById("resultTime");
  const resultWordCount = document.getElementById("resultWordCount");
  const resultUsageStat = document.getElementById("resultUsageStat");
  const resultUsage = document.getElementById("resultUsage");
  const resultIssues = document.getElementById("resultIssues");
  const encouragementBox = document.getElementById("encouragementBox");
  const highlightedText = document.getElementById("highlightedText");
  const suggestions = document.getElementById("suggestions");
  const videoSuggestions = document.getElementById("videoSuggestions");
  const resultsHeading = document.getElementById("results-heading");
  const retrySetBtn = document.getElementById("retrySetBtn");
  const anotherSetBtn = document.getElementById("anotherSetBtn");

  const settingsToggle = document.getElementById("settingsToggle");
  const settingsPanel = document.getElementById("settingsPanel");
  const settingsStatus = document.getElementById("settingsStatus");
  const geminiKeyInput = document.getElementById("geminiKeyInput");
  const saveGeminiKeyBtn = document.getElementById("saveGeminiKeyBtn");
  const clearGeminiKeyBtn = document.getElementById("clearGeminiKeyBtn");

  let currentFilter = "all";
  let selectedSet = null;
  let sessionStartTime = null;
  let timerInterval = null;

  writingInput.setAttribute("maxlength", String(MAX_CHARS));

  function elapsedSeconds() {
    return Math.floor((Date.now() - sessionStartTime) / 1000);
  }

  function updateTimerChip() {
    timerChip.textContent = `Time: ${window.WP.formatTime(elapsedSeconds())}`;
  }

  function showScreen(screen) {
    [browseScreen, practiceScreen, resultsScreen].forEach((section) => {
      section.hidden = section !== screen;
    });
    screen.classList.remove("screen-enter");
    // Re-triggers the CSS entrance animation every time a screen appears.
    requestAnimationFrame(() => screen.classList.add("screen-enter"));
  }

  function renderFilterChips() {
    filterRow.textContent = "";

    const allChip = document.createElement("button");
    allChip.type = "button";
    allChip.className = "filter-chip";
    allChip.textContent = "All Sets";
    allChip.dataset.category = "all";
    filterRow.appendChild(allChip);

    Object.entries(CATEGORY_META).forEach(([key, meta]) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "filter-chip";
      chip.textContent = meta.label;
      chip.dataset.category = key;
      chip.style.setProperty("--accent", meta.color);
      filterRow.appendChild(chip);
    });

    syncFilterChipState();
  }

  function syncFilterChipState() {
    filterRow.querySelectorAll(".filter-chip").forEach((chip) => {
      const isActive = chip.dataset.category === currentFilter;
      chip.classList.toggle("is-active", isActive);
      chip.setAttribute("aria-pressed", String(isActive));
    });
  }

  function renderSetGrid() {
    setGrid.textContent = "";
    const visibleSets = PRACTICE_SETS.filter(
      (set) => currentFilter === "all" || set.category === currentFilter
    );

    visibleSets.forEach((set) => {
      const meta = CATEGORY_META[set.category];
      const card = document.createElement("button");
      card.type = "button";
      card.className = "set-card";
      card.dataset.setId = String(set.id);
      card.style.setProperty("--accent", meta.color);

      const tag = document.createElement("span");
      tag.className = "card-tag";
      tag.textContent = meta.label;

      const title = document.createElement("h3");
      title.className = "card-title";
      title.textContent = set.title;

      const promptPreview = document.createElement("p");
      promptPreview.className = "card-prompt";
      promptPreview.textContent = set.prompt;

      const words = document.createElement("p");
      words.className = "card-words";
      const preview = set.words.slice(0, 4).join(", ");
      const remaining = set.words.length - 4;
      words.textContent = remaining > 0 ? `${preview} +${remaining} more` : preview;

      card.appendChild(tag);
      card.appendChild(title);
      card.appendChild(promptPreview);
      card.appendChild(words);
      setGrid.appendChild(card);
    });
  }

  function resetPracticeForm() {
    clearInterval(timerInterval);
    timerInterval = null;
    sessionStartTime = null;

    writingForm.hidden = true;
    startWritingBtn.hidden = false;
    writingInput.value = "";
    writingInput.disabled = true;
    submitPassword.value = "";
    submitBtn.disabled = true;
    submitBtn.textContent = "Submit for Feedback";
    charCounter.textContent = `0 / ${MAX_CHARS}`;
    wordCountChip.textContent = "Words: 0";
    timerChip.textContent = "Time: 0:00";
    formError.hidden = true;
    formError.textContent = "";
  }

  function openPracticeScreen(set) {
    selectedSet = set;
    practiceTitle.textContent = set.title;
    practicePrompt.textContent = set.prompt;

    wordBankBlock.hidden = set.words.length === 0;
    wordBank.textContent = "";
    set.words.forEach((word) => {
      const chip = document.createElement("span");
      chip.className = "word-chip";
      chip.textContent = word;
      wordBank.appendChild(chip);
    });

    resetPracticeForm();
    showScreen(practiceScreen);
    startWritingBtn.focus();
  }

  function startWriting() {
    sessionStartTime = Date.now();
    clearInterval(timerInterval);
    timerInterval = setInterval(updateTimerChip, 1000);
    updateTimerChip();

    startWritingBtn.hidden = true;
    writingForm.hidden = false;
    writingInput.disabled = false;
    writingInput.focus();
  }

  function handleWritingInput() {
    const text = writingInput.value;
    wordCountChip.textContent = `Words: ${window.WP.countWords(text)}`;
    charCounter.textContent = `${text.length} / ${MAX_CHARS}`;
    submitBtn.disabled = window.WP.countWords(text) < MIN_WORDS;
    if (!formError.hidden) {
      formError.hidden = true;
      formError.textContent = "";
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const text = writingInput.value.trim();
    const wordCount = window.WP.countWords(text);

    if (wordCount < MIN_WORDS) {
      formError.hidden = false;
      formError.textContent = `Write at least ${MIN_WORDS} words before submitting — you're at ${wordCount}.`;
      return;
    }

    if (submitPassword.value !== SUBMIT_PASSWORD) {
      formError.hidden = false;
      formError.textContent = "Incorrect submit password.";
      submitPassword.value = "";
      submitPassword.focus();
      return;
    }

    const finishedAt = elapsedSeconds();
    clearInterval(timerInterval);
    timerInterval = null;

    const usingGemini = window.WP.hasGeminiKey();

    writingInput.disabled = true;
    submitPassword.disabled = true;
    submitBtn.disabled = true;
    submitBtn.textContent = usingGemini ? "Checking with Gemini…" : "Checking your writing…";
    formError.hidden = true;

    try {
      const matches = usingGemini
        ? await window.WP.checkTextWithGemini(text)
        : [...(await window.WP.checkText(text)), ...window.WP.runHeuristicRules(text)];
      const wordsUsedCount = window.WP.countWordsUsedFromBank(selectedSet.words, text);
      showResults({
        set: selectedSet,
        text,
        matches,
        wordCount,
        wordsUsedCount,
        elapsedSeconds: finishedAt,
      });
    } catch (error) {
      formError.hidden = false;
      formError.textContent = usingGemini
        ? `Couldn't get a response from Gemini (${error.message}). Check your API key in Settings, or clear it to use the free checker.`
        : "Couldn't reach the grammar checker — check your connection and try submitting again.";
      writingInput.disabled = false;
      submitPassword.disabled = false;
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit for Feedback";
      timerInterval = setInterval(updateTimerChip, 1000);
    }
  }

  function showResults({ set, text, matches, wordCount, wordsUsedCount, elapsedSeconds: seconds }) {
    resultTime.textContent = window.WP.formatTime(seconds);
    resultWordCount.textContent = String(wordCount);
    resultUsageStat.hidden = set.words.length === 0;
    resultUsage.textContent = `${wordsUsedCount}/${set.words.length}`;
    resultIssues.textContent = String(matches.length);

    const encouragement = window.WP.buildEncouragement({
      wordCount,
      issueCount: matches.length,
      wordsUsedCount,
      totalWords: set.words.length,
      elapsedSeconds: seconds,
    });
    window.WP.renderEncouragement(encouragementBox, encouragement);

    window.WP.renderHighlightedText(highlightedText, text, matches);
    window.WP.renderSuggestions(suggestions, text, matches);
    window.WP.loadVideoSuggestions(videoSuggestions, matches);

    showScreen(resultsScreen);
    resultsHeading.focus();
  }

  function hasUnsavedWriting() {
    return !writingForm.hidden && writingInput.value.trim().length > 0;
  }

  function backToBrowse() {
    if (hasUnsavedWriting() && !window.confirm("Leave this set? Your unsaved writing will be lost.")) {
      return;
    }
    clearInterval(timerInterval);
    timerInterval = null;
    showScreen(browseScreen);
  }

  function syncSettingsStatus() {
    settingsStatus.textContent = window.WP.hasGeminiKey()
      ? "Currently checking with: Gemini (AI review)."
      : "Currently checking with: the free checker (LanguageTool + built-in rules).";
  }

  renderFilterChips();
  renderSetGrid();
  syncSettingsStatus();

  surpriseBtn.addEventListener("click", () => {
    const pool =
      currentFilter === "all" ? PRACTICE_SETS : PRACTICE_SETS.filter((set) => set.category === currentFilter);
    const randomSet = pool[Math.floor(Math.random() * pool.length)];
    openPracticeScreen(randomSet);
  });

  customBtn.addEventListener("click", () => openPracticeScreen(CUSTOM_SET));

  filterRow.addEventListener("click", (event) => {
    const chip = event.target.closest(".filter-chip");
    if (!chip) return;
    currentFilter = chip.dataset.category;
    syncFilterChipState();
    renderSetGrid();
  });

  setGrid.addEventListener("click", (event) => {
    const card = event.target.closest(".set-card");
    if (!card) return;
    const set = PRACTICE_SETS.find((item) => item.id === Number(card.dataset.setId));
    if (set) openPracticeScreen(set);
  });

  backToBrowseBtn.addEventListener("click", backToBrowse);
  startWritingBtn.addEventListener("click", startWriting);
  writingInput.addEventListener("input", handleWritingInput);
  writingForm.addEventListener("submit", handleSubmit);
  retrySetBtn.addEventListener("click", () => openPracticeScreen(selectedSet));
  anotherSetBtn.addEventListener("click", () => showScreen(browseScreen));

  settingsToggle.addEventListener("click", () => {
    const isOpen = !settingsPanel.hidden;
    settingsPanel.hidden = isOpen;
    settingsToggle.setAttribute("aria-expanded", String(!isOpen));
  });

  saveGeminiKeyBtn.addEventListener("click", () => {
    const key = geminiKeyInput.value.trim();
    if (!key) return;
    window.WP.setGeminiApiKey(key);
    geminiKeyInput.value = "";
    syncSettingsStatus();
  });

  clearGeminiKeyBtn.addEventListener("click", () => {
    window.WP.clearGeminiApiKey();
    geminiKeyInput.value = "";
    syncSettingsStatus();
  });
})();
