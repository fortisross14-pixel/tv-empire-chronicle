# TV Empire Chronicle

A Kairosoft-style TV station management game told through cards. You start
as a tiny local station in the parody city of Port Ellison with one writer,
one crew member and one host. Open packs to collect format and topic cards,
make shows, schedule them, beat the rival station in the ratings, and grow.

The full design is in [`docs/DESIGN.md`](docs/DESIGN.md).

## How to play

1. **Week** tab: open your free program pack.
2. **Studio**: start a show. Pick a format + topic, choose your writer, crew
   and on-screen person, split 10 focus points across Direction, Sound, Image,
   FX, Music and Visual art.
3. Press **▶ Air week** to move time forward. Shows go Script → Production → Post.
4. **Schedule**: put the finished show into a slot. Weekday slots air 5×/week.
5. Watch the ratings reveal, earn ad money, buy more packs in the **Shop**.

Each person card has a number of uses (1 per 13-week season). Duplicate topic
cards become Twist tokens that refresh a tired show when you renew it.

## Development

```bash
npm install
npm run dev        # local dev server
npm test           # engine unit tests (Vitest)
npm run typecheck  # TypeScript
npm run ci         # typecheck + tests + production build (used by GitHub Actions)
```

### Code layout

- `src/engine/` — the game rules as pure TypeScript, no UI. Seeded RNG, so a
  game replays exactly. Every action takes a state and returns a new one.
  - `data/` — formats, topics, parody names
  - `production.ts` — scores, focus points, the studio pipeline
  - `game.ts` — actions and the weekly simulation (`airWeek`)
- `src/ui/` — React screens and card components.

Deploys to GitHub Pages from `main` (see `GITHUB_PAGES_DEPLOYMENT.md`).
