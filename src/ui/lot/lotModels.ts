// Low-poly models for the studio lot, built from simple shapes. Everything faces the camera
// corner (+x and +z), where doors and windows go. Parts that move carry `userData.fx`.
import * as THREE from 'three';
import type { Building } from '../../engine';
import { buildingDef } from '../../engine';

// ---------- shared materials (never disposed one by one) ----------
const shared = new Set<THREE.Material>();
const lambert = new Map<string, THREE.MeshLambertMaterial>();
const basic = new Map<string, THREE.MeshBasicMaterial>();

/** A flat-shaded, matte material; one per colour. */
export function M(color: string): THREE.MeshLambertMaterial {
  let m = lambert.get(color);
  if (!m) { m = new THREE.MeshLambertMaterial({ color, flatShading: true }); lambert.set(color, m); shared.add(m); }
  return m;
}
/** A material that ignores the light: lamps, lit windows, beacons. */
export function GLOW(color: string): THREE.MeshBasicMaterial {
  let m = basic.get(color);
  if (!m) { m = new THREE.MeshBasicMaterial({ color }); basic.set(color, m); shared.add(m); }
  return m;
}
export const isShared = (m: THREE.Material) => shared.has(m);
export function forgetShared() { for (const m of shared) m.dispose(); shared.clear(); lambert.clear(); basic.clear(); glowTex?.dispose(); glowTex = null; }

export const WIN_OFF = () => M('#4a6fb5');
export const WIN_ON = () => GLOW('#ffe9a3');
export const BULB_OFF = () => M('#a8842a');
export const BULB_ON = () => GLOW('#fff3b0');

let glowTex: THREE.CanvasTexture | null = null;
/** A soft round glow, for sprites around lamps. */
export function glowTexture(): THREE.CanvasTexture {
  if (glowTex) return glowTex;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const x = c.getContext('2d')!;
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.35, 'rgba(255,255,255,0.45)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  glowTex = new THREE.CanvasTexture(c);
  return glowTex;
}
export function glowSprite(color: string, size: number): THREE.Sprite {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color, transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending }));
  s.scale.setScalar(size);
  return s;
}

// ---------- a small kit of parts ----------
class Kit {
  g = new THREE.Group();
  /** A box whose bottom sits at `y`. */
  box(color: string, sx: number, sy: number, sz: number, x = 0, y = 0, z = 0, shadow = true): THREE.Mesh {
    const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), M(color));
    m.position.set(x, y + sy / 2, z);
    m.castShadow = shadow; m.receiveShadow = true;
    this.g.add(m);
    return m;
  }
  /** An upright cylinder (or cone) whose bottom sits at `y`. */
  cyl(color: string, rTop: number, rBottom: number, h: number, seg: number, x = 0, y = 0, z = 0, shadow = true): THREE.Mesh {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBottom, h, seg), M(color));
    m.position.set(x, y + h / 2, z);
    m.castShadow = shadow; m.receiveShadow = true;
    this.g.add(m);
    return m;
  }
  ball(color: string, r: number, x: number, y: number, z: number, detail = 0): THREE.Mesh {
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(r, detail), M(color));
    m.position.set(x, y, z);
    m.castShadow = true;
    this.g.add(m);
    return m;
  }
  /** A window on the +z face (`face` 'z') or the +x face ('x'): white frame, glass that lights up. */
  win(face: 'z' | 'x', along: number, y: number, depth: number, w: number, h: number) {
    const t = 0.05;
    const frame = face === 'z' ? this.box('#ffffff', w + 0.07, h + 0.07, t, along, y - 0.035, depth, false) : this.box('#ffffff', t, h + 0.07, w + 0.07, depth, y - 0.035, along, false);
    const glass = face === 'z' ? this.box('#4a6fb5', w, h, t, along, y, depth + 0.012, false) : this.box('#4a6fb5', t, h, w, depth + 0.012, y, along, false);
    glass.userData.win = true;
    return frame;
  }
  /** The paved slab a building stands on. */
  apron(w: number, d: number, color = '#efe3cc') {
    const m = this.box(color, w - 0.1, 0.06, d - 0.1, 0, 0, 0, false);
    this.box('#d9c9aa', w - 0.02, 0.03, d - 0.02, 0, 0, 0, false);
    return m;
  }
  add<T extends THREE.Object3D>(o: T): T { this.g.add(o); return o; }
}

