import type { GameState, PendingEvent, Person, Show } from './types';
import { pick, random, weighted } from './rng';
import { newId, overall } from './people';
import { NETWORK_CARDS } from './data/network';
import { GameError } from './errors';
import { projectPeople } from './production';
import { onSportsTeam } from './rights';
import { makeRivalShow } from './rivals';
import { slotsOf } from './schedule';

/** Chance of an event in a week once the cooldown is over. Kept low on purpose. */
export const EVENT_CHANCE = 0.3;
export const EVENT_COOLDOWN = 3;
/** Transfer fee when a rival poaches someone. */
export const POACH_FEE = 5;

interface EventDef {
  id: string;
  weight: number;
  /** Returns the target id ('' for none) if the event can happen now, or null. */
  find: (s: GameState) => string | null;
  make: (s: GameState, targetId: string) => Omit<PendingEvent, 'id' | 'defId' | 'targetId'>;
  /** Applies the choice; returns a news line. */
  resolve: (s: GameState, ev: PendingEvent, choice: number) => string;
}

const onAir = (s: GameState): Show[] =>
  slotsOf(s).map((slot) => s.shows.find((x) => x.id === s.schedule[slot])).filter((x): x is Show => !!x && x.premiered);
const booked = (s: GameState, id: string) => s.projects.some((p) => projectPeople(p).includes(id));
const packPeople = (s: GameState) => s.people.filter((p) => !p.house && p.uses > 0);
const person = (s: GameState, id: string) => s.people.find((p) => p.id === id) as Person;
const show = (s: GameState, id: string) => s.shows.find((x) => x.id === id) as Show;
const pay = (s: GameState, amount: number) => {
  if (s.cash < amount) throw new GameError('Not enough cash for that.');
  s.cash = Math.round((s.cash - amount) * 10) / 10;
};

