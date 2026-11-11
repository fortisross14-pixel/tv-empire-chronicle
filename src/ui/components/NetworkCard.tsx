import { NETWORK_KIND_LABEL, networkById } from '../../engine';
import { cx } from '../util';

const KIND_COLOR = { promo: '#ff8a3c', facility: '#2f6fde', sponsor: '#18a36b' } as const;

export function NetworkCardView({ defId, onClick, owned, selected }: { defId: string; onClick?: () => void; owned?: boolean; selected?: boolean }) {
  const def = networkById(defId);
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag className={cx('card prog', `rarity-${def.rarity}`, selected && 'selected')} onClick={onClick}>
      <div className="prog-head" style={{ background: KIND_COLOR[def.kind] }}>
        <span className="kind">{NETWORK_KIND_LABEL[def.kind]}{owned && ' · installed'}</span>
        <span className="icon">{def.icon}</span>
        <h3>{def.name}</h3>
      </div>
      <div className="prog-body">
        <p>{def.text}</p>
        <span className={cx('rarity-tag', def.rarity)}>{def.rarity}</span>
      </div>
    </Tag>
  );
}
