import type { PosterSpec } from '../../engine';
import { EFFECTS, FRAMES, FRONTS, SCENES, type PosterAsset } from './assets.gen';

export { EFFECTS, FRAMES, FRONTS, SCENES };

/** Background colour or sky, drawn in CSS (no art needed). */
export interface Sky { id: string; label: string; css: string; kind: 'plain' | 'gradient' | 'sky' }

const clouds = 'radial-gradient(ellipse 18% 9% at 22% 30%, rgba(255,255,255,.95) 60%, transparent 62%), radial-gradient(ellipse 14% 8% at 30% 26%, rgba(255,255,255,.95) 60%, transparent 62%), radial-gradient(ellipse 20% 9% at 72% 46%, rgba(255,255,255,.9) 60%, transparent 62%), radial-gradient(ellipse 12% 7% at 80% 41%, rgba(255,255,255,.9) 60%, transparent 62%)';
const stars = 'radial-gradient(1.5px 1.5px at 12% 18%, #fff 50%, transparent 51%), radial-gradient(1px 1px at 30% 40%, #fff 50%, transparent 51%), radial-gradient(1.5px 1.5px at 52% 12%, #fff 50%, transparent 51%), radial-gradient(1px 1px at 70% 30%, #fff 50%, transparent 51%), radial-gradient(1.5px 1.5px at 86% 16%, #fff 50%, transparent 51%), radial-gradient(1px 1px at 92% 46%, #fff 50%, transparent 51%), radial-gradient(1px 1px at 8% 52%, #fff 50%, transparent 51%), radial-gradient(1.5px 1.5px at 42% 58%, #fff 50%, transparent 51%)';

export const SKIES: Sky[] = [
  { id: 'plain-red', label: 'Red', css: '#d93a3a', kind: 'plain' },
  { id: 'plain-yellow', label: 'Yellow', css: '#f4c430', kind: 'plain' },
  { id: 'plain-teal', label: 'Teal', css: '#1aa39a', kind: 'plain' },
  { id: 'plain-blue', label: 'Blue', css: '#2f5fd0', kind: 'plain' },
  { id: 'plain-purple', label: 'Purple', css: '#6a3fc2', kind: 'plain' },
  { id: 'plain-black', label: 'Black', css: '#14121c', kind: 'plain' },
  { id: 'grad-sunset', label: 'Sunset', css: 'linear-gradient(180deg, #ff7e5f, #feb47b)', kind: 'gradient' },
  { id: 'grad-ocean', label: 'Ocean', css: 'linear-gradient(180deg, #2193b0, #6dd5ed)', kind: 'gradient' },
  { id: 'grad-candy', label: 'Candy', css: 'linear-gradient(135deg, #ff6a88, #ffb199)', kind: 'gradient' },
  { id: 'grad-forest', label: 'Forest', css: 'linear-gradient(180deg, #134e5e, #71b280)', kind: 'gradient' },
  { id: 'grad-fire', label: 'Fire', css: 'linear-gradient(180deg, #f12711, #f5af19)', kind: 'gradient' },
  { id: 'grad-royal', label: 'Royal', css: 'linear-gradient(135deg, #3a1c71, #d76d77)', kind: 'gradient' },
  { id: 'sky-day', label: 'Sky with clouds', css: `${clouds}, linear-gradient(180deg, #5aa9ff, #bfe3ff)`, kind: 'sky' },
  { id: 'sky-sunset', label: 'Sunset clouds', css: `${clouds}, linear-gradient(180deg, #ff9966, #ff5e62 60%, #6a3093)`, kind: 'sky' },
  { id: 'sky-night', label: 'Night sky', css: `${stars}, radial-gradient(circle at 80% 18%, #fff6cf 0 6%, transparent 7%), linear-gradient(180deg, #0b1033, #2b2d6e)`, kind: 'sky' },
  { id: 'sky-space', label: 'Deep space', css: `${stars}, radial-gradient(ellipse at 30% 70%, rgba(160,80,255,.45), transparent 60%), #07061a`, kind: 'sky' },
];
export const skyById = (id: string) => SKIES.find((s) => s.id === id) ?? SKIES[12];

