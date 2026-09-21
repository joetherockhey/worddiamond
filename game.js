(function (root) {
  "use strict";

  var WORDS = (typeof module !== "undefined" ? require("./words.js").WORDS : root.WORDS);

  var ALPHA = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  var MAX_DEMERITS = 4;

  // How rare a word may be before the generator refuses it. WORDS is ordered
  // most-used first, so this is a position in that list. Everything past it
  // (TULLE, DOWRY, WOOER...) still counts as a legal word, it just never shows up.
  var COMMON_CAP = 1400;

  // ---------- puzzle generation ----------

  var byFirst = {}, byPair = {}, rank = {};
  WORDS.forEach(function (w, i) {
    rank[w] = i;
    (byFirst[w[0]] = byFirst[w[0]] || []).push(w);
    (byPair[w[0] + w[4]] = byPair[w[0] + w[4]] || []).push(w);
  });

  // deterministic PRNG so a given seed always yields the same puzzle
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function hashSeed(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }

  function distinctLetters(words) {
    var seen = {}, out = [];
    words.join("").split("").forEach(function (c) { if (!seen[c]) { seen[c] = 1; out.push(c); } });
    return out.sort();
  }

  // TL = L___T, TR = T___R, BL = L___B, BR = B___R
  function generate(seed) {
    var rand = mulberry32(hashSeed(String(seed)));
    // every pool is in most-used-first order, so squashing the index toward the
    // front is all it takes to favour familiar words over technically-legal ones
    var pick = function (a) { return a[Math.floor(rand() * rand() * a.length)]; };

    for (var tries = 0; tries < 50000; tries++) {
      var TL = pick(WORDS);
      var L = TL[0], T = TL[4];
      if (!byFirst[T] || !byFirst[L]) continue;

      var TR = pick(byFirst[T]);
      if (TR === TL) continue;
      var R = TR[4];

      var BL = pick(byFirst[L]);
      if (BL === TL || BL === TR) continue;
      var B = BL[4];

      var pool = byPair[B + R];
      if (!pool) continue;
      pool = pool.filter(function (w) { return w !== TL && w !== TR && w !== BL; });
      if (!pool.length) continue;

      var BR = pick(pool);
      if (Math.max(rank[TL], rank[TR], rank[BL], rank[BR]) > COMMON_CAP) continue;

      var letters = distinctLetters([TL, TR, BL, BR]);
      if (letters.length < 8 || letters.length > 14) continue; // quality gate

      return makePuzzle(TL, TR, BL, BR, letters[Math.floor(rand() * letters.length)]);
    }
    throw new Error("generator exhausted");
  }

  function makePuzzle(TL, TR, BL, BR, centreLetter) {
    var letters = distinctLetters([TL, TR, BL, BR]);
    var p = {
      words: { topLeft: TL, topRight: TR, bottomLeft: BL, bottomRight: BR },
      points: { L: TL[0], T: TL[4], R: TR[4], B: BL[4] },
      distinctLetters: letters,
      distinctCount: letters.length,
      centreLetter: centreLetter || letters[0]
    };
    validate(p);
    return p;
  }

  // Acceptance check 11/12/13/14: a mismatched puzzle is rejected outright.
  function validate(p) {
    var w = p.words, all = [w.topLeft, w.topRight, w.bottomLeft, w.bottomRight];
    all.forEach(function (x) {
      if (!/^[A-Z]{5}$/.test(x)) throw new Error("not a 5-letter A-Z word: " + x);
      if (WORDS.indexOf(x) === -1) throw new Error("not in dictionary: " + x);
    });
    if (new Set(all).size !== 4) throw new Error("duplicate words");
    if (w.topLeft[0] !== w.bottomLeft[0]) throw new Error("point L mismatch");
    if (w.topLeft[4] !== w.topRight[0]) throw new Error("point T mismatch");
    if (w.topRight[4] !== w.bottomRight[4]) throw new Error("point R mismatch");
    if (w.bottomLeft[4] !== w.bottomRight[0]) throw new Error("point B mismatch");
    if (p.points.L !== w.topLeft[0] || p.points.T !== w.topLeft[4] ||
        p.points.R !== w.topRight[4] || p.points.B !== w.bottomLeft[4]) throw new Error("points do not match words");
    var letters = distinctLetters(all);
    if (p.distinctCount !== letters.length) throw new Error("distinctCount wrong");
    if (letters.indexOf(p.centreLetter) === -1) throw new Error("centre letter not in puzzle");
    return true;
  }

  // ---------- classification ----------

  // green if present; yellow if an immediate alphabet neighbour is present (no wrap); else red.
  function classify(guess, distinct) {
    if (distinct.indexOf(guess) !== -1) return "green";
    var i = ALPHA.indexOf(guess);
    var prev = i > 0 ? ALPHA[i - 1] : null;
    var next = i < 25 ? ALPHA[i + 1] : null;
    if ((prev && distinct.indexOf(prev) !== -1) || (next && distinct.indexOf(next) !== -1)) return "yellow";
    return "red";
  }

  var COST = { green: 0, yellow: 0.5, red: 1 };

  // ---------- board / game state ----------

  // Each side is 5 cell ids; index 0 and 4 are shared point cells, so 16 cells total.
  var SIDES = {
    topLeft: ["L", "TL1", "TL2", "TL3", "T"],
    topRight: ["T", "TR1", "TR2", "TR3", "R"],
    bottomLeft: ["L", "BL1", "BL2", "BL3", "B"],
    bottomRight: ["B", "BR1", "BR2", "BR3", "R"]
  };

  // allowYellow off means a near miss costs the same as a far one: no softening.
  function newGame(puzzle, revealPoints, allowYellow) {
    var cells = {};
    Object.keys(SIDES).forEach(function (side) {
      SIDES[side].forEach(function (id, i) {
        cells[id] = cells[id] || {
          id: id,
          letter: puzzle.words[side][i],
          revealed: false,
          kind: (i === 0 || i === 4) ? "point" : "mid"
        };
      });
    });

    var g = {
      puzzle: puzzle,
      cells: cells,
      guessedLetters: [],
      guessResults: [],
      demeritPoints: 0,
      maxDemerits: MAX_DEMERITS,
      allowYellow: allowYellow !== false,
      status: "playing"
    };

    // difficulty knob: pre-reveal 0, 1 or 2 point letters
    ["L", "T", "R", "B"].sort(function () { return Math.random() - 0.5; })
      .slice(0, revealPoints || 0)
      .forEach(function (id) { cells[id].revealed = true; });

    return g;
  }

  function hiddenCells(g) {
    return Object.keys(g.cells).filter(function (id) { return !g.cells[id].revealed; });
  }

  function guess(g, letter) {
    if (g.status !== "playing") return null;
    if (g.guessedLetters.indexOf(letter) !== -1) return null; // re-tap does nothing

    var result = classify(letter, g.puzzle.distinctLetters);
    if (result === "yellow" && !g.allowYellow) result = "red";
    var revealed = [];

    if (result === "green") {
      Object.keys(g.cells).forEach(function (id) {
        if (g.cells[id].letter === letter && !g.cells[id].revealed) {
          g.cells[id].revealed = true;
          revealed.push(id);
        }
      });
    } else {
      g.demeritPoints = Math.round((g.demeritPoints + COST[result]) * 2) / 2;
    }

    g.guessedLetters.push(letter);
    g.guessResults.push(result);

    if (hiddenCells(g).length === 0) g.status = "won";
    else if (g.demeritPoints >= g.maxDemerits) g.status = "lost";

    return { result: result, revealed: revealed };
  }

  function revealAll(g) {
    Object.keys(g.cells).forEach(function (id) { g.cells[id].revealed = true; });
  }

  var api = {
    WORDS: WORDS, SIDES: SIDES, ALPHA: ALPHA, MAX_DEMERITS: MAX_DEMERITS,
    generate: generate, makePuzzle: makePuzzle, validate: validate, COMMON_CAP: COMMON_CAP,
    classify: classify, distinctLetters: distinctLetters,
    newGame: newGame, guess: guess, hiddenCells: hiddenCells, revealAll: revealAll
  };

  if (typeof module !== "undefined") { module.exports = api; return; }
  root.WD = api;
})(typeof self !== "undefined" ? self : this);
