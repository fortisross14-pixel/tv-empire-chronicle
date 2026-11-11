# TV Empire Chronicle

A Kairosoft-style TV station management game told through cards. Start as a tiny
local station in the parody city of Port Ellison, collect people, formats and topics
in card packs, make shows, schedule them against rival stations, and grow from Local
to State to National.

Play it: https://fortisross14-pixel.github.io/tv-empire-chronicle/

The full design is in [`docs/DESIGN.md`](docs/DESIGN.md).

## How to play

- **Main menu:** load one of 3 saved stations, start a **mission** (the roadmap:
  6 Beginner missions, then an 18-mission Campaign) or start a **Sandbox** (your own
  difficulty and goals; opens after one campaign win per tier).
- **Home:** your mission goals, what's on air, and an "Up next" list.
- **Studio:** make a show: format + topic (optionally based on an IP), writer, crew and
  on-screen talent, then split the focus points.
- **Guide:** the schedule. Put shows and movies in slots; sports take their own slots.
- **Cards / Market:** your collection (people, network cards, formats, topics, IP),
  card packs, movie packs and the Rights Market (sports and IP licenses).
- Press **▶ Air week** to move time forward.

## Development

```bash
npm install
npm run dev        # local dev server
npm test           # unit, invariant and save tests (Vitest)
npm run typecheck  # TypeScript (strict)
npm run ci         # typecheck + tests + production build (GitHub Actions runs this)
npm run playtest   # long mission playtest bot; run after balance changes (not in CI)
```

`npm run playtest` plays every mission on 6 seeds and prints win rate, stars and finish
weeks. Narrow it with `MISSIONS=l,n1 SEEDS=1,2 npm run playtest`. The last report is in
`docs/audits/2026-11-11-missions-playtest.md`.

### Code layout

- `src/engine/` — the game rules as pure TypeScript, no UI. Every action takes a state
  and returns a new one (`produce` clones it), errors players should see are
  `GameError`s, and randomness comes from a seeded RNG stored in the state.
  - `data/` — formats, topics, rights, IP, missions, parody names
  - `game.ts` — player actions; `sim.ts` — the weekly simulation, step by step
  - `production.ts` (studio), `rights.ts` (market), `ip.ts`, `mission.ts`,
    `rivals.ts`, `events.ts`, `awards.ts`, `packs.ts`
  - `save.ts` — 3 save slots, a backup per slot, versioned migrations, the mission profile
  - `*.test.ts` — unit tests; `invariants.test.ts` runs random players and checks the
    state stays valid every week; `playtest/` holds the mission bot
- `src/ui/` — React screens and components. `todos.ts` builds the Home to-do list;
  `posters/` is the poster editor and renderer.
- `art/posters/` + `scripts/slice_posters.py` — poster sprite sheets cut into
  `public/posters/` (see `docs/POSTER_ASSETS.md`).

### Rules of thumb

- Bump `SAVE_VERSION` and add a migration in `save.ts` for any change to saved state.
- Keep the engine free of React and browser APIs (save.ts is the one place that touches
  `localStorage`).
- New player-facing errors: throw `GameError` with a plain sentence.

Deploys to GitHub Pages from `main` (see `GITHUB_PAGES_DEPLOYMENT.md`).
