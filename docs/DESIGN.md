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
**House cards:** you always own 3 permanent common cards: *Staff Writer*,
*Studio Crew* and *Station Host*. They have basic skills, never run out of
uses and never level up, so you can always make a show even with no money.
Everything better comes from packs, at four rarity levels.

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
- **Busy state:** a card is locked while working on a stage (script, production,
  post) and while calling sports games in season. Once a show is finished, its
  on-screen talent is free for other productions.
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
Bought as a **Network pack** ($30K, 2 cards). Consumables and permanent studio
items (these replace research). Hype from promos boosts appeal (100 hype =
+60%) and fades by 40% after every airing.

- **Business Card** — renew a person (+5 uses).
- **Promo cards** — Social Media Blitz, Radio Spot, Billboard, Newspaper Ad,
  On-air Promo. They add hype to a show before its premiere.
- **Facility cards** (permanent) — "HD Camera Kit" (+Image floor), "Sound Booth",
  "Second Studio" (+1 project in parallel), "Newsroom" (News bonus).
- **Sponsor deals** — "Sparkle Cola sponsors your morning show: +$X per week
  for 8 weeks if rating ≥ Y".

### 3.4 Rights cards (licensed content and IP)
Content you buy instead of produce. It **expires**, unlike program cards.

- **Movies** — from Shop movie packs (see §16), not the market.
- **IP licenses** — books, games, toys, chefs… to base shows on (see §15).
- **Live sports / event rights** — e.g. "Port Ellison Pelicans (minor league
  baseball) 2027 season". Tied to the calendar: the games take over a slot on
  game weeks, and each broadcast needs a crew card plus an on-screen commentator.
- **How you get them:** the **Rights Market** fills up at set calendar moments
  (sports rights in summer before the season, IP licenses at every market).
  Each lot gets one sealed bid; rivals bid too. Big IP (Galaxy Wars,
  Gridiron League) is shown **locked** until State/National — something to aim for.
- Your own hits become **IP** (see §15). No buying or selling your own IP.

### 3.5 Rights Market (built)
- Opens in weeks **10, 30 and 42** for 2 weeks: the sports rights for the
  coming season, 2–3 IP licenses, and 1 big locked lot as a teaser.
- **Sealed bids** (minimum 60% of the typical price). The rival bids too (or
  skips). Highest bid wins; you only pay if you win.
- **Local sports** (Pelicans baseball Apr–Sep on Weekend Evening, Friday Night
  Football Sep–Nov on Weekday Prime, Ice Hawks hockey Nov–Mar on Weekend Prime):
  games take over their slot in season. A crew card and a commentator are
  assigned (house staff by default); on game weeks they can't work in the
  studio. Broadcasts count as 2.5 airings at a 20% ad premium; the last 2 weeks
  are playoffs. Rival-owned sports compete in their slot.
- Locked lots: State College Football and State IP (State); National Gridiron
  League, Galaxy Wars and the other national IP (National).

## 4. Making a show (studio pipeline)

Pick Format + Topic, build the team, split the **focus points**, then
Script → Production → Post. A finished show becomes a **Show card**
(4 score bars, novelty meter, episodes left, last rating).

### Script stars
The script stage ends with a **1–5 star script**. It depends on:
- **Writing time** chosen when green-lighting: Rush (−1 week, ×0.85),
  Standard, Polish (+2 weeks, ×1.12)
- the writer's skill in the format's genre and the topic fit
- a bit of luck (±8)

### Dream team and Shows for the Ages
- **Dream team:** rarity points on the team (rare 1, epic 2, legend 3) add
  +1 quality per 2 points. Epic director + legend star + rare writer = +3.
- **Show for the Ages:** quality 85+. Gold card, +10% appeal, novelty fades 40% slower.

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

## 4b. Reviews

Every premiere (first episode of a season) gets two scores, 0–100, with quotes:
- **Audience** — mostly script and screen power, plus freshness. Drives
  word of mouth: 80 → +10% appeal for the rest of the season, 30 → −10%.
- **Critics** — everything, craft-heavy: script, technical, art, focus match.
  Moves reputation on the premiere and decides awards.

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

