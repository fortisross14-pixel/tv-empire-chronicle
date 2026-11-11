import type { GameState, Pack, PackKind, PosterSpec, SlotId } from './types';
import { CITY } from './data/names';
import { addHouseCards } from './people';
import { applyPack, makePack, PRICES } from './packs';
import { GameError, projectPeople, startProject, type ShowPlan } from './production';
import { makeRivals } from './rivals';
import { applyPromo, applySponsor } from './network';
import { resolvePendingEvent } from './events';
import { rightsById } from './data/rights';
import { assignTeam, onSportsTeam, placeBid, refreshMarketLocks } from './rights';
import { AFFILIATE_MAX, affiliateCost, emptySchedule, reachOf, slotsOf, tierSlot } from './schedule';
import { addNews, round1 } from './news';
import { simulateWeek, CHAMPION_WEEKS, LOAN } from './sim';

export const SAVE_VERSION = 11;

/** What it takes to become a State network. */
export const STATE_LICENSE = { reputation: 35, cash: 250, fee: 200 };
/** What it takes to go National. */
export const NATIONAL_LICENSE = { reputation: 60, cash: 1500, fee: 1000 };
export const START_CASH = 120;
export { CHAMPION_WEEKS, LOAN };


export function newGame(seed: number, stationName: string): GameState {
  const state: GameState = {
    version: SAVE_VERSION,
    rng: seed | 0,
    stationName: stationName.trim() || 'Channel 8',
    tier: 'local',
    milestone: null,
    affiliates: 0,
    shareHistory: [],
    champion: false,
    week: 27,
    year: 1,
    cash: START_CASH,
    reputation: 5,
    rateCard: 1,
    loan: null,
    loanUsed: false,
    people: [],
    formats: [],
    topics: [],
    twists: {},
    projects: [],
    shows: [],
    schedule: emptySchedule('local'),
    rivals: [],
    unopened: [],
    reveal: null,
    businessCards: 0,
    lastResult: null,
    news: [],
    knownFormats: [],
    sweeps: { shareSum: 0, samples: 0 },
    shopUnlocked: false,
    networkCards: [],
    facilities: [],
    sponsorDeals: [],
    pendingEvent: null,
    modifiers: [],
    ceremony: null,
    trophies: [],
    eventCooldown: 4,
    rightsMarket: null,
    rights: [],
    rivalRights: [],
    newlyFinished: [],
    gameOver: null,
    nextId: 0,
  };
  addHouseCards(state);
  state.rivals = makeRivals(state);
  state.unopened.push(makePack(state, 'starter'), makePack(state, 'starter-people'));
  addNews(state, `${state.stationName} goes on air in ${CITY}! Open your two free packs to plan a first show.`, 'good');
  return state;
}


/**
 * Every action works on a copy, so React state is never mutated.
 * While an event waits for an answer, only answering it (and closing screens) is allowed,
 * so nothing the event refers to can disappear first.
 */
function produce(state: GameState, fn: (draft: GameState) => void, opts: { duringEvent?: boolean } = {}): GameState {
  if (state.gameOver) throw new GameError('Game over. Start a new game.');
  if (state.pendingEvent && !opts.duringEvent) throw new GameError('Answer the event first.');
  const draft = structuredClone(state);
  fn(draft);
  return draft;
}

// ---------- Actions ----------

export const openPack = (state: GameState, packId: string) =>
  produce(state, (s) => {
    const pack = s.unopened.find((p) => p.id === packId);
    if (!pack) throw new GameError('Pack not found.');
    s.unopened = s.unopened.filter((p) => p.id !== packId);
    s.reveal = applyPack(s, pack);
  });

export const dismissReveal = (state: GameState) => produce(state, (s) => void (s.reveal = null), { duringEvent: true });

export const buyPack = (state: GameState, kind: Extract<PackKind, 'program' | 'people' | 'network'>) =>
  produce(state, (s) => {
    if (!s.shopUnlocked) throw new GameError('The shop opens after your first show airs.');
    const price = PRICES[kind];
    if (s.cash < price) throw new GameError('Not enough cash.');
    s.cash = round1(s.cash - price);
    const pack: Pack = makePack(s, kind);
    s.reveal = applyPack(s, pack);
  });

export const buyBusinessCard = (state: GameState) =>
  produce(state, (s) => {
    if (!s.shopUnlocked) throw new GameError('The shop opens after your first show airs.');
    if (s.cash < PRICES.business) throw new GameError('Not enough cash.');
    s.cash = round1(s.cash - PRICES.business);
    s.businessCards += 1;
  });

