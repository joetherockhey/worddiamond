# WordDiamond

Four five-letter words locked into a diamond by four shared point letters. Guess letters one at a
time — never a whole word — and watch the shape fill.

**Play: https://joetherockhey.github.io/worddiamond/**

## Rules

- The four words share their **point letters**. Top-left is `L _ _ _ T`, top-right `T _ _ _ R`,
  bottom-left `L _ _ _ B`, bottom-right `B _ _ _ R`. Sixteen cells on screen, four of them shared.
- **Green** — the letter is on the diamond. Every matching cell flips at once. Costs nothing.
- **Red** — the letter is not there. Costs 1.0.
- **Yellow** — Easy only: not there, but an immediate alphabet neighbour is. Costs 0.5 instead of 1.0.
  No alphabet wrap: A only touches B, Z only touches Y.
- Fill every cell before you run out of demerits: 5.0 on Hard, 4.0 on Normal and Easy.
- The centre badge counts how many of the puzzle's distinct letters you have turned up so far
  (“3 of 11 letters”). On Normal and Easy it also publishes one letter that is definitely in the
  puzzle — a clue only, it reveals nothing by itself.
- Closing “How to play” leaves faint arrows in the four corners for a few seconds, showing which way
  each word reads: both left-hand words start at the left point, both right-hand words end at the right.

| Level | Centre letter | Near misses | Budget |
|---|---|---|---|
| Hard (default) | hidden, badge shows the count alone | every miss costs 1.0 | 5.0 |
| Normal | published | every miss costs 1.0 | 4.0 |
| Easy | published | yellow, 0.5 | 4.0 |

The badge counts your progress at every level. The chosen level is remembered.

## Files

| File | What it is |
|---|---|
| `index.html` | The whole UI — layout, styling, input |
| `game.js` | Puzzle generation, validation, classification, game state |
| `words.js` | 2,315 five-letter words, ordered most-used first |
| `icon.svg`, `icon-*.png`, `manifest.json` | Home-screen icon: a W built from letter tiles |
| `qr.svg` | QR code for the site, generated once at build time |
| `test.js` | The design brief's acceptance checks — `node test.js` |

The generator is the backtracking one from the brief: pick a top-left word, which fixes L and T;
pick a top-right word starting with T, which fixes R; pick a bottom-left word starting with L, which
fixes B; the bottom-right word is then a single index probe for `B _ _ _ R`. Puzzles are kept only
when they use 8–14 distinct letters.

Word choice leans on familiarity. `words.js` is sorted by Norvig unigram counts, most-used first, so
every candidate pool is already in frequency order; the generator then biases its pick toward the
front of each pool and refuses any puzzle containing a word past position `COMMON_CAP` (1400). That
keeps TULLE, DOWRY, WOOER and friends out of the board while leaving about 34 million legal diamonds
to draw from. They stay legal words — a hand-authored puzzle may still use them.

The header carries only the title, the demerit bar, a New puzzle button on the left and a ⋯ menu on
the right. How to play, Today’s diamond, the theme, Share and the level all live in that menu, which
is a plain `<details>` — the open and close behaviour is the browser’s, not ours. Everything the menu
opens is a popup, so the board and keyboard never move.

Portrait only. The manifest locks the installed app to portrait; a browser tab cannot be locked on
iOS, so landscape on a phone gets a “turn your phone upright” screen instead. The keyboard sits on
the bottom edge and the board takes the room left over above it.

Two themes. The purple dark one is the default; Light mode in the menu switches to a plain
Wordle-style light palette, and the choice is remembered.

Share in the menu opens a QR code anyone can scan to open the game on their own phone. The
code is generated once at build time for this address, so the page carries no QR library and calls
no QR service.

Finishing a puzzle opens the result card. “Admire puzzle” steps out of it to look at the completed
diamond, leaving a bar at the bottom with share, the results card and the next puzzle.

The daily puzzle is seeded from the date, so everyone gets the same board on the same day.

## Why

Built from Joe Hoffmann's brief: a game his physicist father and arts-graduate mother could have
played together over a cafe breakfast, because you can get in through the maths or through the words.
