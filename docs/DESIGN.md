# TV Empire Chronicle — Design v2 (card-based rebuild)

Kairosoft-style TV studio management in a parody world. Menu-based, everything
is a **card**. Start tiny, unlock slowly: Local → State → National.

Status: agreed. Waves 0–1 are built (see §13).

---

## 1. Pillars

1. **One clear weekly loop.** Plan → Make → Air → React.
2. **Cards, not menus.** People, Programs, Network items and Rights are all cards.
3. **Start with almost nothing.** Every system unlocks when it first becomes useful.
4. **The calendar matters.** Fall premieres, sweeps, summer slump, sports seasons.
5. **Parody world.** Fictional city, rivals, formats and IP ("Galaxy Wars",
   "National Gridiron League", "Castaways", "Rise & Shine Port Ellison").

## 2. The weekly loop (1 turn = 1 week, 52 weeks/year)

1. **Plan** — drag show cards into next week's slots.
2. **Make** — studio projects advance through Script → Production → Post.
3. **Air** — press *Air Week*; slot-by-slot ratings reveal vs rivals, money in/out.
4. **React** — 0–2 event cards (rival copies your format, sponsor offer, star demand…).

## 3. Card families

### 3.1 People cards
Three kinds:

| Kind | Skills (0–100) | Used in |
|---|---|---|
| **Crew** (behind the screen) | Direction, Production, Sound, Image, Edit/FX | Production & Post roles |
| **Writer** | Drama, Comedy, Factual, Entertainment (+ speed) | Script stage |
| **On-screen** (host / actor / presenter) | Hosting, Acting, Charisma, Fame | Cast slot |

- A crew card can fill **any** crew role, but scores with that role's skill
  (80 Direction / 15 Sound → great director, poor sound engineer).
- **Uses:** each card has a number of uses (e.g. writer = 5 scripts). A use is
  consumed when the card starts a project. At 0 uses the card retires.
- **Renewal:** a *Business Card* (network card) adds +5 uses to a person you like.
- **Rarity:** Common / Rare / Epic / Legend. Higher rarity = higher skills,
  sometimes fewer uses (stars are strong but short-lived unless renewed).
- **Growth:** cards gain XP per use and level up (small skill gains). Your
  veteran writer becomes your star.
- **Busy state:** a card is locked while working on a stage. On-screen cards stay
  locked to the show while it airs.
- **A use = one season.** Every show runs in 13-week seasons (one quarter of
  the 52-week year). Each person on the team spends 1 use per season. After a
  season you renew it (new uses) or rest it so its novelty recovers.
- **People packs are random:** 3 cards drawn from crew, writers and on-screen
  (roughly 45% / 25% / 30%), with random rarity.

### 3.2 Program cards (the album)
Permanent, collectible, never expire. Two types that combine:

- **Format cards:** News, Talk Show, Contest, Reality, Series, TV Movie,
  Documentary, Magazine (more unlock per tier).
- **Topic cards:** each one lists the formats it works with and how well (★–★★★).
  - *Specific:* Local News, International News, Sports News, Political News → News only.
  - *Semi-specific:* Martial Arts → Reality ★★★, Contest ★★, Series ★★
    ("The Ultimate Brawler", "Kobra Dojo").
  - *Fiction-leaning:* Medieval → Series ★★★, TV Movie ★★★, Documentary ★.
- **Program pack** = 1 Format + 2 Topics. Packs are expensive; contents are permanent.
- A show = **1 Format + 1 Topic**. The fit stars give a script bonus or penalty.
- **Duplicates** are not wasted: a duplicate Topic becomes a **Twist token**
  for that topic. Spend it when renewing a show for a season with a new twist,
  which restores much more novelty than a plain renewal (see §5). A duplicate
  Format refunds a little cash.
- The **Album** view shows every card, owned or still a silhouette — a collection goal.

### 3.3 Network cards
Consumables and permanent studio items (these replace research):

- **Business Card** — renew a person (+5 uses).
- **Promo cards** — Social Media Blitz, Radio Spot, Billboard, Newspaper Ad,
  On-air Promo. They add hype to a show before its premiere.
- **Facility cards** (permanent) — "HD Camera Kit" (+Image floor), "Sound Booth",
  "Second Studio" (+1 project in parallel), "Newsroom" (News bonus).
