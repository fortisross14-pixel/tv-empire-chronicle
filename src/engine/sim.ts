// The weekly simulation, as named steps. `airWeek` in game.ts runs them in order on a draft state.
import type { AwardLevel, GameState, Show, SlotId, SlotResult, WeekResult } from './types';
import { clamp } from './rng';
import { dateLabel, isFallPremiere, isSweeps, periodOf, type Period } from './calendar';
import { formatById } from './data/formats';
import { networkById } from './data/network';
import { rightsById, weeksToSeasonEnd } from './data/rights';
import { appeal } from './appeal';
import { HYPE_POWER } from './network';
import { makeReviews, wordOfMouth } from './reviews';
import { maybeStartEvent } from './events';
import { AWARD_LEVELS, AWARD_WEEKS, holdCeremony } from './awards';
import { advanceProjects } from './production';
import { advanceRivals, recordRivalShares } from './rivals';
import {
  excitement, expireRights, maybeCloseMarket, maybeOpenMarket, opponent, rivalSportsInSlot, sportsInSlot, sportsQuality,
  SPORTS_AIRINGS, SPORTS_CPM_BONUS,
} from './rights';
import {
  AIRINGS, CPM, FILLER_APPEAL, FILLER_NAME, HUT, OTHER_APPEAL, TIERS, reachOf, slotsOf,
} from './schedule';
import { addNews, round1 } from './news';
import { expireIps, settleSeasonIp } from './ip';
import { MOVIE_NOVELTY } from './rights';

const TIER_ORDER = ['local', 'state', 'national'] as const;

// ---------- Tuning ----------
export const APPEAL = {
  rerun: 0.55,
  classic: 1.1,
  premiere: 1.15,
  fallPremiere: 1.3,
  holidayFilmBoost: 1.3,
  playoffs: 1.25,
  /** Lead-in: each point of share above 15% in the previous slot adds 0.8 points of appeal, within these bounds. */
  leadIn: { pivot: 0.15, slope: 0.8, min: -0.06, max: 0.12 },
};
export const NOVELTY = {
  /** Decay multiplier per matching show on air (same format; topic match counts fully). */
  saturation: 0.45,
  rerunDecay: 1.5,
  classicDecay: 0.6,
  /** Points recovered per week off the air. */
  restRecovery: 3,
};
/** Hype left after each airing. */
export const HYPE_FADE = 0.6;
export const REPUTATION = {
  /** Share below this costs reputation. */
  baseline: 0.12,
  winBonus: 0.12,
  primeWeight: 1.5,
  /** Points per critic point above 50 on a premiere. */
  criticsPerPoint: 1 / 8,
  /** Fraction of reputation lost each week. */
  decay: 0.02,
};
export const SWEEPS_RATE = { base: 0.75, perShare: 2.2, min: 0.75, max: 1.6 };
export const CHAMPION_WEEKS = 13;
export const SHARE_HISTORY_CAP = 26;
export const SHOW_HISTORY_CAP = 26;
export const LOAN = { amount: 100, total: 125, payment: 2.5 };

/** Working state for one week. */
export interface WeekContext {
  period: Period;
  slots: SlotResult[];
  aired: Set<string>;
  reputationDelta: number;
}

// ---------- Steps ----------

