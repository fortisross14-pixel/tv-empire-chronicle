import { test } from 'vitest';
import { airWeek, answerEvent, buySportsRights, newMissionGame, openPack } from '../game';
import { addAnnex } from '../lot';
import { rightsById } from '../data/rights';
import { sportsOffers, sportsPrice } from '../rights';
test('probe', () => {
  const env = (globalThis as any).process.env;
  if (!env.PROBE) return;
  for (const tier of ['local', 'state', 'national'] as const) {
    for (const def of sportsOffers({ tier }).filter((d) => d.tier === tier)) {
      let s = newMissionGame(7, 'P', tier === 'local' ? null : tier === 'state' ? 's2-prime-time-war' : 'n1-stale-giant');
      while (s.unopened.length) s = openPack(s, s.unopened[0].id);
      s.reveal = null; s.cash = 99999;
      addAnnex(s, 'truck');
      s.week = def.season![0] === 1 ? 1 : def.season![0] - 1;
      const price = sportsPrice(s, def);
      s = buySportsRights(s, def.id);
      let rev = 0, games = 0, share = 0;
      for (let i = 0; i < 60; i++) {
        while (s.pendingEvent) s = answerEvent(s, s.pendingEvent.choices.length - 1);
        s = airWeek(s);
        for (const r of s.lastResult!.slots) if (r.kind === 'sports') { rev += r.revenue; games++; share += r.share; }
        if (!s.rights.some((r) => r.defId === def.id)) break;
      }
      console.log(`PROBE ${tier} ${def.id.padEnd(18)} price ${String(price).padStart(5)}  games ${String(games).padStart(2)}  revenue ${Math.round(rev).toString().padStart(6)}  per game ${(rev / Math.max(1, games)).toFixed(1).padStart(7)}  share ${(share / Math.max(1, games) * 100).toFixed(0)}%  roi x${(rev / price).toFixed(1)}`);
      void rightsById;
    }
  }
}, 600000);
