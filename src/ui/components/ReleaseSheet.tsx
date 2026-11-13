import { useState } from 'react';
import { MARKETING, marketingCost, type GameState } from '../../engine';
import { Poster, showPoster } from './Poster';
import { Sheet } from './Sheet';
import { cx, money } from '../util';

/** The last step before airing, at the tower: the poster and the marketing. Then on to the Guide. */
export function ReleaseSheet({
  state, showId, onEditPoster, onRelease, onClose,
}: { state: GameState; showId: string; onEditPoster: () => void; onRelease: (marketing: 0 | 1 | 2) => void; onClose: () => void }) {
  const show = state.shows.find((s) => s.id === showId);
  const [level, setLevel] = useState<0 | 1 | 2>(0);
  if (!show) return null;
  const cost = marketingCost(state, level);
  return (
    <Sheet title={`📡 Release “${show.name}”`} onClose={onClose}
      footer={<button className="btn primary" disabled={state.cash < cost} onClick={() => onRelease(level)}>
        Release{cost > 0 ? ` · ${money(cost)}` : ''} and pick a time slot
      </button>}>
      <div className="stack">
        <div className="stack-sm">
          <div className="section-title"><h3 style={{ fontSize: 16 }}>🎨 Poster</h3><span className="sub">What viewers see in the Guide</span></div>
          <div className="release-poster">
            <Poster {...showPoster(show, state)} />
            <div className="stack-sm">
              <p className="small muted">{show.poster ? 'Your own design.' : 'An automatic poster. Make it yours: background, cast, icons and title.'}</p>
              <button className="btn ghost" onClick={onEditPoster}>🎨 {show.poster ? 'Change the poster' : 'Design the poster'}</button>
            </div>
          </div>
        </div>
        <div className="stack-sm">
          <div className="section-title"><h3 style={{ fontSize: 16 }}>📣 Marketing</h3><span className="sub">Hype lifts the premiere, then fades</span></div>
          {MARKETING.map((m, i) => {
            const c = marketingCost(state, i as 0 | 1 | 2);
            return (
              <button key={m.label} className={cx('todo', level === i && 'selected')} style={level === i ? { boxShadow: '0 0 0 3px var(--focus)' } : undefined}
                disabled={state.cash < c} aria-pressed={level === i} onClick={() => setLevel(i as 0 | 1 | 2)}>
                <span style={{ flex: 1 }}>
                  <b>{m.label}</b> {level === i && <span className="chip good">Selected</span>}
                  <div className="small muted">{m.blurb}</div>
                </span>
                <span style={{ textAlign: 'right' }}><b>{c > 0 ? money(c) : 'Free'}</b><div className="tiny muted">{m.hype > 0 ? `+${m.hype} hype` : 'no hype'}</div></span>
              </button>
            );
          })}
          <p className="tiny muted">Promo cards (Cards → Network) add hype on top of this.</p>
        </div>
      </div>
    </Sheet>
  );
}
