import { SANDBOX_DIFFICULTY, goalLabel, goalProgress, goalsOf, missionWeeksLeft, type GameState } from '../../engine';
import { Sheet } from './Sheet';
import { cx } from '../util';

/** The mission's goals and time left, at the top of Home. */
export function MissionCard({ state }: { state: GameState }) {
  const run = state.mission;
  if (!run) return null;
  const def = goalsOf(run);
  if (!def.goals.length) return null;
  const left = missionWeeksLeft(state);
  const sandbox = !!run.custom;
  return (
    <section className={cx('panel mission-card', run.status)}>
      <div className="spread">
        <div><span className="kicker">{sandbox ? `🏗️ Sandbox · ${SANDBOX_DIFFICULTY[run.custom!.difficulty].label}` : '🎯 Mission'}</span><h2 style={{ fontSize: 18 }}>{def.icon} {def.title}</h2></div>
        <span className={cx('chip', run.status === 'playing' && left <= 4 && 'bad', run.status === 'won' && 'good')}>
          {run.status === 'won' ? (sandbox ? 'All done' : '★'.repeat(run.stars)) : run.status === 'lost' ? 'Time up' : sandbox ? 'No deadline' : `${left} week${left !== 1 ? 's' : ''} left`}
        </span>
      </div>
      <div className="stack-sm small" style={{ marginTop: 8 }}>
        {def.goals.map((g, i) => (
          <div key={i} className={cx('goal', run.met[i] && 'met')}>
            <span>{run.met[i] ? '✅' : '⬜'} {goalLabel(g)}</span>{!run.met[i] && <span className="muted">{goalProgress(state, g, i)}</span>}
          </div>
        ))}
        {def.bonus && (
          <div className={cx('goal bonus', run.bonusMet && 'met')}>
            <span>{run.bonusMet ? '⭐' : '☆'} Bonus: {goalLabel(def.bonus)}</span>{!run.bonusMet && <span className="muted">{goalProgress(state, def.bonus, 'bonus')}</span>}
          </div>
        )}
      </div>
    </section>
  );
}

/** Shown once when a mission is won or lost. */
export function MissionResult({ state, onContinue, onRetry, onMenu }: { state: GameState; onContinue: () => void; onRetry: () => void; onMenu: () => void }) {
  const run = state.mission!;
  const def = goalsOf(run);
  const won = run.status === 'won' && !state.gameOver;
  const sandbox = !!run.custom;
  return (
    <Sheet title={won ? (sandbox ? 'Goals complete!' : 'Mission complete!') : state.gameOver ? 'Off the air' : 'Time is up'}
      footer={<>
        <button className="btn ghost" onClick={onMenu}>Menu</button>
        {!won && <button className="btn primary" onClick={onRetry}>Try again</button>}
        {won && <button className="btn primary" onClick={onContinue}>Keep playing</button>}
      </>}>
      <div className="milestone">
        <div className="big">{won ? '🏆' : '📉'}</div>
        <p><b>{def.icon} {def.title}</b></p>
        {won && !sandbox && <div className="result-stars">{'★'.repeat(run.stars)}<i>{'★'.repeat(3 - run.stars)}</i></div>}
        <p className="small muted">{won && sandbox ? 'Every goal you set is done. Your network keeps running for as long as you like.' : won
          ? `${run.stars === 3 ? 'Perfect!' : run.stars === 2 ? 'Great work.' : 'Done!'} New missions may be open on the map. You can keep running this station too.`
          : state.gameOver ?? 'The deadline passed before every goal was met. Try a different plan!'}</p>
        <div className="panel stack-sm small" style={{ textAlign: 'left' }}>
          {def.goals.map((g, i) => <div key={i}>{run.met[i] ? '✅' : '❌'} {goalLabel(g)}</div>)}
          {def.bonus && <div>{run.bonusMet ? '⭐' : '☆'} Bonus: {goalLabel(def.bonus)}</div>}
        </div>
      </div>
    </Sheet>
  );
}
