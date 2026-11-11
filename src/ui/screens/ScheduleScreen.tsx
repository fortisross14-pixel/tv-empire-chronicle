import { useState } from 'react';
import {
  DAYPARTS, DAYPART_ICON, DAYPART_LABEL, DAY_BLOCKS, DAY_BLOCK_LABEL, FILLER_NAME, fitStars, formatById, grade, slotLabel,
  type GameState, type Show, type SlotId,
} from '../../engine';
import { ShowCard, Stars } from '../components/Cards';
import { Sheet } from '../components/Sheet';
import { cx, gradeClass } from '../util';

export function ScheduleScreen({
  state, onSchedule, onRenew, onCancelShow,
}: {
  state: GameState;
  onSchedule: (slot: SlotId, showId: string | null) => void;
  onRenew: (showId: string) => void;
  onCancelShow: (showId: string) => void;
}) {
  const [picking, setPicking] = useState<SlotId | null>(null);
  const rival = state.rivals[0];
  const showIn = (slot: SlotId) => state.shows.find((s) => s.id === state.schedule[slot]);

  return (
    <>
      <section>
        <div className="section-title"><h2>Next week's schedule</h2><span className="sub">Tap a slot</span></div>
        <div className="sched">
          {DAY_BLOCKS.map((b) => <div key={b} className="sched-head">{DAY_BLOCK_LABEL[b]}</div>)}
          {DAYPARTS.flatMap((part) => DAY_BLOCKS.map((block) => {
            const slot = `${block}-${part}` as SlotId;
            const show = showIn(slot);
            const r = rival?.schedule[slot];
            return (
              <button key={slot} className={cx('slot', !show && 'filler')} onClick={() => setPicking(slot)}>
                {show && <span className="accent" style={{ background: formatById(show.formatId).color }} />}
                <div className="slot-part"><span>{DAYPART_ICON[part]} {DAYPART_LABEL[part]}</span>
                  {show && <span className={cx('grade', gradeClass(grade(show.quality)))} style={{ minWidth: 24, height: 24, fontSize: 12, borderRadius: 7 }}>{grade(show.quality)}</span>}
                </div>
                <div className="slot-show">{show ? `${formatById(show.formatId).icon} ${show.name}` : FILLER_NAME}</div>
                {show && (
                  <div className="row tiny muted">
                    <Stars n={fitStars(show.formatId, block, part)} />
                    <span>{show.episodesLeft > 0 ? `${show.episodesLeft} eps left` : 'reruns'}</span>
                  </div>
                )}
                {r && <div className="slot-vs">vs <b>{rival.short}</b>: {formatById(r.formatId).icon} {r.name}</div>}
              </button>
            );
          }))}
        </div>
        <p className="tiny muted" style={{ marginTop: 8 }}>
          Weekday slots air 5 times a week, weekend slots twice. ★ shows how well a format suits the time slot.
        </p>
      </section>

      <section>
        <div className="section-title"><h2>Your shows</h2><span className="sub">{state.shows.length}</span></div>
        {state.shows.length === 0
          ? <div className="empty"><div className="big">🎬</div>Finished shows appear here. Start one in the Studio.</div>
          : (
            <div className="grid-wide">
              {state.shows.map((show) => (
                <ShowCard key={show.id} show={show} state={state} actions={
                  <div className="row wrap">
                    {show.episodesLeft <= 0 && !state.projects.some((p) => p.showId === show.id) && (
                      <button className="btn good small" onClick={() => onRenew(show.id)}>New season</button>
                    )}
                    <button className="btn danger small" onClick={() => {
                      if (confirm(`Cancel "${show.name}" for good?`)) onCancelShow(show.id);
                    }}>Cancel show</button>
                  </div>
                } />
              ))}
            </div>
          )}
      </section>

      {picking && (
        <SlotPicker state={state} slot={picking} current={showIn(picking)}
          onPick={(id) => { onSchedule(picking, id); setPicking(null); }} onClose={() => setPicking(null)} />
      )}
    </>
  );
}

function SlotPicker({
  state, slot, current, onPick, onClose,
}: { state: GameState; slot: SlotId; current?: Show; onPick: (id: string | null) => void; onClose: () => void }) {
  const [block, part] = slot.split('-') as [typeof DAY_BLOCKS[number], typeof DAYPARTS[number]];
  const r = state.rivals[0]?.schedule[slot];
  const where = (id: string) => Object.entries(state.schedule).find(([, sid]) => sid === id)?.[0] as SlotId | undefined;
  const shows = [...state.shows].sort((a, b) => fitStars(b.formatId, block, part) - fitStars(a.formatId, block, part) || b.quality - a.quality);
  return (
    <Sheet title={slotLabel(slot)} onClose={onClose}>
      {r && (
        <div className="panel flat small" style={{ marginBottom: 12 }}>
          Rival {state.rivals[0].short} airs <b>{formatById(r.formatId).icon} {r.name}</b> · {formatById(r.formatId).name} · quality {grade(r.quality)}
        </div>
      )}
      <div className="stack">
        {shows.length === 0 && <div className="empty">No finished shows yet.</div>}
        {shows.map((show) => {
          const other = where(show.id);
          return (
            <div key={show.id}>
              <ShowCard show={show} state={state} compact onClick={() => onPick(show.id)} />
              <div className="row tiny muted" style={{ margin: '4px 6px 0' }}>
                <span>Slot fit <Stars n={fitStars(show.formatId, block, part)} /></span>
                {other && other !== slot && <span>· moves from {slotLabel(other)}</span>}
                {other === slot && <span>· already here</span>}
              </div>
            </div>
          );
        })}
        {current && <button className="btn ghost" onClick={() => onPick(null)}>Back to filler</button>}
      </div>
    </Sheet>
  );
}
