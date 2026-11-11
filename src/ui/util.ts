export const money = (k: number) => {
  const sign = k < 0 ? '−' : '';
  const v = Math.abs(k);
  return v >= 1000 ? `${sign}$${(v / 1000).toFixed(2)}M` : `${sign}$${v.toFixed(v >= 100 ? 0 : 1).replace(/\.0$/, '')}K`;
};
export const signedMoney = (k: number) => (k >= 0 ? `+${money(k)}` : money(k));
export const viewers = (k: number) => (k >= 1000 ? `${(k / 1000).toFixed(2)}M` : `${k.toFixed(k >= 100 ? 0 : 1)}K`);
export const pct = (x: number) => `${(x * 100).toFixed(1)}%`;
export const initials = (name: string) => name.split(' ').map((w) => w[0]).slice(0, 2).join('');
export const gradeClass = (g: string) => `g-${g.replace('+', 'p')}`;
export const cx = (...xs: (string | false | null | undefined)[]) => xs.filter(Boolean).join(' ');
