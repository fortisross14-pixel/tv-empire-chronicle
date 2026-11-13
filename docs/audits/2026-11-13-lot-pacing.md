# Studio lot pacing (2026-11-13)

Buildings that hold one production each slowed the bot's climb. Economy playtest
(Sandbox normal, 6 seeds, 6 years), median week reached:

| Version | State | National | #1 crown | Bankrupt |
|---|---|---|---|---|
| Before open sports market (96f8833) | 68 | 156 | 2/6 | 0 |
| Open sports market (f45824d) | 90 | 156 | 2/6 | 0 |
| Lot, capacity 1, first try | ~119 | 1/6 runs | — | 0 |
| **Lot, after tuning** | **84** | **150** | **4/6** | **0** |

Changes:
- Bot: no longer bids on sports it doesn't need while saving for a license; expands rooms
  early (two of each stage) when it has spare cash, like a planning player.
- Each license expands every room for free (level 2 at State, 3 at National), matching
  the mission presets. Shown on the license welcome sheets.
- First expansions are cheaper: Writers' Room $20K, Sound Stage $40K, Post $25K.
- State license reputation 35 → 30.

Missions (6 seeds): Beginner 5–6/6 each with 2 stars; every Local, State and National
mission 4/6 or better (State Bound 5/6, National Ambition 4/6, Coast to Coast 4/6).

## After step-by-step production (same day, save v16)

New skills, parts and a crew card per slider at every level. Bot still plans shows in one go.

- Economy (6 seeds): State median week 63, National 6/6 (median week 140), #1 crown 5/6, no bankruptcies.
- Missions (6 seeds): Beginner all 6/6. Most others 5–6/6. To revisit in the balance pass:
  Glimmy Night 3/6 (lost the award), National Ambition 4/6, Bleeding Money 5/6 (one bankruptcy).
- Not measured: a player who waits between steps (the bot never does), and marketing spend.
