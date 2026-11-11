import type { ReactNode } from 'react';
import { IP_KIND_LABEL, TIER_LABEL, formatById, ipWorth, type IpKind, type OwnedIp } from '../../engine';
import { cx } from '../util';

interface IpView {
  name: string; icon: string; kind: IpKind; rating: number; text?: string;
  fits: OwnedIp['fits']; tier?: keyof typeof TIER_LABEL;
}

/** The formats an IP suits best, best first. */
export const bestFormats = (fits: OwnedIp['fits']) =>
  Object.entries(fits).filter(([, f]) => (f ?? 1) >= 2).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0)).map(([id, f]) => ({ id, fit: f! }));

/** A licensed IP or one of our own hit shows. */
export function IpCard({ ip, locked, chips, children }: { ip: IpView; locked?: boolean; chips?: ReactNode; children?: ReactNode }) {
  return (
    <div className={cx('card show ip-card', locked && 'silhouette')}>
      <span className="show-stripe" style={{ background: ip.kind === 'show' ? '#ffb020' : '#e0469a' }} />
      <div className="show-body">
        <div className="show-head">
          <span className="show-icon">{ip.icon}</span>
          <div style={{ minWidth: 0 }}>
            <div className="show-title">{ip.name}</div>
            <div className="show-meta">IP · {IP_KIND_LABEL[ip.kind]}{ip.tier ? ` · ${TIER_LABEL[ip.tier]}` : ''}</div>
          </div>
          {locked ? <span className="grade g-E">🔒</span> : <span className="ip-rating" title="IP rating (0–100)">{ip.rating}</span>}
        </div>
        {ip.text && <p className="small muted">{ip.text}</p>}
        <div className="row wrap">
          <span className="chip">Worth {`$${ipWorth(ip.rating)}K`}</span>
          {bestFormats(ip.fits).slice(0, 4).map(({ id, fit }) => (
            <span key={id} className={cx('chip', fit === 3 && 'good')} title={fit === 3 ? 'Made for it' : 'Works'}>
              {formatById(id)?.icon} {formatById(id)?.name}{fit === 3 ? ' ★' : ''}
            </span>
          ))}
          {chips}
        </div>
        {children}
      </div>
    </div>
  );
}
