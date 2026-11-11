import { freshIdeas, networkById, projectPeople, rightsById, type GameState } from '../engine';
import type { Todo } from './screens/WeekScreen';

type TabId = 'schedule' | 'studio' | 'cards' | 'shop';

/** What the Home "Up next" list suggests, most urgent first. Pure: reads the state only. */
export function buildTodos(
  state: GameState,
  act: { openPack: (packId: string) => void; goTab: (tab: TabId) => void; newShow: () => void },
): Todo[] {
  const todos: Todo[] = [];
  const week = state.year * 52 + state.week;
  for (const pack of state.unopened) {
    const people = pack.kind === 'starter-people' || pack.kind === 'people';
    const label = { starter: 'program', 'starter-people': 'people', program: 'program', people: 'people', network: 'network', movies: 'movie' }[pack.kind];
    todos.push({
      id: `pack-${pack.id}`,
      emoji: people ? '👥' : pack.kind === 'network' ? '📡' : '🎁',
      title: `Open your free ${label} pack`,
      detail: people ? 'Meet 3 new people to join your house staff.' : pack.kind === 'network' ? 'Promos, sponsors or studio upgrades.' : 'See which format and topics you start with.',
      onClick: () => act.openPack(pack.id),
    });
  }
  const booked = (id: string) => state.projects.some((pr) => projectPeople(pr).includes(id));
  const freeKinds = new Set(state.people.filter((p) => (p.house || p.uses > 0) && !booked(p.id)).map((p) => p.kind));
  if (state.formats.length > 0 && freeKinds.size === 3) {
    todos.push({
      id: 'team-free',
      emoji: '✍️',
      title: state.shows.length === 0 && state.projects.length === 0 ? 'Create your first show' : 'Your team is free',
      detail: 'Pick a format and topic, build the team, split the focus points.',
      onClick: act.newShow,
    });
  }
  if (state.shopUnlocked && state.formats.length > 0 && freshIdeas(state) === 0 && state.unopened.length === 0) {
    todos.push({
      id: 'no-ideas', emoji: '🃏', title: 'Every show idea is taken',
      detail: 'All your format + topic pairs are in use. A Program pack brings new formats and topics.',
      onClick: () => act.goTab('shop'),
    });
  }
  const promoTargets = state.projects.length + state.shows.filter((x) => !x.premiered).length;
  if (promoTargets > 0 && state.networkCards.some((c) => networkById(c.defId).kind === 'promo')) {
    todos.push({ id: 'promo', emoji: '📣', title: 'Build hype before the premiere', detail: 'You have promo cards. Use them in Cards → Network.', onClick: () => act.goTab('cards') });
  }
  if (state.rightsMarket && state.rightsMarket.lots.every((l) => !l.bid)) {
    todos.push({ id: 'market', emoji: '📜', title: 'The Rights Market is open', detail: `Sports and IP licenses. Bids close in ${state.rightsMarket.closesAt - week} weeks.`, onClick: () => act.goTab('shop') });
  }
  const scheduled = new Set(Object.values(state.schedule));
  for (const r of state.rights) {
    const def = rightsById(r.defId);
    if (def.kind === 'film' && !scheduled.has(r.id)) {
      todos.push({ id: `film-${r.id}`, emoji: def.icon, title: `Schedule ${def.name}`, detail: `${r.airingsLeft} airings left before the license runs out.`, onClick: () => act.goTab('schedule') });
    }
  }
  for (const show of state.shows) {
    if (show.episodesLeft > 0 && !scheduled.has(show.id)) {
      todos.push({ id: `schedule-${show.id}`, emoji: '📺', title: `Schedule "${show.name}"`, detail: 'It is ready to air. Pick a time slot.', onClick: () => act.goTab('schedule') });
    }
    const justEnded = show.episodesLeft <= 0 && !state.projects.some((p) => p.showId === show.id)
      && show.history.length > 0 && show.history[show.history.length - 1].week === state.lastResult?.week;
    if (justEnded) {
      todos.push({ id: `ended-${show.id}`, emoji: '🔁', title: `"${show.name}" season is over`, detail: 'Renew it, keep it on as reruns, or rest it to recover novelty.', onClick: () => act.goTab('schedule') });
    }
  }
  return todos;
}
