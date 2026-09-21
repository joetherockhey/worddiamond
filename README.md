# WordDiamond

Four five-letter words locked into a diamond by four shared point letters. Guess letters one at a
time — never a whole word — and watch the shape fill.

**Play: https://joetherockhey.github.io/worddiamond/**

## Rules

- The four words share their **point letters**. Top-left is `L _ _ _ T`, top-right `T _ _ _ R`,
  bottom-left `L _ _ _ B`, bottom-right `B _ _ _ R`. Sixteen cells on screen, four of them shared.
- **Green** — the letter is on the diamond. Every matching cell flips at once. Costs nothing.
- **Yellow** — the letter isn't there, but an immediate alphabet neighbour is. Costs 0.5.
- **Red** — neither it nor its neighbours are there. Costs 1.0.
- No alphabet wrap: A only touches B, Z only touches Y.
- Fill every cell before you reach **4.0 demerits**.
- The centre badge publishes one letter that is definitely in the puzzle, and counts how many of the
  puzzle's distinct letters you have turned up so far (“3 of 11 letters”). It reveals nothing by itself.
- Light grey arrows in the four corners show which way each word reads: both left-hand words start at
  the left point, both right-hand words end at the right point.

Difficulty pre-reveals 0, 1 or 2 point letters.

## Files

| File | What it is |
|---|---|
| `index.html` | The whole UI — layout, styling, input |
| `game.js` | Puzzle generation, validation, classification, game state |
| `words.js` | 2,315 five-letter words, ordered most-used first |
| `icon.svg`, `icon-*.png`, `manifest.json` | Home-screen icon: a W built from letter tiles |
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

Two themes. The purple dark one is the default; the sun button in the header switches to a plain
Wordle-style light palette, and the choice is remembered.

Finishing a puzzle opens the result card. “Admire puzzle” steps out of it to look at the completed
diamond, leaving a bar at the bottom with share, the results card and the next puzzle.

The daily puzzle is seeded from the date, so everyone gets the same board on the same day.

## Why

Built from Joe Hoffmann's brief: a game his physicist father and arts-graduate mother could have
played together over a cafe breakfast, because you can get in through the maths or through the words.
