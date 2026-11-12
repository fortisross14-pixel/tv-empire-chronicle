import type { ReactNode } from 'react';
import {
  MONTHS, TIER_LABEL, absWeek, inSeason, monthOf, rightsById, slotLabel, sportsQuality, grade, weeksToSeasonStart,
  type GameState, type OwnedRights,
} from '../../engine';
import { cx, gradeClass } from '../util';

export const seasonLabel = (season: [number, number]) => `${MONTHS[monthOf(season[0])]}–${MONTHS[monthOf(season[1])]}`;

export function RightsCard({
  defId, owned, state, locked, children,
}: { defId: string; owned?: OwnedRights; state: GameState; locked?: boolean; children?: ReactNode }) {
  const def = rightsById(defId);
  const weeksLeft = owned ? owned.expires - absWeek(state) : null;
  const q = owned && def.kind === 'sports' ? sportsQuality(state, owned).quality : def.quality;
  const g = grade(q);
  return (
    <div className={cx('card show', locked && 'silhouette')} style={{ borderColor: def.kind === 'sports' ? '#18a36b' : '#5a4fcf' }}>
      <span className="show-stripe" style={{ background: def.kind === 'sports' ? '#18a36b' : '#5a4fcf' }} />
      <div className="show-body">
        <div className="show-head">
          <span className="show-icon">{def.icon}</span>
          <div style={{ minWidth: 0 }}>
            <div className="show-title">{def.name}</div>
            <div className="show-meta">{def.kind === 'sports' ? 'Sports rights' : def.isNew ? 'New release movie' : 'Movie'} · {TIER_LABEL[def.tier]}</div>
          </div>
          {!locked && <span className={cx('grade', gradeClass(g))} title={`Quality ${q}`}>{g}</span>}
          {locked && <span className="grade g-E">🔒</span>}
        </div>
        <p className="small muted">{def.text}</p>
        <div className="row wrap">
          {def.kind === 'film' && <span className="chip">{owned ? `${owned.airingsLeft} airings left` : `${def.airings} airings`}</span>}
          {def.kind === 'film' && <span className="chip">{owned ? `${weeksLeft} weeks left` : `${def.weeks}-week license`}</span>}
          {def.kind === 'sports' && <span className="chip">{seasonLabel(def.season!)}</span>}
          {def.kind === 'sports' && <span className="chip">{slotLabel(def.slot!)}</span>}
          {def.kind === 'sports' && !owned && <span className={cx('chip', inSeason(def, state.week) ? 'good' : weeksToSeasonStart(def, state.week) > 16 && 'warn')}>
            {inSeason(def, state.week) ? 'Season under way: games start now' : `Season starts in ${weeksToSeasonStart(def, state.week)} weeks`}
          </span>}
          {def.kind === 'sports' && owned && <span className={cx('chip', inSeason(def, state.week) && 'good')}>{inSeason(def, state.week) ? `In season · ${owned.games} games` : 'Off season'}</span>}
          {owned && def.kind === 'film' && Object.values(state.schedule).includes(owned.id) && <span className="chip good">On air</span>}
        </div>
        {children}
      </div>
    </div>
  );
}