export const BUSINESS_CARD_USES = 5;

export const useBusinessCard = (state: GameState, personId: string) =>
  produce(state, (s) => {
    if (s.businessCards <= 0) throw new GameError('You have no Business Cards.');
    const person = s.people.find((p) => p.id === personId);
    if (!person) throw new GameError('Person not found.');
    if (person.house) throw new GameError('House staff never run out of uses.');
    person.uses += BUSINESS_CARD_USES;
    s.businessCards -= 1;
    addNews(s, `${person.name} signs on for ${BUSINESS_CARD_USES} more seasons.`, 'good');
  });

export const createShow = (state: GameState, plan: ShowPlan) =>
  produce(state, (s) => startProject(s, plan));

export const cancelProject = (state: GameState, projectId: string) =>
  produce(state, (s) => {
    const project = s.projects.find((p) => p.id === projectId);
    if (!project) throw new GameError('Project not found.');
    s.projects = s.projects.filter((p) => p.id !== projectId);
    s.cash = round1(s.cash + project.cost / 2);
    // People get their season back; a twist token is returned too.
    for (const id of projectPeople(project)) {
      const person = s.people.find((x) => x.id === id);
      if (person && !person.house) person.uses += 1;
    }
    if (project.twist) s.twists[project.topicId] = (s.twists[project.topicId] ?? 0) + 1;
    addNews(s, `"${project.name}" was scrapped. Half the budget came back, and the team got their season back.`, 'bad');
  });

export const scheduleShow = (state: GameState, slot: SlotId, showId: string | null) =>
  produce(state, (s) => {
    if (!slotsOf(s).includes(slot)) throw new GameError('That time slot is not on your schedule.');
    const film = showId ? s.rights.find((r) => r.id === showId) : null;
    if (film && rightsById(film.defId).kind !== 'film') throw new GameError('Sports air automatically in their own slot.');
    if (showId && !film && !s.shows.some((x) => x.id === showId)) throw new GameError('Show not found.');
    for (const other of slotsOf(s)) if (showId && s.schedule[other] === showId) s.schedule[other] = null;
    s.schedule[slot] = showId;
  });

export const cancelShow = (state: GameState, showId: string) =>
  produce(state, (s) => {
    s.sponsorDeals = s.sponsorDeals.filter((d) => d.showId !== showId);
    const show = s.shows.find((x) => x.id === showId);
    if (!show) throw new GameError('Show not found.');
    if (s.projects.some((p) => p.showId === showId)) throw new GameError('A new season is in production.');
    s.shows = s.shows.filter((x) => x.id !== showId);
    for (const slot of slotsOf(s)) if (s.schedule[slot] === showId) s.schedule[slot] = null;
    addNews(s, `${s.stationName} cancels "${show.name}".`, 'neutral');
  });

export const dismissFinished = (state: GameState) => produce(state, (s) => void (s.newlyFinished = []), { duringEvent: true });

export const usePromo = (state: GameState, cardId: string, targetId: string) =>
  produce(state, (s) => addNews(s, applyPromo(s, cardId, targetId), 'good'));

export const useSponsor = (state: GameState, cardId: string, showId: string) =>
  produce(state, (s) => addNews(s, applySponsor(s, cardId, showId), 'good'));

export const answerEvent = (state: GameState, choice: number) =>
  produce(state, (s) => addNews(s, resolvePendingEvent(s, choice), 'neutral'), { duringEvent: true });

export const bidOnRights = (state: GameState, lotId: string, amount: number | null) =>
  produce(state, (s) => placeBid(s, lotId, amount));

export const assignSportsTeam = (state: GameState, rightsId: string, crewId: string, talentId: string) =>
  produce(state, (s) => assignTeam(s, rightsId, crewId, talentId));

/** Save a poster design for a show (null goes back to the automatic poster). */
export const setPoster = (state: GameState, showId: string, poster: PosterSpec | null) =>
  produce(state, (s) => {
    const show = s.shows.find((x) => x.id === showId);
    if (!show) throw new GameError('Show not found.');
    if (poster && (poster.fronts.length > 2 || typeof poster.sky !== 'string')) throw new GameError('A poster has one sky and up to two front images.');
    show.poster = poster ? structuredClone(poster) : null;
  });

export const dismissMilestone = (state: GameState) => produce(state, (s) => void (s.milestone = null), { duringEvent: true });

