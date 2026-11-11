import {
  DAYPARTS, DAYPART_ICON, DAYPART_LABEL, DAY_BLOCKS, DAY_BLOCK_LABEL, formatById, grade, rightsById,
  type GameState, type SlotId,
} from '../../engine';
import { rivalDef } from '../../engine/rivals';
import { cx, gradeClass, pct } from '../util';

function Spark({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return <span className="tiny muted">Not enough data yet</span>;
  const max = Math.max(0.3, ...values);
  const w = 120;
  const h = 32;
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * w},${h - (v / max) * h}`).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-label="Average share trend">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export function RivalsView({ state }: { state: GameState }) {
  const ours = state.lastResult ? state.lastResult.slots.reduce((s, r) => s + r.share, 0) / state.lastResult.slots.length : 0;
  return (
    <div className="stack">
      <div className="panel small">
        Your average share last week: <b>{pct(ours)}</b>. Rivals cancel flops, renew hits and move strong shows in against slots you dominate.
      </div>
      {state.rivals.map((rival) => {
        const def = rivalDef(rival.id);
        const last = rival.history[rival.history.length - 1] ?? 0;
        const rights = state.rivalRights.filter((r) => r.rivalId === rival.id);
        return (
          <section key={rival.id} className="panel stack">
            <div className="row">
              <span className="avatar" style={{ background: rival.color, borderRadius: 12 }}>{rival.short.split(' ')[1] ?? rival.short[0]}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3>{rival.name}</h3>
                <p className="small muted">{def.blurb}</p>
              </div>
            </div>
            <div className="kpis">
              <div className="kpi flat"><div className="label">Avg share</div><div className="value">{pct(last)}</div></div>
              <div className="kpi flat"><div className="label">Beat you</div><div className="value">{rival.winsVsYou}</div><div className="delta muted">slots this year</div></div>
              <div className="kpi flat"><div className="label">Trend</div><Spark values={rival.history} color={rival.color} /></div>
            </div>
            {rights.length > 0 && (
              <div className="row wrap small">
                <span className="muted">Rights:</span>
                {rights.map((r) => <span key={r.defId} className="chip">{rightsById(r.defId).icon} {rightsById(r.defId).name}</span>)}
              </div>
            )}
            <div className="sched">
              {DAY_BLOCKS.map((b) => <div key={b} className="sched-head">{DAY_BLOCK_LABEL[b]}</div>)}
              {DAYPARTS.flatMap((part) => DAY_BLOCKS.map((block) => {
                const slot = `${block}-${part}` as SlotId;
                const show = rival.schedule[slot];
                const shares = rival.shares[slot] ?? [];
                const share = shares[shares.length - 1];
                const g = grade(show.quality);
                return (
                  <div key={slot} className="slot" style={{ minHeight: 0 }}>
                    <span className="accent" style={{ background: rival.color }} />
                    <div className="slot-part"><span>{DAYPART_ICON[part]} {DAYPART_LABEL[part]}</span>
                      <span className={cx('grade', gradeClass(g))} style={{ minWidth: 24, height: 24, fontSize: 12, borderRadius: 7 }}>{g}</span>
                    </div>
                    <div className="slot-show" style={{ fontSize: 14 }}>{formatById(show.formatId).icon} {show.name}</div>
                    <div className="row wrap tiny">
                      {share !== undefined && <span className="muted">{pct(share)} last week</span>}
                      {show.counter && <span className="chip bad">⚔️ vs you</span>}
                      {share > 0.32 && <span className="chip warn">Hit</span>}
                    </div>
                  </div>
                );
              }))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
