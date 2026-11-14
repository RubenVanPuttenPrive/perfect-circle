// Run with: node --test
const test = require("node:test");
const assert = require("node:assert");
const { scoreCircle } = require("./score.js");

function circle(r, n = 120, turns = 1, noise = 0, rx = r) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const a = (2 * Math.PI * turns * i) / n;
    const wobble = 1 + noise * Math.sin(a * 7);
    pts.push({ x: 300 + rx * wobble * Math.cos(a), y: 300 + r * wobble * Math.sin(a) });
  }
  return pts;
}

test("perfect circle scores ~100", () => {
  assert.ok(scoreCircle(circle(150)).score > 99);
});

test("slightly wobbly circle scores lower but still high", () => {
  const s = scoreCircle(circle(150, 200, 1, 0.03)).score;
  assert.ok(s > 80 && s < 99, `got ${s}`);
});

test("ellipse scores clearly lower", () => {
  const s = scoreCircle(circle(150, 200, 1, 0, 220)).score;
  assert.ok(s < 75, `got ${s}`);
});

test("half circle is rejected", () => {
  const r = scoreCircle(circle(150, 100, 0.5));
  assert.strictEqual(r.score, 0);
  assert.strictEqual(r.reason, "notClosed");
});

test("tiny circle is rejected", () => {
  assert.strictEqual(scoreCircle(circle(10)).reason, "tooSmall");
});

test("straight line is rejected", () => {
  const line = Array.from({ length: 50 }, (_, i) => ({ x: i * 10, y: 100 }));
  assert.strictEqual(scoreCircle(line).score, 0);
});
