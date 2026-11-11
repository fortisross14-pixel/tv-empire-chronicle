// 52-week year. Week 1 is the first week of January.

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** 52 weeks split into 12 months of 4–5 weeks. */
export function monthOf(week: number): number {
  return Math.min(11, Math.floor(((week - 1) * 12) / 52));
}

export function weekOfMonth(week: number): number {
  let first = week;
  while (first > 1 && monthOf(first - 1) === monthOf(week)) first--;
  return week - first + 1;
}

export interface Period {
  id: 'winter' | 'spring' | 'summer' | 'fall' | 'holidays';
  label: string;
  blurb: string;
  /** Multiplier on people watching TV. */
  viewing: number;
  /** Multiplier on ad prices. */
  adPrice: number;
}

const PERIODS: Record<Period['id'], Period> = {
  winter: { id: 'winter', label: 'Winter', blurb: 'Cold nights, everyone is home. Strong viewing.', viewing: 1.12, adPrice: 0.95 },
  spring: { id: 'spring', label: 'Spring', blurb: 'Normal viewing. May sweeps decide summer ad prices.', viewing: 1.0, adPrice: 1.0 },
  summer: { id: 'summer', label: 'Summer slump', blurb: 'People are outside. Low viewing — a good time to build.', viewing: 0.78, adPrice: 0.8 },
  fall: { id: 'fall', label: 'Fall premieres', blurb: 'The big season. New shows get a premiere boost, rivals launch too.', viewing: 1.08, adPrice: 1.15 },
  holidays: { id: 'holidays', label: 'Holidays', blurb: 'Families watch together. Ad prices peak.', viewing: 1.05, adPrice: 1.3 },
};

export function periodOf(week: number): Period {
  if (week >= 49) return PERIODS.holidays;
  if (week >= 36) return PERIODS.fall;
  if (week >= 23) return PERIODS.summer;
  if (week >= 14) return PERIODS.spring;
  return PERIODS.winter;
}

/** Sweeps months: Feb, May, Nov. Ratings then set the rate card for the next months. */
export function isSweeps(week: number): boolean {
  const m = monthOf(week);
  return m === 1 || m === 4 || m === 10;
}

export function isFallPremiere(week: number): boolean {
  return week >= 36 && week <= 40;
}

export function dateLabel(week: number, year: number): string {
  return `${MONTHS[monthOf(week)]} · Week ${weekOfMonth(week)} · Year ${year}`;
}

export interface CalendarMarker {
  week: number;
  label: string;
}

/** Upcoming notable dates for the calendar strip. */
export function upcomingMarkers(week: number, count = 3): CalendarMarker[] {
  const marks: CalendarMarker[] = [
    { week: 5, label: 'Feb sweeps' },
    { week: 14, label: 'Spring' },
    { week: 18, label: 'May sweeps' },
    { week: 23, label: 'Summer slump' },
    { week: 36, label: 'Fall premieres' },
    { week: 44, label: 'Nov sweeps' },
    { week: 49, label: 'Holidays' },
  ];
  const out: CalendarMarker[] = [];
  for (let i = 1; i <= 52 && out.length < count; i++) {
    const w = ((week - 1 + i) % 52) + 1;
    const m = marks.find((x) => x.week === w);
    if (m) out.push({ week: i, label: m.label });
  }
  return out;
}
