import { useEffect, useRef, useState } from 'react';
import {
  CITY, GameError, airWeek, buyBusinessCard, buyPack, cancelProject, cancelShow, clearSave, createShow,
  dateLabel, dismissFinished, dismissReveal, loadGame, newGame, openPack, saveGame, scheduleShow, useBusinessCard,
  type GameState, type ShowPlan,
} from '../engine';
import { NewShowWizard } from './components/NewShowWizard';
import { PackReveal } from './components/PackReveal';
import { WeekResults } from './components/WeekResults';
import { FinishedReveal } from './components/FinishedReveal';
import { WeekScreen, type Todo } from './screens/WeekScreen';
import { ScheduleScreen } from './screens/ScheduleScreen';
import { StudioScreen } from './screens/StudioScreen';
import { CardsScreen } from './screens/CardsScreen';
import { ShopScreen } from './screens/ShopScreen';
import { cx, money } from './util';

type Tab = 'week' | 'schedule' | 'studio' | 'cards' | 'shop';
const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'week', label: 'Week', icon: '📅' },
  { id: 'schedule', label: 'Schedule', icon: '📺' },
  { id: 'studio', label: 'Studio', icon: '🎬' },
  { id: 'cards', label: 'Cards', icon: '🃏' },
  { id: 'shop', label: 'Shop', icon: '🛍️' },
];

export function App() {
  const [state, setState] = useState<GameState | null>(() => loadGame());
  if (!state) return <TitleScreen onStart={(name) => setState(newGame((Math.random() * 2 ** 31) | 0, name))} />;
  return <Game state={state} setState={setState} />;
}

function TitleScreen({ onStart }: { onStart: (name: string) => void }) {
  const [name, setName] = useState('Ellison 8');
  return (
    <div className="title-screen">
      <div className="title-card">
        <div className="tv">📺</div>
        <h1>TV Empire Chronicle</h1>
        <p style={{ opacity: 0.8 }}>
          You just bought a tiny local TV station in {CITY}. Collect cards, make shows, win the ratings — and grow into a national network.
        </p>
        <div className="field" style={{ textAlign: 'left' }}>
          <label htmlFor="station" style={{ color: '#fff' }}>Name your channel</label>
          <input id="station" className="input" value={name} maxLength={24} onChange={(e) => setName(e.target.value)} />
        </div>
        <button className="btn primary block" onClick={() => onStart(name)}>Go on air</button>
      </div>
    </div>
  );
}

