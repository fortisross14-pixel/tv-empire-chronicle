# Implementation Notes

This build implements the first connected vertical slice from the full design document.

## Fully interactive in this pass
- Small local station starting state
- Persistent weekly simulation and browser save
- Competitor universe and MTD/YTD rankings
- Market expansion routes and build timers
- Facilities and condition decay
- Research prerequisites and unlocks
- Rights acquisition and schedulable rights inventory
- Decision-based project costs
- Timed script development and generated script reports
- Production packaging with role-fit scores
- Timed production and show premieres
- Outlook-style daypart schedule with drag/drop and click assignment
- Talent skill/specialty progression
- Ratings, market performance, campaigns, P&L, and generated trade stories

## Good next development layers
1. Multi-round rights, affiliate, advertising, and talent negotiations.
2. Detailed episode-by-episode and season-by-season histories.
3. AI commissioning and cancellation simulation with competitor-owned programs.
4. Affiliate ad-inventory splits, local preemption, and network clearance percentages.
5. Cloud saves and multi-device play.
6. Awards, syndication buyers, international sales, ownership changes, acquisitions, and regulatory events.
7. More sophisticated schedule duration and live-event handling.

## CI test command fix (v0.2.1)

The project now defines `npm test` as `vite build`. This gives GitHub Actions a meaningful compile-time validation step and resolves the previous `Missing script: "test"` failure.
