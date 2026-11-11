import type { Daypart, DayBlock, SlotId } from './types';

export const DAY_BLOCKS: DayBlock[] = ['weekday', 'weekend'];
export const DAYPARTS: Daypart[] = ['morning', 'evening', 'prime'];
export const SLOTS: SlotId[] = DAY_BLOCKS.flatMap((d) => DAYPARTS.map((p) => `${d}-${p}` as SlotId));

export const DAY_BLOCK_LABEL: Record<DayBlock, string> = { weekday: 'Weekdays', weekend: 'Weekend' };
export const DAYPART_LABEL: Record<Daypart, string> = { morning: 'Morning', evening: 'Evening', prime: 'Prime time' };
export const DAYPART_ICON: Record<Daypart, string> = { morning: '🌅', evening: '🌆', prime: '🌙' };

export const slotParts = (slot: SlotId) => {
  const [block, part] = slot.split('-') as [DayBlock, Daypart];
  return { block, part };
};
export const slotLabel = (slot: SlotId) => {
  const { block, part } = slotParts(slot);
  return `${DAY_BLOCK_LABEL[block]} ${DAYPART_LABEL[part]}`;
};

/** Thousands of TV households in the local market. */
export const MARKET_HOUSEHOLDS = 420;
/** Share of households watching TV at all. */
export const HUT: Record<DayBlock, Record<Daypart, number>> = {
  weekday: { morning: 0.24, evening: 0.42, prime: 0.6 },
  weekend: { morning: 0.3, evening: 0.4, prime: 0.55 },
};
/** Airings per week a slot represents. */
export const AIRINGS: Record<DayBlock, number> = { weekday: 5, weekend: 2 };
/** Ad revenue in $ per 1,000 viewers per airing. */
export const CPM: Record<Daypart, number> = { morning: 18, evening: 26, prime: 36 };
/** Station running costs per week ($K). */
export const OVERHEAD = 7;
/** Appeal of everything else on TV (cable, streaming, other locals). */
export const OTHER_APPEAL = 0.9;
export const FILLER_APPEAL = 0.1;
export const FILLER_NAME = 'Infomercials & old reruns';
