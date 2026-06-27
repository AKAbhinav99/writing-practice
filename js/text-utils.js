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

  // Every group is the full set of tenses/forms for one irregular verb.
  // Looked up so a bank word like "see" still counts a draft that only used
  // "saw" or "seen" \u2014 forms regular suffix-stripping can never derive
  // because they don't share a common prefix.
  const IRREGULAR_VERB_GROUPS = [
    ["be", "am", "is", "are", "was", "were", "been", "being"],
    ["have", "has", "had", "having"],
    ["do", "does", "did", "done", "doing"],
    ["go", "goes", "went", "gone", "going"],
    ["see", "sees", "saw", "seen", "seeing"],
    ["eat", "eats", "ate", "eaten", "eating"],
    ["run", "runs", "ran", "running"],
    ["come", "comes", "came", "coming"],
    ["take", "takes", "took", "taken", "taking"],
    ["make", "makes", "made", "making"],
    ["know", "knows", "knew", "known", "knowing"],
    ["think", "thinks", "thought", "thinking"],
    ["give", "gives", "gave", "given", "giving"],
    ["find", "finds", "found", "finding"],
    ["tell", "tells", "told", "telling"],
    ["become", "becomes", "became", "becoming"],
    ["leave", "leaves", "left", "leaving"],
    ["feel", "feels", "felt", "feeling"],
    ["bring", "brings", "brought", "bringing"],
    ["begin", "begins", "began", "begun", "beginning"],
    ["keep", "keeps", "kept", "keeping"],
    ["hold", "holds", "held", "holding"],
    ["write", "writes", "wrote", "written", "writing"],
    ["stand", "stands", "stood", "standing"],
    ["hear", "hears", "heard", "hearing"],
    ["mean", "means", "meant", "meaning"],
    ["sit", "sits", "sat", "sitting"],
    ["meet", "meets", "met", "meeting"],
    ["pay", "pays", "paid", "paying"],
    ["speak", "speaks", "spoke", "spoken", "speaking"],
    ["break", "breaks", "broke", "broken", "breaking"],
    ["choose", "chooses", "chose", "chosen", "choosing"],
    ["drive", "drives", "drove", "driven", "driving"],
    ["fall", "falls", "fell", "fallen", "falling"],
    ["fly", "flies", "flew", "flown", "flying"],
    ["forget", "forgets", "forgot", "forgotten", "forgetting"],
    ["grow", "grows", "grew", "grown", "growing"],
    ["lose", "loses", "lost", "losing"],
    ["ride", "rides", "rode", "ridden", "riding"],
    ["rise", "rises", "rose", "risen", "rising"],
    ["sing", "sings", "sang", "sung", "singing"],
    ["sleep", "sleeps", "slept", "sleeping"],
    ["spend", "spends", "spent", "spending"],
    ["throw", "throws", "threw", "thrown", "throwing"],
    ["wake", "wakes", "woke", "woken", "waking"],
    ["win", "wins", "won", "winning"],
    ["buy", "buys", "bought", "buying"],
    ["sell", "sells", "sold", "selling"],
    ["teach", "teaches", "taught", "teaching"],
    ["catch", "catches", "caught", "catching"],
    ["fight", "fights", "fought", "fighting"],
    ["send", "sends", "sent", "sending"],
    ["build", "builds", "built", "building"],
    ["draw", "draws", "drew", "drawn", "drawing"],
    ["bite", "bites", "bit", "bitten", "biting"],
    ["blow", "blows", "blew", "blown", "blowing"],
    ["drink", "drinks", "drank", "drunk", "drinking"],
    ["ring", "rings", "rang", "rung", "ringing"],
    ["sink", "sinks", "sank", "sunk", "sinking"],
    ["steal", "steals", "stole", "stolen", "stealing"],
    ["strike", "strikes", "struck", "striking"],
    ["sweep", "sweeps", "swept", "sweeping"],
    ["swim", "swims", "swam", "swum", "swimming"],
    ["swing", "swings", "swung", "swinging"],
    ["tear", "tears", "tore", "torn", "tearing"],
    ["understand", "understands", "understood", "understanding"],
    ["lay", "lays", "laid", "laying"],
    ["lead", "leads", "led", "leading"],
    ["lend", "lends", "lent", "lending"],
    ["light", "lights", "lit", "lighting"],
    ["shine", "shines", "shone", "shining"],
    ["shoot", "shoots", "shot", "shooting"],
  ];

  const IRREGULAR_FORM_TO_GROUP = new Map();
  IRREGULAR_VERB_GROUPS.forEach((group) => {
    group.forEach((form) => IRREGULAR_FORM_TO_GROUP.set(form, group));
  });

  // Strips a common inflectional suffix so "wander" still matches text that
  // used "wandered" or "wandering" (and undoes the doubled consonant that
  // suffixes like "-ing"/"-ed" leave behind, e.g. "running" -> "run"). "ied"
  // is handled separately from "ed" so "hurried"/"carried"-style verbs stem
  // to a prefix ("hurr"/"carr") that also matches the "-y"/"-ies"/"-ying"
  // forms \u2014 those don't share a literal "ed" ending with the base spelling.
  function wordStem(word) {
    const lower = normalize(word);
    const suffixes = ["ied", "ing", "ed", "es", "s"];
    for (const suffix of suffixes) {
      if (lower.endsWith(suffix) && lower.length - suffix.length >= 3) {
        let stem = lower.slice(0, lower.length - suffix.length);
        const canUndoDoubling = suffix !== "ied";
        if (canUndoDoubling && stem.length >= 4 && stem[stem.length - 1] === stem[stem.length - 2]) {
          stem = stem.slice(0, -1);
        }
        return stem;
      }
    }
    return lower;
  }

  function isWordUsed(word, normalizedText) {
    const cleanWord = normalize(word).replace(/[^a-z]/g, "");
    if (!cleanWord) return false;

    // Bank word is a recognized irregular verb (in any of its own tenses) \u2014
    // accept any tense/form of that same verb, not just the one printed.
    const irregularGroup = IRREGULAR_FORM_TO_GROUP.get(cleanWord);
    if (irregularGroup) {
      const pattern = new RegExp(`\\b(${irregularGroup.join("|")})\\b`, "i");
      if (pattern.test(normalizedText)) return true;
    }

    const stem = wordStem(word).replace(/[^a-z]/g, "");
    if (!stem) return false;
    const pattern = new RegExp(`\\b${stem}\\w*\\b`, "i");
    return pattern.test(normalizedText);
  }

  function usedBankWords(words, text) {
    const normalizedText = normalize(text);
    return words.filter((word) => isWordUsed(word, normalizedText));
  }

  function countWordsUsedFromBank(words, text) {
    return usedBankWords(words, text).length;
  }

  window.WP = window.WP || {};
  Object.assign(window.WP, {
    countWords,
    formatTime,
    normalize,
    wordStem,
    isWordUsed,
    usedBankWords,
    countWordsUsedFromBank,
  });
})();
