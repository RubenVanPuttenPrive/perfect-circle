const test = require("node:test");
const assert = require("node:assert");
const LB = require("./leaderboard.js");

test("first score ranks #1 with the top title", () => {
  const r = LB.record([], "Ann", 80, 1);
  assert.strictEqual(r.rank, 1);
  assert.strictEqual(r.title, LB.TITLES[0]);
  assert.ok(r.improved);
});

test("keeps only each player's best, names case-insensitive", () => {
  let p = LB.record([], "Ann", 80, 1).players;
  const worse = LB.record(p, "ann", 70, 2);
  assert.strictEqual(worse.improved, false);
  assert.strictEqual(worse.players.length, 1);
  assert.strictEqual(LB.bestOf(worse.players, "ANN"), 80);
  const better = LB.record(p, "ANN ", 90, 3);
  assert.strictEqual(better.players.length, 1);
  assert.strictEqual(LB.bestOf(better.players, "Ann"), 90);
});

test("top10 is sorted and titled; 11th place has no rank", () => {
  let p = [];
  for (let i = 0; i < 11; i++) p = LB.record(p, `P${i}`, 50 + i, i).players;
  const top = LB.top10(p);
  assert.strictEqual(top.length, 10);
  assert.strictEqual(top[0].name, "P10");
  assert.strictEqual(top[9].title, LB.TITLES[9]);
  assert.strictEqual(LB.record(p, "Low", 1, 99).rank, null);
});

test("ties: earlier score ranks higher", () => {
  let p = LB.record([], "A", 90, 1).players;
  const r = LB.record(p, "B", 90, 2);
  assert.strictEqual(r.rank, 2);
});

test("load survives broken storage", () => {
  assert.deepStrictEqual(LB.load({ getItem: () => "not json" }), []);
  assert.deepStrictEqual(LB.load({ getItem: () => { throw new Error("blocked"); } }), []);
});
