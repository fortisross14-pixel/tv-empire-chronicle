import { useState } from 'react';
import type { PosterSpec } from '../../engine';
import { Sheet } from '../components/Sheet';
import { PosterArt } from './PosterArt';
import { EFFECTS, FONTS, FRAMES, FRONTS, SCENES, SKIES, TITLE_COLORS, autoPoster, shufflePoster } from './library';
import { cx } from '../util';

type Tab = 'sky' | 'scene' | 'cast' | 'effect' | 'frame' | 'title';
const TABS: { id: Tab; label: string }[] = [
  { id: 'sky', label: 'Sky' }, { id: 'scene', label: 'Scene' }, { id: 'cast', label: 'Cast' },
  { id: 'effect', label: 'Effect' }, { id: 'frame', label: 'Frame' }, { id: 'title', label: 'Title' },
];

interface Subject { id: string; name: string; formatId: string; topicId?: string | null; topic2Id?: string | null }

export function PosterEditor({
  subject, initial, onSave, onClose,
}: { subject: Subject; initial: PosterSpec | null; onSave: (spec: PosterSpec | null) => void; onClose: () => void }) {
  const [spec, setSpec] = useState<PosterSpec>(() => structuredClone(initial ?? autoPoster(subject)));
  const [tab, setTab] = useState<Tab>('sky');
  const set = (patch: Partial<PosterSpec>) => setSpec({ ...spec, ...patch });
  const setTitle = (patch: Partial<PosterSpec['title']>) => setSpec({ ...spec, title: { ...spec.title, ...patch } });

  // Relevant art first, then everything else.
  const tags = [subject.topicId, subject.topic2Id, subject.formatId].filter(Boolean) as string[];
  const sortByFit = <T extends { tags: string[] }>(xs: T[]) =>
    [...xs].sort((a, b) => Number(b.tags.some((t) => tags.includes(t))) - Number(a.tags.some((t) => tags.includes(t))));

  const toggleFront = (id: string) => {
    if (spec.fronts.includes(id)) set({ fronts: spec.fronts.filter((f) => f !== id) });
    else set({ fronts: [...spec.fronts, id].slice(-2) });
  };

  const Option = ({ on, onPick, preview, label }: { on: boolean; onPick: () => void; preview: PosterSpec; label: string }) => (
    <button className={cx('pe-opt', on && 'on')} onClick={onPick} title={label} aria-label={label} aria-pressed={on}>
      <PosterArt spec={preview} title={subject.name} hideTitle />
    </button>
  );

  return (
    <Sheet title="Poster" onClose={onClose} wide
      footer={<>
        <button className="btn ghost" onClick={() => setSpec(shufflePoster(subject))}>🎲 Shuffle</button>
        <button className="btn primary" onClick={() => onSave(spec)}>Save poster</button>
      </>}>
      <div className="stack">
        <div className="pe-preview"><PosterArt spec={spec} title={subject.name} /></div>
        <div className="row wrap small">
          <span className="muted">Art layers: sky, scene, up to 2 cast images, effect, frame, title.</span>
          <button className="btn small ghost" onClick={() => { setSpec(autoPoster(subject)); onSave(null); }}>Use automatic</button>
        </div>
        <div className="segmented pe-tabs">
          {TABS.map((t) => <button key={t.id} className={tab === t.id ? 'on' : ''} onClick={() => setTab(t.id)}>{t.label}</button>)}
        </div>

        {tab === 'sky' && (
          <div className="pe-grid">
            {SKIES.map((s) => <Option key={s.id} label={s.label} on={spec.sky === s.id} onPick={() => set({ sky: s.id })}
              preview={{ ...spec, sky: s.id, scene: null, fronts: [], effect: null, frame: null }} />)}
          </div>
        )}
        {tab === 'scene' && (
          <div className="pe-grid">
            <button className={cx('pe-opt pe-none', !spec.scene && 'on')} onClick={() => set({ scene: null })}>No scene</button>
            {sortByFit(SCENES).map((a) => <Option key={a.id} label={a.label} on={spec.scene === a.id} onPick={() => set({ scene: a.id })}
              preview={{ ...spec, scene: a.id, fronts: [], effect: null }} />)}
          </div>
        )}
        {tab === 'cast' && (
          <>
            <p className="small muted">Pick up to two. They stand side by side.</p>
            <div className="pe-grid">
              {sortByFit(FRONTS).map((a) => <Option key={a.id} label={a.label} on={spec.fronts.includes(a.id)} onPick={() => toggleFront(a.id)}
                preview={{ ...spec, fronts: [a.id], effect: null }} />)}
            </div>
          </>
        )}
        {tab === 'effect' && (
          <div className="pe-grid">
            <button className={cx('pe-opt pe-none', !spec.effect && 'on')} onClick={() => set({ effect: null })}>No effect</button>
            {sortByFit(EFFECTS).map((a) => <Option key={a.id} label={a.label} on={spec.effect === a.id} onPick={() => set({ effect: a.id })}
              preview={{ ...spec, effect: a.id }} />)}
          </div>
        )}
        {tab === 'frame' && (
          <div className="pe-grid">
            <button className={cx('pe-opt pe-none', !spec.frame && 'on')} onClick={() => set({ frame: null })}>No frame</button>
            {FRAMES.map((f) => <Option key={f.id} label={f.label} on={spec.frame === f.id} onPick={() => set({ frame: f.id })}
              preview={{ ...spec, frame: f.id }} />)}
          </div>
        )}
        {tab === 'title' && (
          <div className="stack">
            <label className="row small"><input type="checkbox" checked={spec.title.show} onChange={(e) => setTitle({ show: e.target.checked })} /> Show the title on the poster</label>
            <div className="field"><label>Font</label>
              <div className="pe-fonts">
                {FONTS.map((f) => (
                  <button key={f.id} className={cx('pe-font', spec.title.font === f.id && 'on')} style={{ fontFamily: f.family }} onClick={() => setTitle({ font: f.id })}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="field"><label>Colour</label>
              <div className="row wrap">
                {TITLE_COLORS.map((c) => (
                  <button key={c} className={cx('pe-swatch', spec.title.color === c && 'on')} style={{ background: c }} onClick={() => setTitle({ color: c })} aria-label={`Colour ${c}`} />
                ))}
              </div>
            </div>
            <div className="field"><label>Size</label>
              <div className="segmented">
                {(['s', 'm', 'l'] as const).map((z) => <button key={z} className={spec.title.size === z ? 'on' : ''} onClick={() => setTitle({ size: z })}>{z === 's' ? 'Small' : z === 'm' ? 'Medium' : 'Large'}</button>)}
              </div>
            </div>
            <div className="field"><label>Position</label>
              <div className="segmented">
                {(['top', 'middle', 'bottom', 'tilted'] as const).map((p) => <button key={p} className={spec.title.position === p ? 'on' : ''} onClick={() => setTitle({ position: p })}>{p[0].toUpperCase() + p.slice(1)}</button>)}
              </div>
            </div>
          </div>
        )}
      </div>
    </Sheet>
  );
}
