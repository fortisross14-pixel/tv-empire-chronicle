// Economy playtest: the bot plays a plain Sandbox (Normal) for several years, aiming for
// National, and prints yearly medians. Run with `npm run playtest` (ECON_YEARS=6, SEEDS=...).
import { newMissionGame } from '../game';
import { rankOf } from '../mission';
import { playState } from './missions.playtest';
import type { GameState } from '../types';

const ENV = (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env ?? {};
const SEEDS = (ENV.SEEDS ?? '1,2,3,4,5,6').split(',').map(Number);
const YEARS = Number(ENV.ECON_YEARS ?? 6);
const med = (xs: number[]) => { const v = [...xs].sort((a, b) => a - b); return v.length ? v[Math.floor(v.length / 2)] : NaN; };

interface Row { cash: number; rep: number; tier: string; share: number; primeRank: number; rank: number; net: number; shows: number }

test('economy', () => {
  if (ENV.MISSIONS && !ENV.ECON) return; // mission-only runs skip this
  const rows: Row[][] = [];
  const events: { state: number[]; national: number[]; loan: number[]; bust: number[]; champ: number[] } = { state: [], national: [], loan: [], bust: [], champ: [] };
  for (const seed of SEEDS) {
    const yearly: Row[] = [];
    let week = 0;
    let net = 0;
    let shareSum = 0;
    let prime = 0;
    let rank = 0;
    const seen = { state: false, national: false, loan: false, champ: false };
    playState(newMissionGame(seed, 'Bot', null, ENV.DIFF ? { difficulty: ENV.DIFF as 'easy' | 'hard', goals: [] } : undefined), [{ kind: 'tier', tier: 'national' }], YEARS * 52, (s: GameState) => {
      week++;
      net += s.lastResult?.net ?? 0;
      shareSum += s.shareHistory.at(-1) ?? 0;
      prime += rankOf(s, true);
      rank += rankOf(s);
      if (s.tier === 'state' && !seen.state) { seen.state = true; events.state.push(week); }
      if (s.tier === 'national' && !seen.national) { seen.national = true; events.national.push(week); }
      if (s.loanUsed && !seen.loan) { seen.loan = true; events.loan.push(week); }
      if (s.champion && !seen.champ) { seen.champ = true; events.champ.push(week); }
      if (ENV.LOCAL_TRACE && Number(ENV.LOCAL_TRACE) === seed && s.tier === 'local' && week % 13 === 0) {
        console.log(`L seed${seed} w${week} cash=${Math.round(s.cash)} rep=${s.reputation} net=${s.lastResult?.net} shows=${s.shows.map((x) => x.formatId + ':' + x.quality + '/' + Math.round(x.novelty) + (x.episodesLeft > 0 ? '' : 'r')).join(',')} proj=${s.projects.length} people=${s.people.filter((p) => !p.house && p.uses > 0).length} formats=${s.formats.length} loan=${!!s.loan}`);
      }
      if (s.gameOver) { events.bust.push(week); console.log(`seed${seed} bankrupt at week ${week} as ${s.tier} (loan at ${events.loan.at(-1)})`); }
      if (ENV.ECON_TRACE && s.tier === 'national' && week >= Number(ENV.FROM ?? 0) && week % Number(ENV.EVERY ?? 8) === 0 && s.lastResult) {
        const r = s.lastResult;
        const kinds = r.slots.map((x) => (x.kind ?? 'filler')[0] + (x.rerun ? 'r' : '') + Math.round(x.share * 100)).join(' ');
        console.log(`seed${seed} w${week} cash=${Math.round(s.cash)} net=${r.net} rev=${r.revenue} oh=${r.overhead} reach=${s.affiliates} proj=${s.projects.length} shows=${s.shows.length} rights=${s.rights.map((x) => x.defId).join(',')} ips=${s.ips.length} y${s.year}w${s.week} | ${kinds}`);
      }
      if (week % 52 === 0) {
        yearly.push({ cash: Math.round(s.cash), rep: Math.round(s.reputation), tier: s.tier[0], share: +(shareSum / 52 * 100).toFixed(1), primeRank: +(prime / 52).toFixed(1), rank: +(rank / 52).toFixed(1), net: Math.round(net), shows: s.shows.length });
        net = 0; shareSum = 0; prime = 0; rank = 0;
      }
    });
    rows.push(yearly);
  }
  const n = SEEDS.length;
  console.log(`\nECONOMY (Sandbox ${ENV.DIFF ?? 'normal'}, ${n} seeds, ${YEARS} years)`);
  console.log(`State reached ${events.state.length}/${n} (median week ${med(events.state)})  National ${events.national.length}/${n} (week ${med(events.national)})  #1 champion ${events.champ.length}/${n} (week ${med(events.champ)})  loans ${events.loan.length}  bankrupt ${events.bust.length}`);
  for (let y = 0; y < YEARS; y++) {
    const r = rows.map((x) => x[y]).filter(Boolean);
    if (!r.length) continue;
    const m = (k: keyof Row) => med(r.map((x) => x[k] as number));
    console.log(`Y${y + 1} tiers=${r.map((x) => x.tier).join('')} cash=${m('cash')} net/yr=${m('net')} rep=${m('rep')} share=${m('share')}% rank=${m('rank')} primeRank=${m('primeRank')} shows=${m('shows')}`);
  }
}, 1_800_000);
