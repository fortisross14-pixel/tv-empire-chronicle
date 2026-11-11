import type {
  CrewCard, CrewSkill, GameState, Genre, Person, PersonKind, Rarity, TalentCard, TalentSkill, WriterCard,
} from './types';
import { clamp, pick, randInt, weighted } from './rng';
import { FIRST_NAMES, LAST_NAMES } from './data/names';

export const CREW_SKILLS: CrewSkill[] = ['direction', 'production', 'sound', 'image', 'fx', 'music', 'art'];
export const GENRES: Genre[] = ['factual', 'entertainment', 'drama', 'comedy'];
export const TALENT_SKILLS: TalentSkill[] = ['hosting', 'acting', 'charisma', 'fame'];

export const CREW_SKILL_LABEL: Record<CrewSkill, string> = {
  direction: 'Direction', production: 'Producing', sound: 'Sound', image: 'Image', fx: 'FX', music: 'Music', art: 'Visual art',
};
export const GENRE_LABEL: Record<Genre, string> = {
  factual: 'Factual', entertainment: 'Entertainment', drama: 'Drama', comedy: 'Comedy',
};
export const TALENT_SKILL_LABEL: Record<TalentSkill, string> = {
  hosting: 'Hosting', acting: 'Acting', charisma: 'Charisma', fame: 'Fame',
};
export const KIND_LABEL: Record<PersonKind, string> = {
  crew: 'Crew', writer: 'Writer', talent: 'On-screen',
};

/** Primary skill range and seasons of use per rarity. */
const RARITY: Record<Rarity, { primary: [number, number]; other: [number, number]; uses: number; fame: [number, number] }> = {
  common: { primary: [42, 58], other: [8, 38], uses: 4, fame: [3, 18] },
  rare: { primary: [56, 72], other: [12, 45], uses: 5, fame: [12, 32] },
  epic: { primary: [70, 85], other: [18, 52], uses: 5, fame: [28, 52] },
  legend: { primary: [84, 96], other: [25, 60], uses: 3, fame: [55, 85] },
};

export const RARITY_WEIGHTS: Record<Rarity, number> = { common: 62, rare: 28, epic: 9, legend: 1 };

export function newId(state: GameState, prefix: string): string {
  state.nextId += 1;
  return `${prefix}${state.nextId}`;
}

function personName(state: GameState): string {
  const taken = new Set(state.people.map((p) => p.name));
  for (let i = 0; i < 20; i++) {
    const name = `${pick(state, FIRST_NAMES)} ${pick(state, LAST_NAMES)}`;
    if (!taken.has(name)) return name;
  }
  return `${pick(state, FIRST_NAMES)} ${pick(state, LAST_NAMES)} Jr.`;
}

function rollSkills<K extends string>(state: GameState, keys: readonly K[], rarity: Rarity, primaryCount: number): Record<K, number> {
  const r = RARITY[rarity];
  const primaries = new Set<K>();
  while (primaries.size < primaryCount) primaries.add(pick(state, keys));
  const out = {} as Record<K, number>;
  for (const key of keys) {
    out[key] = primaries.has(key) ? randInt(state, ...r.primary) : randInt(state, ...r.other);
  }
  return out;
}

export function makePerson(state: GameState, kind: PersonKind, rarity: Rarity): Person {
  const base = {
    id: newId(state, 'p'),
    name: personName(state),
    rarity,
    uses: RARITY[rarity].uses,
    xp: 0,
    level: 1,
    hue: randInt(state, 0, 359),
  };
  if (kind === 'crew') {
    // Crew get one strong specialty, sometimes two.
    const skills = rollSkills(state, CREW_SKILLS, rarity, randInt(state, 1, 2));
    return { ...base, kind, skills } satisfies CrewCard;
  }
  if (kind === 'writer') {
    const skills = rollSkills(state, GENRES, rarity, randInt(state, 1, 2));
    return { ...base, kind, skills, speed: randInt(state, 25, 85) } satisfies WriterCard;
  }
  const skills = rollSkills(state, ['hosting', 'acting', 'charisma'] as const, rarity, randInt(state, 1, 2));
  const fame = randInt(state, ...RARITY[rarity].fame);
  return { ...base, kind, skills: { ...skills, fame } } satisfies TalentCard;
}

/** Adds the three generalists you start the game with. */
export function addStarterPeople(state: GameState): void {
  const crew = makePerson(state, 'crew', 'common') as CrewCard;
  crew.skills = { direction: 50, production: 46, sound: 38, image: 42, fx: 14, music: 26, art: 34 };
  state.people.push(crew);
  const writer = makePerson(state, 'writer', 'common') as WriterCard;
  writer.skills = { factual: 48, entertainment: 46, drama: 30, comedy: 28 };
  writer.speed = 50;
  state.people.push(writer);
  const talent = makePerson(state, 'talent', 'common') as TalentCard;
  talent.skills = { hosting: 50, acting: 24, charisma: 44, fame: 8 };
  state.people.push(talent);
}

export function rollPeoplePack(state: GameState): Person[] {
  const out: Person[] = [];
  for (let i = 0; i < 3; i++) {
    const kind = weighted<PersonKind>(state, { crew: 45, writer: 25, talent: 30 });
    out.push(makePerson(state, kind, weighted(state, RARITY_WEIGHTS)));
  }
  return out;
}

/** Best skill value for display. */
export function topSkill(p: Person): number {
  const entries = Object.entries(p.skills).filter(([k]) => k !== 'fame');
  return Math.max(...entries.map(([, v]) => v as number));
}

/** Overall card rating shown on the card face. */
export function overall(p: Person): number {
  const vals = Object.entries(p.skills).filter(([k]) => k !== 'fame').map(([, v]) => v as number).sort((a, b) => b - a);
  return Math.round(vals[0] * 0.7 + (vals[1] ?? vals[0]) * 0.3);
}

/** XP: 1 per season worked; level up every 2 XP. Improves the person's best skills. */
export function grantXp(state: GameState, person: Person): boolean {
  person.xp += 1;
  const newLevel = 1 + Math.floor(person.xp / 2);
  if (newLevel <= person.level) return false;
  person.level = newLevel;
  const skills = person.skills as Record<string, number>;
  const keys = Object.keys(skills).filter((k) => k !== 'fame');
  const sorted = [...keys].sort((a, b) => skills[b] - skills[a]);
  sorted.slice(0, 2).forEach((k) => (skills[k] = clamp(skills[k] + randInt(state, 3, 5), 0, 99)));
  skills[pick(state, sorted.slice(2))] += randInt(state, 1, 3);
  if (person.kind === 'talent') person.skills.fame = clamp(person.skills.fame + randInt(state, 2, 5), 0, 99);
  return true;
}