/** A triangular prism (a pitched roof) with its ridge along z. */
function prism(width: number, height: number, length: number): THREE.BufferGeometry {
  const s = new THREE.Shape();
  s.moveTo(-width / 2, 0); s.lineTo(width / 2, 0); s.lineTo(0, height); s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, { depth: length, bevelEnabled: false });
  geo.translate(0, 0, -length / 2);
  return geo;
}

function pencil(): THREE.Group {
  const k = new Kit();
  k.cyl('#ffd23f', 0.1, 0.1, 0.8, 6, 0, 0.22, 0);
  k.cyl('#f2c9a0', 0.02, 0.1, 0.18, 6, 0, 1.02, 0);
  k.cyl('#3b2a55', 0.001, 0.035, 0.07, 6, 0, 1.16, 0);
  k.cyl('#c9ced6', 0.105, 0.105, 0.08, 6, 0, 0.14, 0);
  k.cyl('#ff8fb3', 0.1, 0.1, 0.14, 6, 0, 0, 0);
  return k.g;
}

function writers(lv: number): THREE.Group {
  const k = new Kit();
  const W = 1.56, D = 1.4, F = 0.58, y0 = 0.06;
  k.apron(2, 2);
  k.box('#2f9ec4', W + 0.06, 0.14, D + 0.06, 0, y0, 0);
  for (let i = 0; i < lv; i++) {
    const y = y0 + i * F;
    k.box('#62d2f2', W, F, D, 0, y, 0);
    if (i > 0) k.box('#ffffff', W + 0.05, 0.05, D + 0.05, 0, y - 0.025, 0, false);
    for (const a of [-0.42, 0.42]) {
      if (!(i === 0 && a < 0)) k.win('z', a, y + 0.2, D / 2, 0.3, 0.26);
      k.win('x', a * 0.9, y + 0.2, W / 2, 0.3, 0.26);
    }
  }
  // Door with a striped awning.
  k.box('#8a5a3a', 0.3, 0.42, 0.05, -0.42, y0, D / 2 + 0.01, false);
  k.box('#ffd23f', 0.03, 0.03, 0.03, -0.32, y0 + 0.2, D / 2 + 0.05, false);
  const awning = k.box('#ff6b81', 0.46, 0.05, 0.26, -0.42, y0 + 0.46, D / 2 + 0.1);
  awning.rotation.x = 0.35;
  // Pitched roof with a chimney.
  const top = y0 + lv * F;
  const roof = k.add(new THREE.Mesh(prism(D + 0.24, 0.46, W + 0.22), M('#5a45b0')));
  roof.rotation.y = Math.PI / 2; roof.position.y = top; roof.castShadow = true;
  k.box('#4a3896', W + 0.3, 0.05, D + 0.3, 0, top - 0.02, 0, false);
  k.box('#f2e6d0', 0.2, 0.5, 0.2, 0.45, top + 0.05, -0.3);
  const cap = k.box('#5a45b0', 0.26, 0.05, 0.26, 0.45, top + 0.55, -0.3, false);
  cap.userData.fx = 'smoke';
  // The landmark: a giant pencil leaning on the roof.
  const p = k.add(pencil());
  p.position.set(-0.3, top + 0.02, 0.42); p.rotation.set(0.5, 0.4, -0.3); p.scale.setScalar(1.25);
  p.traverse((o) => { (o as THREE.Mesh).castShadow = true; });
  k.g.userData.top = top + 0.95;
  return k.g;
}

