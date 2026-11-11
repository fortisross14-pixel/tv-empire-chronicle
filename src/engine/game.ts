import type { AwardLevel, GameState, NewsItem, Pack, PackKind, Show, SlotId, SlotResult, WeekResult } from './types';
import { clamp } from './rng';
import { dateLabel, isFallPremiere, isSweeps, periodOf } from './calendar';
import { formatById } from './data/formats';
import { CITY } from './data/names';
import { addHouseCards, newId } from './people';
import { applyPack, makePack, PRICES } from './packs';
import { advanceProjects, GameError, projectPeople, startProject, type ShowPlan } from './production';
import { advanceRivals, makeRivals, recordRivalShares } from './rivals';
import { appeal } from './appeal';
import { applyPromo, applySponsor, HYPE_POWER } from './network';
import { makeReviews, wordOfMouth } from './reviews';
import { maybeStartEvent, resolvePendingEvent } from './events';
import { AWARD_LEVELS, AWARD_WEEKS, holdCeremony } from './awards';
import { networkById } from './data/network';
import { rightsById, weeksToSeasonEnd } from './data/rights';
import {
  assignTeam, excitement, expireRights, maybeCloseMarket, maybeOpenMarket, opponent, placeBid, rivalSportsInSlot,
  sportsInSlot, sportsQuality, SPORTS_AIRINGS, SPORTS_CPM_BONUS,
} from './rights';
import {
  AIRINGS, AFFILIATE_MAX, CPM, FILLER_APPEAL, FILLER_NAME, HUT, OTHER_APPEAL, TIERS, affiliateCost, emptySchedule, reachOf, slotsOf, tierSlot,
} from './schedule';

export const SAVE_VERSION = 9;

/** What it takes to become a State network. */
export const STATE_LICENSE = { reputation: 35, cash: 250, fee: 200 };
/** What it takes to go National. */
export const NATIONAL_LICENSE = { reputation: 60, cash: 1500, fee: 1000 };
/** Weeks of average share compared to decide the #1 network. */
export const CHAMPION_WEEKS = 13;
export const START_CASH = 120;
export const LOAN = { amount: 100, total: 125, payment: 2.5 };

const round1 = (v: number) => Math.round(v * 10) / 10;

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

function addNews(state: GameState, text: string, tone: NewsItem['tone'] = 'neutral') {
  state.news.unshift({ id: newId(state, 'n'), week: state.week, year: state.year, text, tone });
  state.news = state.news.slice(0, 40);
}

/** Every action works on a copy, so React state is never mutated. */
function produce(state: GameState, fn: (draft: GameState) => void): GameState {
  if (state.gameOver) throw new GameError('Game over. Start a new game.');
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

export const dismissReveal = (state: GameState) => produce(state, (s) => void (s.reveal = null));

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
    addNews(s, `"${project.name}" was scrapped. Half the budget was recovered.`, 'bad');
  });