## 7b. Events and awards

**Events:** at most one at a time, about a 30% chance a week, then a 3-week
cooldown. Each is a small choice: a star wants a raise, a Gazette interview,
transmitter trouble, a viral clip, a sponsor offer, a rival poaching someone,
writer's block, a rival copying your show.

**Awards:** three levels each year. Shows whose season premiered in the past
52 weeks compete; critics count most.

| Ceremony | Week | Who you face | Categories open to a local station | Win prize |
|---|---|---|---|---|
| Indie TV Awards | 12 (Mar) | small stations | Best Indie Show, Writing, Craft, On-Screen, Audience Award | People pack, +4 rep |
| State TV Awards | 25 (Jun) | state networks | Best Show, Writing, Performance | Program pack, $10K, +7 rep |
| The Glimmy Awards | 38 (Sep) | national | Best Indie Production only | Network pack, $25K, +15 rep |

## 7c. Rivals (built)

| Station | Style | Counter-programs | Rights appetite | On air |
|---|---|---|---|---|
| KPEL 5 | News, sports, a bit of everything | 60% chance | Normal, loves sports | From the start |
| WAVE 12 | Young: reality, contests, sitcoms, cheap | 35% chance | Low | Launches in week 36 of year 1 |

Each week every rival: ages its shows; **cancels flops** (under 12% share for 3
weeks); **renews hits** (over 32% share) instead of replacing them; and, when
off cooldown, may **counter-program** a slot where your show held 30%+ share
two weeks running, launching a stronger show there (then a 6-week cooldown).
Rivals bid on rights by personality. The Schedule tab has a **Rivals** view:
lineup, shares, trend, rights owned and slots won against you.

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
  rivals, more formats, bigger movie packs, State IP and college sports.
- **National**: affiliate stations, the big IP (Galaxy Wars, Gridiron League),
  prime-time wars, the Glimmys at full scale.

## 10b. State network (built)

- **License:** reputation 35 and $250K cash, then a $200K fee (Week tab goal card).
- **Schedule:** Mon–Wed (3 airings), Thu–Fri (2) and Weekend (2) ×
  Morning, Afternoon, Evening, Prime, Late Night = 15 slots. Existing shows move
  over (weekday prime → Thu–Fri prime, other weekday slots → Mon–Wed).
- **Market:** 2.4M households, $30K/week running costs.
- **Rivals:** Capital 7 (polished, rich, aggressive) and StateNet (cheap upstart)
  replace the local stations.
- **Advanced productions:** up to 2 writers (the second adds 25% of their
  skill), a specialist crew card per area, 15 focus points (max 7 per area),
  an optional second topic (+4 script when both fit at 2+ stars), cost ×1.6,
  +1 week of production.
- **New formats in packs:** Animation, Late Show.
- **Rights:** State lots open (Detective Noir Library, State College Football).

## 10c. National network (built)

- **License:** State network, reputation 60 and $1.5M cash, then a $1M fee.
- **Schedule:** Mon–Tue (2 airings), Wed–Thu (2), Friday (1), Weekend (2) ×
  5 dayparts = 20 slots (scrolls sideways on phones).
- **Reach:** 12M households × reach. Reach starts at 50% and each **affiliate**
  adds 5% (max 10 affiliates, $150K + $50K per affiliate already signed).
  Running costs $120K/week.
- **Rivals:** Atlas One (the giant), Nova (prestige drama), Fizz (young, loud).
- **AAA productions:** up to 3 writers, a full crew of specialists, 20 focus
  points (max 8 per area), 2 topics, cost ×2.6, +2 weeks.
- **Big IP:** Galaxy Wars Saga, Prestige Drama Vault, National Gridiron League.
- **Full Glimmys:** Best Show, Drama, Comedy, Unscripted, News & Factual,
  Writing, Performance.
- **Spin-offs:** a Show for the Ages, an award winner or a 3+ season show can
  be spun off: same format, new team, +30 hype and +10 fame.
- **#1 network:** beat every rival on average share over 13 weeks for a
  crown screen. The game continues afterwards.

