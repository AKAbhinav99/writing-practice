(() => {
  // LanguageTool's free API is mostly a spelling/agreement/punctuation
  // checker — it does not reliably flag comma splices, subject-less
  // fragments, or redundant conjunction pairs (verified directly against
  // the API, including at level=picky). These three pattern-based checks
  // fill that specific gap. They are heuristics, not a parser: tuned to
  // catch the common textbook cases while avoiding the most obvious false
  // positives (lists, participial openers like "Excited, I ran...").

  const AUX_OR_MODAL = new Set([
    "is", "are", "was", "were", "am", "be", "been", "being",
    "have", "has", "had", "do", "does", "did",
    "will", "would", "shall", "should", "can", "could", "may", "might", "must",
  ]);

  // Used for "is there a verb in this clause" checks (comma splices), where
  // a stray false positive just means one more candidate to weigh — not
  // shown directly as "this word is a past-tense verb" the way the
  // sentence-initial check below is, so ambiguous base=past forms like
  // "let" or "set" are fine to include here.
  const IRREGULAR_PAST = new Set([
    "went", "ate", "saw", "ran", "said", "got", "came", "took", "made",
    "knew", "thought", "found", "gave", "told", "became", "left", "felt",
    "brought", "began", "kept", "held", "wrote", "stood", "heard", "let",
    "meant", "sat", "met", "paid", "spoke", "broke", "chose", "drove",
    "fell", "flew", "forgot", "grew", "lost", "rode", "rose", "sang",
    "slept", "spent", "threw", "woke", "won", "bought", "sold", "taught",
    "caught", "fought", "sent", "built", "dug", "drew", "bit", "blew",
    "crept", "drank", "rang", "sank", "stole", "struck", "swept", "swam",
    "swung", "tore", "understood", "wept", "set", "put", "read", "cut",
    "hit", "cost", "hurt", "shut", "split", "quit", "bet",
  ]);

  // Only safe for the sentence-initial "missing subject" check: excludes
  // irregular verbs whose past-tense form is identical to their base/
  // imperative form (e.g. "Let me know..." or "Set the table..." are valid
  // sentences on their own, not fragments missing a subject).
  const AMBIGUOUS_BASE_PAST = new Set([
    "let", "set", "put", "read", "cut", "hit", "cost", "hurt", "shut",
    "split", "quit", "bet", "beat", "spread", "burst", "cast",
  ]);

  const IRREGULAR_PAST_UNAMBIGUOUS = new Set([...IRREGULAR_PAST].filter((word) => !AMBIGUOUS_BASE_PAST.has(word)));

  const COMMON_PRESENT_VERBS = new Set([
    "go", "goes", "want", "wants", "like", "likes", "need", "needs",
    "think", "thinks", "know", "knows", "love", "loves", "see", "sees",
    "feel", "feels", "look", "looks", "seem", "seems", "get", "gets",
    "make", "makes", "take", "takes", "eat", "eats", "drink", "drinks",
    "walk", "walks", "talk", "talks", "play", "plays", "watch", "watches",
    "work", "works", "live", "lives", "hope", "hopes", "believe", "believes",
    "remember", "remembers", "plan", "plans", "hate", "hates", "enjoy",
    "enjoys", "miss", "misses", "agree", "agrees", "decide", "decides",
    "hear", "hears", "say", "says", "tell", "tells", "ask", "asks",
  ]);

  // Common -ed adjectives that legitimately open a sentence as a
  // participial phrase ("Excited, I ran to the door."), not a missing-
  // subject fragment. Excluded from the sentence-initial-verb check.
  const PARTICIPIAL_ADJECTIVES = new Set([
    "excited", "worried", "surprised", "frustrated", "pleased", "amazed",
    "tired", "confused", "interested", "concerned", "satisfied",
    "disappointed", "shocked", "scared", "annoyed", "relieved", "thrilled",
    "delighted", "exhausted", "determined",
  ]);

  const SUBJECT_WORDS = new Set(["i", "you", "he", "she", "it", "we", "they", "this", "that", "these", "those", "there"]);

  const CONNECTIVE_STARTERS = [
    "and", "but", "or", "nor", "for", "yet", "so",
    "because", "although", "though", "even though", "since", "unless",
    "while", "whereas", "when", "whenever", "if", "after", "before",
    "until", "as", "once", "so that",
    "which", "who", "whom", "whose", "that",
    "however", "therefore", "thus", "then", "moreover", "furthermore",
    "nevertheless", "nonetheless", "meanwhile", "consequently", "otherwise",
    "instead", "besides",
  ];

  const SUBORDINATORS = ["although", "though", "even though", "because", "since", "while", "whereas"];

  function buildMatch(offset, length, message, replacements) {
    return {
      offset,
      length,
      message,
      replacements: replacements || [],
      rule: { issueType: "grammar", category: { id: "GRAMMAR" } },
    };
  }

  function hasVerbWithin(words) {
    return words.some(
      (w) => AUX_OR_MODAL.has(w) || IRREGULAR_PAST.has(w) || COMMON_PRESENT_VERBS.has(w) || /^[a-z]+(ed|ing)$/.test(w)
    );
  }

  function startsAsIndependentClause(segment) {
    const words = segment.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (words.length < 2 || !SUBJECT_WORDS.has(words[0])) return false;
    return hasVerbWithin(words.slice(1, 6));
  }

  function startsWithConnective(segment) {
    const lower = segment.trim().toLowerCase();
    return CONNECTIVE_STARTERS.some((word) => lower === word || lower.startsWith(`${word} `) || lower.startsWith(`${word},`));
  }

  // Splits on sentence-ending punctuation while tracking absolute offsets
  // into the original text, so flagged spans can be highlighted correctly.
  function getSentenceSpans(text) {
    const spans = [];
    let start = 0;
    const re = /[.!?]+(?:\s|$)/g;
    let match;
    while ((match = re.exec(text)) !== null) {
      const end = match.index + match[0].length;
      spans.push({ start, text: text.slice(start, end) });
      start = end;
    }
    if (start < text.length) {
      spans.push({ start, text: text.slice(start) });
    }
    return spans;
  }

  function findCommaSplices(text) {
    const matches = [];
    getSentenceSpans(text).forEach((sentence) => {
      const commaCount = (sentence.text.match(/,/g) || []).length;
      if (commaCount < 1 || commaCount > 2) return; // skip lists/long series

      const parts = sentence.text.split(",");
      let cursor = sentence.start;
      for (let i = 0; i < parts.length - 1; i++) {
        const left = parts[i];
        const right = parts[i + 1];
        const commaOffset = cursor + left.length;

        if (startsAsIndependentClause(left) && startsAsIndependentClause(right) && !startsWithConnective(right)) {
          matches.push(
            buildMatch(
              commaOffset,
              1,
              "This may be a comma splice — two complete sentences joined only by a comma. Try a period, a semicolon, or adding a conjunction.",
              [{ value: "." }, { value: ";" }, { value: ", and" }]
            )
          );
        }
        cursor += left.length + 1;
      }
    });
    return matches;
  }

  function findMissingSubjectFragments(text) {
    const matches = [];
    getSentenceSpans(text).forEach((sentence) => {
      const leadingMatch = sentence.text.match(/^[\s"'(]*/);
      const leadingLength = leadingMatch ? leadingMatch[0].length : 0;
      const rest = sentence.text.slice(leadingLength);
      const wordMatch = rest.match(/^([A-Za-z]+)/);
      if (!wordMatch) return;

      const firstWord = wordMatch[1];
      const lower = firstWord.toLowerCase();
      const afterWord = rest.slice(firstWord.length);
      const followedByComma = /^\s*,/.test(afterWord);

      const looksLikePastTenseVerb = !PARTICIPIAL_ADJECTIVES.has(lower) && (IRREGULAR_PAST_UNAMBIGUOUS.has(lower) || /^[a-z]+ed$/.test(lower));

      if (looksLikePastTenseVerb && !followedByComma) {
        matches.push(
          buildMatch(
            sentence.start + leadingLength,
            firstWord.length,
            `This sentence may be missing a subject before "${firstWord}" (e.g., "I ${lower}...", "She ${lower}...").`
          )
        );
      }
    });
    return matches;
  }

  function findRedundantConjunctions(text) {
    const matches = [];

    const adjacentPairs = [
      ["but", "however"],
      ["and", "also"],
      ["but", "yet"],
      ["so", "therefore"],
      ["because", "since"],
      ["and", "plus"],
    ];
    adjacentPairs.forEach(([first, second]) => {
      const re = new RegExp(`\\b(${first})\\s+(${second})\\b`, "gi");
      let match;
      while ((match = re.exec(text)) !== null) {
        matches.push(
          buildMatch(
            match.index,
            match[0].length,
            `"${first}" and "${second}" both signal the same kind of contrast or addition — keep one.`,
            [{ value: match[1] }, { value: match[2] }]
          )
        );
      }
    });

    const subordinatorPattern = SUBORDINATORS.join("|");
    const crossClauseRe = new RegExp(`\\b(${subordinatorPattern})\\b[^,.!?]{0,100},\\s*(but|yet)\\b`, "gi");
    let crossMatch;
    while ((crossMatch = crossClauseRe.exec(text)) !== null) {
      const butIndex = text.indexOf(crossMatch[2], crossMatch.index + crossMatch[1].length);
      matches.push(
        buildMatch(
          butIndex,
          crossMatch[2].length,
          `This clause already opens with "${crossMatch[1]}" — you likely don't need "${crossMatch[2]}" too. Drop one of them.`
        )
      );
    }

    return matches;
  }

  function runHeuristicRules(text) {
    return [...findCommaSplices(text), ...findMissingSubjectFragments(text), ...findRedundantConjunctions(text)];
  }

  window.WP = window.WP || {};
  Object.assign(window.WP, { runHeuristicRules });
})();