function stage(lv: number): THREE.Group {
  const k = new Kit();
  const L = 2.62, D = 1.66, y0 = 0.06;
  const wall = 0.62 + (lv - 1) * 0.24;
  k.apron(3, 2);
  k.box('#e0a22a', L + 0.06, 0.16, D + 0.06, 0, y0, 0);
  k.box('#fff0c9', L, wall, D, 0, y0, 0);
  k.box('#ff4d6d', L + 0.02, 0.07, D + 0.02, 0, y0 + wall - 0.16, 0, false);
  // Barrel roof with ribs.
  const r = D / 2 + 0.04;
  const roof = k.add(new THREE.Mesh(new THREE.CylinderGeometry(r, r, L + 0.14, 12, 1, false, 0, Math.PI), M('#ffc12e')));
  roof.rotation.z = Math.PI / 2; roof.scale.x = 0.5; roof.position.y = y0 + wall; roof.castShadow = true;
  for (const x of [-L / 2 + 0.05, -L / 6, L / 6, L / 2 - 0.05]) {
    const rib = k.add(new THREE.Mesh(new THREE.CylinderGeometry(r + 0.035, r + 0.035, 0.1, 12, 1, false, 0, Math.PI), M('#f39c1f')));
    rib.rotation.z = Math.PI / 2; rib.scale.x = 0.5; rib.position.set(x, y0 + wall, 0);
  }
  for (let i = 0; i < lv; i++) k.box('#d8dbe6', 0.26, 0.14, 0.26, -L / 2 + 0.5 + i * 0.7, y0 + wall + r * 0.5 - 0.06, 0); // roof vents
  // The big sliding door at the end, with a hazard stripe.
  const dh = Math.min(wall - 0.08, 0.62);
  k.box('#4b4470', 0.05, dh, D * 0.56, L / 2 + 0.01, y0, 0, false);
  k.box('#3b3560', 0.06, dh, 0.03, L / 2 + 0.015, y0, 0, false);
  k.box('#ffd23f', 0.06, 0.06, D * 0.6, L / 2 + 0.012, y0 + dh, 0, false);
  // The long side: a small door, high windows, a star per level.
  k.box('#8a5a3a', 0.26, 0.4, 0.05, -L / 2 + 0.35, y0, D / 2 + 0.01, false);
  for (let i = 0; i < 4; i++) k.win('z', -0.45 + i * 0.5, y0 + wall - 0.4, D / 2, 0.3, 0.16);
  for (let i = 0; i < lv; i++) {
    const star = k.add(new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.04, 5), M('#ff4d6d')));
    star.rotation.x = Math.PI / 2; star.position.set(-0.45 + i * 0.28, y0 + 0.24, D / 2 + 0.03);
  }
  // A searchlight by the door: its beam sweeps while something is shooting.
  for (let i = 0; i < (lv >= 3 ? 2 : 1); i++) {
    const z = i === 0 ? D / 2 + 0.02 : -D / 2 + 0.2;
    k.cyl('#3b3560', 0.03, 0.05, 0.22, 5, L / 2 + 0.2, 0.06, z, false);
    const head = new THREE.Group();
    head.position.set(L / 2 + 0.2, 0.34, z);
    const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.07, 0.14, 8), M('#3b3560'));
    lamp.position.y = 0.04; head.add(lamp);
    const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.02, 8), GLOW('#fff3b0'));
    lens.position.y = 0.115; head.add(lens);
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.07, 2.6, 10, 1, true), new THREE.MeshBasicMaterial({ color: '#fff6c8', transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide }));
    beam.position.y = 1.42; beam.name = 'beamCone'; head.add(beam);
    head.userData.fx = 'beam'; head.userData.phase = i * 2.1;
    k.add(head);
  }
  // A clapperboard prop by the door.
  const clap = new Kit();
  clap.box('#2b2540', 0.34, 0.24, 0.04, 0, 0, 0);
  for (let i = 0; i < 3; i++) clap.box('#ffffff', 0.06, 0.05, 0.045, -0.11 + i * 0.11, 0.25, 0, false);
  const arm = clap.box('#2b2540', 0.36, 0.05, 0.045, 0.02, 0.25, 0);
  arm.rotation.z = 0.3; arm.position.y += 0.05;
  clap.g.position.set(-L / 2 + 0.85, 0.06, D / 2 + 0.12); clap.g.rotation.y = 0.3;
  k.add(clap.g);
  k.g.userData.top = y0 + wall + r * 0.5 + 0.1;
  return k.g;
}