- **Sponsor deals** — "Sparkle Cola sponsors your morning show: +$X per week
  for 8 weeks if rating ≥ Y".

### 3.4 Rights cards (licensed content and IP)
Content you buy instead of produce. It **expires**, unlike program cards.

- **Film / series packages** — e.g. "Galaxy Wars Trilogy: 6 airings in 2 years".
  Ready to air with fixed quality; each rerun loses novelty.
- **Live sports / event rights** — e.g. "Port Ellison Pelicans (minor league
  baseball) 2027 season". Tied to the calendar: the games take over a slot on
  game weeks, and each broadcast needs a crew card plus an on-screen commentator.
- **How you get them:** the **Rights Market** fills up at set calendar moments
  (sports rights in summer before the season, film packages each quarter).
  Each lot gets one sealed bid; rivals bid too. Big IP (Galaxy Wars,
  Gridiron League) is shown **locked** until State/National — something to aim for.
- **Later:** your own hits become **Franchise cards** (spin-offs, syndication sales).

## 4. Making a show (studio pipeline)

Pick Format + Topic, build the team, split the **focus points**, then
Script → Production → Post. A finished show becomes a **Show card**
(4 score bars, novelty meter, episodes left, last rating).

### Production tiers

| Tier | Unlocks at | Team | Focus points | Topics |
|---|---|---|---|---|
| **Basic** | Local | 1 writer, 1 crew lead (covers every area), 1 on-screen | 10 | 1 |
| **Advanced** | State | up to 2 writers + specialist roles | 15 | 2 |
| **AAA** | National | up to 3 writers, up to 6 crew roles (director, producer, sound, FX, composer, art) + cast | 20 | 2 |

### Focus points
Each show splits its points across six areas: **Direction, Sound, Image, FX,
Music, Visual art** (max 5 per area on Basic). Every format has a hidden ideal
split (a quiz needs sound and visual art, little FX; a fantasy series needs a
balance). Before you've made a format you only see its two key areas; after
the first production the exact ideal is revealed. Close to the ideal gives a
quality bonus, far off a penalty.

How well each area is done = the skill of whoever covers it × how many points
it got compared with the ideal. On Basic, the one crew card covers every area
with its own skill profile (an 80 Direction / 15 Sound crew is a great
director and a weak sound engineer). Advanced and AAA let you put a specialist
on each area.

| Stage | Who works | Feeds |
|---|---|---|
| Script | Writer | **Script** |
| Production | Crew + cast | **Art**, **Technical**, **Screen Power** |
| Post | Crew | **Technical** |

- Producer skill shortens production and lowers cost.
- People work one stage per week. Someone booked on two shows makes the second wait.

### The four scores
- **Script** — writer skill in the format's genre × topic fit
- **Technical** — Sound + Image + FX
- **Art** — Direction + Music + Visual art
- **Screen Power** — the cast's Hosting/Acting + Charisma + Fame

Each format weighs them differently (e.g. News: Technical/Screen Power heavy;
Series: Script/Art heavy; Contest: Screen Power/Technical). Quality is the
weighted sum.

## 5. Show life cycle

