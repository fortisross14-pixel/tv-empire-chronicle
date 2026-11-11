import { networkById, type GameState } from '../../engine';
import { NetworkCardView } from './NetworkCard';
import { Sheet } from './Sheet';

/** Pick which show (or project) a promo or sponsor card goes on. */
export function TargetPicker({ state, cardId, onPick, onClose }: {
  state: GameState; cardId: string; onPick: (targetId: string) => void; onClose: () => void;
}) {
  const card = state.networkCards.find((c) => c.id === cardId);
  if (!card) return null;
  const def = networkById(card.defId);
  const targets = def.kind === 'promo'
    ? [
      ...state.projects.map((p) => ({ id: p.id, name: p.name, note: `In production · hype ${p.hype}` })),
      ...state.shows.filter((s) => !s.premiered).map((s) => ({ id: s.id, name: s.name, note: `Before premiere · hype ${s.hype}` })),
    ]
    : state.shows.filter((s) => !state.sponsorDeals.some((d) => d.showId === s.id))
      .map((s) => ({ id: s.id, name: s.name, note: s.history.length ? `Last share ${(s.history[s.history.length - 1].share * 100).toFixed(0)}%` : 'Not aired yet' }));
  return (
    <Sheet title={`Use ${def.name}`} onClose={onClose}>
      <div style={{ maxWidth: 240, margin: '0 auto 14px' }}><NetworkCardView defId={def.id} /></div>
      <div className="stack-sm">
        {targets.length === 0 && (
          <div className="empty">{def.kind === 'promo' ? 'Promos work on shows before their premiere. Start a new show first.' : 'No show without a sponsor.'}</div>
        )}
        {targets.map((t) => (
          <button key={t.id} className="todo" onClick={() => onPick(t.id)}>
            <span><b>{t.name}</b><div className="small muted">{t.note}</div></span>
            <span className="go">›</span>
          </button>
        ))}
      </div>
    </Sheet>
  );
}
