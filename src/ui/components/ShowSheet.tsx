import { canSpinOff, slotLabel, type GameState, type SlotId } from '../../engine';
import { ShowCard } from './Cards';
import { Poster, showPoster } from './Poster';
import { Sheet } from './Sheet';

/** Detail view for one of your shows, opened from a poster. */
export function ShowSheet({
  state, showId, onClose, onSchedule, onRenew, onSpinoff, onCancel,
}: {
  state: GameState; showId: string; onClose: () => void;
  onSchedule: () => void; onRenew: (id: string) => void; onSpinoff: (id: string) => void; onCancel: (id: string) => void;
}) {
  const show = state.shows.find((s) => s.id === showId);
  if (!show) return null;
  const slot = Object.entries(state.schedule).find(([, id]) => id === show.id)?.[0] as SlotId | undefined;
  const renewing = state.projects.some((p) => p.showId === show.id);
  return (
    <Sheet title={show.name} onClose={onClose}>
      <div className="stack">
        <Poster {...showPoster(show, state)} wide fill />
        <p className="small muted">{slot ? `On air: ${slotLabel(slot)}` : 'Not on the schedule.'}{show.awards.length > 0 && ` · 🏆 ${show.awards.join(', ')}`}</p>
        <ShowCard show={show} state={state} />
        <div className="row wrap">
          <button className="btn primary" onClick={onSchedule}>{slot ? 'Change slot' : 'Schedule it'}</button>
          {show.episodesLeft <= 0 && !renewing && <button className="btn good" onClick={() => onRenew(show.id)}>New season</button>}
          {canSpinOff(show) && <button className="btn ghost" onClick={() => onSpinoff(show.id)}>✨ Spin-off</button>}
          <button className="btn danger" onClick={() => onCancel(show.id)}>Cancel show</button>
        </div>
      </div>
    </Sheet>
  );
}