function Game({ state, setState }: { state: GameState; setState: (s: GameState | null) => void }) {
  const [tab, setTab] = useState<Tab>('week');
  const [wizard, setWizard] = useState<{ renew?: string } | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);

  useEffect(() => { saveGame(state); }, [state]);
  useEffect(() => { window.scrollTo({ top: 0 }); }, [tab]);

  const say = (msg: string) => {
    setToast(msg);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2600);
  };

  /** Run an engine action; show its error as a toast. */
  const run = (fn: (s: GameState) => GameState, okMsg?: string): boolean => {
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
    if (run(airWeek)) setShowResults(true);
  };

  const newGameConfirm = () => {
    if (!confirm('Start over? Your current station will be lost.')) return;
    clearSave();
    setState(null);
  };

  if (state.gameOver) {
    return (
      <div className="title-screen">
        <div className="title-card">
          <div className="tv">📉</div>
          <h1>Off the air</h1>
          <p style={{ opacity: 0.8 }}>{state.gameOver}</p>
          <button className="btn primary block" onClick={() => { clearSave(); setState(null); }}>Try again</button>
        </div>
      </div>
    );
  }

  // To-do list on the Week tab.
  const todos: Todo[] = [];
  for (const pack of state.unopened) {
    todos.push({ emoji: '🎁', title: 'Open your free program pack', detail: 'See which format and topics you start with.', onClick: () => run((s) => openPack(s, pack.id)) });
  }
  const booked = (id: string) => state.projects.some((pr) => [pr.writerId, pr.crewId, pr.talentId].includes(id));
  const freeKinds = new Set(state.people.filter((p) => p.uses > 0 && !booked(p.id)).map((p) => p.kind));
  if (state.formats.length > 0 && freeKinds.size === 3) {
    todos.push({
      emoji: '✍️',
      title: state.shows.length === 0 && state.projects.length === 0 ? 'Create your first show' : 'Your team is free',
      detail: 'Pick a format and topic, build the team, split the focus points.',
      onClick: () => { setTab('studio'); setWizard({}); },
    });
  }
  const scheduled = new Set(Object.values(state.schedule));
  for (const show of state.shows) {
    if (show.episodesLeft > 0 && !scheduled.has(show.id)) {
      todos.push({ emoji: '📺', title: `Schedule "${show.name}"`, detail: 'It is ready to air. Pick a time slot.', onClick: () => setTab('schedule') });
    }
    if (show.episodesLeft <= 0 && !state.projects.some((p) => p.showId === show.id) && show.history.length > 0 && show.history[show.history.length - 1].week === state.lastResult?.week) {
      todos.push({ emoji: '🔁', title: `"${show.name}" season is over`, detail: 'Renew it, keep it on as reruns, or rest it to recover novelty.', onClick: () => setTab('schedule') });
    }
  }

  const finishedShows = state.newlyFinished.map((id) => state.shows.find((s) => s.id === id)).filter(Boolean) as GameState['shows'];
  const shopDot = state.shopUnlocked && state.cash >= 40 && state.unopened.length === 0;
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
            <span className={cx('hud-stat', state.cash < 0 && 'neg')}><small>Cash</small>{money(state.cash)}</span>
            <span className="hud-stat"><small>Rep</small>{state.reputation.toFixed(0)}</span>
          </div>
        </div>
      </header>

      <main className="main">
        {tab === 'week' && <WeekScreen state={state} todos={todos} onNewGame={newGameConfirm} />}
        {tab === 'schedule' && (
          <ScheduleScreen state={state}
            onSchedule={(slot, id) => run((s) => scheduleShow(s, slot, id))}
            onRenew={(id) => setWizard({ renew: id })}
            onCancelShow={(id) => run((s) => cancelShow(s, id))} />
        )}
        {tab === 'studio' && (
          <StudioScreen state={state} onNewShow={() => setWizard({})}
            onCancelProject={(id) => run((s) => cancelProject(s, id))} />
        )}
        {tab === 'cards' && <CardsScreen state={state} onUseBusinessCard={(id) => run((s) => useBusinessCard(s, id), 'Contract renewed!')} />}
        {tab === 'shop' && (
          <ShopScreen state={state}
            onBuyPack={(kind) => run((s) => buyPack(s, kind))}
            onBuyBusinessCard={() => run(buyBusinessCard, 'Business Card added to your collection.')} />
        )}
      </main>

      <button className="air-fab" onClick={air} aria-label="Air this week">
        ▶ Air week
      </button>

      <nav className="tabbar">
        <div className="tabbar-inner">
          {TABS.map((t) => (
            <button key={t.id} className={cx('tab', tab === t.id && 'active', t.id === 'shop' && !state.shopUnlocked && 'locked')} onClick={() => setTab(t.id)}>
              <span className="tab-icon">{t.id === 'shop' && !state.shopUnlocked ? '🔒' : t.icon}</span>
              {t.label}
              {((t.id === 'week' && state.unopened.length > 0) || (t.id === 'shop' && shopDot) || (t.id === 'schedule' && scheduleDot)) && <span className="dot" />}
            </button>
          ))}
        </div>
      </nav>

      {wizard && (
        <NewShowWizard state={state} renewShowId={wizard.renew} onClose={() => setWizard(null)}
          onCreate={(plan: ShowPlan) => run((s) => createShow(s, plan), `"${plan.name || 'New season'}" is in production!`)} />
      )}
      {state.reveal && <PackReveal key={state.reveal.id} pack={state.reveal} onDone={() => run(dismissReveal)} />}
      {!state.reveal && showResults && state.lastResult && (
        <WeekResults result={state.lastResult} state={state} onClose={() => setShowResults(false)} />
      )}
      {!state.reveal && !showResults && finishedShows.length > 0 && (
        <FinishedReveal shows={finishedShows} state={state} onClose={() => { run(dismissFinished); setTab('schedule'); }} />
      )}
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}
