# Writing Practice

A free-writing practice tool. Pick one of 50 prompts, weave a set of 12
given words into a paragraph or two, and get back spelling, grammar, and
style feedback with the exact spots highlighted — plus how long it took you.

No build step, no server of its own, no dependencies. It's plain
HTML/CSS/JS. By default the only network call it makes is to the free
[LanguageTool](https://languagetool.org) grammar-check API when you submit
your writing — see [AI checking with Gemini](#ai-checking-with-gemini-optional)
below for an optional, much stronger alternative.

## Running it

**If you downloaded the ZIP from GitHub** ("Code" → "Download ZIP"): unzip
it, open the extracted folder, and double-click `index.html`. It opens in
your default browser and just works — no terminal needed.

**If you cloned with `git clone`**, same thing: open `index.html` from
inside the `writing-practice` folder.

### Serving it locally instead (optional)

Some browsers are stricter about `fetch()` from a `file://` page, so if the
grammar check seems to silently fail, serve it over HTTP instead:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## How it works

- **Choose a practice set** from the grid of 50, or hit **Surprise Me** for
  a random one. Filter by category (Travel & Adventure, Science &
  Discovery, etc.) with the chips above the grid — **Surprise Me** picks
  only from whichever category is currently selected (or the full set of
  50 if you haven't filtered).
- Each set gives you a one-line prompt and 12 words to work into your
  writing — any tense of a word counts (e.g. "run" still counts a draft
  that only used "running" or "ran"). **Start Writing** begins the timer
  and opens the text box.
- **Submit for Feedback** (enabled once you've written at least 40 words)
  sends your text to LanguageTool and takes you to a results screen with:
  - Time taken, words written, how many of the assigned words you used,
    and how many issues turned up.
  - A short, specific note on how the draft went.
  - Your writing with spelling, grammar, and style/structure issues
    underlined in different colors (hover or focus a highlight to see the
    explanation), plus the same issues listed below with suggested fixes.
  - A **"Brush up on these"** box grouping your most common mistakes (e.g.
    comma splices, subject-verb agreement) with links to relevant YouTube
    videos — see below for how those are found.
- **Write This Set Again** restarts the same set from a blank page;
  **Try Another Set** goes back to the grid.

## AI checking with Gemini (optional)

The free LanguageTool checker (plus a few hand-written rules for comma
splices, missing-subject fragments, redundant conjunctions, and
indefinite-pronoun agreement) is pattern-based — it catches a lot, but it
doesn't *understand* the writing the way a model does. If you want
noticeably better feedback, click **AI Checker Settings** under the title
and paste in a [Gemini API key](https://aistudio.google.com/apikey) (Google
gives a free tier). Once a key is saved, submissions go straight to Gemini
instead of the free checker.

**Where the key lives:** only in your browser's `localStorage`. It is never
written to any file in this project, never committed to git, and never
sent anywhere except directly from your browser to Google's API when you
submit writing. Clearing it (the "Clear saved key" link) or opening the
site in a different browser/profile goes back to the free checker. Because
this repo is public, **never** paste a real key into `js/gemini.js` or any
other file — always enter it through the Settings panel in the running
page.

To change the model, edit the `MODEL` constant in `js/gemini.js`.

### Suggested videos for your mistakes

The results screen always shows a "Brush up on these" box for your most
common mistake types, each with a "Search YouTube for ..." link — this part
needs no API key and always works.

If a Gemini key is saved, that box is upgraded: Gemini uses Google's search
tool to look for one real, specific YouTube video per mistake (e.g. a video
on fixing comma splices) and lists it above the generic search link.

Gemini itself never gets to type out a video URL — it can only *name* a
video; the actual link comes from Google Search's own citation data
(`groundingMetadata`) for that exact recommendation, which is the only part
of the response guaranteed to be a real, currently-indexed source rather
than a plausible-looking guess. If grounding doesn't back a topic with a
real source, that topic just keeps its generic search link — so a missed
AI suggestion never leaves you with a dead "video unavailable" link.

## Customizing the practice sets

Edit `js/sets.js` — it's a plain array of objects:

```js
{ id: 51, category: "everyday", title: "...", words: ["...", "..."], prompt: "..." }
```

`category` must match one of the keys in `CATEGORY_META` at the top of the
same file (or add a new category there, with a label and an accent color).

## Browser support note

The grammar check uses `fetch()` and a CSS color-mix function, both
well-supported in current Chrome, Edge, Firefox, and Safari. If a request
to LanguageTool fails (offline, or its free-tier rate limit), the page
shows an inline error and lets you retry without losing your writing.