function post(lv: number): THREE.Group {
  const k = new Kit();
  const W = 1.5, D = 1.44, F = 0.54, y0 = 0.06;
  k.apron(2, 2);
  k.box('#c94fa8', W + 0.06, 0.12, D + 0.06, 0, y0, 0);
  for (let i = 0; i < lv; i++) {
    const y = y0 + i * F;
    const inset = i % 2 ? 0.1 : 0;
    k.box(i % 2 ? '#ff9ae2' : '#ff7ad9', W - inset, F, D - inset, 0, y, 0);
    // A long ribbon window on both visible sides.
    k.win('z', i === 0 ? 0.2 : 0, y + 0.2, (D - inset) / 2, i === 0 ? W * 0.5 : W * 0.72, 0.2);
    k.win('x', 0, y + 0.2, (W - inset) / 2, D * 0.66, 0.2);
  }
  // Glass door with a canopy.
  k.box('#2b3a67', 0.3, 0.4, 0.05, -0.45, y0, D / 2 + 0.01, false);
  k.box('#ffffff', 0.44, 0.04, 0.2, -0.45, y0 + 0.43, D / 2 + 0.1);
  // Flat roof: parapet, air conditioning, the dish and an antenna.
  const top = y0 + lv * F;
  k.box('#ffffff', W + 0.08, 0.08, D + 0.08, 0, top, 0);
  k.box('#d8dbe6', 0.34, 0.18, 0.26, 0.4, top + 0.08, 0.35);
  k.box('#aab0c4', 0.3, 0.02, 0.22, 0.4, top + 0.26, 0.35, false);
  k.cyl('#aab0c4', 0.03, 0.04, 0.24, 5, -0.3, top + 0.08, -0.1);
  const dish = new THREE.Group();
  const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.34, 10, 5, 0, Math.PI * 2, 0, Math.PI / 2.6), new THREE.MeshLambertMaterial({ color: '#f4f4fb', flatShading: true, side: THREE.DoubleSide }));
  bowl.rotation.x = Math.PI - 0.9; bowl.position.set(0, 0.26, 0.12); bowl.castShadow = true;
  bowl.userData.own = true;
  dish.add(bowl);
  const horn = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.3, 4), M('#ff4d6d'));
  horn.rotation.x = 0.9 - Math.PI / 2 + Math.PI / 2; horn.position.set(0, 0.12, 0.05);
  dish.add(horn);
  dish.position.set(-0.3, top + 0.22, -0.1); dish.userData.fx = 'dish';
  k.add(dish);
  k.cyl('#3b3560', 0.012, 0.012, 0.6, 4, 0.5, top + 0.08, -0.45, false);
  const tip = k.add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.04, 0), GLOW('#ff4d6d')));
  tip.position.set(0.5, top + 0.7, -0.45);
  const vent = k.box('#aab0c4', 0.01, 0.01, 0.01, 0.4, top + 0.3, 0.35, false);
  vent.userData.fx = 'smoke';
  k.g.userData.top = top + 0.6;
  return k.g;
}

