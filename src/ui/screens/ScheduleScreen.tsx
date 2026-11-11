import { useState } from 'react';
import {
  DAYPARTS, DAYPART_ICON, DAYPART_LABEL, DAY_BLOCKS, DAY_BLOCK_LABEL, FILLER_NAME, fitStars, formatById, grade, slotLabel,
  rightsById, inSeason, type GameState, type OwnedRights, type Show, type SlotId,
} from '../../engine';
import { PersonCard, ShowCard, Stars } from '../components/Cards';
import { RightsCard, seasonLabel } from '../components/RightsCard';
import { Sheet } from '../components/Sheet';
import { cx, gradeClass } from '../util';

export function ScheduleScreen({
  state, onSchedule, onRenew, onCancelShow, onAssignTeam,
}: {
  state: GameState;
  onSchedule: (slot: SlotId, id: string | null) => void;
  onRenew: (showId: string) => void;
  onCancelShow: (showId: string) => void;
  onAssignTeam: (rightsId: string, crewId: string, talentId: string) => boolean;
}) {
  const [picking, setPicking] = useState<SlotId | null>(null);
  const [teamFor, setTeamFor] = useState<OwnedRights | null>(null);
  const rival = state.rivals[0];
  const showIn = (slot: SlotId) => state.shows.find((s) => s.id === state.schedule[slot]);
  const filmIn = (slot: SlotId) => state.rights.find((r) => r.id === state.schedule[slot]);
  const sportsFor = (slot: SlotId) => state.rights.find((r) => rightsById(r.defId).slot === slot);

  return (
    <>
      <section>
        <div className="section-title"><h2>Next week's schedule</h2><span className="sub">Tap a slot</span></div>
        <div className="sched">
          {DAY_BLOCKS.map((b) => <div key={b} className="sched-head">{DAY_BLOCK_LABEL[b]}</div>)}
          {DAYPARTS.flatMap((part) => DAY_BLOCKS.map((block) => {
            const slot = `${block}-${part}` as SlotId;
            const show = showIn(slot);
            const film = filmIn(slot);
            const sport = sportsFor(slot);
            const sportDef = sport ? rightsById(sport.defId) : null;
            const live = !!sportDef && inSeason(sportDef, state.week);
            const r = rival?.schedule[slot];
            const filled = show || film;
            return (
              <button key={slot} className={cx('slot', !filled && !live && 'filler')} onClick={() => setPicking(slot)}>
                {show && <span className="accent" style={{ background: formatById(show.formatId).color }} />}
                {film && <span className="accent" style={{ background: '#5a4fcf' }} />}
                {live && <span className="accent" style={{ background: '#18a36b' }} />}
                <div className="slot-part"><span>{DAYPART_ICON[part]} {DAYPART_LABEL[part]}</span>
                  {show && <span className={cx('grade', gradeClass(grade(show.quality)))} style={{ minWidth: 24, height: 24, fontSize: 12, borderRadius: 7 }}>{grade(show.quality)}</span>}
                </div>
                {live && <div className="slot-show">{sportDef!.icon} {sportDef!.short} games</div>}
                <div className={live ? 'tiny muted' : 'slot-show'}>
                  {live && filled ? 'Preempts: ' : ''}
                  {show ? `${formatById(show.formatId).icon} ${show.name}` : film ? `${rightsById(film.defId).icon} ${rightsById(film.defId).name}` : live ? '' : FILLER_NAME}
                </div>
                {show && !live && (
                  <div className="row tiny muted">
                    <Stars n={fitStars(show.formatId, block, part)} />
                    <span>{show.episodesLeft > 0 ? `${show.episodesLeft} eps left` : 'reruns'}</span>
                  </div>
                )}
                {film && !live && <div className="tiny muted">{film.airingsLeft} airings left</div>}
                {sportDef && !live && <div className="tiny muted">{sportDef.icon} Games from {seasonLabel(sportDef.season!)}</div>}
                {r && <div className="slot-vs">vs <b>{rival.short}</b>: {formatById(r.formatId).icon} {r.name}</div>}
              </button>
            );
          }))}
        </div>
        <p className="tiny muted" style={{ marginTop: 8 }}>
          Weekday slots air 5 times a week, weekend slots twice. ★ shows how well a format suits the time slot. Sports games take over their slot in season.
        </p>
      </section>

      {state.rights.length > 0 && (
        <section>
          <div className="section-title"><h2>Your rights</h2><span className="sub">{state.rights.length}</span></div>
          <div className="grid-wide">
            {state.rights.map((r) => {
              const def = rightsById(r.defId);
              const crew = state.people.find((p) => p.id === r.crewId);
              const talent = state.people.find((p) => p.id === r.talentId);
              return (
                <RightsCard key={r.id} defId={r.defId} owned={r} state={state}>
                  {def.kind === 'sports' && (
                    <div className="spread small">
                      <span>🎥 {crew?.name ?? '—'} · 🎙️ {talent?.name ?? '—'}</span>
                      <button className="btn ghost small" onClick={() => setTeamFor(r)}>Change team</button>
                    </div>
                  )}
                  {def.kind === 'film' && !Object.values(state.schedule).includes(r.id) && <p className="tiny muted">Tap a slot to schedule it.</p>}
                </RightsCard>
              );
            })}
          </div>
        </section>
      )}

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
        <SlotPicker state={state} slot={picking}
          onPick={(id) => { onSchedule(picking, id); setPicking(null); }} onClose={() => setPicking(null)} />
      )}
      {teamFor && (
        <TeamPicker state={state} rights={teamFor} onClose={() => setTeamFor(null)}
          onSave={(c, t) => { if (onAssignTeam(teamFor.id, c, t)) setTeamFor(null); }} />
      )}
    </>
  );
}