const EVENTS: EventDef[] = [
  {
    id: 'raise', weight: 3,
    find: (s) => pick(s, [...packPeople(s).filter((p) => p.kind === 'talent' && p.skills.fame >= 15), null])?.id ?? null,
    make: (s, id) => {
      const p = person(s, id);
      const amount = Math.round(4 + (p.kind === 'talent' ? p.skills.fame : 0) / 5);
      return {
        title: `${p.name} wants a raise`,
        text: `Fans stop ${p.name.split(' ')[0]} in the street now. Their agent calls: pay up, or they work fewer seasons for you.`,
        amount,
        choices: [
          { label: `Pay $${amount}K`, detail: '+1 use and +3 fame' },
          { label: 'Refuse', detail: '−1 use' },
        ],
      };
    },
    resolve: (s, ev, c) => {
      const p = person(s, ev.targetId!);
      if (c === 0) {
        pay(s, ev.amount);
        p.uses += 1;
        if (p.kind === 'talent') p.skills.fame = Math.min(99, p.skills.fame + 3);
        return `${p.name} gets a raise and feels like a star.`;
      }
      p.uses = Math.max(0, p.uses - 1);
      return `${p.name} is unhappy after being refused a raise.`;
    },
  },
  {
    id: 'interview', weight: 3,
    find: (s) => pick(s, [...onAir(s), null])?.id ?? null,
    make: (s, id) => ({
      title: 'The Gazette wants an interview',
      text: `A reporter wants to talk about "${show(s, id).name}". Good publicity, but it takes a day of filming.`,
      amount: 0,
      choices: [
        { label: 'Send the host', detail: '+15 hype for the show' },
        { label: 'Decline', detail: 'Nothing happens' },
      ],
    }),
    resolve: (s, ev, c) => {
      const sh = show(s, ev.targetId!);
      if (c === 0) {
        sh.hype = Math.min(100, sh.hype + 15);
        return `The Gazette runs a big story on "${sh.name}".`;
      }
      return 'You passed on the Gazette interview.';
    },
  },
  {
    id: 'breakdown', weight: 2,
    find: () => '',
    make: () => ({
      title: 'The transmitter is acting up',
      text: 'The signal flickers during the evening news. The engineer can fix it properly, or tape it together.',
      amount: 6,
      choices: [
        { label: 'Repair it · $6K', detail: 'No harm done' },
        { label: 'Tape it together', detail: '−10% viewers for 2 weeks' },
      ],
    }),
    resolve: (s, ev, c) => {
      if (c === 0) {
        pay(s, ev.amount);
        return 'The transmitter is repaired.';
      }
      s.modifiers.push({ kind: 'viewers', mult: 0.9, weeksLeft: 2, label: 'Weak signal' });
      return 'Viewers complain about a fuzzy picture.';
    },
  },
  {
    id: 'viral', weight: 2,
    find: (s) => {
      const hits = onAir(s).filter((x) => (x.history[x.history.length - 1]?.share ?? 0) > 0.2);
      return hits.length ? pick(s, hits).id : null;
    },
    make: (s, id) => ({
      title: 'A clip went viral! 🔥',
      text: `A moment from "${show(s, id).name}" is all over social media.`,
      amount: 0,
      choices: [{ label: 'Ride the wave', detail: '+15 novelty, +10 hype' }],
    }),
    resolve: (s, ev) => {
      const sh = show(s, ev.targetId!);
      sh.novelty = Math.min(100, sh.novelty + 15);
      sh.hype = Math.min(100, sh.hype + 10);
      return `"${sh.name}" is the talk of the town.`;
    },
  },
  {
    id: 'sponsor-offer', weight: 2,
    find: (s) => (s.shopUnlocked ? '' : null),
    make: (s) => {
      const def = pick(s, NETWORK_CARDS.filter((c) => c.kind === 'sponsor' && c.rarity === 'common'));
      return {
        title: `${def.name} wants to advertise`,
        text: `A rep from ${def.name} offers a sponsor deal you can attach to any show. ${def.text}`,
        amount: NETWORK_CARDS.indexOf(def),
        choices: [
          { label: 'Sign', detail: `Get a ${def.name} sponsor card` },
          { label: 'Pass', detail: 'Nothing happens' },
        ],
      };
    },
    resolve: (s, ev, c) => {
      const def = NETWORK_CARDS[ev.amount];
      if (c === 0) {
        s.networkCards.push({ id: newId(s, 'nc'), defId: def.id });
        return `You sign a sponsor deal with ${def.name}.`;
      }
      return `You turn down ${def.name}.`;
    },
  },
  {
    id: 'poach', weight: 2,
    find: (s) => {
      const stars = packPeople(s).filter((p) => p.rarity !== 'common' && !booked(s, p.id) && !onSportsTeam(s, p.id));
      return stars.length ? pick(s, stars).id : null;
    },
    make: (s, id) => {
      const p = person(s, id);
      const amount = Math.round(6 + overall(p) / 10);
      return {
        title: `${s.rivals[0]?.short ?? 'A rival'} tries to poach ${p.name}`,
        text: `They offered ${p.name.split(' ')[0]} more money. You can make a counter-offer, or let them go for a transfer fee.`,
        amount,
        choices: [
          { label: `Counter-offer · $${amount}K`, detail: '+2 uses' },
          { label: 'Let them go', detail: `Lose the card, get $${POACH_FEE}K` },
        ],
      };
    },
    resolve: (s, ev, c) => {
      const p = person(s, ev.targetId!);
      if (c === 0) {
        pay(s, ev.amount);
        p.uses += 2;
        return `${p.name} stays with ${s.stationName}.`;
      }
      s.people = s.people.filter((x) => x.id !== p.id);
      s.cash = Math.round((s.cash + POACH_FEE) * 10) / 10;
      return `${p.name} leaves for ${s.rivals[0]?.short ?? 'a rival'}.`;
    },
  },
  {
    id: 'writers-block', weight: 2,
    find: (s) => pick(s, [...s.projects.filter((p) => p.stage === 'script'), null])?.id ?? null,
    make: (s, id) => ({
      title: "Writer's block",
      text: `The script for "${s.projects.find((p) => p.id === id)!.name}" is stuck. A script doctor could help.`,
      amount: 5,
      choices: [
        { label: 'Hire a script doctor · $5K', detail: '+8 script score' },
        { label: 'Push through', detail: 'Script takes 1 more week' },
      ],
    }),
    resolve: (s, ev, c) => {
      const p = s.projects.find((x) => x.id === ev.targetId);
      if (!p) return 'The script got finished anyway.';
      if (c === 0) {
        pay(s, ev.amount);
        p.scriptBonus += 8;
        return `A script doctor polishes "${p.name}".`;
      }
      p.weeksLeft += 1;
      return `"${p.name}" is a week late on its script.`;
    },
  },
  {
    id: 'copycat', weight: 2,
    find: (s) => pick(s, [...onAir(s), null])?.id ?? null,
    make: (s, id) => ({
      title: `${s.rivals[0]?.short ?? 'A rival'} copies your show`,
      text: `They announced a show suspiciously like "${show(s, id).name}". Two of the same will tire viewers faster.`,
      amount: 4,
      choices: [
        { label: 'Answer with a promo · $4K', detail: '+20 hype for your show' },
        { label: 'Ignore it', detail: 'Nothing else happens' },
      ],
    }),
    resolve: (s, ev, c) => {
      const sh = show(s, ev.targetId!);
      const rival = s.rivals[0];
      if (rival) {
        const slot = pick(s, slotsOf(s));
        const copy = makeRivalShow(s, slot, rival);
        rival.schedule[slot] = { ...copy, formatId: sh.formatId, topicId: sh.topicId, name: `${sh.name.split(' ')[0]} Too`, novelty: 100 };
      }
      if (c === 0) {
        pay(s, ev.amount);
        sh.hype = Math.min(100, sh.hype + 20);
        return `You fire back with a promo for "${sh.name}".`;
      }
      return `${rival?.short ?? 'A rival'} airs a copy of "${sh.name}".`;
    },
  },
];

