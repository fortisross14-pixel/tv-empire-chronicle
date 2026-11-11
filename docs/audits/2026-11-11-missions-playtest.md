# Mission playtest (Wave 13)

A bot plays every mission with a sensible policy (best show it can make, renewals,
schedule by appeal, packs, bids on what the goals need, movies when the goals need them,
tier upgrades when a goal asks for one). 6 seeds per mission. The bot is a fair stand-in
for a careful player; it does not chase bonus goals.

## Final results

| Mission | Weeks | Bot wins | Typical finish |
|---|---|---|---|
| First Hit | 20 | 6/6 | week 5 |
| Play Ball | 30 | 6/6 | week 7 |
| Movie Night | 12 | 6/6 | week 1–2 |
| In the Black | 26 | 6/6 | week 9 |
| No Filler | 30 | 6/6 | week 9–15 |
| Back for More | 40 | 6/6 | week 21–33 |
| Zero to Hero | 60 | 5/6 | week 23–57 |
| Shoestring | 40 | 6/6 | week 18–22 |
| Sports Town | 52 | 5/6 | week 36 |
| Critics' Darling | 60 | 5/6 | week 38 |
| The Comeback | 30 | 6/6 | week 11–23 |
| State Bound | 104 | 3/6 | week 74–94 |
| Bleeding Money | 40 | 6/6 | week 12–20 |
| Prime Time War | 52 | 6/6 | week 10–28 |
| Rights Rush | 30 | 6/6 | week 12–15 |
| House Rules | 78 | 5/6 | week 24–62 |
| Franchise Builder | 104 | 6/6 | week 40–101 |
| National Ambition | 104 | 6/6 | week 36–44 |
| The Stale Giant | 52 | 6/6 | week 22–31 |
| Glimmy Night | 92 | 5/6 | week 38 |
| Coast to Coast | 78 | 6/6 | week 21–27 |
| The Big Gamble | 104 | 5/6 | week 84 |
| Underdog | 78 | 6/6 | week 27–36 |
| Empire | 156 | 6/6 | week 54–120 |

## What the first run found, and the fixes

- **Shoestring** went bankrupt every time: the loan was already used, so the first bad
  week ended the game. Now $50K cash and a smaller loan ($80K at $2K/week).
- **Sports Town** could not be won: the Pelicans license ends before the Ice Hawks are
  sold, so nobody can hold all three at once. The goal is now "win the rights to all
  three" (each counts once won).
- **Zero to Hero** (the first campaign mission) was won 2/6: now #1 in prime time for
  2 weeks, 60 weeks.
- **National missions** were won 0/6. Two causes: preset stations had 5 shows for 20 slots
  (and the shows were mid-season and tired), and national #1 by average share across all
  20 slots is out of reach because rivals always run fresh shows (see balancing backlog).
  Fixes: presets can fill the whole lineup; preset shows start a full season; rank goals
  in National missions (and Zero to Hero) are judged on **prime-time share**, the way real
  networks are ranked. The Stale Giant really starts as #1 with fading shows.
- **Glimmy Night** started after the Glimmys and ended before the next ones: now starts in
  January with two ceremonies in the window.
- **Bonus goals** that needed more time than the main goal (8 games, 3 profitable months,
  10 weeks without Filler, paying off a 40-week loan) could never be reached, because a
  mission stops when its goals are met. They were replaced by goals reachable on the way.
- Easy ones tightened: Bleeding Money now really bleeds (debt payments), Franchise
  Builder asks for an IP rated 70.

## For the balancing wave

- National: show novelty falls about 8 points a week for older seasons, and 20 slots
  can't be kept fresh, while rivals always air novelty 60–100. Average-share #1 is close
  to impossible; this is the "#1 network unreachable" item from the pass-1 audit.
- National money piles up (the bot ends missions with $10–50K unspent).
