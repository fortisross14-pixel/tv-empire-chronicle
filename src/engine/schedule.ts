import type { Daypart, DayBlock, GameState, SlotId, Tier } from './types';

export interface TierConfig {
  label: string;
  blocks: DayBlock[];
  dayparts: Daypart[];
  /** Thousands of TV households reached. */
  households: number;
  /** Station running costs per week ($K). */
  overhead: number;
}

export const TIERS: Record<Tier, TierConfig> = {
  local: { label: 'Local station', blocks: ['weekday', 'weekend'], dayparts: ['morning', 'evening', 'prime'], households: 420, overhead: 7 },
  state: {
    label: 'State network', blocks: ['monwed', 'thufri', 'weekend'], dayparts: ['morning', 'afternoon', 'evening', 'prime', 'late'],
    households: 2400, overhead: 30,
  },
};

export const slotsFor = (tier: Tier): SlotId[] =>
  TIERS[tier].blocks.flatMap((d) => TIERS[tier].dayparts.map((p) => `${d}-${p}` as SlotId));
export const slotsOf = (state: Pick<GameState, 'tier'>) => slotsFor(state.tier);
export const emptySchedule = (tier: Tier) => Object.fromEntries(slotsFor(tier).map((s) => [s, null])) as Record<SlotId, string | null>;

/** Local defaults, kept for tests and the first tier. */
export const DAY_BLOCKS: DayBlock[] = TIERS.local.blocks;
export const DAYPARTS: Daypart[] = TIERS.local.dayparts;
export const SLOTS: SlotId[] = slotsFor('local');

export const DAY_BLOCK_LABEL: Record<DayBlock, string> = { weekday: 'Weekdays', monwed: 'Mon–Wed', thufri: 'Thu–Fri', weekend: 'Weekend' };
export const DAYPART_LABEL: Record<Daypart, string> = {
  morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening', prime: 'Prime time', late: 'Late night',
};
export const DAYPART_ICON: Record<Daypart, string> = { morning: '🌅', afternoon: '☀️', evening: '🌆', prime: '🌙', late: '🦉' };

/** Weekday blocks share weekday viewing habits. */
export const isWeekdayBlock = (b: DayBlock) => b !== 'weekend';

/** Where a local slot lives on a bigger schedule (Friday games move to Thu–Fri). */
export function tierSlot(slot: SlotId, tier: Tier): SlotId {
  if (tier === 'local') return slot;
  const { block, part } = slotParts(slot);
  if (block === 'weekday') return `${part === 'prime' ? 'thufri' : 'monwed'}-${part}` as SlotId;
  return slot;
}

export const slotParts = (slot: SlotId) => {
  const [block, part] = slot.split('-') as [DayBlock, Daypart];
  return { block, part };
};
export const slotLabel = (slot: SlotId) => {
  const { block, part } = slotParts(slot);
  return `${DAY_BLOCK_LABEL[block]} ${DAYPART_LABEL[part]}`;
};

/** Share of households watching TV at all. */
const WEEKDAY_HUT: Record<Daypart, number> = { morning: 0.24, afternoon: 0.3, evening: 0.42, prime: 0.6, late: 0.28 };
export const HUT: Record<DayBlock, Record<Daypart, number>> = {
  weekday: WEEKDAY_HUT, monwed: WEEKDAY_HUT, thufri: WEEKDAY_HUT,
  weekend: { morning: 0.3, afternoon: 0.36, evening: 0.4, prime: 0.55, late: 0.3 },
};
/** Airings per week a slot represents. */
export const AIRINGS: Record<DayBlock, number> = { weekday: 5, monwed: 3, thufri: 2, weekend: 2 };
/** Ad revenue in $ per 1,000 viewers per airing. */
export const CPM: Record<Daypart, number> = { morning: 18, afternoon: 16, evening: 26, prime: 36, late: 22 };
/** Appeal of everything else on TV (cable, streaming, other locals). */
export const OTHER_APPEAL = 0.9;
export const FILLER_APPEAL = 0.1;
export const FILLER_NAME = 'Infomercials & old reruns';
