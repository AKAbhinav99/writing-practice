# Writing Practice

A free-writing practice tool. Pick one of 50 prompts, weave a set of 8-10
given words into a paragraph or two, and get back spelling, grammar, and
style feedback with the exact spots highlighted — plus how long it took you.

No build step, no server of its own, no dependencies. It's plain
HTML/CSS/JS. The only network call it makes is to the free
[LanguageTool](https://languagetool.org) grammar-check API when you submit
your writing.

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
  Discovery, etc.) with the chips above the grid.
- Each set gives you a one-line prompt and 8-10 words to work into your
  writing. **Start Writing** begins the timer and opens the text box.
- **Submit for Feedback** (enabled once you've written at least 40 words)
  sends your text to LanguageTool and takes you to a results screen with:
  - Time taken, words written, how many of the assigned words you used,
    and how many issues turned up.
  - A short, specific note on how the draft went.
  - Your writing with spelling, grammar, and style/structure issues
    underlined in different colors (hover or focus a highlight to see the
    explanation), plus the same issues listed below with suggested fixes.
- **Write This Set Again** restarts the same set from a blank page;
  **Try Another Set** goes back to the grid.

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