/** Air every slot: our show, film or sports against the rivals. */
export function airSlots(s: GameState): WeekContext {
  const ctx: WeekContext = { period: periodOf(s.week), slots: [], aired: new Set(), reputationDelta: 0 };
  const viewerMod = s.modifiers.reduce((m, x) => m * x.mult, 1);
  const fall = isFallPremiere(s.week);
  const tier = TIERS[s.tier];
  for (const block of tier.blocks) {
    let prevShare = 0.1;
    for (const part of tier.dayparts) {
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
        if (rerun) ours *= APPEAL.rerun;
        if (show.classic) ours *= APPEAL.classic;
        if (premiere) ours *= fall ? APPEAL.fallPremiere : APPEAL.premiere;
        ours *= 1 + (show.hype / 100) * HYPE_POWER;
        ours *= wordOfMouth(show.reviews);
      } else if (film) {
        kind = 'film';
        const def = rightsById(film.defId);
        entryName = def.name;
        ours = appeal({ quality: def.quality, novelty: film.novelty, fame: def.fame, formatId: 'movie', block, part });
        // A new release's first TV airing is an event, like a premiere.
        if (def.isNew && film.airingsLeft === def.airings) ours *= APPEAL.premiere;
        if (def.boostWeeks && s.week >= def.boostWeeks[0] && s.week <= def.boostWeeks[1]) ours *= APPEAL.holidayFilmBoost;
      } else if (sports) {
        kind = 'sports';
        const def = rightsById(sports.defId);
        const q = sportsQuality(s, sports);
        entryName = `${def.short} vs ${opponent(s, def)}`;
        ours = appeal({ quality: q.quality, novelty: clamp(80 + excitement(s), 0, 100), fame: q.fame, formatId: 'sports', block, part });
        if (weeksToSeasonEnd(def, s.week) <= 2) { ours *= APPEAL.playoffs; entryName += ' · Playoffs!'; }
        airings = SPORTS_AIRINGS;
        cpmBonus = SPORTS_CPM_BONUS;
        sports.games += 1;
      }
      const L = APPEAL.leadIn;
      if (kind) ours *= 1 + clamp((prevShare - L.pivot) * L.slope, L.min, L.max);
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
      // A local team's games are watched by its local fans, whatever the network's size.
      const sportsTier = sports ? rightsById(sports.defId).tier : null;
      const households = sportsTier && sportsTier !== 'national' && sportsTier !== s.tier && TIER_ORDER.indexOf(sportsTier) < TIER_ORDER.indexOf(s.tier)
        ? TIERS[sportsTier].households : tier.households * reachOf(s);
      const watching = households * HUT[block][part] * ctx.period.viewing;
      const viewers = round1(watching * share * viewerMod);
      const revenue = round1((viewers * airings * CPM[part] * cpmBonus * ctx.period.adPrice * s.rateCard) / 1000);
      const won = !!kind && share > rivalShare;
      ctx.slots.push({
        kind, slot, showId: show?.id ?? film?.id ?? sports?.id ?? null, showName: entryName, rerun, premiere,
        viewers, share, revenue, rivalName: rivalsHere[0]?.name ?? '', rivalShare, won, rivals: rivalsHere,
      });
      prevShare = share;
      if (film) {
        film.airingsLeft -= 1;
        const fdef = rightsById(film.defId);
        // Pack movies: a new release drops to classic novelty after its premiere; classics stay put.
        film.novelty = fdef.rarity ? (fdef.isNew ? MOVIE_NOVELTY.classic : film.novelty) : Math.max(0, film.novelty - (fdef.decay ?? 6));
      }
      if (kind) {
        if (show) ctx.aired.add(show.id);
        const weight = part === 'prime' ? REPUTATION.primeWeight : 1;
        ctx.reputationDelta += ((share - REPUTATION.baseline) + (won ? REPUTATION.winBonus : 0)) * weight;
      }
    }
  }
  return ctx;
}

/** How many shows on air share this show's format and topic (saturation). */
export function saturation(state: GameState, show: Show): number {
  let same = 0;
  const match = (formatId: string, topicId: string) => (formatId === show.formatId ? (topicId === show.topicId ? 1 : 0.3) : 0);
  for (const slot of slotsOf(state)) {
    const id = state.schedule[slot];
    const other = id && id !== show.id ? state.shows.find((x) => x.id === id) : null;
    if (other) same += match(other.formatId, other.topicId);
    for (const rival of state.rivals) {
      const r = rival.schedule[slot];
      if (r) same += match(r.formatId, r.topicId);
    }
  }
  return same;
}

/** Shows age after airing (premieres get reviews); shows resting off-air recover novelty. */
export function ageShows(s: GameState, ctx: WeekContext): void {
  for (const show of s.shows) {
    if (!ctx.aired.has(show.id)) {
      show.novelty = Math.min(show.noveltyCap, round1(show.novelty + NOVELTY.restRecovery));
      continue;
    }
    const res = ctx.slots.find((r) => r.showId === show.id)!;
    const decay = formatById(show.formatId).decay
      * (1 + NOVELTY.saturation * saturation(s, show))
      * (res.rerun ? NOVELTY.rerunDecay : 1)
      * (show.classic ? NOVELTY.classicDecay : 1);
    show.novelty = Math.max(0, round1(show.novelty - decay));
    show.history.push({ week: s.week, year: s.year, slot: res.slot, viewers: res.viewers, share: res.share });
    if (show.history.length > SHOW_HISTORY_CAP) show.history.splice(0, show.history.length - SHOW_HISTORY_CAP);
    show.bestViewers = Math.max(show.bestViewers, res.viewers);
    if (res.premiere) {
      show.premiered = true;
      show.premieredAt = { week: s.week, year: s.year };
      show.reviews = makeReviews(s, show);
      res.reviews = show.reviews;
      ctx.reputationDelta += (show.reviews.critics - 50) * REPUTATION.criticsPerPoint;
      addNews(s, `"${show.name}"${show.season > 1 ? ` season ${show.season}` : ''} premieres to ${Math.round(res.viewers)}K viewers. Critics ${show.reviews.critics}, audience ${show.reviews.audience}.`, 'good');
    }
    show.hype = Math.round(show.hype * HYPE_FADE);
    if (!res.rerun) {
      show.episodesLeft -= 1;
      if (show.episodesLeft === 0) {
        settleSeasonIp(s, show);
        addNews(s, `"${show.name}" airs its ${show.episodesTotal > 1 ? 'season finale' : 'premiere night'}. Renew it, rerun it or rest it.`, 'neutral');
      }
    }
  }
  if (!s.shopUnlocked && ctx.slots.some((r) => r.showId)) {
    s.shopUnlocked = true;
    addNews(s, 'The card shop is open! Buy packs for new formats, topics and people.', 'good');
  }
}

