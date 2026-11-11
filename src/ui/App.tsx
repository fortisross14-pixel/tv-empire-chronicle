import { useEffect, useRef, useState } from 'react';
import {
  GameError, airWeek, buyBusinessCard, buyPack, cancelProject, cancelShow, createShow, ackMission, newMissionGame, recordMission,
  dateLabel, dismissFinished, dismissReveal, openPack, saveGame, scheduleShow, useBusinessCard,
  setPoster, answerEvent, dismissCeremony, dismissMilestone, expandToState, expandToNational, signAffiliate, TIERS, releasePerson, usePromo, useSponsor, networkById, bidOnRights, assignSportsTeam,
  reachOf, SANDBOX_GOALS, type GameState, type Goal, type ShowPlan,
} from '../engine';
import { NewShowWizard } from './components/NewShowWizard';
import { PackReveal } from './components/PackReveal';
import { WeekResults } from './components/WeekResults';
import { FinishedReveal } from './components/FinishedReveal';
import { EventModal } from './components/EventModal';
import { CeremonyModal } from './components/CeremonyModal';
import { TargetPicker } from './components/TargetPicker';
import { Sheet } from './components/Sheet';
import { ShowSheet } from './components/ShowSheet';
import { PosterEditor } from './posters/PosterEditor';
import { ConfirmProvider, useConfirm } from './components/Confirm';
import { WeekScreen } from './screens/WeekScreen';
import { ScheduleScreen } from './screens/ScheduleScreen';
import { StudioScreen } from './screens/StudioScreen';
import { CardsScreen } from './screens/CardsScreen';
import { ShopScreen } from './screens/ShopScreen';
import { MenuScreen } from './screens/MenuScreen';
import { buildTodos } from './todos';
import { Ticker } from './components/Ticker';
import { ErrorBoundary } from './components/ErrorBoundary';
import { MissionResult } from './components/MissionCard';
import { cx, money } from './util';

type Tab = 'week' | 'schedule' | 'studio' | 'cards' | 'shop';
const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'week', label: 'Home', icon: '🏠' },
  { id: 'schedule', label: 'Guide', icon: '📺' },
  { id: 'studio', label: 'Studio', icon: '🎬' },
  { id: 'cards', label: 'Cards', icon: '🃏' },
  { id: 'shop', label: 'Market', icon: '🛍️' },
];

const seed = () => (Math.random() * 2 ** 31) | 0;
/** The Sandbox goal ids for a list of goals (to start the same Sandbox again). */
const sandboxGoalIds = (goals: Goal[]) => SANDBOX_GOALS.filter((g) => goals.some((x) => JSON.stringify(x) === JSON.stringify(g.goal))).map((g) => g.id);

export function App() {
  // Null: the title screen with save slots and the mission map.
  const [play, setPlay] = useState<{ slot: number; state: GameState; gen: number } | null>(null);
  const [menuKey, setMenuKey] = useState(0);
  if (!play) {
    return (
      <ConfirmProvider>
        <MenuScreen key={menuKey} onPlay={(slot, state, start) => {
          const s = state ?? newMissionGame(seed(), start?.name ?? 'Ellison 8', start?.missionId ?? null, start?.sandbox);
          saveGame(s, slot);
          setPlay({ slot, state: s, gen: Date.now() });
        }} />
      </ConfirmProvider>
    );
  }
  const toMenu = () => { setPlay(null); setMenuKey((k) => k + 1); window.scrollTo({ top: 0 }); };
  const retry = () => {
    const run = play.state.mission;
    const s = newMissionGame(seed(), play.state.stationName, run?.id ?? null,
      run?.custom ? { difficulty: run.custom.difficulty, goals: sandboxGoalIds(run.custom.goals) } : undefined);
    saveGame(s, play.slot);
    setPlay({ slot: play.slot, state: s, gen: Date.now() });
  };
  return (
    <ConfirmProvider>
      <ErrorBoundary key={`eb-${play.gen}`} onMenu={toMenu}>
      <Game key={play.gen} slot={play.slot} state={play.state}
        setState={(s) => setPlay({ ...play, state: s })} onMenu={toMenu} onRetry={retry} />
      </ErrorBoundary>
    </ConfirmProvider>
  );
}

