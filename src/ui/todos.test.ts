// The Home "Up next" list is pure: it only reads the state.
import { newMissionGame, openPack } from '../engine';
import { buildTodos } from './todos';

const act = { openPack: () => {}, goTab: () => {}, newShow: () => {}, shoot: () => {} };

test('a new game asks you to open the free packs, then to make a first show', () => {
  let s = newMissionGame(1, 'T', null);
  expect(buildTodos(s, act).map((t) => t.id).filter((id) => id.startsWith('pack-'))).toHaveLength(2);
  while (s.unopened.length) s = openPack(s, s.unopened[0].id);
  const ids = buildTodos(s, act).map((t) => t.id);
  expect(ids).toContain('team-free');
  expect(ids.some((id) => id.startsWith('pack-'))).toBe(false);
});