const avgShare = (slots: SlotResult[]) => slots.reduce((sum, r) => sum + r.share, 0) / Math.max(1, slots.length);

/** Sweeps months set the rate card for the months after. */
export function runSweeps(s: GameState, ctx: WeekContext): void {
  if (!isSweeps(s.week)) return;
  s.sweeps.shareSum += avgShare(ctx.slots);
  s.sweeps.samples += 1;
  if (isSweeps((s.week % 52) + 1)) return;
  const sweepsAvg = s.sweeps.shareSum / s.sweeps.samples;
  const old = s.rateCard;
  const R = SWEEPS_RATE;
  s.rateCard = Math.round(clamp(R.base + sweepsAvg * R.perShare, R.min, R.max) * 100) / 100;
  s.sweeps = { shareSum: 0, samples: 0 };
  const up = s.rateCard >= old;
  addNews(s, `Sweeps are over: average share ${(sweepsAvg * 100).toFixed(1)}%. Ad prices ${up ? 'rise' : 'fall'} to ×${s.rateCard.toFixed(2)}.`, up ? 'good' : 'bad');
}

/** Sponsors pay while their show holds its share. Returns this week's sponsor income. */
export function paySponsors(s: GameState, ctx: WeekContext): number {
  let sponsors = 0;
  for (const deal of s.sponsorDeals) {
    const res = ctx.slots.find((r) => r.showId === deal.showId);
    if (res && res.share >= deal.minShare) {
      res.sponsorPay = deal.perWeek;
      sponsors += deal.perWeek;
    }
    deal.weeksLeft -= 1;
    if (deal.weeksLeft <= 0) addNews(s, `The ${networkById(deal.defId).name} sponsor deal has ended.`, 'neutral');
  }
  s.sponsorDeals = s.sponsorDeals.filter((d) => d.weeksLeft > 0);
  s.modifiers = s.modifiers.map((m) => ({ ...m, weeksLeft: m.weeksLeft - 1 })).filter((m) => m.weeksLeft > 0);
  return round1(sponsors);
}

/** Money and reputation for the week; records the week result. */
export function settleWeek(s: GameState, ctx: WeekContext, sponsors: number): void {
  const revenue = round1(ctx.slots.reduce((sum, r) => sum + r.revenue, 0));
  let loanPayment = 0;
  if (s.loan) {
    loanPayment = Math.min(s.loan.payment, s.loan.balance);
    s.loan.balance = round1(s.loan.balance - loanPayment);
    if (s.loan.balance <= 0) {
      s.loan = null;
      addNews(s, 'The bank loan is paid off.', 'good');
    }
  }
  const overhead = TIERS[s.tier].overhead;
  const net = round1(revenue + sponsors - overhead - loanPayment);
  s.cash = round1(s.cash + net);
  ctx.reputationDelta -= s.reputation * REPUTATION.decay;
  s.reputation = round1(clamp(s.reputation + ctx.reputationDelta, 0, 100));
  s.lastResult = {
    week: s.week, year: s.year, slots: ctx.slots, revenue, sponsors, overhead, loanPayment, net,
    reputationDelta: round1(ctx.reputationDelta),
  } satisfies WeekResult;
}

