import { IP_KIND_LABEL, canSpinOff, ipWorth, slotLabel, type GameState, type SlotId } from '../../engine';
import { ShowCard } from './Cards';
import { Poster, showPoster } from './Poster';
import { Sheet } from './Sheet';

/** Detail view for one of your shows, opened from a poster. */
export function ShowSheet({
  state, showId, onClose, onSchedule, onRenew, onSpinoff, onCancel, onRestore, onEditPoster,
}: {
  state: GameState; showId: string; onClose: () => void;
  onSchedule: () => void; onRenew: (id: string) => void; onSpinoff: (id: string) => void; onCancel: (id: string) => void; onRestore: (id: string) => void;
  onEditPoster: (id: string) => void;
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
        {(() => {
          const ip = state.ips.find((x) => x.id === show.ipId);
          if (!ip) return <p className="tiny muted">A season scoring 55+ (reviews and share) makes this show an IP of yours.</p>;
          return (
            <div className="panel flat small spread">
              <span>{ip.icon} {ip.originShowId === show.id ? 'Your IP' : `Based on ${ip.name}`} · {IP_KIND_LABEL[ip.kind]}</span>
              <b>Rating {ip.rating} · ${ipWorth(ip.rating)}K</b>
            </div>
          );
        })()}
        <ShowCard show={show} state={state} />
        {show.archived ? (
          <div className="row wrap">
            <span className="chip">🗄️ In the archive</span>
            <button className="btn primary" onClick={() => onRestore(show.id)}>Restore to the guide</button>
            {canSpinOff(show) && <button className="btn ghost" onClick={() => onSpinoff(show.id)}>✨ {show.ipId ? 'Spin-off / adaptation' : 'Spin-off'}</button>}
          </div>
        ) : (
          <div className="row wrap">
            <button className="btn primary" onClick={onSchedule}>{slot ? 'Change slot' : 'Schedule it'}</button>
            <button className="btn ghost" onClick={() => onEditPoster(show.id)}>🎨 Edit poster</button>
            {show.episodesLeft <= 0 && !renewing && <button className="btn good" onClick={() => onRenew(show.id)}>New season</button>}
            {canSpinOff(show) && <button className="btn ghost" onClick={() => onSpinoff(show.id)}>✨ {show.ipId ? 'Spin-off / adaptation' : 'Spin-off'}</button>}
            <button className="btn ghost" onClick={() => onCancel(show.id)}>🗄️ Archive</button>
          </div>
        )}
      </div>
    </Sheet>
  );
}