/** The next license for this station, or null at the top. */
export const nextLicense = (s: Pick<GameState, 'tier'>) =>
  s.tier === 'local' ? { tier: 'state' as const, ...STATE_LICENSE } : s.tier === 'state' ? { tier: 'national' as const, ...NATIONAL_LICENSE } : null;

/** What is missing for the next license. */
export function licenseGaps(s: GameState): string[] {
  const lic = nextLicense(s);
  if (!lic) return [];
  const gaps: string[] = [];
  if (s.reputation < lic.reputation) gaps.push(`Reputation ${Math.floor(s.reputation)}/${lic.reputation}`);
  if (s.cash < lic.cash) gaps.push(`Cash $${Math.floor(s.cash)}K/$${lic.cash}K`);
  return gaps;
}

/** Kept for older callers: gaps for the State license. */
export const stateLicenseGaps = (s: GameState) => (s.tier === 'local' ? licenseGaps(s) : []);

function moveUp(s: GameState) {
  const lic = nextLicense(s);
  if (!lic) throw new GameError('You are already a national network.');
  const gaps = licenseGaps(s);
  if (gaps.length) throw new GameError(`Not yet: ${gaps.join(', ')}.`);
  s.cash = round1(s.cash - lic.fee);
  s.tier = lic.tier;
  const old = s.schedule;
  s.schedule = emptySchedule(lic.tier);
  for (const [slot, id] of Object.entries(old) as [SlotId, string | null][]) {
    const target = tierSlot(slot, lic.tier);
    if (id && !s.schedule[target]) s.schedule[target] = id;
  }
  s.rivals = makeRivals(s);
  // Rival-owned rights belonged to the old competitors; they go back on the market.
  s.rivalRights = [];
  refreshMarketLocks(s);
  s.sweeps = { shareSum: 0, samples: 0 };
  s.milestone = lic.tier;
  return lic.tier;
}

/** Sign one more affiliate station (national only): +5% reach. */
export const signAffiliate = (state: GameState) =>
  produce(state, (s) => {
    if (s.tier !== 'national') throw new GameError('Affiliates are for national networks.');
    if (s.affiliates >= AFFILIATE_MAX) throw new GameError('Your network already covers the whole country.');
    const cost = affiliateCost(s.affiliates);
    if (s.cash < cost) throw new GameError('Not enough cash.');
    s.cash = round1(s.cash - cost);
    s.affiliates += 1;
    addNews(s, `📡 A new affiliate joins ${s.stationName}. Reach is now ${Math.round(reachOf(s) * 100)}% of the country.`, 'good');
  });

export const expandToNational = (state: GameState) =>
  produce(state, (s) => {
    if (s.tier !== 'state') throw new GameError('Become a State network first.');
    moveUp(s);
    addNews(s, `🇺🇸 ${s.stationName} goes national! 20 slots, 12M households, and rivals ${s.rivals.map((r) => r.short).join(', ')}.`, 'good');
  });

/** Become a State network: bigger audience, 15 slots, state rivals, Advanced productions. */
export const expandToState = (state: GameState) =>
  produce(state, (s) => {
    if (s.tier !== 'local') throw new GameError('You are already a State network.');
    moveUp(s);
    addNews(s, `🎉 ${s.stationName} is now a State network! 15 slots, 2.4M households, and new rivals: ${s.rivals.map((r) => r.short).join(' and ')}.`, 'good');
  });

export const dismissCeremony = (state: GameState) => produce(state, (s) => void (s.ceremony = null), { duringEvent: true });

/** Let a person go for good. House staff can't be released. */
export const releasePerson = (state: GameState, personId: string) =>
  produce(state, (s) => {
    const p = s.people.find((x) => x.id === personId);
    if (!p) throw new GameError('Person not found.');
    if (p.house) throw new GameError('House staff stay with the station.');
    if (s.projects.some((pr) => projectPeople(pr).includes(p.id))) throw new GameError(`${p.name} is working on a show.`);
    if (onSportsTeam(s, p.id)) throw new GameError(`${p.name} is on a sports broadcast team. Change the team first.`);
    s.people = s.people.filter((x) => x.id !== personId);
    addNews(s, `${p.name} leaves ${s.stationName}. Thanks for everything!`, 'neutral');
  });

// ---------- Airing ----------

/** Air one week: see sim.ts for the steps. */
export const airWeek = (state: GameState) => produce(state, (s) => simulateWeek(s));

export { GameError };
