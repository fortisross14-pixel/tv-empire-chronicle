import type { GameState, NewsItem, Pack, PackKind, Show, SlotId, SlotResult, WeekResult } from './types';
import { clamp } from './rng';
import { dateLabel, isFallPremiere, isSweeps, periodOf } from './calendar';
import { formatById } from './data/formats';
import { CITY } from './data/names';
import { addHouseCards, newId } from './people';
import { applyPack, makePack, PRICES } from './packs';
import { advanceProjects, GameError, startProject, type ShowPlan } from './production';
import { advanceRivals, makeRivals } from './rivals';
import { appeal } from './appeal';
import {
  AIRINGS, CPM, DAYPARTS, DAY_BLOCKS, FILLER_APPEAL, FILLER_NAME, HUT, MARKET_HOUSEHOLDS, OTHER_APPEAL, OVERHEAD, SLOTS,
} from './schedule';

export const SAVE_VERSION = 4;
export const START_CASH = 120;
export const LOAN = { amount: 100, total: 125, payment: 2.5 };

const round1 = (v: number) => Math.round(v * 10) / 10;

export function newGame(seed: number, stationName: string): GameState {
  const state: GameState = {
    version: SAVE_VERSION,
    rng: seed | 0,
    stationName: stationName.trim() || 'Channel 8',
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
    schedule: Object.fromEntries(SLOTS.map((s) => [s, null])) as Record<SlotId, string | null>,
    rivals: [],
    unopened: [],
    reveal: null,
    businessCards: 0,
    lastResult: null,
    news: [],
    knownFormats: [],
    sweeps: { shareSum: 0, samples: 0 },
    shopUnlocked: false,
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

export const buyPack = (state: GameState, kind: Extract<PackKind, 'program' | 'people'>) =>
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
    if (showId && !s.shows.some((x) => x.id === showId)) throw new GameError('Show not found.');
    for (const other of SLOTS) if (showId && s.schedule[other] === showId) s.schedule[other] = null;
    s.schedule[slot] = showId;
  });

export const cancelShow = (state: GameState, showId: string) =>
  produce(state, (s) => {
    const show = s.shows.find((x) => x.id === showId);
    if (!show) throw new GameError('Show not found.');
    if (s.projects.some((p) => p.showId === showId)) throw new GameError('A new season is in production.');
    s.shows = s.shows.filter((x) => x.id !== showId);
    for (const slot of SLOTS) if (s.schedule[slot] === showId) s.schedule[slot] = null;
    addNews(s, `${s.stationName} cancels "${show.name}".`, 'neutral');
  });

export const dismissFinished = (state: GameState) => produce(state, (s) => void (s.newlyFinished = []));

// ---------- Airing ----------

/** How many shows on air share this show's format and topic (saturation). */
function saturation(state: GameState, show: Show): number {
  let same = 0;
  for (const slot of SLOTS) {
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
    s.newlyFinished = [];
    const period = periodOf(s.week);
    const fall = isFallPremiere(s.week);
    const slots: SlotResult[] = [];
    const aired = new Set<string>();
    let reputationDelta = 0;
    const rival = s.rivals[0];

    for (const block of DAY_BLOCKS) {
      let prevShare = 0.1;
      for (const part of DAYPARTS) {
        const slot = `${block}-${part}` as SlotId;
        const show = s.shows.find((x) => x.id === s.schedule[slot]) ?? null;
        const rerun = !!show && show.episodesLeft <= 0;
        const premiere = !!show && !rerun && !show.premiered;
        let ours = FILLER_APPEAL;
        if (show) {
          ours = appeal({ quality: show.quality, novelty: show.novelty, fame: show.fame, formatId: show.formatId, block, part });
          if (rerun) ours *= 0.55;
          if (show.classic) ours *= 1.1;
          if (premiere) ours *= fall ? 1.3 : 1.15;
          ours *= 1 + clamp((prevShare - 0.15) * 0.8, -0.06, 0.12);
        }
        const rivalShows = s.rivals.map((r) => r.schedule[slot]);
        const rivalAppeals = rivalShows.map((r) =>
          appeal({ quality: r.quality, novelty: r.novelty, fame: r.fame, formatId: r.formatId, block, part }));
        const total = ours + rivalAppeals.reduce((a, b) => a + b, 0) + OTHER_APPEAL;
        const share = ours / total;
        const rivalShare = rivalAppeals[0] / total;
        const watching = MARKET_HOUSEHOLDS * HUT[block][part] * period.viewing;
        const viewers = round1(watching * share);
        const revenue = round1((viewers * AIRINGS[block] * CPM[part] * period.adPrice * s.rateCard) / 1000);
        const won = !!show && share > rivalShare;
        slots.push({
          slot, showId: show?.id ?? null, showName: show?.name ?? FILLER_NAME, rerun, premiere,
          viewers, share, revenue, rivalName: rivalShows[0].name, rivalShare, won,
        });
        prevShare = share;
        if (show) {
          aired.add(show.id);
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
          addNews(s, `"${show.name}"${show.season > 1 ? ` season ${show.season}` : ''} premieres to ${Math.round(res.viewers)}K viewers.`, 'good');
        }
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
    const net = round1(revenue - OVERHEAD - loanPayment);
    s.cash = round1(s.cash + net);
    // Reputation fades unless you keep earning it.
    reputationDelta -= s.reputation * 0.02;
    s.reputation = round1(clamp(s.reputation + reputationDelta, 0, 100));

    const wins = slots.filter((r) => r.won).length;
    if (wins > 0 && rival) addNews(s, `${s.stationName} beats ${rival.short} in ${wins} of ${slots.length} slots this week.`, 'good');

    s.lastResult = {
      week: s.week, year: s.year, slots, revenue, overhead: OVERHEAD, loanPayment, net, reputationDelta: round1(reputationDelta),
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

    // Next week.
    s.week += 1;
    if (s.week > 52) {
      s.week = 1;
      s.year += 1;
      addNews(s, `Happy new year! Year ${s.year} begins.`, 'neutral');
    }
    for (const line of advanceRivals(s, s.week === 36)) addNews(s, line, 'bad');
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