export const scheduleShow = (state: GameState, slot: SlotId, showId: string | null) =>
  produce(state, (s) => {
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

export const dismissFinished = (state: GameState) => produce(state, (s) => void (s.newlyFinished = []));

export const usePromo = (state: GameState, cardId: string, targetId: string) =>
  produce(state, (s) => addNews(s, applyPromo(s, cardId, targetId), 'good'));

export const useSponsor = (state: GameState, cardId: string, showId: string) =>
  produce(state, (s) => addNews(s, applySponsor(s, cardId, showId), 'good'));

export const answerEvent = (state: GameState, choice: number) =>
  produce(state, (s) => addNews(s, resolvePendingEvent(s, choice), 'neutral'));

export const bidOnRights = (state: GameState, lotId: string, amount: number | null) =>
  produce(state, (s) => placeBid(s, lotId, amount));

export const assignSportsTeam = (state: GameState, rightsId: string, crewId: string, talentId: string) =>
  produce(state, (s) => assignTeam(s, rightsId, crewId, talentId));

export const dismissMilestone = (state: GameState) => produce(state, (s) => void (s.milestone = null));

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
  s.rivalRights = [];
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

export const dismissCeremony = (state: GameState) => produce(state, (s) => void (s.ceremony = null));

/** Let a person go for good. House staff can't be released. */
export const releasePerson = (state: GameState, personId: string) =>
  produce(state, (s) => {
    const p = s.people.find((x) => x.id === personId);
    if (!p) throw new GameError('Person not found.');
    if (p.house) throw new GameError('House staff stay with the station.');
    if (s.projects.some((pr) => projectPeople(pr).includes(p.id))) throw new GameError(`${p.name} is working on a show.`);
    s.people = s.people.filter((x) => x.id !== personId);
    addNews(s, `${p.name} leaves ${s.stationName}. Thanks for everything!`, 'neutral');
  });

// ---------- Airing ----------

/** How many shows on air share this show's format and topic (saturation). */
function saturation(state: GameState, show: Show): number {
  let same = 0;
  for (const slot of slotsOf(state)) {
    const id = state.schedule[slot];
    const other = id && id !== show.id ? state.shows.find((x) => x.id === id) : null;
    if (other) same += other.formatId === show.formatId ? (other.topicId === show.topicId ? 1 : 0.3) : 0;
    for (const rival of state.rivals) {
      const r = rival.schedule[slot];
      same += r.formatId === show.formatId ? (r.topicId === show.topicId ? 1 : 0.3) : 0;
    }
  }
  return same;
}

export const airWeek = (state: GameState) =>
  produce(state, (s) => {
    if (s.pendingEvent) throw new GameError('Answer the event first.');
    s.newlyFinished = [];
    s.ceremony = null;
    const period = periodOf(s.week);
    const viewerMod = s.modifiers.reduce((m, x) => m * x.mult, 1);
    const fall = isFallPremiere(s.week);
    const slots: SlotResult[] = [];
    const aired = new Set<string>();
    let reputationDelta = 0;

    const tierCfg = TIERS[s.tier];
    for (const block of tierCfg.blocks) {
      let prevShare = 0.1;
      for (const part of tierCfg.dayparts) {
        const slot = `${block}-${part}` as SlotId;
        // Sports games take over their slot; otherwise the scheduled show or film airs.
        const sports = sportsInSlot(s, slot);
        const film = sports ? null : s.rights.find((x) => x.id === s.schedule[slot]) ?? null;
        const show = sports || film ? null : s.shows.find((x) => x.id === s.schedule[slot]) ?? null;
        const rerun = !!show && show.episodesLeft <= 0;
        const premiere = !!show && !rerun && !show.premiered;
        let ours = FILLER_APPEAL;
        let entryName = FILLER_NAME;
        let kind: SlotResult['kind'] = undefined;
        let airings: number = AIRINGS[block];
        let cpmBonus = 1;
        if (show) {
          kind = 'show';
          entryName = show.name;
          ours = appeal({ quality: show.quality, novelty: show.novelty, fame: show.fame, formatId: show.formatId, block, part });
          if (rerun) ours *= 0.55;
          if (show.classic) ours *= 1.1;
          if (premiere) ours *= fall ? 1.3 : 1.15;
          ours *= 1 + (show.hype / 100) * HYPE_POWER;
          ours *= wordOfMouth(show.reviews);
        } else if (film) {
          kind = 'film';
          const def = rightsById(film.defId);
          entryName = def.name;
          ours = appeal({ quality: def.quality, novelty: film.novelty, fame: def.fame, formatId: 'movie', block, part });
          if (def.boostWeeks && s.week >= def.boostWeeks[0] && s.week <= def.boostWeeks[1]) ours *= 1.3;
        } else if (sports) {
          kind = 'sports';
          const def = rightsById(sports.defId);
          const q = sportsQuality(s, sports);
          entryName = `${def.short} vs ${opponent(s, def)}`;
          const playoffs = weeksToSeasonEnd(def, s.week) <= 2;
          ours = appeal({ quality: q.quality, novelty: clamp(80 + excitement(s), 0, 100), fame: q.fame, formatId: 'sports', block, part });
          if (playoffs) { ours *= 1.25; entryName += ' · Playoffs!'; }
          airings = SPORTS_AIRINGS;
          cpmBonus = SPORTS_CPM_BONUS;
          sports.games += 1;
        }
        if (kind) ours *= 1 + clamp((prevShare - 0.15) * 0.8, -0.06, 0.12);
        const rivalShows = s.rivals.map((r) => {
          const sport = rivalSportsInSlot(s, slot, r.id);
          return sport
            ? { name: `${sport.short} on ${r.short}`, formatId: 'sports', topicId: 'sports', quality: sport.quality + 5, novelty: 85, fame: sport.fame, weeksLeft: 1 }
            : r.schedule[slot];
        });
        const rivalAppeals = rivalShows.map((r) =>
          appeal({ quality: r.quality, novelty: r.novelty, fame: r.fame, formatId: r.formatId, block, part }));
        const total = ours + rivalAppeals.reduce((a, b) => a + b, 0) + OTHER_APPEAL;
        const share = ours / total;
        const rivalsHere = s.rivals.map((r, i) => ({ id: r.id, short: r.short, name: rivalShows[i].name, share: rivalAppeals[i] / total }))
          .sort((a, b) => b.share - a.share);
        const rivalShare = rivalsHere[0]?.share ?? 0;
        const watching = tierCfg.households * reachOf(s) * HUT[block][part] * period.viewing;
        const viewers = round1(watching * share * viewerMod);
        const revenue = round1((viewers * airings * CPM[part] * cpmBonus * period.adPrice * s.rateCard) / 1000);
        const won = !!kind && share > rivalShare;
        slots.push({
          kind, slot, showId: show?.id ?? film?.id ?? sports?.id ?? null, showName: entryName, rerun, premiere,
          viewers, share, revenue, rivalName: rivalsHere[0]?.name ?? '', rivalShare, won, rivals: rivalsHere,
        });
        prevShare = share;
        if (film) {
          film.airingsLeft -= 1;
          film.novelty = Math.max(0, film.novelty - (rightsById(film.defId).decay ?? 6));
        }
        if (kind) {
          if (show) aired.add(show.id);
          const weight = part === 'prime' ? 1.5 : 1;
          reputationDelta += ((share - 0.12) + (won ? 0.12 : 0)) * weight;
        }
      }
    }

    // Shows age after airing; shows resting off-air recover novelty.
    for (const show of s.shows) {
      if (aired.has(show.id)) {
        const res = slots.find((r) => r.showId === show.id)!;
        const rerun = res.rerun;
        const decay = formatById(show.formatId).decay * (1 + 0.45 * saturation(s, show)) * (rerun ? 1.5 : 1) * (show.classic ? 0.6 : 1);
        show.novelty = Math.max(0, round1(show.novelty - decay));
        show.history.push({ week: s.week, year: s.year, slot: res.slot, viewers: res.viewers, share: res.share });
        show.history = show.history.slice(-26);
        show.bestViewers = Math.max(show.bestViewers, res.viewers);
        if (res.premiere) {
          show.premiered = true;
          show.premieredAt = { week: s.week, year: s.year };
          show.reviews = makeReviews(s, show);
          res.reviews = show.reviews;
          reputationDelta += (show.reviews.critics - 50) / 8;
          addNews(s, `"${show.name}"${show.season > 1 ? ` season ${show.season}` : ''} premieres to ${Math.round(res.viewers)}K viewers. Critics ${show.reviews.critics}, audience ${show.reviews.audience}.`, 'good');
        }
        // Hype fades after each airing.
        show.hype = Math.round(show.hype * 0.6);
        if (!rerun) {
          show.episodesLeft -= 1;
          if (show.episodesLeft === 0) {
            addNews(s, `"${show.name}" airs its ${show.episodesTotal > 1 ? 'season finale' : 'premiere night'}. Renew it, rerun it or rest it.`, 'neutral');
          }
        }
      } else {
        show.novelty = Math.min(show.noveltyCap, round1(show.novelty + 3));
      }
    }

    if (!s.shopUnlocked && slots.some((r) => r.showId)) {
      s.shopUnlocked = true;
      addNews(s, 'The card shop is open! Buy packs for new formats, topics and people.', 'good');
    }

    // Sweeps months set the rate card for the months after.
    if (isSweeps(s.week)) {
      const avg = slots.reduce((sum, r) => sum + r.share, 0) / slots.length;
      s.sweeps.shareSum += avg;
      s.sweeps.samples += 1;
      const nextWeek = (s.week % 52) + 1;
      if (!isSweeps(nextWeek)) {
        const sweepsAvg = s.sweeps.shareSum / s.sweeps.samples;
        const old = s.rateCard;
        s.rateCard = round1(clamp(0.75 + sweepsAvg * 2.2, 0.75, 1.6) * 100) / 100;
        s.sweeps = { shareSum: 0, samples: 0 };
        addNews(s, `Sweeps are over: average share ${(sweepsAvg * 100).toFixed(1)}%. Ad prices ${s.rateCard >= old ? 'rise' : 'fall'} to ×${s.rateCard.toFixed(2)}.`, s.rateCard >= old ? 'good' : 'bad');
      }
    }

    // Sponsors pay while their show holds its share.
    let sponsors = 0;
    for (const deal of s.sponsorDeals) {
      const res = slots.find((r) => r.showId === deal.showId);
      if (res && res.share >= deal.minShare) {
        res.sponsorPay = deal.perWeek;
        sponsors += deal.perWeek;
      }
      deal.weeksLeft -= 1;
      if (deal.weeksLeft <= 0) addNews(s, `The ${networkById(deal.defId).name} sponsor deal has ended.`, 'neutral');
    }
    s.sponsorDeals = s.sponsorDeals.filter((d) => d.weeksLeft > 0);
    sponsors = round1(sponsors);
    s.modifiers = s.modifiers.map((m) => ({ ...m, weeksLeft: m.weeksLeft - 1 })).filter((m) => m.weeksLeft > 0);

    const revenue = round1(slots.reduce((sum, r) => sum + r.revenue, 0));
    let loanPayment = 0;
    if (s.loan) {
      loanPayment = Math.min(s.loan.payment, s.loan.balance);
      s.loan.balance = round1(s.loan.balance - loanPayment);
      if (s.loan.balance <= 0) {
        s.loan = null;
        addNews(s, 'The bank loan is paid off.', 'good');
      }
    }
    const net = round1(revenue + sponsors - tierCfg.overhead - loanPayment);
    s.cash = round1(s.cash + net);
    // Reputation fades unless you keep earning it.
    reputationDelta -= s.reputation * 0.02;
    s.reputation = round1(clamp(s.reputation + reputationDelta, 0, 100));

    recordRivalShares(s, slots);
    s.shareHistory.push(slots.reduce((sum, r) => sum + r.share, 0) / slots.length);
    if (s.shareHistory.length > 26) s.shareHistory.shift();
    if (s.tier === 'national' && !s.champion && s.shareHistory.length >= CHAMPION_WEEKS) {
      const avg = (xs: number[]) => xs.slice(-CHAMPION_WEEKS).reduce((a, b) => a + b, 0) / Math.min(CHAMPION_WEEKS, xs.length);
      const ours = avg(s.shareHistory);
      if (s.rivals.every((r) => r.history.length >= CHAMPION_WEEKS && avg(r.history) < ours)) {
        s.champion = true;
        s.milestone = 'champion';
        addNews(s, `👑 ${s.stationName} is the #1 network in the country!`, 'good');
      }
    }
    const wins = slots.filter((r) => r.won).length;
    if (wins > 0) addNews(s, `${s.stationName} wins ${wins} of ${slots.length} slots this week.`, 'good');

    s.lastResult = {
      week: s.week, year: s.year, slots, revenue, sponsors, overhead: tierCfg.overhead, loanPayment, net, reputationDelta: round1(reputationDelta),
    } satisfies WeekResult;

    // Studio work happens during the week too.
    const { finished, scripts } = advanceProjects(s);
    for (const p of scripts) {
      addNews(s, `Script done for "${p.name}": ${'★'.repeat(p.script!.stars)}${'☆'.repeat(5 - p.script!.stars)}. On to production.`, p.script!.stars >= 4 ? 'good' : 'neutral');
    }
    for (const show of finished) {
      if (show.classic) addNews(s, `🏆 Critics rave: "${show.name}" is a Show for the Ages! Quality ${show.quality}.`, 'good');
      else addNews(s, `"${show.name}"${show.season > 1 ? ` season ${show.season}` : ''} is ready to air. Quality ${show.quality}.`, 'good');
    }

    // Award season.
    for (const level of Object.keys(AWARD_WEEKS) as AwardLevel[]) {
      if (AWARD_WEEKS[level] !== s.week) continue;
      const ceremony = holdCeremony(s, level);
      if (ceremony) {
        s.ceremony = ceremony;
        const wins = ceremony.categories.filter((c) => c.weWon).length;
        addNews(s, wins
          ? `🏆 ${s.stationName} wins ${wins} award${wins > 1 ? 's' : ''} at the ${ceremony.title}!`
          : `${ceremony.title}: no wins for ${s.stationName} this year.`, wins ? 'good' : 'neutral');
      } else {
        addNews(s, `The ${AWARD_LEVELS[level].title} were held. You had no show that premiered this year.`, 'neutral');
      }
    }

    maybeStartEvent(s);

    // Next week.
    s.week += 1;
    if (s.week > 52) {
      s.week = 1;
      s.year += 1;
      addNews(s, `Happy new year! Year ${s.year} begins.`, 'neutral');
      for (const r of s.rivals) r.winsVsYou = 0;
    }
    for (const line of advanceRivals(s, s.week === 36, slots)) addNews(s, line, 'bad');
    for (const line of maybeCloseMarket(s)) addNews(s, line, line.startsWith('You win') ? 'good' : 'neutral');
    const opened = maybeOpenMarket(s);
    if (opened) addNews(s, opened, 'good');
    for (const line of expireRights(s)) addNews(s, line, 'neutral');
    if (s.week === 36) addNews(s, 'Fall premiere season starts! New shows get a big boost for the next 5 weeks.', 'neutral');

    // Money trouble: one bank loan, then game over.
    if (s.cash < 0) {
      if (!s.loanUsed) {
        s.loanUsed = true;
        s.loan = { balance: LOAN.total, payment: LOAN.payment };
        s.cash = round1(s.cash + LOAN.amount);
        addNews(s, `Cash ran out. The bank lends $${LOAN.amount}K, to be repaid at $${LOAN.payment}K a week. There will be no second loan.`, 'bad');
      } else {
        s.gameOver = `${s.stationName} ran out of money on ${dateLabel(s.week, s.year)}.`;
      }
    }
  });

export { GameError };
