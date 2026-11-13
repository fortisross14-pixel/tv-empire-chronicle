import type { NetworkKind, Rarity } from '../types';

export interface NetworkDef {
  id: string;
  kind: NetworkKind;
  name: string;
  icon: string;
  rarity: Rarity;
  text: string;
  /** Promo: hype added. */
  hype?: number;
  /** Facility: effect. */
  /** `floor`: that slider is done at this skill or better, whoever works it. */
  facility?: { floor?: { skill: 'sound' | 'image' | 'fx' | 'music' | 'set' | 'wardrobe'; value: number }; script?: number; screen?: number };
  /** Sponsor: deal terms. */
  sponsor?: { perWeek: number; weeks: number; minShare: number };
}

const d = (x: NetworkDef) => x;

export const NETWORK_CARDS: NetworkDef[] = [
  // Promo cards: use on a show before it premieres (or a project in production).
  d({ id: 'street-team', kind: 'promo', name: 'Street Team', icon: '📣', rarity: 'common', hype: 10, text: 'Flyers and free stickers downtown. +10 hype.' }),
  d({ id: 'social-blitz', kind: 'promo', name: 'Social Media Blitz', icon: '📱', rarity: 'common', hype: 15, text: 'Clips and memes everywhere. +15 hype.' }),
  d({ id: 'radio-spot', kind: 'promo', name: 'Radio Spot', icon: '📻', rarity: 'common', hype: 20, text: 'Drive-time ads on PEL-FM. +20 hype.' }),
  d({ id: 'newspaper', kind: 'promo', name: 'Gazette Feature', icon: '🗞️', rarity: 'rare', hype: 25, text: 'A full page in the Port Ellison Gazette. +25 hype.' }),
  d({ id: 'billboard', kind: 'promo', name: 'Highway Billboard', icon: '🪧', rarity: 'rare', hype: 30, text: 'Ten meters tall on Route 9. +30 hype.' }),
  d({ id: 'viral-teaser', kind: 'promo', name: 'Viral Teaser', icon: '🔥', rarity: 'epic', hype: 45, text: 'A teaser that everyone shares. +45 hype.' }),

  // Facility cards: permanent studio upgrades.
  d({ id: 'hd-cameras', kind: 'facility', name: 'HD Camera Kit', icon: '🎥', rarity: 'rare', facility: { floor: { skill: 'image', value: 55 } }, text: 'Visual art is done at skill 55 or better on every show.' }),
  d({ id: 'sound-booth', kind: 'facility', name: 'Sound Booth', icon: '🎚️', rarity: 'rare', facility: { floor: { skill: 'sound', value: 55 } }, text: 'Sound is done at skill 55 or better on every show.' }),
  d({ id: 'fx-workstation', kind: 'facility', name: 'FX Workstation', icon: '🖥️', rarity: 'rare', facility: { floor: { skill: 'fx', value: 50 } }, text: 'Visual effects are done at skill 50 or better on every show.' }),
  d({ id: 'music-library', kind: 'facility', name: 'Music Library', icon: '🎼', rarity: 'common', facility: { floor: { skill: 'music', value: 50 } }, text: 'Music is done at skill 50 or better on every show.' }),
  d({ id: 'set-workshop', kind: 'facility', name: 'Set Workshop', icon: '🪚', rarity: 'common', facility: { floor: { skill: 'set', value: 50 } }, text: 'Sets are built at skill 50 or better on every show.' }),
  d({ id: 'writers-room', kind: 'facility', name: "Writers' Room", icon: '☕', rarity: 'epic', facility: { script: 5 }, text: 'Every writer scores +5 on scripts.' }),
  d({ id: 'makeup-room', kind: 'facility', name: 'Makeup & Green Room', icon: '💄', rarity: 'epic', facility: { screen: 5 }, text: 'Every on-screen person scores +5 screen power.' }),

  // Sponsor cards: attach to a show; pays weekly while the show holds its share.
  d({ id: 'sparkle-cola', kind: 'sponsor', name: 'Sparkle Cola', icon: '🥤', rarity: 'common', sponsor: { perWeek: 1.5, weeks: 8, minShare: 0.15 }, text: '$1.5K/week for 8 weeks while the show keeps 15% share.' }),
  d({ id: 'burger-barn', kind: 'sponsor', name: 'Burger Barn', icon: '🍔', rarity: 'common', sponsor: { perWeek: 2, weeks: 6, minShare: 0.2 }, text: '$2K/week for 6 weeks while the show keeps 20% share.' }),
  d({ id: 'glow-cosmetics', kind: 'sponsor', name: 'Glow Cosmetics', icon: '✨', rarity: 'rare', sponsor: { perWeek: 2.5, weeks: 10, minShare: 0.18 }, text: '$2.5K/week for 10 weeks while the show keeps 18% share.' }),
  d({ id: 'ellison-motors', kind: 'sponsor', name: 'Ellison Motors', icon: '🚗', rarity: 'rare', sponsor: { perWeek: 3.5, weeks: 8, minShare: 0.25 }, text: '$3.5K/week for 8 weeks while the show keeps 25% share.' }),
  d({ id: 'megamart', kind: 'sponsor', name: 'MegaMart', icon: '🛒', rarity: 'epic', sponsor: { perWeek: 5, weeks: 12, minShare: 0.22 }, text: '$5K/week for 12 weeks while the show keeps 22% share.' }),
];

export const NETWORK_BY_ID: Record<string, NetworkDef> = Object.fromEntries(NETWORK_CARDS.map((x) => [x.id, x]));
export const networkById = (id: string) => NETWORK_BY_ID[id];

export const NETWORK_KIND_LABEL: Record<NetworkKind, string> = { promo: 'Promo', facility: 'Studio upgrade', sponsor: 'Sponsor' };
