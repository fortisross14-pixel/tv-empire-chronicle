import type { CrewCard, GameState, NetworkCard, Rarity, TalentCard, WriterCard } from './types';
import { pick, weighted } from './rng';
import { NETWORK_CARDS, networkById } from './data/network';
import { newId } from './people';
import { GameError } from './errors';

export const NETWORK_PACK_SIZE = 2;
export const FACILITY_REFUND = 8;
/** Share of hype that turns into extra appeal: 100 hype = +60%. */
export const HYPE_POWER = 0.6;

const NETWORK_RARITY: Record<Rarity, number> = { common: 60, rare: 30, epic: 10, legend: 0 };

export function rollNetworkCards(state: GameState): NetworkCard[] {
  const out: NetworkCard[] = [];
  for (let i = 0; i < NETWORK_PACK_SIZE; i++) {
    const rarity = weighted(state, NETWORK_RARITY);
    const pool = NETWORK_CARDS.filter((c) => c.rarity === rarity);
    out.push({ id: newId(state, 'nc'), defId: pick(state, pool).id });
  }
  return out;
}

/** Copies of the team with studio upgrades applied. */
export function withFacilities(state: GameState, writer: WriterCard, crew: CrewCard, talent: TalentCard) {
  const w = structuredClone(writer);
  const c = structuredClone(crew);
  const t = structuredClone(talent);
  for (const id of state.facilities) {
    const f = networkById(id)?.facility;
    if (!f) continue;
    if (f.floor) c.skills[f.floor.skill] = Math.max(c.skills[f.floor.skill], f.floor.value);
    if (f.script) for (const k of Object.keys(w.skills) as (keyof WriterCard['skills'])[]) w.skills[k] += f.script;
    if (f.screen) {
      t.skills.hosting += f.screen;
      t.skills.acting += f.screen;
    }
  }
  return { writer: w, crew: c, talent: t };
}

function takeCard(state: GameState, cardId: string, kind: 'promo' | 'sponsor') {
  const card = state.networkCards.find((c) => c.id === cardId);
  if (!card) throw new GameError('Card not found.');
  const def = networkById(card.defId);
  if (def.kind !== kind) throw new GameError(`That is not a ${kind} card.`);
  state.networkCards = state.networkCards.filter((c) => c.id !== cardId);
  return def;
}

/** Promo cards go on a project in production or a show that has not premiered yet. */
export function applyPromo(state: GameState, cardId: string, targetId: string): string {
  const project = state.projects.find((p) => p.id === targetId);
  const show = state.shows.find((s) => s.id === targetId);
  if (!project && !(show && !show.premiered)) throw new GameError('Promos work before a premiere.');
  const def = takeCard(state, cardId, 'promo');
  const target = project ?? show!;
  target.hype = Math.min(100, target.hype + (def.hype ?? 0));
  return `${def.name} builds buzz for "${target.name}" (hype ${target.hype}).`;
}

export function applySponsor(state: GameState, cardId: string, showId: string): string {
  const show = state.shows.find((s) => s.id === showId);
  if (!show) throw new GameError('Show not found.');
  if (state.sponsorDeals.some((d) => d.showId === showId)) throw new GameError('This show already has a sponsor.');
  const def = takeCard(state, cardId, 'sponsor');
  const terms = def.sponsor!;
  state.sponsorDeals.push({
    id: newId(state, 'sd'), defId: def.id, showId, perWeek: terms.perWeek, weeksLeft: terms.weeks, minShare: terms.minShare,
  });
  return `${def.name} sponsors "${show.name}".`;
}
