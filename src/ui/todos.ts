import { freshIdeas, isHeldScript, isHeldShot, networkById, projectPeople, rightsById, stageUse, type GameState } from '../engine';
import type { Todo } from './screens/WeekScreen';

type TabId = 'schedule' | 'studio' | 'cards' | 'shop';

/** What the Home "Up next" list suggests, most urgent first. Pure: reads the state only. */
export function buildTodos(
  state: GameState,
  act: { openPack: (packId: string) => void; goTab: (tab: TabId) => void; newShow: () => void; shoot: (projectId: string) => void; post: (projectId: string) => void },
): Todo[] {
  const todos: Todo[] = [];
  for (const pack of state.unopened) {
    const people = pack.kind === 'starter-people' || pack.kind === 'people';
    const label = { starter: 'program', 'starter-people': 'people', program: 'program', people: 'people', network: 'network', movies: 'movie', ip: 'license' }[pack.kind];
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
  // Finished scripts wait for a crew and cast.
  for (const p of state.projects.filter(isHeldScript)) {
    todos.push({ id: `shoot-${p.id}`, emoji: '🎬', title: `Shoot “${p.name}”`, detail: `The script is written (${'★'.repeat(p.script!.stars)}). Pick the cast and crew at a Sound Stage.`, onClick: () => act.shoot(p.id) });
  }
  for (const p of state.projects.filter(isHeldShot)) {
    todos.push({ id: `post-${p.id}`, emoji: '🎞️', title: `Finish “${p.name}”`, detail: 'It’s filmed. Set sound, music and effects at the Post-production Suite.', onClick: () => act.post(p.id) });
  }
  const room = stageUse(state, 'script');
  if (state.formats.length > 0 && freeKinds.has('writer') && room.used < room.capacity) {
    todos.push({
      id: 'team-free',
      emoji: '✍️',
      title: state.shows.length === 0 && state.projects.length === 0 ? 'Write your first script' : 'The Writers’ Room is free',
      detail: 'Pick a format, a topic and a writer. You choose the cast and crew when the script is done.',
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
  const scheduled = new Set(Object.values(state.schedule));
  for (const r of state.rights) {
    const def = rightsById(r.defId);
    if (def.kind === 'film' && !scheduled.has(r.id)) {
      todos.push({ id: `film-${r.id}`, emoji: def.icon, title: `Schedule ${def.name}`, detail: `${r.airingsLeft} airings left before the license runs out.`, onClick: () => act.goTab('schedule') });
    }
  }
  for (const show of state.shows.filter((x) => !x.archived)) {
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
