# TV Empire Chronicle — Expansion Build

A playable Vite + React prototype of a persistent broadcast-industry simulation. You begin as **Northstar 8**, a small station serving Rockford and northern Illinois, and can build toward a Midwest regional network, cable specialist, sports service, national broadcaster, streamer, or hybrid media company.

## Run locally

```bash
npm install
npm run dev
```

Then open the local URL shown by Vite.

## Core playable systems

### Living industry universe
- Regional, national broadcast, cable-news, and streaming competitors.
- MTD and YTD audience-share and revenue rankings.
- Competitor momentum, reach, brand identities, flagship programs, and strategic moves.

### Distribution and growth
- Start with one owned local station and a limited household footprint.
- Enter markets through affiliates, cable carriage, repeater chains, owned-station acquisitions, or national carriage.
- Each route has different cost, lead time, ongoing expense, coverage, control, and research requirements.
- Facilities have levels and condition, can be upgraded, and slowly decay.

### Deeper creative pipeline
1. **Create a project** by selecting category, subtype, target, episode count, duration, narrative structure, closure, tone, writer, and visual identity.
2. **Write the script** over several simulated weeks.
3. Receive a **1–5 star script package** with critical roles, secondary roles, strengths, risks, and recommended production setup.
4. **Package production** by assigning a producer, director, and lead based on role fit rather than rarity alone.
5. Production takes weeks; finished shows become available for programming.
6. Continuous talk/news formats can enter the schedule while their production workflow is being finalized.

### Decision-driven cost
There is no generic quality or budget slider. Episode and season cost are calculated from:
- Music
- VFX / studio graphics
- Sets
- Locations
- Wardrobe
- Writing-room model
- Episode count and length
- External talent fees
- Launch support

### Content taxonomy
- Drama: police, medical, young adult, political, historical/medieval, science fiction, family saga.
- Comedy: workplace, family, romance, sketch, animation.
- Contest: culture quiz, physical challenge, family, talent, cooking.
- Reality: social, survival, love, transformation, entrepreneur.
- News/factual: daily news, investigations, nature, sports, local magazine, true crime.
- Talk: morning, daytime, late night, political, sports.
- Many types require research before they can be commissioned.

### Rights market
- Local and regional sports.
- College packages.
- Movie libraries and premiere windows.
- Proven format rights.
- International highlights.
- Competition, deadlines, territorial coverage, exclusivity, terms, and weekly commitments.

### Outlook-style programming
- Seven days across five meaningful dayparts: Morning, Afternoon, Evening, Prime Time, and Late Night.
- Drag and drop between cells.
- Drag shows, ready productions, sports, and movie packages from the content bank.
- Click a cell for a searchable-style content picker.

### People and institutional learning
- Rarity, profession, style, reliability, prestige, and commercial value.
- Separate skill ratings for acting, hosting, writing, producing, directing, journalism, music, and cinematography.
- Role-specific specialties such as drama lead, contest host, local anchor, pilot director, or reality producer.
- Staff gain experience from completed productions and can improve outside their original specialty.
- The network itself develops institutional specialties such as local news or regional sports.

### Research and facilities
- Distribution, infrastructure, creative, production, news, commercial, rights, and corporate research trees.
- One active capability program at a time.
- Research unlocks markets, production types, rights packages, and expansion routes.

### Business systems
- Nielsen-style program performance.
- Market awareness and share.
- Advertiser market, agreements, and marketing campaigns.
- Weekly management P&L.
- Program-level economics, future commitments, liquidity, debt, and board confidence.
- Weekly Chronicle stories generated from scripts, productions, premieres, expansion, research, ratings, and failure.

## Controls
- Use **Advance week** or **Advance 4 weeks** to run the simulation.
- The game autosaves a compact state to browser `localStorage` under `tv-empire-chronicle-v2`.
- Use **Reset universe** at the bottom of the sidebar to return to the starting state.

## Current prototype boundaries
- The simulation is intentionally compact and client-side.
- Negotiations are represented through prices, requirements, and strategic decisions rather than multi-round dialogue.
- Drag and drop is optimized for desktop Chrome; mobile uses the click-to-select schedule workflow.
- No server or database is required for this build.

The complete design document is included in `/docs`.
