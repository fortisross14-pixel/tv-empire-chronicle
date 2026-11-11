import type { Ceremony } from '../../engine';
import { Sheet } from './Sheet';
import { cx } from '../util';

const LEVEL_ICON = { indie: '🎗️', state: '🏅', glimmy: '🏆' } as const;

export function CeremonyModal({ ceremony, national, onClose }: { ceremony: Ceremony; national?: boolean; onClose: () => void }) {
  const wins = ceremony.categories.filter((c) => c.weWon).length;
  return (
    <Sheet title={`${LEVEL_ICON[ceremony.level]} ${ceremony.title}`} onClose={onClose}
      footer={<button className="btn primary" onClick={onClose}>{wins ? 'Celebrate! 🎉' : 'Next year…'}</button>}>
      {ceremony.level === 'glimmy' && !national && (
        <p className="small muted" style={{ marginBottom: 12 }}>The big categories are for national networks. Local stations compete for Best Indie Production.</p>
      )}
      <div className="stack">
        {ceremony.categories.map((c, i) => (
          <div key={c.category} className="result-row" style={{ animationDelay: `${i * 0.5}s`, display: 'block' }}>
            <div className="where">{c.category}</div>
            <div className="stack-sm" style={{ marginTop: 6 }}>
              {c.nominees.map((n, j) => (
                <div key={n.name + j} className={cx('spread small', n.ours && 'pos')} style={{ fontWeight: n.ours ? 700 : 400 }}>
                  <span>{j === 0 ? '🏆 ' : ''}{n.name} <span className="muted">· {n.station}</span></span>
                  <span>{n.score}</span>
                </div>
              ))}
              {!c.nominees.some((n) => n.ours) && <div className="tiny muted">Your shows were not nominated.</div>}
            </div>
          </div>
        ))}
        <div className="panel big-net" style={{ animationDelay: `${ceremony.categories.length * 0.5}s` }}>
          <div className="value">{wins ? `${wins} win${wins > 1 ? 's' : ''}!` : 'No wins'}</div>
          {ceremony.prize && <div className="small">Prize: {ceremony.prize}</div>}
        </div>
      </div>
    </Sheet>
  );
}
