# The Perfect Circle

Draw a circle with your mouse or finger. The game scores how round it is, as a percentage.

**Play it:** https://rubenvanputtenprive.github.io/perfect-circle/

- `index.html`: the game page
- `score.js`: the scoring logic, shared by the page and the tests
- `leaderboard.js`: player names, high scores and top-10 titles
- `score.test.js`, `leaderboard.test.js`: tests (`node --test`)

## How scoring works

1. The stroke is resampled into 200 evenly spaced points, so drawing speed doesn't matter.
2. A least-squares fit finds the circle's best centre and radius.
3. The score starts at 100 and loses points for:
   - the average distance from that radius (1% wobble costs about 6 points)
   - a gap between the start and end of the stroke
   - going round more than once
4. A stroke that is too small or doesn't go all the way round scores 0, with a hint.

## Leaderboard

When the page opens it asks for your name (click your name to change it). Each player's best
score is kept, and the 🏆 button shows the top 10, each rank with its own title, from
#1 *Supreme Circle Overlord* to #10 *Round Rookie*.

Scores are stored in the browser (`localStorage`), so the leaderboard covers everyone who
has played **on that device**. It isn't shared online.

## Run locally

It's a static site with no build step. Open `index.html` in a browser, or serve it:

```sh
python3 -m http.server 8080
```

## Hosting

Any static host works. Upload these files as they are:

- **GitHub Pages**: push to GitHub, then go to Settings → Pages → Deploy from branch `main`, folder `/`.
- **Netlify / Cloudflare Pages**: connect the repo. Leave the build command empty and set the output directory to `/`.
