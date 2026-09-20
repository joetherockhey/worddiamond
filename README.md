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
- The centre badge publishes one letter that is definitely in the puzzle, plus the number of
  distinct letters across the whole diamond. It's a clue only — it reveals nothing.

Difficulty pre-reveals 0, 1 or 2 point letters.

## Files

| File | What it is |
|---|---|
| `index.html` | The whole UI — layout, styling, input |
| `game.js` | Puzzle generation, validation, classification, game state |
| `words.js` | 2,315 common five-letter words |
| `test.js` | The design brief's acceptance checks — `node test.js` |

The generator is the backtracking one from the brief: pick a top-left word, which fixes L and T;
pick a top-right word starting with T, which fixes R; pick a bottom-left word starting with L, which
fixes B; the bottom-right word is then a single index probe for `B _ _ _ R`. Puzzles are kept only
when they use 8–14 distinct letters. This dictionary yields **255,023,496** legal diamonds.

Theme is a plain Wordle-style palette; the green/yellow/red feedback colours are the only hues.

The daily puzzle is seeded from the date, so everyone gets the same board on the same day.

## Why

Built from Joe Hoffmann's brief: a game his physicist father and arts-graduate mother could have
played together over a cafe breakfast, because you can get in through the maths or through the words.
