import type { PendingEvent } from '../../engine';
import { Sheet } from './Sheet';

export function EventModal({ event, onChoose }: { event: PendingEvent; onChoose: (i: number) => void }) {
  return (
    <Sheet title={`📨 ${event.title}`}>
      <p style={{ marginBottom: 16 }}>{event.text}</p>
      <div className="stack">
        {event.choices.map((c, i) => (
          <button key={c.label} className="panel todo" style={{ borderLeftColor: i === 0 ? 'var(--accent)' : 'var(--ink-3)' }} onClick={() => onChoose(i)}>
            <span><b>{c.label}</b><div className="small muted">{c.detail}</div></span>
            <span className="go">›</span>
          </button>
        ))}
      </div>
    </Sheet>
  );
}
