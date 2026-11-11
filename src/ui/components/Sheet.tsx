import { useEffect, useRef, type ReactNode } from 'react';
import { cx } from '../util';

/** Open sheets, newest last: Escape closes only the top one. */
const open: object[] = [];

export function Sheet({
  title, onClose, children, wide, footer,
}: { title: ReactNode; onClose?: () => void; children: ReactNode; wide?: boolean; footer?: ReactNode }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);
  // Escape closes a sheet that can be closed (sheets that need an answer have no onClose).
  useEffect(() => {
    const token = {};
    open.push(token);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open[open.length - 1] === token && closeRef.current) closeRef.current();
    };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); open.splice(open.indexOf(token), 1); };
  }, []);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className={cx('sheet', wide && 'wide')} role="dialog" aria-modal="true">
        <div className="sheet-head">
          <h2>{title}</h2>
          {onClose && <button className="close" onClick={onClose} aria-label="Close">✕</button>}
        </div>
        {children}
        {footer && <div className="sheet-foot">{footer}</div>}
      </div>
    </div>
  );
}
