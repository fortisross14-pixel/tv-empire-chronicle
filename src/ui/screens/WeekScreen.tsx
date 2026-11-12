import { MissionCard } from '../components/MissionCard';
import { Fragment, useState } from 'react';
import {
  AFFILIATE_MAX, CHAMPION_WEEKS, TIERS, affiliateCost, dateLabel, formatById, grade, isSweeps, licenseGaps,
  nextLicense, primeShares, periodOf, reachOf, slotLabel, slotsOf, upcomingMarkers, type GameState, type Show,
} from '../../engine';
import { Poster, artStyle, projectPoster, showPoster } from '../components/Poster';
import { PosterArt } from '../posters/PosterArt';
import { autoPoster } from '../posters/library';
import { money, pct, signedMoney, viewers } from '../util';

const PERIOD_EMOJI = { winter: '❄️', spring: '🌷', summer: '☀️', fall: '🍂', holidays: '🎄' } as const;

export interface Todo { id: string; emoji: string; title: string; detail: string; onClick: () => void }

type Featured = { show: Show; kicker: string; action: 'schedule' | 'air' } | null;

/** The show the billboard features: something new to schedule, else the biggest show on air. */
function featured(state: GameState): Featured {
  const scheduled = new Set(Object.values(state.schedule));
  const fresh = state.shows.filter((s) => s.episodesLeft > 0 && !s.archived && !scheduled.has(s.id)).sort((a, b) => b.quality - a.quality)[0];
  if (fresh) return { show: fresh, kicker: fresh.season > 1 ? `NEW SEASON READY` : 'READY TO AIR', action: 'schedule' };
  const onAir = state.shows.filter((s) => scheduled.has(s.id))
    .sort((a, b) => (b.history[b.history.length - 1]?.viewers ?? 0) - (a.history[a.history.length - 1]?.viewers ?? 0))[0];
  if (onAir) return { show: onAir, kicker: onAir.premiered ? 'ON AIR' : 'PREMIERES THIS WEEK', action: 'air' };
  return null;
}

