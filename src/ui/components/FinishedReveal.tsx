import { AREAS, AREA_LABEL, formatById, grade, type GameState, type Show } from '../../engine';
import { Pillars } from './Cards';
import { Sheet } from './Sheet';
import { cx, gradeClass } from '../util';

export function FinishedReveal({ shows, state, onClose }: { shows: Show[]; state: GameState; onClose: () => void }) {
  return (
    <Sheet title={shows.length > 1 ? 'Shows complete! 🎬' : 'Show complete! 🎬'} onClose={onClose}
      footer={<button className="btn primary" onClick={onClose}>Great — to the schedule</button>}>
      <div className="stack">
        {shows.map((show) => {
          const format = formatById(show.formatId);
          const g = grade(show.quality);
          const firstTime = state.shows.filter((s) => s.formatId === show.formatId).length === 1 && show.season === 1;
          return (
            <div key={show.id} className="panel stack">
              <div className="row">
                <span style={{ fontSize: 34 }}>{format.icon}</span>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: 20 }}>{show.name}</h3>
                  <div className="muted small">{format.name}{show.season > 1 && ` · Season ${show.season}`} · starring {show.talentName}</div>
                </div>
                <span className={cx('grade reveal-grade', gradeClass(g))} style={{ width: 64, height: 64, fontSize: 30, animationDelay: '1.4s' }}>{g}</span>
              </div>
              <Pillars scores={show.scores} delayed />
              <div className="small">
                Focus match <b>{Math.round(show.focusMatch * 100)}%</b>
                {show.focusMatch >= 0.9 ? ' — perfect split! 🎯' : show.focusMatch >= 0.7 ? ' — good split.' : ' — the points could be split better.'}
              </div>
              {firstTime && (
                <div className="panel flat small">
                  <b>New know-how!</b> You now know the ideal focus for {format.name}:{' '}
                  {AREAS.filter((a) => format.ideal[a] > 0).map((a) => `${AREA_LABEL[a]} ${format.ideal[a]}`).join(' · ')}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Sheet>
  );
}
