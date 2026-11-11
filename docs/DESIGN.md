# TV Empire Chronicle — Design v2 (card-based rebuild)

Kairosoft-style TV studio management in a parody world. Menu-based, everything
is a **card**. Start tiny, unlock slowly: Local → State → National.

Status: design agreed in principle. Items marked **[OPEN]** still need a decision.

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
- **[OPEN]** What a "use" means for recurring shows (proposal: one use per
  13-week cycle on air).

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
- **Duplicates** are not wasted (proposal): a duplicate Topic becomes a
  **Twist token** for that topic, used to revamp a tired show (see §5).
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

Pick Format + Topic, then **Season** (N episodes: 1 / 6 / 10 / 13) or
**Recurring** (no end, e.g. daily news or a weekly quiz).

| Stage | Role slots | Feeds score |
|---|---|---|
| Script | Writer | **Script** |
| Production | Director, Producer, Sound, Image, Cast | **Art**, **Technical**, **Screen Power** |
| Post | Editor/FX | **Technical** |

- At Local only **Director** and **Cast** are required. An empty optional role
  is covered by the director at a penalty, so a 3-person studio can still make a show.
- Producer skill reduces production time and cost.
- Each stage takes some weeks and shows its progress; the finished show becomes
  a **Show card** (4 score bars, novelty meter, episodes left, last rating).

### The four scores
- **Script** — writer skill in the format's genre × topic fit
- **Technical** — Sound + Image + Edit/FX (+ facility floors)
- **Art** — Direction (+ production design later)
- **Screen Power** — the cast's Hosting/Acting + Charisma + Fame

Each format weighs them differently (e.g. News: Technical/Screen Power heavy;
Series: Script/Art heavy; Contest: Screen Power/Technical). Quality is the
weighted sum.

## 5. Show life cycle

- **Novelty** starts at 100 and drops each week on air. It drops faster with
  **saturation**: other shows (yours or rivals') with the same Format+Topic.
  Five Political News shows means the newest is near 0 within weeks.
- **Revamp** — spend a Twist token (or a short script project): restores part
  of the novelty; each revamp of the same show works less well.
- **Renew** (season shows) — a new season keeps most of the audience and resets novelty partly.
- **Cancel** — frees the slot. **Rerun** — cheap filler with low novelty.

## 6. Schedule

The grid is built from **day blocks × dayparts**. Each slot holds one show.
One airing a week uses one episode (recurring shows never run out). Empty slots
run **Filler** (infomercials and old reruns): tiny audience, tiny revenue.

| Tier | Day blocks | Dayparts | Slots |
|---|---|---|---|
| Local | Weekday, Weekend | Morning, Evening, Prime | 6 |
| State | Weekday ×2, Weekend | + Afternoon, Late Night | 15 |
| National | **[OPEN]** | all | — |

**[OPEN]** How the weekday is split at State and National (proposal:
State = Mon–Wed / Thu–Fri / Weekend; National = Mon–Tue / Wed–Thu / Fri / Weekend).

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
- **[OPEN]** What happens at bankruptcy (game over, or a bank loan once).

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
1. **Core loop (Local)** — starter people, free pack opening, studio pipeline
   with roles, show cards, 6-slot schedule with filler, 1 rival, *Air Week*
   reveal, money, seasonal audience.
   *Test: is making a show and seeing it rate fun within 20 minutes?*
2. **Card economy** — shop, packs, duplicates → Twist tokens, album, uses +
   Business Card renewals, XP and levels, rarities.
3. **Show life** — novelty, saturation, revamp, renew/cancel, recurring vs
   season, lead-in, daypart fit.
4. **Calendar & marketing** — sweeps and ad pricing, premiere season, promo
   cards, hype, events, sponsors.
5. **Rights** — Rights Market, film packages, local sports on the calendar.
6. **State tier** — license, more slots, second rival, new formats.
7. **National + payoff** — national tier, Glimmy Awards, franchises, balance pass.