function Game({ state, setState, slot, onMenu, onRetry }: {
  state: GameState; setState: (s: GameState) => void; slot: number; onMenu: () => void; onRetry: () => void;
}) {
  const [tab, setTab] = useState<Tab>('week');
  const [wizard, setWizard] = useState<{ renew?: string; spinoff?: string } | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [usingCard, setUsingCard] = useState<string | null>(null);
  const [openShow, setOpenShow] = useState<string | null>(null);
  const [posterFor, setPosterFor] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);

  const ask = useConfirm();
  const saveWarned = useRef(false);
  useEffect(() => {
    if (!saveGame(state, slot) && !saveWarned.current) {
      saveWarned.current = true;
      say('Your browser blocked saving: progress will be lost when you close this page.');
    }
  }, [state]);
  useEffect(() => { window.scrollTo({ top: 0 }); }, [tab]);

  const say = (msg: string) => {
    setToast(msg);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2600);
  };

  /** Run an engine action; show its error as a toast. */
  const run = (fn: (s: GameState) => GameState, okMsg?: string): boolean => {
    setToast(null);
    try {
      setState(fn(state));
      if (okMsg) say(okMsg);
      return true;
    } catch (e) {
      say(e instanceof GameError ? e.message : 'Something went wrong.');
      if (!(e instanceof GameError)) console.error(e);
      return false;
    }
  };

  const air = () => {
    if (state.pendingEvent) return say('Answer the event first.');
    if (run(airWeek)) setShowResults(true);
  };

  // A finished mission: record the stars once (the profile keeps the best).
  const mission = state.mission;
  useEffect(() => {
    if (mission?.status === 'won' && !mission.custom) recordMission(mission.id, mission.stars);
  }, [mission?.status, mission?.id, mission?.stars]);
  const showMissionResult = !!mission && (mission.status !== 'playing' || !!state.gameOver) && !mission.counters.resultSeen;

  if (state.gameOver && !mission) {
    return (
      <div className="title-screen">
        <div className="title-card">
          <div className="tv">📉</div>
          <h1>Off the air</h1>
          <p style={{ opacity: 0.8 }}>{state.gameOver}</p>
          <button className="btn primary block" onClick={onMenu}>Back to the menu</button>
        </div>
      </div>
    );
  }

  // To-do list on the Home tab.
  const todos = buildTodos(state, {
    openPack: (id) => run((s) => openPack(s, id)),
    goTab: setTab,
    newShow: () => { setTab('studio'); setWizard({}); },
  });
  const scheduled = new Set(Object.values(state.schedule));

  const finishedShows = state.newlyFinished.map((id) => state.shows.find((s) => s.id === id)).filter(Boolean) as GameState['shows'];
  const shopDot = (state.shopUnlocked && state.cash >= 40 && state.unopened.length === 0) || !!state.rightsMarket;
  const scheduleDot = state.shows.some((s) => s.episodesLeft > 0 && !scheduled.has(s.id));

  return (
    <div className="app">
      <header className="hud">
        <div className="hud-inner">
          <div className="hud-station">
            <h1>{state.stationName}</h1>
            <div className="hud-date">{dateLabel(state.week, state.year)}</div>
          </div>
          <div className="hud-stats">
            <span className={cx('hud-stat', state.cash < 0 && 'neg')}><small>Cash</small><Ticker value={state.cash} format={money} delta /></span>
            <span className="hud-stat"><small>Rep</small>{state.reputation.toFixed(0)}</span>
          </div>
        </div>
      </header>

      <main className="main tab-enter" key={tab}>
        {tab === 'week' && (
          <WeekScreen state={state} todos={todos} onMenu={onMenu}
            onExpand={() => {
              void ask({ title: 'Buy the license?', text: 'Running costs rise a lot, but so does the audience. Make sure you have shows ready for the bigger schedule.', confirm: 'Buy license' })
                .then((ok) => { if (ok) run(state.tier === 'local' ? expandToState : expandToNational); });
            }}
            onAffiliate={() => run(signAffiliate, 'Affiliate signed! 📡')}
            onOpenShow={setOpenShow} onNewShow={() => setWizard({})} goTab={setTab} />
        )}
        {tab === 'schedule' && (
          <ScheduleScreen state={state}
            onSchedule={(slot, id) => run((s) => scheduleShow(s, slot, id))}
            onOpenShow={setOpenShow}
            onAssignTeam={(rid, c, t) => run((s) => assignSportsTeam(s, rid, c, t), 'Broadcast team set.')} />
        )}
        {tab === 'studio' && (
          <StudioScreen state={state} onNewShow={() => setWizard({})}
            onCancelProject={(id) => run((s) => cancelProject(s, id), 'Production scrapped.')} />
        )}
        {tab === 'cards' && (
          <CardsScreen state={state}
            onUseBusinessCard={(id) => run((s) => useBusinessCard(s, id), 'Contract renewed!')}
            onRelease={(id) => run((s) => releasePerson(s, id), 'Card released.')}
            onUseNetworkCard={(id) => setUsingCard(id)} />
        )}
        {tab === 'shop' && (
          <ShopScreen state={state}
            onBuyPack={(kind) => run((s) => buyPack(s, kind))}
            onBuyBusinessCard={() => run(buyBusinessCard, 'Business Card added to your collection.')}
            onBid={(lot, amount) => run((s) => bidOnRights(s, lot, amount), amount === null ? 'Bid withdrawn.' : 'Sealed bid placed.')} />
        )}
      </main>

      <button className="air-fab" onClick={air} aria-label="Air this week">
        ▶ Air week
      </button>

      <nav className="tabbar">
        <div className="tabbar-inner">
          {TABS.map((t) => (
            <button key={t.id} className={cx('tab', tab === t.id && 'active', t.id === 'shop' && !state.shopUnlocked && !state.rightsMarket && 'locked')} onClick={() => setTab(t.id)}>
              <span className="tab-icon">{t.id === 'shop' && !state.shopUnlocked && !state.rightsMarket ? '🔒' : t.icon}</span>
              {t.label}
              {((t.id === 'week' && state.unopened.length > 0) || (t.id === 'shop' && shopDot) || (t.id === 'schedule' && scheduleDot)) && <span className="dot" />}
            </button>
          ))}
        </div>
      </nav>

      {wizard && (
        <NewShowWizard state={state} renewShowId={wizard.renew} spinoffOf={wizard.spinoff} onClose={() => setWizard(null)}
          onCreate={(plan: ShowPlan) => run((s) => createShow(s, plan), `"${plan.name || 'New season'}" is in production!`)} />
      )}
      {showMissionResult && (
        <MissionResult state={state} onMenu={onMenu} onRetry={onRetry}
          onContinue={() => run(ackMission)} />
      )}
      {state.reveal && <PackReveal key={state.reveal.id} pack={state.reveal} onDone={() => run(dismissReveal)} />}
      {!state.reveal && showResults && state.lastResult && (
        <WeekResults result={state.lastResult} state={state} onClose={() => setShowResults(false)} />
      )}
      {!state.reveal && !showResults && state.ceremony && (
        <CeremonyModal ceremony={state.ceremony} national={state.tier === 'national'} onClose={() => run(dismissCeremony)} />
      )}
      {!state.reveal && !showResults && !state.ceremony && state.pendingEvent && (
        <EventModal event={state.pendingEvent} cash={state.cash} onChoose={(i) => run((s) => answerEvent(s, i))} />
      )}
      {usingCard && (
        <TargetPicker state={state} cardId={usingCard} onClose={() => setUsingCard(null)}
          onPick={(target) => {
            const card = state.networkCards.find((c) => c.id === usingCard);
            const kind = card && networkById(card.defId).kind;
            const ok = run((s) => (kind === 'promo' ? usePromo(s, usingCard, target) : useSponsor(s, usingCard, target)), kind === 'promo' ? 'Hype is building! 🔥' : 'Sponsor signed! 💰');
            if (ok) setUsingCard(null);
          }} />
      )}
      {!state.reveal && !showResults && !state.ceremony && !state.pendingEvent && finishedShows.length > 0 && (
        <FinishedReveal shows={finishedShows} state={state} onClose={() => { run(dismissFinished); setTab('schedule'); }} />
      )}
      {state.milestone === 'state' && !state.reveal && !showResults && (
        <Sheet title="Welcome to the State! 🎉" onClose={() => run(dismissMilestone)}
          footer={<button className="btn primary" onClick={() => { run(dismissMilestone); setTab('schedule'); }}>See the new schedule</button>}>
          <div className="milestone">
            <div className="big">📡</div>
            <p><b>{state.stationName}</b> now broadcasts across the state.</p>
            <div className="panel stack-sm small" style={{ textAlign: 'left' }}>
              <div>📺 <b>15 slots:</b> Mon–Wed, Thu–Fri and Weekend, with Afternoon and Late Night.</div>
              <div>👥 <b>{TIERS.state.households / 1000}M households</b> — and ${TIERS.state.overhead}K/week running costs.</div>
              <div>🎛️ <b>Advanced productions:</b> 2 writers, specialists per area, 15 focus points, 2 topics.</div>
              <div>🃏 New formats in packs: <b>Animation</b> and <b>Late Show</b>.</div>
              <div>📜 State rights at the Rights Market.</div>
              <div>⚔️ New rivals: <b>{state.rivals.map((r) => r.short).join(' and ')}</b>.</div>
            </div>
          </div>
        </Sheet>
      )}
      {state.milestone === 'national' && !state.reveal && !showResults && (
        <Sheet title="Coast to coast! 🇺🇸" onClose={() => run(dismissMilestone)}
          footer={<button className="btn primary" onClick={() => { run(dismissMilestone); setTab('schedule'); }}>See the national schedule</button>}>
          <div className="milestone">
            <div className="big">🌎</div>
            <p><b>{state.stationName}</b> is a national network.</p>
            <div className="panel stack-sm small" style={{ textAlign: 'left' }}>
              <div>📺 <b>20 slots:</b> Mon–Tue, Wed–Thu, Friday and Weekend, five dayparts each.</div>
              <div>📡 <b>Reach {Math.round(reachOf(state) * 100)}%</b> of {TIERS.national.households / 1000}M households. Sign affiliates to grow it.</div>
              <div>🎬 <b>AAA productions:</b> 3 writers, a full crew, 20 focus points.</div>
              <div>🌌 <b>Big IP</b> at the Rights Market: Galaxy Wars, the Gridiron League.</div>
              <div>🏆 The <b>full Glimmy Awards</b>, and spin-offs for your hits.</div>
              <div>⚔️ Rivals: <b>{state.rivals.map((r) => r.short).join(', ')}</b>. Beat them all to become #1.</div>
            </div>
          </div>
        </Sheet>
      )}
      {state.milestone === 'champion' && !state.reveal && !showResults && (
        <Sheet title="#1 in the nation! 👑" onClose={() => run(dismissMilestone)}
          footer={<button className="btn primary" onClick={() => run(dismissMilestone)}>Keep broadcasting</button>}>
          <div className="milestone">
            <div className="big">👑</div>
            <p>From a tiny station in Port Ellison to the most-watched network in the country. <b>{state.stationName}</b> is #1!</p>
            <p className="small muted">The game goes on — keep your crown, chase more Glimmys and build more Shows for the Ages.</p>
          </div>
        </Sheet>
      )}
      {openShow && (
        <ShowSheet state={state} showId={openShow} onClose={() => setOpenShow(null)}
          onSchedule={() => { setOpenShow(null); setTab('schedule'); }}
          onRenew={(id) => { setOpenShow(null); setWizard({ renew: id }); }}
          onSpinoff={(id) => { setOpenShow(null); setWizard({ spinoff: id }); }}
          onEditPoster={(id) => setPosterFor(id)}
          onCancel={(id) => {
            const show = state.shows.find((s) => s.id === id);
            void ask({ title: `Cancel "${show?.name}"?`, text: 'The show is gone for good. Its sponsor deal ends too.', confirm: 'Cancel show', danger: true })
              .then((ok) => { if (ok && run((s) => cancelShow(s, id), 'Show cancelled.')) setOpenShow(null); });
          }} />
      )}
      {posterFor && (() => {
        const show = state.shows.find((s) => s.id === posterFor);
        return show ? (
          <PosterEditor subject={show} initial={show.poster} onClose={() => setPosterFor(null)}
            onSave={(spec) => { if (run((s) => setPoster(s, show.id, spec), spec ? 'Poster saved.' : 'Back to the automatic poster.')) setPosterFor(null); }} />
        ) : null;
      })()}
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}
