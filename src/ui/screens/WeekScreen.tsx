import {
  SLOTS, dateLabel, isSweeps, periodOf, upcomingMarkers, slotLabel, type GameState,
} from '../../engine';
import { money, signedMoney } from '../util';

const PERIOD_EMOJI = { winter: '❄️', spring: '🌷', summer: '☀️', fall: '🍂', holidays: '🎄' } as const;

export interface Todo { emoji: string; title: string; detail: string; onClick: () => void }

export function WeekScreen({
  state, todos, onNewGame,
}: { state: GameState; todos: Todo[]; onNewGame: () => void }) {
  const period = periodOf(state.week);
  const last = state.lastResult;
  const onAir = SLOTS.filter((s) => state.schedule[s]).length;
  return (
    <>
      <section className="panel calendar">
        <div className="period">
          <span className="emoji">{PERIOD_EMOJI[period.id]}</span>
          <div style={{ flex: 1 }}>
            <div className="row wrap">
              <h2 style={{ fontSize: 20 }}>{period.label}</h2>
              {isSweeps(state.week) && <span className="chip warn">📋 Sweeps month</span>}
            </div>
            <p className="small muted">{period.blurb}</p>
          </div>
        </div>
        <div className="cal-strip" aria-label="Year calendar">
          {Array.from({ length: 52 }, (_, i) => (
            <i key={i} className={`${periodOf(i + 1).id}${i + 1 === state.week ? ' now' : ''}`} title={dateLabel(i + 1, state.year)} />
          ))}
        </div>
        <div className="row wrap small">
          <span className="muted">Coming up:</span>
          {upcomingMarkers(state.week).map((m) => <span key={m.label} className="chip">{m.label} · {m.week}w</span>)}
        </div>
      </section>

      {todos.length > 0 && (
        <section className="stack-sm">
          <div className="section-title"><h2>To do</h2><span className="sub">{todos.length}</span></div>
          {todos.map((t) => (
            <button key={t.title} className="todo" onClick={t.onClick}>
              <span className="emoji">{t.emoji}</span>
              <span><b>{t.title}</b><div className="small muted">{t.detail}</div></span>
              <span className="go">›</span>
            </button>
          ))}
        </section>
      )}

      <section>
        <div className="section-title"><h2>Station</h2><span className="sub">{onAir}/{SLOTS.length} slots with your shows</span></div>
        <div className="kpis">
          <div className="kpi">
            <div className="label">Cash</div>
            <div className={`value ${state.cash < 0 ? 'neg' : ''}`}>{money(state.cash)}</div>
            {last && <div className={`delta ${last.net >= 0 ? 'pos' : 'neg'}`}>{signedMoney(last.net)} last week</div>}
          </div>
          <div className="kpi">
            <div className="label">Reputation</div>
            <div className="value">{state.reputation.toFixed(1)}</div>
            {last && <div className={`delta ${last.reputationDelta >= 0 ? 'pos' : 'neg'}`}>{last.reputationDelta >= 0 ? '+' : ''}{last.reputationDelta.toFixed(1)}</div>}
          </div>
          <div className="kpi">
            <div className="label">Ad rate card</div>
            <div className="value">×{state.rateCard.toFixed(2)}</div>
            <div className="delta muted">Set by sweeps</div>
          </div>
          <div className="kpi">
            <div className="label">Ad prices now</div>
            <div className="value">×{period.adPrice.toFixed(2)}</div>
            <div className="delta muted">Viewing ×{period.viewing.toFixed(2)}</div>
          </div>
        </div>
        {state.modifiers.map((m) => (
          <p key={m.label} className="small neg" style={{ marginTop: 8 }}>⚠️ {m.label}: viewers ×{m.mult} for {m.weeksLeft} more week{m.weeksLeft > 1 ? 's' : ''}.</p>
        ))}
        {state.loan && (
          <p className="small neg" style={{ marginTop: 8 }}>Bank loan: {money(state.loan.balance)} left, {money(state.loan.payment)}/week. There is no second loan.</p>
        )}
      </section>

      {last && (
        <section className="panel">
          <div className="section-title"><h2>Last week</h2><span className="sub">{dateLabel(last.week, last.year)}</span></div>
          <div className="stack-sm small">
            {last.slots.filter((r) => r.showId).map((r) => (
              <div key={r.slot} className="spread">
                <span>{r.showName} <span className="muted">· {slotLabel(r.slot)}</span></span>
                <b>{Math.round(r.viewers)}K {r.won ? '🏆' : ''}</b>
              </div>
            ))}
            {last.slots.every((r) => !r.showId) && <p className="muted">Only filler aired. Make a show!</p>}
          </div>
        </section>
      )}

      <section className="panel">
        <div className="section-title"><h2>🏆 Trophy cabinet</h2><span className="sub">{state.trophies.length}</span></div>
        {state.trophies.length === 0
          ? <p className="small muted">Indie Awards in March, State Awards in June, Glimmys in September. Shows that premiered in the past year compete — critics count most.</p>
          : <div className="trophies">{state.trophies.map((t, i) => (
            <div key={i} className="trophy"><b>{t.level === 'glimmy' ? '🏆' : t.level === 'state' ? '🏅' : '🎗️'} {t.title}</b><div className="muted">{t.showName} · Y{t.year}</div></div>
          ))}</div>}
      </section>

      <section className="panel">
        <div className="section-title"><h2>🎯 Goal: State network</h2></div>
        <p className="small muted">Grow from local station to a state network: more slots, afternoon and late night, bigger audiences. Coming in a later update — build reputation now.</p>
        <div className="bar" style={{ marginTop: 10 }}><i style={{ width: `${Math.min(100, (state.reputation / 60) * 100)}%`, background: 'var(--accent)' }} /></div>
        <p className="tiny muted" style={{ marginTop: 4 }}>Reputation {state.reputation.toFixed(0)} / 60</p>
      </section>

      <section className="panel">
        <div className="section-title"><h2>📰 The Chronicle</h2></div>
        <div className="news">
          {state.news.slice(0, 10).map((n) => (
            <div key={n.id} className={`news-item ${n.tone}`}>
              <i />
              <div>{n.text}<div className="when">{dateLabel(n.week, n.year)}</div></div>
            </div>
          ))}
        </div>
      </section>

      <div style={{ textAlign: 'center' }}>
        <button className="btn danger small" onClick={onNewGame}>Start a new game</button>
      </div>
    </>
  );
}