function tower(): THREE.Group {
  const k = new Kit();
  k.box('#d9d2ea', 0.86, 0.08, 0.86, 0, 0, 0, false);
  k.box('#8f86ad', 0.4, 0.26, 0.34, 0.2, 0.08, -0.2);
  // A tapered mast in red and white bands.
  const H = 2.7, N = 6, base = 0.26, tipR = 0.05;
  for (let i = 0; i < N; i++) {
    const r0 = base + (tipR - base) * (i / N), r1 = base + (tipR - base) * ((i + 1) / N);
    const seg = k.cyl(i % 2 ? '#ffffff' : '#ff4d6d', r1, r0, H / N, 4, -0.08, 0.08 + i * (H / N), 0.08);
    seg.rotation.y = Math.PI / 4;
  }
  k.box('#8f86ad', 0.5, 0.04, 0.5, -0.08, 0.08 + H * 0.62, 0.08, false);
  for (const [x, z, ry] of [[0.2, 0.08, Math.PI / 2], [-0.08, 0.36, 0]] as const) {
    const drum = k.add(new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.06, 8), M('#f4f4fb')));
    drum.rotation.set(Math.PI / 2, 0, ry); drum.position.set(x, 0.08 + H * 0.62 + 0.2, z);
  }
  k.cyl('#3b3560', 0.015, 0.015, 0.3, 4, -0.08, 0.08 + H, 0.08, false);
  const beacon = k.add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.09, 1), GLOW('#ff4d6d')));
  beacon.position.set(-0.08, 0.08 + H + 0.34, 0.08); beacon.userData.fx = 'beacon';
  const glow = k.add(glowSprite('#ff4d6d', 1.1));
  glow.position.copy(beacon.position); glow.userData.fx = 'glow';
  k.g.userData.top = H + 0.5;
  return k.g;
}

function tree(seed: number): THREE.Group {
  const k = new Kit();
  const r = (n: number) => { const v = Math.sin(seed * 12.9898 + n * 78.233) * 43758.5453; return v - Math.floor(v); };
  const crown = new Kit();
  if (r(1) < 0.4) {
    // A pine: stacked cones.
    k.cyl('#8a5a3a', 0.05, 0.07, 0.24, 5, 0, 0, 0);
    crown.cyl('#3f9a55', 0.001, 0.34, 0.42, 6, 0, 0.2, 0);
    crown.cyl('#4fb36a', 0.001, 0.27, 0.4, 6, 0, 0.46, 0);
    crown.cyl('#63c77a', 0.001, 0.18, 0.34, 6, 0, 0.72, 0);
  } else {
    // A round tree: a few leafy blobs.
    k.cyl('#8a5a3a', 0.05, 0.08, 0.4, 5, 0, 0, 0);
    crown.ball('#4fb36a', 0.32, 0, 0.62, 0);
    crown.ball('#63c77a', 0.24, 0.17, 0.82, 0.08);
    crown.ball('#3f9a55', 0.22, -0.18, 0.56, 0.1);
    if (r(2) < 0.35) crown.ball('#ff9ae2', 0.07, 0.22, 0.62, 0.22); // blossom
  }
  crown.g.userData.fx = 'sway'; crown.g.userData.phase = r(3) * 6;
  k.add(crown.g);
  k.g.scale.setScalar(0.9 + r(4) * 0.35);
  k.g.rotation.y = r(5) * Math.PI * 2;
  k.g.userData.top = 1;
  return k.g;
}

function fountain(): THREE.Group {
  const k = new Kit();
  k.cyl('#d9d2ea', 0.86, 0.92, 0.2, 10, 0, 0, 0);
  const water = k.add(new THREE.Mesh(new THREE.CylinderGeometry(0.76, 0.76, 0.04, 10), new THREE.MeshLambertMaterial({ color: '#7ad7ff', flatShading: true, transparent: true, opacity: 0.9 })));
  water.position.y = 0.2; water.userData.own = true;
  k.cyl('#c7bfdd', 0.1, 0.16, 0.5, 6, 0, 0.2, 0);
  k.cyl('#d9d2ea', 0.34, 0.12, 0.1, 8, 0, 0.66, 0);
  for (let i = 0; i < 8; i++) {
    const drop = k.add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.05, 0), M('#c8f1ff')));
    drop.userData.fx = 'jet'; drop.userData.phase = i / 8; drop.userData.angle = (i % 4) * (Math.PI / 2) + 0.4;
  }
  k.g.userData.top = 1;
  return k.g;
}

