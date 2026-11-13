import type { GameState, OwnedIp, Show } from './types';
import { ADAPTATIONS, ipDefById, ipWorth, type IpDef } from './data/ips';
import { formatById } from './data/formats';
import { clamp } from './rng';
import { newId } from './people';
import { addNews } from './news';

export { ipWorth };

const absWeek = (s: Pick<GameState, 'week' | 'year'>) => s.year * 52 + s.week;

/** What basing a show on an IP brings, by how well the IP suits the format. */
export const IP_FIT = {
  1: { label: 'A stretch', fame: 0.15, hype: 0.1, quality: -2 },
  2: { label: 'Works', fame: 0.3, hype: 0.2, quality: 1 },
  3: { label: 'Made for it', fame: 0.45, hype: 0.3, quality: 4 },
} as const;

/** A season this good (0–100) makes a show an IP of its own. */
export const OWN_IP_MIN = 55;
/** Below this a season hurts the IP it was based on. */
export const IP_FLOP = 40;

export const ipFit = (ip: Pick<OwnedIp, 'fits'>, formatId: string): 1 | 2 | 3 => ip.fits[formatId] ?? 1;

export function ipBonus(ip: OwnedIp, formatId: string) {
  const fit = ipFit(ip, formatId);
  const f = IP_FIT[fit];
  return { fit, label: f.label, fame: Math.round(ip.rating * f.fame), hype: Math.round(ip.rating * f.hype), quality: f.quality };
}

/**
 * Advertisers pay more for a name people know: extra ad revenue for a show based on an IP,
 * up to +50% for a world-famous one in a format made for it.
 */
export const ipPremium = (ip: Pick<OwnedIp, 'rating' | 'fits'>, formatId: string): number =>
  Math.min(0.5, (ip.rating / 200) * [0, 0.5, 0.8, 1][ipFit(ip, formatId)]);

/** IPs a new show can be based on right now. */
export const usableIps = (s: GameState) => s.ips.filter((x) => x.expires === null || x.expires >= absWeek(s));

export function licenseIp(s: GameState, def: IpDef): OwnedIp {
  const owned: OwnedIp = {
    id: newId(s, 'ip'), defId: def.id, name: def.name, icon: def.icon, kind: def.kind, rating: def.rating,
    topicId: def.topicId, fits: { ...def.fits }, expires: absWeek(s) + def.weeks, shows: 0, originShowId: null,
  };
  s.ips.push(owned);
  return owned;
}

/** 0–100: how a finished season did, from its reviews and its share. */
export function seasonScore(show: Show): number {
  const aired = show.history.slice(-Math.max(1, show.episodesTotal));
  const share = aired.reduce((sum, h) => sum + h.share, 0) / Math.max(1, aired.length);
  const reviews = show.reviews ? (show.reviews.audience + show.reviews.critics) / 2 : show.quality;
  const awards = show.awards.length ? 8 : 0;
  return clamp(Math.round(reviews * 0.5 + clamp(share * 400, 0, 100) * 0.5 + awards + (show.classic ? 6 : 0)), 0, 100);
}

/** Our own show turned IP: its own format fits best, then its natural adaptations. */
function ownFits(formatId: string): OwnedIp['fits'] {
  const fits: OwnedIp['fits'] = { [formatId]: 3 };
  for (const f of ADAPTATIONS[formatId] ?? []) fits[f] = 2;
  return fits;
}

/**
 * At a season finale: a hit makes the show an IP of its own, and every season moves
 * the rating of the IP it belongs to.
 */
export function settleSeasonIp(s: GameState, show: Show): void {
  const score = seasonScore(show);
  const ip = show.ipId ? s.ips.find((x) => x.id === show.ipId) : undefined;
  if (!ip) {
    if (show.ipId || score < OWN_IP_MIN) return;
    const own: OwnedIp = {
      id: newId(s, 'ip'), defId: null, name: show.name, icon: formatById(show.formatId).icon, kind: 'show',
      rating: Math.round(score * 0.6), topicId: show.topicId, fits: ownFits(show.formatId), expires: null, shows: 1, originShowId: show.id,
    };
    s.ips.push(own);
    show.ipId = own.id;
    addNews(s, `"${show.name}" is a hit: it is now an IP of yours (rating ${own.rating}, worth $${ipWorth(own.rating)}K). Make spin-offs, movies and more from it.`, 'good');
    return;
  }
  const before = ip.rating;
  if (score >= IP_FLOP) ip.rating = clamp(Math.round(ip.rating + Math.max(2, (score - ip.rating) * 0.3)), 0, 100);
  else ip.rating = clamp(ip.rating - 5, 5, 100);
  if (ip.rating !== before) {
    const up = ip.rating > before;
    addNews(s, `${ip.icon} ${ip.name} ${up ? 'grows' : 'loses fans'}: IP rating ${before} → ${ip.rating}.`, up ? 'good' : 'bad');
  }
}

/** Licensed IP ends; shows already made keep airing. Returns news lines. */
export function expireIps(s: GameState): string[] {
  const now = absWeek(s);
  const news: string[] = [];
  s.ips = s.ips.filter((x) => {
    if (x.expires === null || x.expires >= now) return true;
    news.push(`Your license for ${x.name} has ended. Shows already made keep airing.`);
    for (const show of s.shows) if (show.ipId === x.id) show.ipId = null;
    return false;
  });
  s.rivalIps = s.rivalIps.filter((x) => x.expires >= now);
  return news;
}

export const ipDefOf = (ip: OwnedIp) => (ip.defId ? ipDefById(ip.defId) : undefined);
