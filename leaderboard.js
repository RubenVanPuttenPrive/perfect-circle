// Leaderboard: each player's best score, stored in the browser.
// Works in the browser (window.Leaderboard) and in Node (require).
(function (root) {
  const TITLES = [
    "Supreme Circle Overlord",
    "Grand Compass",
    "Lord of the Rings",
    "Pi Whisperer",
    "Donut Duke",
    "Wheel Wizard",
    "Hula Hoop Hero",
    "Pizza Perfectionist",
    "Bagel Baron",
    "Round Rookie",
  ];
  const MAX_PLAYERS = 100;

  const key = (name) => name.trim().toLowerCase();

  // players: [{ name, score, date }]. Returns a new sorted list, best first.
  function sorted(players) {
    return [...players].sort((a, b) => b.score - a.score || a.date - b.date);
  }

  // Records a score. Returns { players, improved, rank, title }:
  // improved = this beat the player's previous best,
  // rank = 1-based position after recording (null if outside the top 10).
  function record(players, name, score, date = Date.now()) {
    const k = key(name);
    const existing = players.find((p) => key(p.name) === k);
    let list = players;
    let improved = false;
    if (!existing || score > existing.score) {
      improved = true;
      list = players.filter((p) => key(p.name) !== k).concat({ name: name.trim(), score, date });
    }
    list = sorted(list).slice(0, MAX_PLAYERS);
    const idx = list.findIndex((p) => key(p.name) === k);
    const rank = idx >= 0 && idx < TITLES.length ? idx + 1 : null;
    return { players: list, improved, rank, title: rank ? TITLES[rank - 1] : null };
  }

  function bestOf(players, name) {
    const p = players.find((p) => key(p.name) === key(name));
    return p ? p.score : 0;
  }

  const top10 = (players) => sorted(players).slice(0, TITLES.length)
    .map((p, i) => ({ ...p, rank: i + 1, title: TITLES[i] }));

  // Storage helpers: never throw (private mode, blocked storage...).
  const STORE = "perfect-circle-leaderboard";
  function load(storage) {
    try {
      const data = JSON.parse(storage.getItem(STORE));
      return Array.isArray(data) ? data.filter((p) => p && typeof p.name === "string" && typeof p.score === "number") : [];
    } catch { return []; }
  }
  function save(storage, players) {
    try { storage.setItem(STORE, JSON.stringify(players)); } catch {}
  }

  const api = { TITLES, record, bestOf, top10, load, save };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Leaderboard = api;
})(this);