/** Title fonts (Google Fonts, loaded in index.html), by mood. */
export const FONTS = [
  { id: 'bungee', label: 'Blockbuster', family: "'Bungee', sans-serif" },
  { id: 'abril', label: 'Drama', family: "'Abril Fatface', serif" },
  { id: 'luckiest', label: 'Comedy', family: "'Luckiest Guy', sans-serif" },
  { id: 'oswald', label: 'News', family: "'Oswald', sans-serif" },
  { id: 'pacifico', label: 'Retro script', family: "'Pacifico', cursive" },
  { id: 'creepster', label: 'Horror', family: "'Creepster', cursive" },
  { id: 'orbitron', label: 'Sci-fi', family: "'Orbitron', sans-serif" },
  { id: 'rye', label: 'Western', family: "'Rye', serif" },
  { id: 'marker', label: 'Handwritten', family: "'Permanent Marker', cursive" },
  { id: 'playfair', label: 'Classic', family: "'Playfair Display', serif" },
] as const;
export const fontById = (id: string) => FONTS.find((f) => f.id === id) ?? FONTS[0];

export const TITLE_COLORS = ['#ffffff', '#ffd23f', '#ff4d4d', '#5ce1ff', '#ff7ad9', '#14121c'];

// ---------- Automatic posters ----------

/** Small deterministic RNG so a show always gets the same automatic poster. */
function seeded(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

const FORMAT_FONT: Record<string, string> = {
  news: 'oswald', talk: 'luckiest', contest: 'bungee', reality: 'bungee', magazine: 'playfair', documentary: 'playfair',
  series: 'abril', sitcom: 'luckiest', movie: 'abril', animation: 'luckiest', 'late-show': 'pacifico', sports: 'bungee',
};
const TOPIC_FONT: Record<string, string> = { scifi: 'orbitron', romance: 'pacifico', dating: 'pacifico', 'true-crime': 'creepster', history: 'rye' };
const FORMAT_SKY: Record<string, string[]> = {
  news: ['plain-blue', 'grad-ocean'], talk: ['grad-sunset', 'grad-candy'], contest: ['plain-yellow', 'grad-fire'], reality: ['sky-day', 'grad-forest'],
  magazine: ['grad-candy', 'sky-day'], documentary: ['grad-forest', 'sky-day'], series: ['grad-royal', 'sky-night'], sitcom: ['grad-candy', 'plain-yellow'],
  movie: ['sky-night', 'sky-sunset'], animation: ['sky-day', 'plain-yellow'], 'late-show': ['sky-night', 'plain-purple'], sports: ['sky-day', 'plain-red'],
};

interface PosterSubject { id: string; name: string; formatId: string; topicId?: string | null; topic2Id?: string | null }

function pickFor(rand: () => number, list: PosterAsset[], tags: string[]): PosterAsset | null {
  for (const tag of tags) {
    const matches = list.filter((a) => a.tags.includes(tag));
    if (matches.length) return matches[Math.floor(rand() * matches.length)];
  }
  return null;
}

/** A fitting poster for a show from its format and topics. Same show, same poster. */
export function autoPoster(subject: PosterSubject, salt = ''): PosterSpec {
  const rand = seeded(subject.id + salt);
  const tags = [subject.topicId, subject.topic2Id, subject.formatId].filter((t): t is string => !!t);
  const scene = pickFor(rand, SCENES, tags);
  const front = pickFor(rand, FRONTS, tags) ?? FRONTS.find((f) => f.id === 'front-camera')!;
  const second = subject.topic2Id ? pickFor(rand, FRONTS.filter((f) => f.id !== front.id), [subject.topic2Id]) : null;
  const effect = rand() < 0.45 ? pickFor(rand, EFFECTS, tags) : null;
  const skies = FORMAT_SKY[subject.formatId] ?? ['sky-day'];
  return {
    sky: skies[Math.floor(rand() * skies.length)],
    scene: scene && rand() < 0.8 ? scene.id : null,
    fronts: second ? [front.id, second.id] : [front.id],
    effect: effect?.id ?? null,
    frame: rand() < 0.35 ? FRAMES[Math.floor(rand() * FRAMES.length)].id : null,
    title: {
      show: true,
      font: (subject.topicId && TOPIC_FONT[subject.topicId]) || FORMAT_FONT[subject.formatId] || 'bungee',
      color: TITLE_COLORS[Math.floor(rand() * 3)],
      size: subject.name.length > 22 ? 's' : 'm',
      position: rand() < 0.7 ? 'top' : 'bottom',
    },
  };
}

/** A random variation for the 🎲 button, still fitting the show. */
export const shufflePoster = (subject: PosterSubject) => autoPoster(subject, String(Math.random()));