export function WeekScreen({
  state, todos, onMenu, onExpand, onAffiliate, onOpenShow, onNewShow, goTab,
}: {
  state: GameState; todos: Todo[]; onMenu: () => void; onExpand: () => void; onAffiliate: () => void;
  onOpenShow: (id: string) => void; onNewShow: () => void; goTab: (tab: 'schedule' | 'studio' | 'cards' | 'shop') => void;
}) {
  const [allNews, setAllNews] = useState(false);
  const lic = nextLicense(state);
  const SLOTS = slotsOf(state);
  const period = periodOf(state.week);
  const last = state.lastResult;
  const feat = featured(state);
  const shows = state.shows.filter((x) => !x.archived).sort((a, b) => Number(Object.values(state.schedule).includes(b.id)) - Number(Object.values(state.schedule).includes(a.id)) || b.quality - a.quality);
  const topShowResult = last?.slots.filter((r) => r.showId).sort((a, b) => b.viewers - a.viewers)[0];

  return (
    <div className="home-cols">
    <div className="home-main">
      <MissionCard state={state} />
      {feat ? (
        <section className="billboard" style={artStyle(feat.show.formatId)}>
          <div className="art"><PosterArt spec={{ ...(feat.show.poster ?? autoPoster(feat.show)), frame: null }} title={feat.show.name} hideTitle /></div>
          <div className="shade" />
          <div className="body">
            <span className="kicker">{feat.kicker}</span>
            <h2>{feat.show.name}</h2>
            <div className="meta">
              {formatById(feat.show.formatId).name}{feat.show.season > 1 && ` · Season ${feat.show.season}`} · Grade {grade(feat.show.quality)}
              {feat.show.reviews && ` · Critics ${feat.show.reviews.critics} · Fans ${feat.show.reviews.audience}`}
            </div>
            <div className="acts">
              {feat.action === 'schedule'
                ? <button className="btn primary" onClick={() => goTab('schedule')}>Schedule it</button>
                : <button className="btn primary" onClick={() => onOpenShow(feat.show.id)}>Details</button>}
              {feat.action === 'schedule'
                ? <button className="btn ghost" onClick={() => onOpenShow(feat.show.id)}>Details</button>
                : <button className="btn ghost" onClick={() => goTab('schedule')}>Guide</button>}
            </div>
          </div>
        </section>
      ) : (
        <section className="billboard" style={artStyle('magazine')}>
          <div className="art"><span className="glyph" aria-hidden="true">📺</span></div>
          <div className="shade" />
          <div className="body">
            <span className="kicker">WELCOME TO {state.stationName.toUpperCase()}</span>
            <h2>{state.projects.length ? 'Your first show is in the works' : 'Make your first show'}</h2>
            <div className="meta">{state.projects.length ? 'Air weeks to move it through script, production and post.' : 'Pick a format and topic, choose the team, split the focus points.'}</div>
            <div className="acts">
              {state.projects.length
                ? <button className="btn primary" onClick={() => goTab('studio')}>See the studio</button>
                : <button className="btn primary" onClick={onNewShow} disabled={state.formats.length === 0}>+ New show</button>}
            </div>
          </div>
        </section>
      )}

      {todos.length > 0 && (
        <section className="stack-sm">
          <div className="section-title"><h2>Up next</h2><span className="sub">{todos.length}</span></div>
          {todos.map((t) => (
            <button key={t.id} className="todo" onClick={t.onClick}>
              <span className="emoji">{t.emoji}</span>
              <span><b>{t.title}</b><div className="small muted">{t.detail}</div></span>
              <span className="go">›</span>
            </button>
          ))}
        </section>
      )}

      <section>
        <div className="section-title"><h2>On your channel</h2>
          <span className="sub">{SLOTS.filter((s) => state.schedule[s]).length}/{SLOTS.length} slots filled</span></div>
        {shows.length === 0
          ? <div className="empty">Finished shows appear here as posters.</div>
          : <div className="rail">{shows.map((s) => <Poster key={s.id} {...showPoster(s, state)} onClick={() => onOpenShow(s.id)} />)}</div>}
      </section>

      {state.projects.length > 0 && (
        <section>
          <div className="section-title"><h2>In production</h2><span className="sub">Script → Production → Post</span></div>
          <div className="rail">{state.projects.map((p) => <Poster key={p.id} {...projectPoster(p)} onClick={() => goTab('studio')} />)}</div>
        </section>
      )}
    </div>

    <div className="home-side">
      {last && (
        <section className="panel stack-sm">
          <div className="section-title"><h2>Last week's ratings</h2><span className="sub">{dateLabel(last.week, last.year)}</span></div>
          {topShowResult ? (
            <>
              <div className="spread"><b>{topShowResult.showName}</b><span style={{ fontWeight: 900, fontSize: 22 }}>{viewers(topShowResult.viewers)}</span></div>
              <div className="share-duel"><span className="us" style={{ width: `${topShowResult.share * 100}%` }} /></div>
              <div className="spread small muted"><span>{slotLabel(topShowResult.slot)} · share {pct(topShowResult.share)}</span>{topShowResult.won && <span className="win">WIN</span>}</div>
            </>
          ) : <p className="small muted">Only filler aired. Make a show!</p>}
          <div className="spread small"><span className="muted">Week result</span><b className={last.net >= 0 ? 'pos' : 'neg'}>{signedMoney(last.net)}</b></div>
        </section>
      )}

      <section className="panel calendar">
        <div className="period">
          <span className="emoji">{PERIOD_EMOJI[period.id]}</span>
          <div style={{ flex: 1 }}>
            <div className="row wrap"><h2 style={{ fontSize: 19 }}>{period.label}</h2>{isSweeps(state.week) && <span className="chip warn">📋 Sweeps month</span>}</div>
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

      <section>
        <div className="section-title"><h2>Station</h2><span className="sub">{TIERS[state.tier].label}</span></div>
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
          <div className="kpi"><div className="label">Ad rate card</div><div className="value">×{state.rateCard.toFixed(2)}</div><div className="delta muted">Set by sweeps</div></div>
          <div className="kpi"><div className="label">Ad prices now</div><div className="value">×{period.adPrice.toFixed(2)}</div><div className="delta muted">Viewing ×{period.viewing.toFixed(2)}</div></div>
        </div>
        {state.modifiers.map((m) => (
          <p key={m.label} className="small neg" style={{ marginTop: 8 }}>⚠️ {m.label}: viewers ×{m.mult} for {m.weeksLeft} more week{m.weeksLeft > 1 ? 's' : ''}.</p>
        ))}
        {state.loan && <p className="small neg" style={{ marginTop: 8 }}>Bank loan: {money(state.loan.balance)} left, {money(state.loan.payment)}/week. There is no second loan.</p>}
      </section>

      {lic && (
        <section className="panel stack-sm">
          <div className="section-title"><h2>🎯 Goal: {lic.tier === 'state' ? 'State' : 'National'} network</h2></div>
          <p className="small muted">
            {lic.tier === 'state'
              ? `A State license brings 15 slots (afternoon and late night too), ${TIERS.state.households / 1000}M households, Advanced productions with specialists and 2 topics, State rights and new formats. Running costs rise to $${TIERS.state.overhead}K/week.`
              : `Going national brings 20 slots, up to ${TIERS.national.households / 1000}M households (grow reach with affiliates), AAA productions, Galaxy Wars and the Gridiron League, and the full Glimmys. Running costs start at $${Math.round(TIERS.national.overhead / 2)}K/week and grow with your reach.`}
          </p>
          <div className="req">
            <span>Reputation {Math.floor(state.reputation)} / {lic.reputation}</span><span>{state.reputation >= lic.reputation ? '✅' : '⏳'}</span>
            <span className="bar" style={{ gridColumn: '1 / -1' }}><i style={{ width: `${Math.min(100, (state.reputation / lic.reputation) * 100)}%`, background: 'var(--accent)' }} /></span>
            <span>Cash ${Math.floor(state.cash)}K / ${lic.cash}K</span><span>{state.cash >= lic.cash ? '✅' : '⏳'}</span>
            <span className="bar" style={{ gridColumn: '1 / -1' }}><i style={{ width: `${Math.max(0, Math.min(100, (state.cash / lic.cash) * 100))}%`, background: 'var(--good)' }} /></span>
          </div>
          <button className="btn primary" disabled={licenseGaps(state).length > 0} onClick={onExpand}>
            Buy {lic.tier === 'state' ? 'State' : 'National'} license · ${lic.fee}K
          </button>
        </section>
      )}
      {state.tier === 'national' && (
        <section className="panel stack-sm">
          <div className="section-title"><h2>{state.champion ? '👑 #1 network' : '👑 Goal: #1 network'}</h2></div>
          <p className="small muted">Be #1 in prime time for {CHAMPION_WEEKS} weeks in a row. {!state.champion && `Streak: ${state.primeStreak ?? 0}/${CHAMPION_WEEKS}.`}</p>
          {(() => {
            const p = primeShares(state);
            return (
              <div className="req">
                <span>You · prime time</span><b>{(p.ours * 100).toFixed(1)}%</b>
                {p.rivals.map((r) => <Fragment key={r.id}><span style={{ color: r.color }}>{r.short}</span><b>{(r.share * 100).toFixed(1)}%</b></Fragment>)}
              </div>
            );
          })()}
          <div className="section-title" style={{ marginTop: 8 }}><h3>📡 Affiliates</h3><span className="sub">Reach {Math.round(reachOf(state) * 100)}%</span></div>
          <div className="affiliates">{Array.from({ length: AFFILIATE_MAX }, (_, i) => <i key={i} className={i < state.affiliates ? 'on' : ''} />)}</div>
          {state.affiliates < AFFILIATE_MAX && (
            <>
              <button className="btn ghost" disabled={state.cash < affiliateCost(state.affiliates)} onClick={onAffiliate}>
                Sign an affiliate · ${affiliateCost(state.affiliates)}K
              </button>
              <p className="tiny muted">Each affiliate adds 5% reach, and 5% to running costs.</p>
            </>
          )}
        </section>
      )}

      <section className="panel">
        <div className="section-title"><h2>📰 The Chronicle</h2></div>
        <div className="news">
          {state.news.slice(0, allNews ? 30 : 3).map((n) => (
            <div key={n.id} className={`news-item ${n.tone}`}><i /><div>{n.text}<div className="when">{dateLabel(n.week, n.year)}</div></div></div>
          ))}
        </div>
        {state.news.length > 3 && (
          <button className="btn ghost small" style={{ marginTop: 10 }} onClick={() => setAllNews(!allNews)}>{allNews ? 'Show less' : 'Show all news'}</button>
        )}
      </section>

      <div style={{ textAlign: 'center' }}>
        <button className="btn ghost small" onClick={onMenu}>🏠 Main menu</button>
      </div>
    </div>
    </div>
  );
}
