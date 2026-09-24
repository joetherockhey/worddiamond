// node test.js  -- acceptance checks from the design brief
var assert = require("assert");
var WD = require("./game.js");

var p = WD.makePuzzle("COURT", "TRUER", "COPSE", "ETHER", "O");
assert.deepStrictEqual(p.points, { L: "C", T: "T", R: "R", B: "E" });

// 12: repeated letters count once
assert.strictEqual(p.distinctCount, p.distinctLetters.length);
assert.deepStrictEqual(WD.distinctLetters(["CRANE", "CRANE"]), ["A", "C", "E", "N", "R"]);
// 13: centre letter is always in the set
assert.ok(p.distinctLetters.indexOf(p.centreLetter) !== -1);

// 11 + 14: illegal puzzles are rejected
assert.throws(function () { WD.makePuzzle("COURT", "XRUER", "COPSE", "ETHER"); }, /dictionary|mismatch/);
assert.throws(function () { WD.makePuzzle("CRANE", "EARTH", "CRANE", "HEATH"); }, /duplicate|mismatch/);

// 1: one guess reveals every matching cell
var g = WD.newGame(p, 0);
assert.strictEqual(WD.hiddenCells(g).length, 16);
var r = WD.guess(g, "R"); // R is a point and appears in COURT, TRUER, ETHER
assert.strictEqual(r.result, "green");
assert.ok(r.revealed.length >= 3);
assert.strictEqual(g.demeritPoints, 0); // 3: greens never cost

// 2: a point letter is one cell, shared by two words
var g2 = WD.newGame(WD.makePuzzle("COURT", "TRUER", "COPSE", "ETHER", "O"), 0);
assert.strictEqual(WD.guess(g2, "T").revealed.filter(function (id) { return id === "T"; }).length, 1);
assert.ok(g2.cells.T.revealed && g2.cells.T.kind === "point");

// 4/5/6: adjacency, no wrap
assert.strictEqual(WD.classify("G", ["F", "Z"]), "yellow");
assert.strictEqual(WD.classify("G", ["H", "Z"]), "yellow");
assert.strictEqual(WD.classify("G", ["A", "Z"]), "red");
assert.strictEqual(WD.classify("F", ["F"]), "green");      // green wins
assert.strictEqual(WD.classify("A", ["Z"]), "red");        // no wrap A<-Z
assert.strictEqual(WD.classify("Z", ["A"]), "red");        // no wrap Z->A
assert.strictEqual(WD.classify("A", ["B"]), "yellow");
assert.strictEqual(WD.classify("Z", ["Y"]), "yellow");

// 7: re-tapping does nothing
var g3 = WD.newGame(p, 0);
WD.guess(g3, "Z");
var before = g3.demeritPoints, n = g3.guessedLetters.length;
assert.strictEqual(WD.guess(g3, "Z"), null);
assert.strictEqual(g3.demeritPoints, before);
assert.strictEqual(g3.guessedLetters.length, n);

// 9: a miss that hits 4.0 with blanks left loses; half steps stay exact
var g4 = WD.newGame(p, 0);
["Z", "X", "J", "L"].forEach(function (c) { WD.guess(g4, c); });
assert.ok(g4.demeritPoints >= 4 && g4.status === "lost");
var g5 = WD.newGame(p, 0);
WD.guess(g5, "Z"); WD.guess(g5, "X");
assert.ok(g5.demeritPoints % 0.5 === 0);

// 8: filling the last cell wins even at 3.5 demerits
var g6 = WD.newGame(p, 0);
p.distinctLetters.forEach(function (c) { WD.guess(g6, c); });
assert.strictEqual(g6.status, "won");
assert.strictEqual(WD.hiddenCells(g6).length, 0);

// 10: full reveal after the game ends
var g7 = WD.newGame(p, 0);
WD.revealAll(g7);
assert.strictEqual(WD.hiddenCells(g7).length, 0);

// Hard and Normal drop the near-miss softening: V sits next to U, which is on this board
var gy = WD.newGame(p, 0, true);
assert.strictEqual(WD.guess(gy, "V").result, "yellow");
assert.strictEqual(gy.demeritPoints, 0.5);
var gn = WD.newGame(p, 0, false);
assert.strictEqual(WD.guess(gn, "V").result, "red");
assert.strictEqual(gn.demeritPoints, 1);
assert.strictEqual(WD.newGame(p, 0).allowYellow, true);   // default stays on
// a green is still green with the softening off
assert.strictEqual(WD.guess(WD.newGame(p, 0, false), "R").result, "green");

// hard's bigger budget: five full-point misses, and four is not yet fatal
var gh = WD.newGame(p, 0, false, 5);
assert.strictEqual(gh.maxDemerits, 5);
["Z", "X", "J", "L"].forEach(function (c) { WD.guess(gh, c); });
assert.strictEqual(gh.demeritPoints, 4);
assert.strictEqual(gh.status, "playing");
WD.guess(gh, "N");
assert.strictEqual(gh.demeritPoints, 5);
assert.strictEqual(gh.status, "lost");

// difficulty knob
assert.strictEqual(WD.hiddenCells(WD.newGame(p, 2)).length, 14);

// generator: deterministic, legal, inside the quality band
for (var i = 0; i < 200; i++) {
  var q = WD.generate("seed-" + i);
  WD.validate(q);
  assert.ok(q.distinctCount >= 8 && q.distinctCount <= 14);
  assert.deepStrictEqual(WD.generate("seed-" + i).words, q.words);
}

// the generator only reaches for words people have actually heard of
var WORDS = WD.WORDS;
for (var j = 0; j < 300; j++) {
  var gen = WD.generate("common-" + j);
  Object.keys(gen.words).forEach(function (k) {
    assert.ok(WORDS.indexOf(gen.words[k]) <= WD.COMMON_CAP, "too obscure: " + gen.words[k]);
  });
}

// names never make a puzzle
["HARRY", "RALPH", "BOBBY", "DUTCH"].forEach(function (n) { assert.strictEqual(WORDS.indexOf(n), -1, "name in list: " + n); });

console.log("all acceptance checks passed");