function SlotPicker({
  state, slot, onPick, onClose,
}: { state: GameState; slot: SlotId; onPick: (id: string | null) => void; onClose: () => void }) {
  const [block, part] = slot.split('-') as [typeof DAY_BLOCKS[number], typeof DAYPARTS[number]];
  const r = state.rivals[0]?.schedule[slot];
  const where = (id: string) => Object.entries(state.schedule).find(([, sid]) => sid === id)?.[0] as SlotId | undefined;
  const shows = [...state.shows].sort((a, b) => fitStars(b.formatId, block, part) - fitStars(a.formatId, block, part) || b.quality - a.quality);
  const films = state.rights.filter((x) => rightsById(x.defId).kind === 'film');
  const sport = state.rights.find((x) => rightsById(x.defId).slot === slot);
  const note = (id: string) => {
    const other = where(id);
    if (other === slot) return '· already here';
    return other ? `· moves from ${slotLabel(other)}` : '';
  };
  return (
    <Sheet title={slotLabel(slot)} onClose={onClose}>
      {r && (
        <div className="panel flat small" style={{ marginBottom: 12 }}>
          Rival {state.rivals[0].short} airs <b>{formatById(r.formatId).icon} {r.name}</b> · {formatById(r.formatId).name} · quality {grade(r.quality)}
        </div>
      )}
      {sport && (
        <div className="panel flat small" style={{ marginBottom: 12 }}>
          {rightsById(sport.defId).icon} {rightsById(sport.defId).name} games take over this slot {seasonLabel(rightsById(sport.defId).season!)}. Whatever you schedule here waits on game weeks.
        </div>
      )}
      <div className="stack">
        {shows.length === 0 && films.length === 0 && <div className="empty">No finished shows yet.</div>}
        {shows.map((show: Show) => (
          <div key={show.id}>
            <ShowCard show={show} state={state} compact onClick={() => onPick(show.id)} />
            <div className="row tiny muted" style={{ margin: '4px 6px 0' }}>
              <span>Slot fit <Stars n={fitStars(show.formatId, block, part)} /></span><span>{note(show.id)}</span>
            </div>
          </div>
        ))}
        {films.length > 0 && <h3 style={{ fontSize: 15 }}>Licensed films</h3>}
        {films.map((f) => (
          <button key={f.id} style={{ textAlign: 'left' }} onClick={() => onPick(f.id)}>
            <RightsCard defId={f.defId} owned={f} state={state}>
              <div className="row tiny muted"><span>Slot fit <Stars n={fitStars('movie', block, part)} /></span><span>{note(f.id)}</span></div>
            </RightsCard>
          </button>
        ))}
        {state.schedule[slot] && <button className="btn ghost" onClick={() => onPick(null)}>Back to filler</button>}
      </div>
    </Sheet>
  );
}

function TeamPicker({
  state, rights, onSave, onClose,
}: { state: GameState; rights: OwnedRights; onSave: (crewId: string, talentId: string) => void; onClose: () => void }) {
  const [crew, setCrew] = useState(rights.crewId);
  const [talent, setTalent] = useState(rights.talentId);
  const def = rightsById(rights.defId);
  return (
    <Sheet title={`${def.icon} Broadcast team`} onClose={onClose}
      footer={<button className="btn primary" disabled={!crew || !talent} onClick={() => onSave(crew!, talent!)}>Save team</button>}>
      <p className="small muted" style={{ marginBottom: 12 }}>
        On game weeks they call the game and can't work in the studio. Crew uses direction, image and sound; the commentator uses hosting and charisma. Pack cards spend 1 use for the season.
      </p>
      {(['crew', 'talent'] as const).map((kind) => (
        <div key={kind}>
          <h3 style={{ fontSize: 15, margin: '8px 0' }}>{kind === 'crew' ? '🎥 Crew' : '🎙️ Commentator'}</h3>
          <div className="hscroll">
            {state.people.filter((p) => p.kind === kind).map((p) => (
              <div key={p.id} style={{ width: 190 }}>
                <PersonCard person={p} disabled={!p.house && p.uses <= 0 && p.id !== crew && p.id !== talent}
                  highlight={kind === 'crew' ? ['direction', 'image', 'sound'] : ['hosting', 'charisma']}
                  selected={(kind === 'crew' ? crew : talent) === p.id}
                  onClick={() => (kind === 'crew' ? setCrew(p.id) : setTalent(p.id))} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </Sheet>
  );
}
