// Sound effects, synthesised with the Web Audio API (no audio files).
// The AudioContext is created on the first user gesture, as browsers require.
(function (root) {
  const KEY = "perfect-circle-muted";
  let store = null;
  try { store = root.localStorage; } catch {}

  let muted = false;
  try { muted = store && store.getItem(KEY) === "1"; } catch {}

  let ctx = null;
  let master = null;
  let drawOsc = null;
  let drawGain = null;

  function ensure() {
    if (ctx) {
      if (ctx.state === "suspended") ctx.resume();
      return ctx;
    }
    const AC = root.AudioContext || root.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.5;
    master.connect(ctx.destination);
    return ctx;
  }

  // One short note with a soft attack and exponential decay.
  function note(freq, at, dur, { type = "sine", vol = 0.3 } = {}) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(vol, at + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    o.connect(g).connect(master);
    o.start(at);
    o.stop(at + dur + 0.05);
  }

  const Sound = {
    get muted() { return muted; },

    toggleMute() {
      muted = !muted;
      try { store && store.setItem(KEY, muted ? "1" : "0"); } catch {}
      if (master) master.gain.setTargetAtTime(muted ? 0 : 0.5, ctx.currentTime, 0.02);
      if (!muted) { ensure(); this.click(); }
      return muted;
    },

    click() {
      if (!ensure() || muted) return;
      note(880, ctx.currentTime, 0.08, { type: "triangle", vol: 0.15 });
    },

    // A soft hum that plays while drawing.
    drawStart() {
      if (!ensure()) return;
      this.drawStop();
      drawOsc = ctx.createOscillator();
      drawGain = ctx.createGain();
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 1200;
      drawOsc.type = "triangle";
      drawOsc.frequency.value = 220;
      drawGain.gain.value = 0;
      drawOsc.connect(lp).connect(drawGain).connect(master);
      drawOsc.start();
    },

    // speed: pixels per event; score: live roundness 0-100 (or null).
    drawUpdate(speed, score) {
      if (!drawOsc) return;
      const t = ctx.currentTime;
      const vol = Math.min(0.12, speed * 0.006);
      drawGain.gain.setTargetAtTime(vol, t, 0.05);
      // Rounder circle, higher pitch: 196 Hz (G3) up to 392 Hz (G4).
      const s = score == null ? 50 : Math.max(0, Math.min(100, score));
      drawOsc.frequency.setTargetAtTime(196 * Math.pow(2, s / 100), t, 0.08);
    },

    drawStop() {
      if (!drawOsc) return;
      const t = ctx.currentTime;
      drawGain.gain.setTargetAtTime(0, t, 0.03);
      drawOsc.stop(t + 0.2);
      drawOsc = null;
      drawGain = null;
    },

    // Score reveal: the better the circle, the brighter the chord.
    score(s) {
      if (!ensure()) return;
      const t = ctx.currentTime + 0.02;
      let chord;
      if (s >= 95) chord = [523.25, 659.25, 783.99, 1046.5]; // C major, up to high C
      else if (s >= 80) chord = [523.25, 659.25, 783.99];     // C major
      else if (s >= 60) chord = [440, 523.25, 659.25];         // A minor
      else chord = [392, 369.99];                              // a droop down
      chord.forEach((f, i) => note(f, t + i * 0.09, 0.6, { type: "sine", vol: 0.22 }));
    },

    // Stroke rejected (too small, not closed).
    fail() {
      if (!ensure()) return;
      const t = ctx.currentTime;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "square";
      o.frequency.setValueAtTime(220, t);
      o.frequency.exponentialRampToValueAtTime(110, t + 0.25);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.08, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
      o.connect(g).connect(master);
      o.start(t);
      o.stop(t + 0.35);
    },

    // New personal best or leaderboard rank.
    fanfare() {
      if (!ensure()) return;
      const t = ctx.currentTime + 0.55; // after the score chord
      [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5].forEach((f, i) =>
        note(f, t + i * 0.1, i === 5 ? 0.7 : 0.18, { type: "triangle", vol: 0.2 }));
    },
  };

  root.Sound = Sound;
})(typeof window !== "undefined" ? window : globalThis);