function sign(name: string): THREE.Group {
  const k = new Kit();
  for (const x of [-0.72, 0.72]) k.box('#3b3560', 0.07, 0.5, 0.07, x, 0, 0);
  k.box('#3b3560', 1.84, 0.56, 0.08, 0, 0.42, 0);
  const canvas = document.createElement('canvas');
  canvas.width = 384; canvas.height = 96;
  const c = canvas.getContext('2d')!;
  const grad = c.createLinearGradient(0, 0, 0, 96);
  grad.addColorStop(0, '#ffe07a'); grad.addColorStop(1, '#ffc12e');
  c.fillStyle = grad; c.fillRect(0, 0, 384, 96);
  c.fillStyle = '#2b1750'; c.font = '900 46px Figtree, system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
  const text = name.toUpperCase().slice(0, 14);
  c.fillText(text, 192, 52, 350);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const face = new THREE.MeshBasicMaterial({ map: tex });
  for (const s of [1, -1]) {
    const board = k.add(new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.42), face));
    board.position.set(0, 0.7, s * 0.045); board.rotation.y = s === 1 ? 0 : Math.PI;
  }
  // Marquee bulbs along the top.
  for (let i = 0; i < 9; i++) {
    const bulb = k.add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.04, 0), BULB_OFF()));
    bulb.position.set(-0.8 + i * 0.2, 1.02, 0); bulb.userData.fx = 'bulb'; bulb.userData.i = i;
  }
  k.g.userData.top = 1.1;
  return k.g;
}

/** One building. Its height is in `userData.top`. */
export function buildingMesh(b: Pick<Building, 'kind' | 'level'> & { x?: number; y?: number }, stationName: string): THREE.Group {
  const lv = b.level ?? 1;
  switch (b.kind) {
    case 'writers': return writers(lv);
    case 'stage': return stage(lv);
    case 'post': return post(lv);
    case 'tower': return tower();
    case 'tree': return tree((b.x ?? 0) * 31 + (b.y ?? 0) * 17 + 1);
    case 'fountain': return fountain();
    case 'sign': return sign(stationName);
    default: { const k = new Kit(); k.box(buildingDef(b.kind).color, 0.8, 0.8, 0.8); k.g.userData.top = 1; return k.g; }
  }
}

/** A film reel: one production. */
export function reelMesh(color: string): THREE.Group {
  const g = new THREE.Group();
  const spin = new THREE.Group();
  for (const z of [-0.05, 0.05]) {
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.025, 12), M(color));
    disc.rotation.x = Math.PI / 2; disc.position.z = z; disc.castShadow = true;
    spin.add(disc);
    for (let i = 0; i < 3; i++) {
      const hole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.03, 6), M('#2b1750'));
      hole.rotation.x = Math.PI / 2;
      hole.position.set(Math.cos(i * 2.094) * 0.12, Math.sin(i * 2.094) * 0.12, z + Math.sign(z) * 0.002);
      spin.add(hole);
    }
  }
  const film = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.08, 12), M('#3b3560'));
  film.rotation.x = Math.PI / 2; spin.add(film);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.14, 6), M('#ffffff'));
  hub.rotation.x = Math.PI / 2; spin.add(hub);
  spin.name = 'spin';
  g.add(spin);
  return g;
}

const SKIN = ['#f3c9a8', '#e0a878', '#b9794f', '#8a5a3a', '#ffd9bf'];
const HAIR = ['#3b2a55', '#8a5a3a', '#ffd23f', '#e8505b', '#2b2540', '#d8dbe6'];
/** A little person in their card colour, with legs that swing as they walk. */
export function walkerMesh(color: string, seed: number): THREE.Group {
  const g = new THREE.Group();
  const add = (geo: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number) => {
    const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; g.add(o); return o;
  };
  const legGeo = () => new THREE.BoxGeometry(0.045, 0.1, 0.05).translate(0, -0.05, 0);
  const l = add(legGeo(), M('#3b3560'), -0.035, 0.1, 0); l.name = 'legL';
  const r = add(legGeo(), M('#3b3560'), 0.035, 0.1, 0); r.name = 'legR';
  add(new THREE.CylinderGeometry(0.06, 0.085, 0.17, 6), M(color), 0, 0.185, 0);
  add(new THREE.IcosahedronGeometry(0.07, 1), M(SKIN[seed % SKIN.length]), 0, 0.33, 0);
  const hair = add(new THREE.SphereGeometry(0.076, 6, 4, 0, Math.PI * 2, 0, Math.PI / 2.1), M(HAIR[(seed * 7) % HAIR.length]), 0, 0.335, -0.008);
  hair.rotation.x = -0.25;
  return g;
}