## 10d. Look: Living Room (built)

A TV home-screen style chosen from three streaming takes: plum night background,
solid rounded tiles, a white focus ring, pill buttons, Figtree type. Shows are
posters (2:3 in rows, 16:9 for the billboard and productions), people are a cast row
of portraits with rarity rings, and the schedule is the Guide. Home opens with a
billboard for the show that needs you most. Poster art is a placeholder (format
colours + topic icon) until the poster editor and its art library
(`docs/POSTER_ASSETS.md`) arrive.

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

## 14. Game modes: Beginner, Campaign, Sandbox (built)

**Title screen:** three save slots (each holds one station: a mission or a Sandbox game;
Continue or delete) and the **mission roadmap**: the Beginner path, three Campaign lanes
(Local, State, National, 6 numbered steps each) and the Sandbox. Most nodes start locked;
tap one to read its brief, goals and why it is locked. Tap an empty slot, then a mission.
Progress (best stars per mission) lives in a profile shared by all slots. In a game,
Home shows the mission card (goals ticked as you reach them, weeks left), and a result
screen appears on a win (keep playing or back to the menu) or when time runs out (retry).

**A scenario** = a preset station (tier, cash, loan, people, shows with their novelty,
rights, rivals, reputation) + 1–3 goals + a deadline in weeks. Fail the deadline →
retry. Stars: ★ goal met, ★★ met with time to spare, ★★★ met with a bonus condition.

### Beginner (6, finish 5 to open the Campaign)
1. **First Hit** — air a show that reaches an easy share (e.g. 8%).
2. **Play Ball** — win a local sports right and air one game.
3. **Movie Night** — buy a movie pack and air 4 movies.
4. **In the Black** — end a month with a positive balance.
5. **No Filler** — fill all 6 slots with your own content for 4 weeks.
6. **Back for More** — make season 2 of a show.

