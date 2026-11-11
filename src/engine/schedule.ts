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
    households: 2400, overhead: 38,
  },
  national: {
    label: 'National network', blocks: ['montue', 'wedthu', 'fri', 'weekend'], dayparts: ['morning', 'afternoon', 'evening', 'prime', 'late'],
    households: 10000, overhead: 160,
  },
};

/** National: reach grows with affiliates (50% with none, 100% with 10). */
export const AFFILIATE_MAX = 10;
export const reachOf = (s: Pick<GameState, 'tier' | 'affiliates'>) => (s.tier === 'national' ? 0.5 + 0.05 * Math.min(AFFILIATE_MAX, s.affiliates) : 1);
export const affiliateCost = (signed: number) => 500 + signed * 250;
/** Weekly running costs. A national network pays for the reach it has (affiliates add both). */
export const overheadOf = (s: Pick<GameState, 'tier' | 'affiliates'>) => Math.round(TIERS[s.tier].overhead * reachOf(s));

export const slotsFor = (tier: Tier): SlotId[] =>
  TIERS[tier].blocks.flatMap((d) => TIERS[tier].dayparts.map((p) => `${d}-${p}` as SlotId));
export const slotsOf = (state: Pick<GameState, 'tier'>) => slotsFor(state.tier);
export const emptySchedule = (tier: Tier) => Object.fromEntries(slotsFor(tier).map((s) => [s, null])) as Record<SlotId, string | null>;

/** Local defaults, kept for tests and the first tier. */
export const DAY_BLOCKS: DayBlock[] = TIERS.local.blocks;
export const DAYPARTS: Daypart[] = TIERS.local.dayparts;
export const SLOTS: SlotId[] = slotsFor('local');

export const DAY_BLOCK_LABEL: Record<DayBlock, string> = {
  weekday: 'Weekdays', monwed: 'Mon–Wed', thufri: 'Thu–Fri', montue: 'Mon–Tue', wedthu: 'Wed–Thu', fri: 'Friday', weekend: 'Weekend',
};
export const DAYPART_LABEL: Record<Daypart, string> = {
  morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening', prime: 'Prime time', late: 'Late night',
};
export const DAYPART_ICON: Record<Daypart, string> = { morning: '🌅', afternoon: '☀️', evening: '🌆', prime: '🌙', late: '🦉' };

/** Weekday blocks share weekday viewing habits. */
export const isWeekdayBlock = (b: DayBlock) => b !== 'weekend';

/** Where a slot lives on another tier's schedule. Friday prime (football) follows Friday. */
export function tierSlot(slot: SlotId, tier: Tier): SlotId {
  const { block, part } = slotParts(slot);
  if (block === 'weekend') return slot;
  const friday = part === 'prime' && (block === 'weekday' || block === 'thufri' || block === 'fri');
  if (tier === 'local') return `weekday-${part}` as SlotId;
  if (tier === 'state') return `${friday || block === 'thufri' || block === 'wedthu' || block === 'fri' ? 'thufri' : 'monwed'}-${part}` as SlotId;
  if (friday) return `fri-${part}` as SlotId;
  if (block === 'thufri' || block === 'wedthu') return `wedthu-${part}` as SlotId;
  if (block === 'fri') return `fri-${part}` as SlotId;
  return `montue-${part}` as SlotId;
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
  weekday: WEEKDAY_HUT, monwed: WEEKDAY_HUT, thufri: WEEKDAY_HUT, montue: WEEKDAY_HUT, wedthu: WEEKDAY_HUT,
  fri: { morning: 0.24, afternoon: 0.3, evening: 0.4, prime: 0.56, late: 0.32 },
  weekend: { morning: 0.3, afternoon: 0.36, evening: 0.4, prime: 0.55, late: 0.3 },
};
/** Airings per week a slot represents. */
export const AIRINGS: Record<DayBlock, number> = { weekday: 5, monwed: 3, thufri: 2, montue: 2, wedthu: 2, fri: 1, weekend: 2 };
/** Ad revenue in $ per 1,000 viewers per airing. */
export const CPM: Record<Daypart, number> = { morning: 18, afternoon: 16, evening: 26, prime: 36, late: 22 };
/** Appeal of everything else on TV (cable, streaming, other locals). */
export const OTHER_APPEAL = 0.9;
export const FILLER_APPEAL = 0.1;
export const FILLER_NAME = 'Infomercials & old reruns';