const CAR_COLORS = ['#ff6b81', '#5be3a1', '#7cc4ff', '#ffd23f', '#b98cff', '#ffffff'];
/** A small car (or the station's news van) pointing along +x. */
export function carMesh(seed: number, van = false): THREE.Group {
  const k = new Kit();
  const color = van ? '#ffffff' : CAR_COLORS[seed % CAR_COLORS.length];
  const L = van ? 0.95 : 0.8;
  k.box(color, L, van ? 0.34 : 0.17, 0.42, 0, 0.08, 0);
  if (van) {
    k.box('#b98cff', L + 0.01, 0.07, 0.43, 0, 0.16, 0, false);
    k.box('#4a6fb5', 0.03, 0.14, 0.34, L / 2, 0.25, 0, false);
    k.cyl('#aab0c4', 0.02, 0.02, 0.12, 4, -0.2, 0.42, 0, false);
    const dish = k.add(new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2.6), new THREE.MeshLambertMaterial({ color: '#f4f4fb', flatShading: true, side: THREE.DoubleSide })));
    dish.rotation.x = Math.PI - 0.7; dish.position.set(-0.2, 0.62, 0.04); dish.userData.own = true;
  } else {
    k.box('#4a6fb5', L * 0.5, 0.14, 0.38, -0.04, 0.25, 0, false);
    k.box(color, L * 0.44, 0.03, 0.4, -0.04, 0.39, 0, false);
    k.box('#fff3b0', 0.02, 0.05, 0.3, L / 2, 0.14, 0, false);
  }
  for (const x of [-L / 2 + 0.17, L / 2 - 0.17]) for (const z of [-0.2, 0.2]) {
    const wheel = k.add(new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.06, 8), M('#2b2540')));
    wheel.rotation.x = Math.PI / 2; wheel.position.set(x, 0.08, z);
  }
  return k.g;
}

/** A street lamp with a warm glow. */
export function lampMesh(): THREE.Group {
  const k = new Kit();
  k.cyl('#3b3560', 0.025, 0.04, 0.9, 5, 0, 0, 0);
  k.box('#3b3560', 0.05, 0.03, 0.26, 0, 0.88, -0.1, false);
  const bulb = k.add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.06, 0), GLOW('#fff3b0')));
  bulb.position.set(0, 0.85, -0.2);
  const glow = k.add(glowSprite('#ffe9a3', 0.7));
  glow.position.copy(bulb.position);
  return k.g;
}

/** The studio gate: two pillars, a beam and a gold star. */
export function gateMesh(): THREE.Group {
  const k = new Kit();
  for (const x of [-1, 1]) {
    k.box('#f2e6d0', 0.3, 1.25, 0.3, x, 0, 0);
    k.box('#5a45b0', 0.38, 0.08, 0.38, x, 1.25, 0);
    k.box('#d9c9aa', 0.36, 0.12, 0.36, x, 0, 0, false);
  }
  k.box('#5a45b0', 2.5, 0.26, 0.2, 0, 1.33, 0);
  k.box('#ffd23f', 2.5, 0.04, 0.22, 0, 1.59, 0, false);
  const star = k.add(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.08, 5), M('#ffd23f')));
  star.rotation.x = Math.PI / 2; star.position.set(0, 1.84, 0); star.castShadow = true;
  return k.g;
}
