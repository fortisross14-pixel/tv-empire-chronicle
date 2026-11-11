import { useEffect, type ReactNode } from 'react';
import { cx } from '../util';

export function Sheet({
  title, onClose, children, wide, footer,
}: { title: ReactNode; onClose?: () => void; children: ReactNode; wide?: boolean; footer?: ReactNode }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);
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