### Campaign (18: 6 Local, 6 State, 6 National, each tier from easy to hard)
The easiest of each tier is open at once; each win opens the next in that tier.
- **Local:** Zero to Hero (0 audience → #1 in Port Ellison in a year) · Shoestring
  (no cash, a loan, profitable for 3 months) · Sports Town (hold all 3 local sports
  rights and win weekends) · Critics' Darling (win an Indie Award) · The Comeback
  (a tired lineup, every show low novelty: rebuild it) · State Bound (earn the State
  license in 2 years).
- **State:** Bleeding Money (great rights and licenses, low cash, losing money every
  month → 3 profitable months in a row) · Prime Time War (win prime in all 3 day
  blocks) · Rights Rush (win State College Football and make it pay) · House Rules
  (house staff only + packs → a Show for the Ages) · Franchise Builder (grow one of
  your shows to an IP worth $X) · National Ambition (the National license).
- **National:** The Stale Giant (#1 network, lineup out of novelty: renew and replace,
  stay #1 for 26 weeks) · Glimmy Night (win Best Drama) · Coast to Coast (sign 10
  affiliates) · The Big Gamble (bought Galaxy Wars on a loan: pay it off) · Underdog
  (last of 4 networks → top 2) · Empire (#1 with 3 IPs worth $X each).

### Sandbox (opens after one win in each campaign tier)
Today's game: a new station from scratch, Local → State → National. Pick a
difficulty (Relaxed $220K and softer rivals, Normal, Tough $70K and sharper rivals) and
optional goals (become State/National, #1 in prime time, a Show for the Ages, an IP rated
60, an Indie Award, a Glimmy, 10 affiliates, $5M). No deadline; Home tracks the goals.
Existing saves become Sandbox saves. National rank goals count prime-time share.

## 15. IP: licensed and your own (built)

**IP** is anything famous a show can be built around. You can't buy or sell your own
IP; you license other people's at the Rights Market and grow your own by making hits.

**Licensed IP** (Rights Market, sealed bids, a 2–4 year production license):
books, video games, board games, toy lines, film franchises, celebrity chefs, sports
events, comic books. Each has a **rating** (0–100), a topic and the formats it suits
(★ made for it, works, a stretch). Big names are locked to big networks.
- Local: The Lighthouse Mysteries (book), Mama Rosa's Kitchen (chef), Pixel Pup
  (indie game), Harbor Hustle (board game), Gull Girl (web comic), Port Ellison Marathon.
- State: Moonlit Fangs (vampire romance books), Crypt Runner (tomb-raiding games),
  Landlord Tycoon (board game), Chef Rory Blaze, Captain Thunderbolt (comic),
  Zip the Hedgehog (game mascot).
- National: Galaxy Wars, Crown of Thorns (fantasy books), Daisy Doll, Titan-Man (toys),
  The World Games, Midnight Carnival (horror films).

**Making a show from an IP:** in the new-show wizard, pick "Based on an IP" (optional).
The show gets fame and hype from the IP's rating, and a quality bonus when the IP suits
the format (made for it +4, works +1, a stretch −2). You can make as many shows from an
IP as you like while you hold it: a cooking contest from Chef Rory Blaze, a documentary
on the history of Landlord Tycoon, a Galaxy Wars series. When a license ends, shows
already made keep airing.

**Your own IP:** a season that scores 55+ (reviews and share, plus awards and Shows
for the Ages) makes the show an IP of yours, forever. Its own format fits best, then its
natural adaptations (sitcom → TV movie or animation, news → documentary or magazine,
talk → late show…). Spin-offs and adaptations use it.

**Growth:** every season made from an IP (licensed or your own) moves its rating:
good seasons push it up, flops (under 40) cost 5 points. A small book or game you
license can grow; a Friends-type hit of yours can end up worth as much as Galaxy Wars.
IP worth in $K = rating² / 10 (rating 95 ≈ $900K).

## 16. Movie packs (built)

Movies are cheap content you air without producing: **Shop → Movie pack**
($15K Local, $45K State, $140K National), 4 movie cards per pack, ready to schedule.
- **Classics** (most cards): little novelty and no buzz, but a steady, easy audience.
- **New releases** (epic/legend): the first airing is a premiere, then like a classic.
- Duplicates add airings. A movie leaves once its airings are used (or after a year).
- The Rights Market sells only **sports rights and IP licenses**.

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
2. **Cards, deeper** ✅ (started) — permanent house cards, script stars with
   writing time and luck, dream-team rarity bonus, Shows for the Ages.
   Next: network packs, facility cards, more people variety.
3. **Reviews, marketing, events, awards** ✅ — audience + critic reviews,
   network packs (promos/hype, sponsors, studio upgrades), 8 events,
   Indie/State/Glimmy awards with trophy cabinet, release a card.
4. **Rights** ✅ — Rights Market, film packages, local sports on the calendar,
   rival-owned rights, broadcast teams.
5. **Rivals & AI** ✅ — reactive KPEL 5, second rival WAVE 12, personality
   bids, Rivals view.
6. **State tier** ✅ — license, 15 slots, state rivals, Advanced productions,
   2 topics, new formats, State rights.
7. **National + payoff** ✅ — national tier, affiliates, AAA, big IP, full
   Glimmys, spin-offs, #1 crown.

Next (planned):

11. **Movie packs + IP** ✅ — movie packs in the Shop, licensed IP in the Rights
    Market, shows based on IP, own hits become IP, IP ratings grow and shrink.
12. **Scenario engine + Beginner** ✅ — title screen with 3 save slots, mission roadmap,
    profile, preset starts, goals, deadlines, stars, all 24 missions and their unlocks.
13. **Campaign polish + Sandbox setup** ✅ — every mission playtested by a bot and tuned
    (docs/audits/2026-11-11-missions-playtest.md), Sandbox difficulty (Relaxed, Normal,
    Tough) and optional goals with no deadline.

14. **Best practices** ✅ — playtest tool, invariant and save tests, error boundary.
15. **Visual and navigation polish** ✅ — see docs/audits/2026-11-11-polish.md.

The last three waves are always:

8. **Game dev best practices** — code quality, tests, architecture.
9. **Visual and navigation upscale** — GUI/UX polish.
10. **Balancing** — economy, odds, difficulty curve.
