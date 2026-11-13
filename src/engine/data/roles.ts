// Who appears on screen. Each format has a lead part and a few optional ones; every part
// asks for two skills. The show's topic adds a third skill for the lead (an action show
// wants a physical lead, a quiz a brainy one).
import type { AgeGroup, ScreenSkill, TalentCard } from '../types';

export interface Role {
  id: string;
  name: string;
  /** The two skills the part needs, most important first. */
  skills: [ScreenSkill, ScreenSkill];
  /** Optional parts can stay empty; filling them well adds screen power. */
  optional?: boolean;
  /** Age groups that suit the part (a small bonus, never a rule). */
  ages?: AgeGroup[];
}

const lead = (id: string, name: string, a: ScreenSkill, b: ScreenSkill, ages?: AgeGroup[]): Role => ({ id, name, skills: [a, b], ages });
const extra = (id: string, name: string, a: ScreenSkill, b: ScreenSkill, ages?: AgeGroup[]): Role => ({ id, name, skills: [a, b], optional: true, ages });

export const FORMAT_ROLES: Record<string, Role[]> = {
  news: [lead('anchor', 'Anchor', 'hosting', 'voice'), extra('coanchor', 'Co-anchor', 'hosting', 'looks'), extra('analyst', 'Analyst', 'brain', 'voice')],
  talk: [lead('host', 'Host', 'hosting', 'brain'), extra('cohost', 'Co-host', 'hosting', 'looks')],
  contest: [lead('host', 'Host', 'hosting', 'voice'), extra('cohost', 'Co-host', 'looks', 'hosting'), extra('judge', 'Judge', 'brain', 'hosting')],
  reality: [lead('host', 'Host', 'hosting', 'looks'), extra('judge', 'Judge', 'brain', 'voice')],
  magazine: [lead('host', 'Host', 'hosting', 'looks'), extra('reporter', 'Reporter', 'brain', 'voice')],
  documentary: [lead('narrator', 'Narrator', 'voice', 'brain', ['adult', 'senior']), extra('expert', 'Expert', 'brain', 'hosting')],
  series: [lead('lead', 'Lead actor', 'acting', 'looks'), extra('colead', 'Co-lead', 'acting', 'voice'), extra('support', 'Supporting actor', 'acting', 'physical')],
  sitcom: [lead('lead', 'Lead actor', 'acting', 'voice'), extra('colead', 'Co-lead', 'acting', 'looks'), extra('support', 'Supporting actor', 'acting', 'brain')],
  movie: [lead('lead', 'Lead actor', 'acting', 'looks'), extra('colead', 'Co-lead', 'acting', 'physical'), extra('support', 'Supporting actor', 'acting', 'voice')],
  animation: [lead('lead', 'Lead voice', 'voice', 'acting'), extra('colead', 'Second voice', 'voice', 'acting'), extra('singer', 'Singer', 'voice', 'looks')],
  'late-show': [lead('host', 'Host', 'hosting', 'brain'), extra('singer', 'Band leader', 'voice', 'looks')],
  sports: [lead('host', 'Commentator', 'hosting', 'voice')],
};

export const rolesFor = (formatId: string): Role[] => FORMAT_ROLES[formatId] ?? [lead('host', 'Host', 'hosting', 'voice')];
export const leadRole = (formatId: string): Role => rolesFor(formatId)[0];

/** The extra skill a topic asks of the lead. */
export const TOPIC_SCREEN: Record<string, ScreenSkill> = {
  'local-news': 'voice', weather: 'looks', 'sports-news': 'physical', 'political-news': 'brain', 'business-news': 'brain', 'crime-beat': 'voice',
  cooking: 'looks', 'martial-arts': 'physical', music: 'voice', trivia: 'brain', dating: 'looks', home: 'physical', survival: 'physical',
  celebrity: 'looks', nature: 'voice', 'true-crime': 'voice', medical: 'brain', police: 'physical', family: 'looks', workplace: 'brain',
  medieval: 'physical', scifi: 'brain', romance: 'looks', wellness: 'physical', travel: 'looks', 'local-life': 'voice', teen: 'looks',
  fashion: 'looks', pets: 'voice', history: 'brain', politics: 'brain', business: 'brain', sports: 'physical',
};
/** Age groups a topic suits, for the lead. */
export const TOPIC_AGES: Record<string, AgeGroup[]> = { teen: ['teen', 'young'], family: ['child', 'adult'], pets: ['child', 'young'], history: ['adult', 'senior'] };

export const AGE_LABEL: Record<AgeGroup, string> = { child: 'Child', teen: 'Teen', young: 'Young adult', adult: 'Adult', senior: 'Senior' };
export const SCREEN_SKILL_LABEL: Record<ScreenSkill, string> = { hosting: 'Hosting', acting: 'Acting', physical: 'Physical', voice: 'Voice', looks: 'Looks', brain: 'Brain' };

/** What a part asks for: its two skills, plus the topic's skill and ages for the lead. */
export function roleProfile(formatId: string, role: Role, topicId?: string | null): { skills: ScreenSkill[]; ages: AgeGroup[] } {
  const isLead = role.id === leadRole(formatId).id;
  const flavor = isLead && topicId ? TOPIC_SCREEN[topicId] : undefined;
  const skills: ScreenSkill[] = flavor && !role.skills.includes(flavor) ? [...role.skills, flavor] : [...role.skills];
  return { skills, ages: [...(role.ages ?? []), ...((isLead && topicId && TOPIC_AGES[topicId]) || [])] };
}

/** 0–100: how well a person plays a part. */
export function roleScore(formatId: string, role: Role, person: TalentCard, topicId?: string | null): number {
  const { skills, ages } = roleProfile(formatId, role, topicId);
  const s = person.skills;
  const base = skills.length === 3 ? s[skills[0]] * 0.5 + s[skills[1]] * 0.3 + s[skills[2]] * 0.2 : s[skills[0]] * 0.6 + s[skills[1]] * 0.4;
  return Math.min(100, base + (ages.includes(person.age) ? 4 : 0));
}

/** Screen power bonus from an optional part: nothing for a poor fit, up to about +6 for a great one. */
export const supportBonus = (score: number): number => Math.max(0, (score - 35) * 0.1);
