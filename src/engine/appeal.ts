import type { DayBlock, Daypart } from './types';
import { formatById } from './data/formats';

/** How attractive a show is to viewers in a given slot. Used for player and rival shows. */
export function appeal(opts: {
  quality: number; novelty: number; fame: number; formatId: string; block: DayBlock; part: Daypart;
}): number {
  const format = formatById(opts.formatId);
  const base = 0.15 + Math.pow(opts.quality / 100, 1.4) * 1.1;
  const freshness = 0.35 + 0.65 * (opts.novelty / 100);
  const star = 1 + (opts.fame / 100) * 0.3;
  const fit = format.fit[opts.part] * (opts.block === 'weekend' ? format.weekendFit : 1);
  return base * freshness * star * fit;
}

/** Daypart fit as 1–3 stars, for the UI. */
export function fitStars(formatId: string, block: DayBlock, part: Daypart): 1 | 2 | 3 {
  const format = formatById(formatId);
  const fit = format.fit[part] * (block === 'weekend' ? format.weekendFit : 1);
  if (fit >= 1.1) return 3;
  if (fit >= 0.95) return 2;
  return 1;
}
