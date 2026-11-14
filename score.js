// Circle scoring. Works in the browser (window.scoreCircle) and in Node (require).
(function (root) {
  // Resample a stroke so points are evenly spaced along its length.
  // Without this, slow parts of the stroke (many points) would weigh more.
  function resample(points, n) {
    const lens = [0];
    for (let i = 1; i < points.length; i++) {
      const dx = points[i].x - points[i - 1].x;
      const dy = points[i].y - points[i - 1].y;
      lens.push(lens[i - 1] + Math.hypot(dx, dy));
    }
    const total = lens[lens.length - 1];
    if (total === 0) return [];
    const out = [];
    let j = 1;
    for (let k = 0; k < n; k++) {
      const target = (total * k) / (n - 1);
      while (j < lens.length - 1 && lens[j] < target) j++;
      const seg = lens[j] - lens[j - 1] || 1;
      const t = (target - lens[j - 1]) / seg;
      out.push({
        x: points[j - 1].x + (points[j].x - points[j - 1].x) * t,
        y: points[j - 1].y + (points[j].y - points[j - 1].y) * t,
      });
    }
    return out;
  }

  // Least-squares circle fit (Kasa method): solve x²+y² + Dx + Ey + F = 0.
  // Returns the center, or null if the points are degenerate (e.g. a line).
  function fitCircle(pts) {
    // Work relative to the mean for numerical stability.
    let mx = 0, my = 0;
    for (const p of pts) { mx += p.x; my += p.y; }
    mx /= pts.length; my /= pts.length;
    let suu = 0, svv = 0, suv = 0, suuu = 0, svvv = 0, suvv = 0, svuu = 0;
    for (const p of pts) {
      const u = p.x - mx, v = p.y - my;
      suu += u * u; svv += v * v; suv += u * v;
      suuu += u * u * u; svvv += v * v * v;
      suvv += u * v * v; svuu += v * u * u;
    }
    const det = suu * svv - suv * suv;
    if (Math.abs(det) < 1e-9) return null;
    const a = (suuu + suvv) / 2, b = (svvv + svuu) / 2;
    const uc = (a * svv - b * suv) / det;
    const vc = (b * suu - a * suv) / det;
    return { x: uc + mx, y: vc + my };
  }

  // Returns { score (0-100), reason, center, radius }.
  // reason is null for a valid circle, or a short string explaining a 0 score.
  function scoreCircle(rawPoints, opts) {
    const minRadius = (opts && opts.minRadius) || 40;
    if (rawPoints.length < 10) return { score: 0, reason: "tooShort" };

    const pts = resample(rawPoints, 200);
    if (!pts.length) return { score: 0, reason: "tooShort" };

    const fit = fitCircle(pts);
    if (!fit) return { score: 0, reason: "tooShort" };
    const cx = fit.x, cy = fit.y;
    const dists = pts.map((p) => Math.hypot(p.x - cx, p.y - cy));
    const R = dists.reduce((a, b) => a + b, 0) / dists.length;
    const base = { center: { x: cx, y: cy }, radius: R };

    if (R < minRadius) return { ...base, score: 0, reason: "tooSmall" };

    // How far around the center did the stroke travel?
    let sweep = 0;
    for (let i = 1; i < pts.length; i++) {
      const a0 = Math.atan2(pts[i - 1].y - cy, pts[i - 1].x - cx);
      const a1 = Math.atan2(pts[i].y - cy, pts[i].x - cx);
      let d = a1 - a0;
      if (d > Math.PI) d -= 2 * Math.PI;
      if (d < -Math.PI) d += 2 * Math.PI;
      sweep += d;
    }
    if (Math.abs(sweep) < 2 * Math.PI * 0.85) return { ...base, score: 0, reason: "notClosed" };

    // Roundness: mean relative deviation from the radius.
    const dev = dists.reduce((a, d) => a + Math.abs(d - R), 0) / dists.length / R;

    // Gap between start and end, relative to radius.
    const first = pts[0], last = pts[pts.length - 1];
    const gap = Math.hypot(first.x - last.x, first.y - last.y) / R;

    // A 1% average wobble costs about 6 points; a gap of a full radius costs ~15.
    let score = 100 - dev * 600 - Math.max(0, gap - 0.1) * 15;
    // Going around more than once hides wobble, so penalise the overlap a bit.
    const extraTurns = Math.max(0, Math.abs(sweep) / (2 * Math.PI) - 1.1);
    score -= extraTurns * 20;

    score = Math.max(0, Math.min(100, score));
    return { ...base, score, reason: null, deviation: dev, gap };
  }

  const api = { scoreCircle, resample, fitCircle };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else Object.assign(root, api);
})(this);