- **Novelty** starts at 100 and drops each week on air. It drops faster with
  **saturation**: other shows (yours or rivals') with the same Format+Topic.
  Five Political News shows means the newest is near 0 within weeks.
- **Renew** — a new season (shorter script and production, uses again).
  Restores +25 novelty, and the ceiling drops each season.
- **Renew with a Twist token** — restores +55 novelty and resets the ceiling.
- **Rest** — off the schedule, a show recovers novelty slowly.
- **Rerun** — after the season, a show can keep airing as reruns: cheap, weaker, ages faster.
- **Cancel** — removes the show for good.

## 6. Schedule

The grid is built from **day blocks × dayparts**. Each slot holds one show.
One airing a week uses one episode (recurring shows never run out). Empty slots
run **Filler** (infomercials and old reruns): tiny audience, tiny revenue.

| Tier | Day blocks | Dayparts | Slots |
|---|---|---|---|
| Local | Weekday, Weekend | Morning, Evening, Prime | 6 |
| State | Mon–Wed, Thu–Fri, Weekend | + Afternoon, Late Night | 15 |
| National | Mon–Tue, Wed–Thu, Fri, Weekend | all 5 | 20 |

Rating per slot = market size × daypart audience × season multiplier ×
quality × novelty × format/daypart fit × hype × lead-in − rival pressure.

## 7. Calendar

The game starts in **July, Year 1**, so you have one summer to prepare for fall.

| Period | Weeks | Effect |
|---|---|---|
| Summer slump | 23–35 | Low viewing; reality/contest shine; good time to build |
| **Fall premiere season** | 36–48 | Viewing up, premiere novelty bonus, rivals launch shows |
| Holidays | 49–52 | Movies and family content boosted |
| Winter | 1–13 | High viewing, midseason launches |
| Spring | 14–22 | Normal |
| **Sweeps** | Feb, May, Nov | Ratings here set ad prices for the next quarter |

Plus: sports seasons, election falls (Political News boost), the yearly
**"Glimmy Awards"** in September, and a parody "Olympics" every 4 years.

## 8. Economy

- **In:** ad revenue (rating × slot ad price, adjusted by sweeps), sponsor deals,
  later syndication.
- **Out:** packs, production cost per episode, promo cards, rights bids,
  renewals, licenses for tier upgrades.
- No salaries: people are paid through packs and renewals.
- Shop: Program pack, People pack, Network pack. A few free packs come from
  milestones (first slot win, first sweeps, awards).
- **Bankruptcy:** the first time cash goes negative the bank lends $100K
  (repaid at $2.5K/week). The second time, the game is over.

## 9. Start and unlock order

Start: 3 People cards (1 Crew, 1 Writer, 1 On-screen), 1 free Program pack,
small cash, 6 slots of Filler, 1 rival station.

Unlocks:
1. Studio + Schedule (from week 1)
2. Shop (after the first show airs)
3. Promo cards and hype (before your second premiere)
4. Rights Market (first summer window)
5. Second rival, sponsor deals (first fall)
6. State license (reputation + cash goal)

## 10. Progression

- **Local** (Port Ellison): 6 slots, 1–2 rivals, basic formats.
- **State**: license fee + reputation. More slots, a bigger audience, stronger
  rivals, more formats, film packages and college sports.
- **National**: affiliate stations, the big IP (Galaxy Wars, Gridiron League),
  prime-time wars, the Glimmys at full scale.

## 11. Screens (mobile-first, bottom tab bar)

1. **Week** — calendar strip, cash, alerts, big *Air Week* button, results reveal
2. **Schedule** — slot grid of show cards
3. **Studio** — projects in progress, and the button to start a new show
4. **Cards** — album and collection (People / Programs / Network / Rights)
5. **Shop** — packs and Rights Market (unlocks later)

## 12. Tech

- Vite + React + **TypeScript**. Keep the GitHub Pages deploy.
- The simulation is a pure TS engine (`src/engine`) with a seeded RNG and no UI
  code, unit-tested with Vitest.
- UI (`src/ui`) only renders state and sends actions.
- Data files hold formats, topics, fit tables, name generators and parody content.
- Versioned localStorage save.

## 13. Build waves

0. **Foundation** — remove the old code, TS + engine/UI split, card components,
   save/load, week tick, calendar.
1. **Core loop (Local)** ✅ — starter people, free pack opening, studio pipeline,
   focus points, show cards, 6-slot schedule with filler, 1 rival, *Air Week*
   reveal, money, calendar periods and sweeps, bank loan.
   Also pulled forward from waves 2–3: shop (program/people packs, Business
   Cards), duplicates → Twist tokens, album, uses, XP/levels, rarities,
   novelty + saturation, seasons/renewals/reruns, lead-in, daypart fit.
   *Test: is making a show and seeing it rate fun within 20 minutes?*
2. **Card economy, deeper** — network packs, facility cards, pack odds tuning,
   more people variety.
3. **Show life, deeper** — hype, better rival AI reactions, show history charts.
4. **Calendar & marketing** — sweeps and ad pricing, premiere season, promo
   cards, hype, events, sponsors.
5. **Rights** — Rights Market, film packages, local sports on the calendar.
6. **State tier** — license, more slots, second rival, new formats.
7. **National + payoff** — national tier, Glimmy Awards, franchises, balance pass.
