import type { PendingEvent } from '../../engine';
import { Sheet } from './Sheet';
import { cx, money } from '../util';

/** An event that needs an answer. Choices you can't afford are shown but disabled. */
export function EventModal({ event, cash, onChoose }: { event: PendingEvent; cash: number; onChoose: (i: number) => void }) {
  return (
    <Sheet title={`📨 ${event.title}`}>
      <p style={{ marginBottom: 16 }}>{event.text}</p>
      <div className="stack">
        {event.choices.map((c, i) => {
          const short = !!c.cost && cash < c.cost;
          return (
            <button key={c.label} className={cx('todo', short && 'disabled')} disabled={short} onClick={() => onChoose(i)}>
              <span><b>{c.label}</b><div className="small muted">{short ? `Not enough cash (you have ${money(cash)})` : c.detail}</div></span>
              <span className="go">›</span>
            </button>
          );
        })}
      </div>
    </Sheet>
  );
}