const BY_ID = Object.fromEntries(EVENTS.map((e) => [e.id, e]));

/** Maybe start an event this week. At most one at a time, with a cooldown. */
export function maybeStartEvent(s: GameState): void {
  if (s.pendingEvent) return;
  if (s.eventCooldown > 0) {
    s.eventCooldown -= 1;
    return;
  }
  if (random(s) > EVENT_CHANCE) return;
  const ready = EVENTS.map((e) => ({ e, target: e.find(s) })).filter((x) => x.target !== null);
  if (!ready.length) return;
  const chosen = weighted(s, Object.fromEntries(ready.map((x) => [x.e.id, x.e.weight])));
  const { e, target } = ready.find((x) => x.e.id === chosen)!;
  s.pendingEvent = { id: newId(s, 'ev'), defId: e.id, targetId: target || null, ...e.make(s, target!) };
  s.eventCooldown = EVENT_COOLDOWN;
}

export function resolvePendingEvent(s: GameState, choice: number): string {
  const ev = s.pendingEvent;
  if (!ev) throw new GameError('No event to answer.');
  if (choice < 0 || choice >= ev.choices.length) throw new GameError('Pick one of the options.');
  // The event's subject may be gone (e.g. a save from before events blocked other actions).
  const gone = ev.targetId && !s.people.some((p) => p.id === ev.targetId)
    && !s.shows.some((x) => x.id === ev.targetId) && !s.projects.some((x) => x.id === ev.targetId);
  const line = gone ? 'The situation sorted itself out.' : BY_ID[ev.defId].resolve(s, ev, choice);
  s.pendingEvent = null;
  return line;
}

/** For tests: force a specific event. */
export function startEvent(s: GameState, defId: string): boolean {
  const e = BY_ID[defId];
  const target = e?.find(s);
  if (!e || target === null || target === undefined) return false;
  s.pendingEvent = { id: newId(s, 'ev'), defId, targetId: target || null, ...e.make(s, target) };
  return true;
}
