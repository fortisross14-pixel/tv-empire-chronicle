---
name: game-audit
description: Audit checklist for this TV management card game's engine, economy, performance and functionality. Use before a release, after a big wave of features, or when asked to review game logic, balance or bugs.
---

# Game audit (engine, economy, performance, functionality)

A checklist for a turn-based, card-driven management game written as a pure
TypeScript engine (`src/engine`) with a React UI (`src/ui`). Adapted from the
code-review and balance-check skills in Claude Code Game Studios
(github.com/Donchitos/Claude-Code-Game-Studios) and trimmed for a web game with
no game engine.

Report findings with a severity: **BLOCKER** (crash, softlock, lost save,
wrong money), **MAJOR** (rule behaves differently from the design or the UI
says), **MINOR** (edge case, polish), **NOTE** (idea, not a defect). Every
finding names the file and line, the situation that triggers it, and what
the player sees.

## 1. Engine architecture
- [ ] Engine has no React/DOM imports; UI never mutates state (actions return a new state).
- [ ] All randomness comes from the seeded RNG in state, never `Math.random()` inside the engine.
- [ ] No circular imports between engine modules.
- [ ] Every action validates its input and throws a `GameError` with a player-readable message.
- [ ] Constants a designer would tune (prices, thresholds, rates) are named and live in one place.
- [ ] Functions stay small enough to read; the weekly simulation is split into named steps.

## 2. Game rules and state integrity
- [ ] Ids referenced by state (schedule, projects, sponsor deals, rights teams) never point at deleted things after cancel / release / poach / expiry / tier change.
- [ ] A card can't be used twice in one role or two places at once where the rules forbid it.
- [ ] Uses, cash and reputation never go below their floor unexpectedly; money math rounds consistently.
- [ ] Calendar edges: week 52 → 1, season wrap (e.g. Nov–Mar), events and markets that span New Year.
- [ ] Tier changes (Local → State → National) keep every reference valid and every screen working.
- [ ] Nothing can softlock: a pending event, modal or empty collection always has a way forward.
- [ ] Save/load: a versioned save, and a migration or a clear reset message when the version changes.

## 3. Economy and progression (balance)
- [ ] Map faucets (ads, sponsors, prizes, sports) and sinks (production, packs, licenses, overhead, bids).
- [ ] Simulate typical play: time to first profit, first pack, State license, National license.
- [ ] Look for dead zones (long stretches with nothing to buy or do) and cliffs (a tier jump that bankrupts you).
- [ ] Look for degenerate strategies (one format/slot/card that beats everything; an infinite money loop).
- [ ] Rarity odds: expected packs to see each rarity; duplicates still useful.
- [ ] Rivals: can be beaten, but not trivially; they don't snowball out of reach.

## 4. Performance (web)
- [ ] Per-action cost: avoid deep-cloning large state on every click if it grows (history, news caps).
- [ ] Arrays that grow every week are capped (history, news, shares).
- [ ] Expensive derived values are memoised; lists don't re-render the whole app on every keystroke.
- [ ] Bundle size reasonable; no unused heavy dependencies.
- [ ] localStorage writes are bounded in size and wrapped in try/catch.

## 5. Functionality (player-facing)
- [ ] Every button does what its label says, and disabled buttons say why.
- [ ] Numbers on screen match the engine (costs, weeks, shares, ad revenue).
- [ ] Empty states guide the player to the next action.
- [ ] Errors are shown as toasts with a fix, never as a blank screen.
- [ ] Play from a new game to the end at least once (automated sim + a browser run).

## Output
Write the report to `docs/audits/<date>-<area>.md`: a summary verdict, a
findings table ranked by severity, and what was fixed. Fix BLOCKER and MAJOR
issues in the same pass; list MINOR/NOTE for later waves.
