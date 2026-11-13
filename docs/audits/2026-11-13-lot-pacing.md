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