/** Shares for the rivals' AI and the #1 network race. */
export function trackShares(s: GameState, ctx: WeekContext): void {
  recordRivalShares(s, ctx.slots);
  s.shareHistory.push(avgShare(ctx.slots));
  if (s.shareHistory.length > SHARE_HISTORY_CAP) s.shareHistory.shift();
  if (s.tier === 'national' && !s.champion && s.shareHistory.length >= CHAMPION_WEEKS) {
    const avg = (xs: number[]) => xs.slice(-CHAMPION_WEEKS).reduce((a, b) => a + b, 0) / Math.min(CHAMPION_WEEKS, xs.length);
    const ours = avg(s.shareHistory);
    if (s.rivals.every((r) => r.history.length >= CHAMPION_WEEKS && avg(r.history) < ours)) {
      s.champion = true;
      s.milestone = 'champion';
      addNews(s, `👑 ${s.stationName} is the #1 network in the country!`, 'good');
    }
  }
  const wins = ctx.slots.filter((r) => r.won).length;
  if (wins > 0) addNews(s, `${s.stationName} wins ${wins} of ${ctx.slots.length} slots this week.`, 'good');
}

/** Studio work happens during the week too. */
export function studioWeek(s: GameState): void {
  const { finished, scripts } = advanceProjects(s);
  for (const p of scripts) {
    const stars = p.script!.stars;
    addNews(s, `Script done for "${p.name}": ${'★'.repeat(stars)}${'☆'.repeat(5 - stars)}. On to production.`, stars >= 4 ? 'good' : 'neutral');
  }
  for (const show of finished) {
    if (show.classic) addNews(s, `🏆 Critics rave: "${show.name}" is a Show for the Ages! Quality ${show.quality}.`, 'good');
    else addNews(s, `"${show.name}"${show.season > 1 ? ` season ${show.season}` : ''} is ready to air. Quality ${show.quality}.`, 'good');
  }
}

export function awardSeason(s: GameState): void {
  for (const level of Object.keys(AWARD_WEEKS) as AwardLevel[]) {
    if (AWARD_WEEKS[level] !== s.week) continue;
    const ceremony = holdCeremony(s, level);
    if (!ceremony) {
      addNews(s, `The ${AWARD_LEVELS[level].title} were held. You had no show that premiered this year.`, 'neutral');
      continue;
    }
    s.ceremony = ceremony;
    const wins = ceremony.categories.filter((c) => c.weWon).length;
    addNews(s, wins
      ? `🏆 ${s.stationName} wins ${wins} award${wins > 1 ? 's' : ''} at the ${ceremony.title}!`
      : `${ceremony.title}: no wins for ${s.stationName} this year.`, wins ? 'good' : 'neutral');
  }
}

/** Move to next week: rivals, rights market, expiries, calendar news. */
export function nextWeek(s: GameState, ctx: WeekContext): void {
  maybeStartEvent(s);
  s.week += 1;
  if (s.week > 52) {
    s.week = 1;
    s.year += 1;
    addNews(s, `Happy new year! Year ${s.year} begins.`, 'neutral');
    for (const r of s.rivals) r.winsVsYou = 0;
  }
  for (const line of advanceRivals(s, s.week === 36, ctx.slots)) addNews(s, line, 'bad');
  for (const line of maybeCloseMarket(s)) addNews(s, line, line.startsWith('You win') ? 'good' : 'neutral');
  const opened = maybeOpenMarket(s);
  if (opened) addNews(s, opened, 'good');
  for (const line of expireRights(s)) addNews(s, line, 'neutral');
  for (const line of expireIps(s)) addNews(s, line, 'neutral');
  if (s.week === 36) addNews(s, 'Fall premiere season starts! New shows get a big boost for the next 5 weeks.', 'neutral');
}

/** Money trouble: one bank loan, then game over. */
export function checkBankruptcy(s: GameState): void {
  if (s.cash >= 0) return;
  if (!s.loanUsed) {
    s.loanUsed = true;
    s.loan = { balance: LOAN.total, payment: LOAN.payment };
    s.cash = round1(s.cash + LOAN.amount);
    addNews(s, `Cash ran out. The bank lends $${LOAN.amount}K, to be repaid at $${LOAN.payment}K a week. There will be no second loan.`, 'bad');
  } else {
    s.gameOver = `${s.stationName} ran out of money on ${dateLabel(s.week, s.year)}.`;
  }
}

/** One full week, in order. */
export function simulateWeek(s: GameState): void {
  s.newlyFinished = [];
  s.ceremony = null;
  const ctx = airSlots(s);
  ageShows(s, ctx);
  runSweeps(s, ctx);
  const sponsors = paySponsors(s, ctx);
  settleWeek(s, ctx, sponsors);
  trackShares(s, ctx);
  studioWeek(s);
  awardSeason(s);
  nextWeek(s, ctx);
  checkBankruptcy(s);
}
