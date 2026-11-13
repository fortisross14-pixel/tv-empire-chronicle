import * as THREE from 'three';
import type { Building, BuildingKind } from '../../engine';
import { buildingDef, footprint } from '../../engine';
import { BULB_OFF, BULB_ON, M, WIN_OFF, WIN_ON, buildingMesh, carMesh, cardMesh, forgetShared, gateMesh, isShared, lampMesh, reelMesh, walkerMesh, type LotCard } from './lotModels';

export type { LotCard };

/** What the scene draws: the lot, its buildings, productions in flight, a placement ghost. */
export interface LotModel {
  w: number;
  h: number;
  stationName: string;
  buildings: Building[];
  /** Productions: which building they're in (null = waiting outside its next one). */
  projects: { id: string; buildingId: string | null; waitingAt: string | null; color: string }[];
  /** Finished things standing on the lot as cards: scripts to shoot, programmes to schedule. */
  cards: LotCard[];
  /** Free people strolling on the lot. */
  walkers: { id: string; color: string }[];
  ghost: { kind: BuildingKind; x: number; y: number; rot: number; ok: boolean } | null;
  selectedId: string | null;
}

export interface LotLabel { id: string; x: number; y: number; visible: boolean; card?: LotCard['kind'] }

const REDUCED = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const CAM_OFFSET = new THREE.Vector3(14, 16, 14);
const BORDER = 0.5; // grass around the buildable tiles
const FRONT = 2; // pavement and road in front of the lot
const easeOutBack = (t: number) => { const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

interface Entry { group: THREE.Group; key: string; fx: THREE.Object3D[]; wins: THREE.Mesh[]; anim: { kind: 'pop' | 'bounce'; t: number } | null; level: number }
interface Reel { mesh: THREE.Group; from: THREE.Vector3; to: THREE.Vector3; t: number; key: string }
interface Walker { mesh: THREE.Group; path: THREE.Vector3[]; speed: number; wait: number; phase: number; legs: THREE.Object3D[] }
interface Particle { mesh: THREE.Mesh; v: THREE.Vector3; gravity: number; life: number; t: number; grow: number; spin: number; opacity: number }

/**
 * The studio lot in 3D: a little island seen from a fixed corner, which you pan and zoom.
 * Low-poly buildings, production reels that fly between them, staff strolling about, cars
 * on the road. Draws only while something moves, and pauses when the page is hidden.
 */
export class LotScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.OrthographicCamera;
  private sun: THREE.DirectionalLight;
  /** Where the camera wants to look and how close; the drawn camera eases toward these. */
  private target = new THREE.Vector3();
  private zoom = 1;
  private camTarget = new THREE.Vector3();
  private camZoom = 0.82;
  private minZoom = 0.6;
  private aspect = 1;
  private ground = new THREE.Group();
  private gridLines: THREE.Mesh | null = null;
  private buildingsGroup = new THREE.Group();
  private meshes = new Map<string, Entry>();
  private reels = new Map<string, Reel>();
  private walkers = new Map<string, Walker>();
  private cardsGroup = new THREE.Group();
  private cards = new Map<string, { mesh: THREE.Group; key: string; t: number; spot: THREE.Vector3 }>();
  private ghost: THREE.Group | null = null;
  private ghostKey = '';
  private selection: THREE.Mesh;
  private model: LotModel | null = null;
  private busy = new Set<string>();
  private started = false;
  private raf = 0;
  private last = 0;
  private hotUntil = 0;
  private labelKey = '';
  private pointers = new Map<number, { x: number; y: number }>();
  private dragStart: { x: number; y: number; target: THREE.Vector3; moved: boolean } | null = null;
  private pinch: { dist: number; zoom: number } | null = null;
  private waves: { mesh: THREE.Mesh; t: number }[] = [];
  private particles: Particle[] = [];
  private nextPuff = 0;
  private car: { mesh: THREE.Group; wait: number; dir: number } | null = null;
  private puffGeo = new THREE.IcosahedronGeometry(1, 0);
  private bitGeo = new THREE.BoxGeometry(1, 1, 0.3);
  private onVisibility = () => { if (document.visibilityState === 'visible') this.kick(); };

  constructor(private canvas: HTMLCanvasElement, private handlers: {
    onTile: (x: number, y: number) => void;
    onBuilding: (id: string) => void;
    onCard: (kind: LotCard['kind'], id: string) => void;
    onLabels: (labels: LotLabel[]) => void;
  }) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 200);
    // A warm afternoon: bright sky, lilac bounce from below, a low sun and a soft cool fill.
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x9a7be0, 1.75));
    this.sun = new THREE.DirectionalLight(0xffe4b8, 2.1);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.bias = -0.0006;
    this.sun.shadow.normalBias = 0.03;
    this.scene.add(this.sun, this.sun.target);
    const fill = new THREE.DirectionalLight(0xb9d4ff, 0.55);
    fill.position.set(10, 6, 2);
    this.scene.add(fill);
    this.scene.add(this.ground, this.buildingsGroup, this.cardsGroup);
    this.selection = new THREE.Mesh(new THREE.RingGeometry(0.62, 0.7, 4, 1).rotateZ(Math.PI / 4), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95, depthWrite: false }));
    this.selection.rotation.x = -Math.PI / 2;
    this.selection.visible = false;
    this.scene.add(this.selection);
    canvas.addEventListener('pointerdown', this.down);
    canvas.addEventListener('pointermove', this.moveP);
    canvas.addEventListener('pointerup', this.up);
    canvas.addEventListener('pointercancel', this.up);
    canvas.addEventListener('wheel', this.wheel, { passive: false });
    document.addEventListener('visibilitychange', this.onVisibility);
    this.resize();
  }

  dispose() {
    cancelAnimationFrame(this.raf);
    document.removeEventListener('visibilitychange', this.onVisibility);
    this.canvas.removeEventListener('pointerdown', this.down);
    this.canvas.removeEventListener('pointermove', this.moveP);
    this.canvas.removeEventListener('pointerup', this.up);
    this.canvas.removeEventListener('pointercancel', this.up);
    this.canvas.removeEventListener('wheel', this.wheel);
    this.free(this.scene);
    forgetShared();
    this.puffGeo.dispose(); this.bitGeo.dispose();
    this.renderer.dispose();
  }

  /** Release an object's geometry, and the materials that belong to it alone. */
  private free(root: THREE.Object3D) {
    root.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.geometry && m.geometry !== this.puffGeo && m.geometry !== this.bitGeo) m.geometry.dispose();
      const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
      for (const x of mats) if (!isShared(x)) { const map = (x as THREE.MeshBasicMaterial).map; if (map && map.image instanceof HTMLCanvasElement && map.image.width !== 64) map.dispose(); x.dispose(); }
    });
  }

  // ---------- coordinates ----------
  private tileToWorld(x: number, y: number): THREE.Vector3 {
    const m = this.model!;
    return new THREE.Vector3(x - m.w / 2, 0, y - m.h / 2);
  }
  private centerOf(b: Pick<Building, 'kind' | 'x' | 'y' | 'rot'>): THREE.Vector3 {
    const f = footprint(b);
    return this.tileToWorld(f.x + f.w / 2, f.y + f.h / 2);
  }
  private worldToTile(p: THREE.Vector3): { x: number; y: number } {
    const m = this.model!;
    return { x: Math.floor(p.x + m.w / 2), y: Math.floor(p.z + m.h / 2) };
  }
  private topOf(id: string): number { return (this.meshes.get(id)?.group.userData.top as number | undefined) ?? 1.2; }

  resize() {
    const r = this.canvas.getBoundingClientRect();
    const w = Math.max(1, r.width);
    const h = Math.max(1, r.height);
    this.renderer.setSize(w, h, false);
    this.aspect = w / h;
    this.fitZoom();
    this.updateCamera();
    this.kick(400);
  }

  private span() { const m = this.model; return m ? Math.max(m.w, m.h) * 0.6 : 8; }

  /** The furthest zoom-out shows the whole island. */
  private fitZoom() {
    const m = this.model;
    if (!m) return;
    const across = (m.w + m.h + 2 * BORDER + FRONT) / Math.SQRT2;
    const needW = across / 2 + 0.6;
    const needH = across * 0.63 / 2 + 2.4;
    this.minZoom = Math.min(1, this.span() / Math.max(needH, needW / this.aspect));
    this.zoom = Math.max(this.zoom, this.minZoom);
  }

  private updateCamera() {
    const half = this.span() / this.camZoom;
    const c = this.camera;
    c.left = -half * this.aspect; c.right = half * this.aspect; c.top = half; c.bottom = -half;
    c.position.copy(this.camTarget).add(CAM_OFFSET);
    c.lookAt(this.camTarget);
    c.updateProjectionMatrix();
  }

  // ---------- input ----------
  private down = (e: PointerEvent) => {
    this.canvas.setPointerCapture(e.pointerId);
    this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (this.pointers.size === 1) this.dragStart = { x: e.clientX, y: e.clientY, target: this.target.clone(), moved: false };
    if (this.pointers.size === 2) {
      const [a, b] = [...this.pointers.values()];
      this.pinch = { dist: Math.hypot(a.x - b.x, a.y - b.y), zoom: this.zoom };
    }
  };
  private moveP = (e: PointerEvent) => {
    if (!this.pointers.has(e.pointerId)) return;
    this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (this.pinch && this.pointers.size === 2) {
      const [a, b] = [...this.pointers.values()];
      this.setZoom(this.pinch.zoom * (Math.hypot(a.x - b.x, a.y - b.y) / this.pinch.dist), true);
      if (this.dragStart) this.dragStart.moved = true;
      return;
    }
    const d = this.dragStart;
    if (!d) return;
    const dx = e.clientX - d.x, dy = e.clientY - d.y;
    if (!d.moved && Math.hypot(dx, dy) < 8) return;
    d.moved = true;
    // Screen drag → ground movement along the camera's right and forward directions.
    const r = this.canvas.getBoundingClientRect();
    const worldPerPx = (this.camera.right - this.camera.left) / r.width;
    const right = new THREE.Vector3(1, 0, -1).normalize();
    const fwd = new THREE.Vector3(-1, 0, -1).normalize();
    const next = d.target.clone().addScaledVector(right, -dx * worldPerPx).addScaledVector(fwd, dy * worldPerPx * 1.59);
    const m = this.model;
    if (m) { next.x = THREE.MathUtils.clamp(next.x, -m.w / 2, m.w / 2); next.z = THREE.MathUtils.clamp(next.z, -m.h / 2, m.h / 2 + FRONT); }
    this.target.copy(next);
    this.camTarget.copy(next); // a finger drag follows the finger exactly
    this.updateCamera();
    this.kick();
  };
  private up = (e: PointerEvent) => {
    const d = this.dragStart;
    const tap = d && !d.moved && this.pointers.size === 1;
    this.pointers.delete(e.pointerId);
    if (this.pointers.size < 2) this.pinch = null;
    if (this.pointers.size === 0) this.dragStart = null;
    if (tap) this.pick(e.clientX, e.clientY);
  };
  private wheel = (e: WheelEvent) => { e.preventDefault(); this.setZoom(this.zoom * (e.deltaY < 0 ? 1.12 : 1 / 1.12)); };
  private setZoom(z: number, snap = false) {
    this.zoom = THREE.MathUtils.clamp(z, this.minZoom, 3);
    if (snap) { this.camZoom = this.zoom; this.updateCamera(); }
    this.kick(500);
  }
  zoomBy(f: number) { this.setZoom(this.zoom * f); }

  private pick(cx: number, cy: number) {
    if (!this.model) return;
    const r = this.canvas.getBoundingClientRect();
    const ndc = new THREE.Vector2(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
    const ray = new THREE.Raycaster();
    ray.setFromCamera(ndc, this.camera);
    if (!this.model.ghost) {
      for (const h of ray.intersectObjects(this.cardsGroup.children, true)) {
        let o: THREE.Object3D | null = h.object;
        while (o && !o.userData.cardId) o = o.parent;
        if (o?.userData.cardId) return this.handlers.onCard(o.userData.cardKind, o.userData.cardId);
      }
      const hits = ray.intersectObjects(this.buildingsGroup.children, true);
      for (const h of hits) {
        if (h.object.name === 'beamCone') continue;
        let o: THREE.Object3D | null = h.object;
        while (o && !o.userData.buildingId) o = o.parent;
        if (o?.userData.buildingId) return this.handlers.onBuilding(o.userData.buildingId);
      }
    }
    const p = new THREE.Vector3();
    if (ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), p)) {
      const t = this.worldToTile(p);
      if (t.x >= 0 && t.y >= 0 && t.x < this.model.w && t.y < this.model.h) this.handlers.onTile(t.x, t.y);
    }
  }

  // ---------- model ----------
  setModel(m: LotModel) {
    const sizeChanged = !this.model || this.model.w !== m.w || this.model.h !== m.h;
    const wasSelected = this.model?.selectedId;
    this.model = m;
    this.busy = new Set(m.projects.map((p) => p.buildingId).filter((x): x is string => !!x));
    if (sizeChanged) {
      this.buildGround();
      this.fitZoom();
      if (!this.started) { this.target.set(-1.1, 0, -0.5); this.camTarget.copy(this.target); this.camZoom = this.zoom * 0.82; }
      this.updateCamera();
    }
    this.syncBuildings();
    this.syncGhost();
    this.syncReels();
    this.syncCards();
    this.syncWalkers();
    if (this.gridLines) this.gridLines.visible = !!m.ghost;
    const sel = m.selectedId ? m.buildings.find((b) => b.id === m.selectedId) : undefined;
    this.selection.visible = !!sel;
    if (sel) {
      const f = footprint(sel);
      this.selection.position.copy(this.centerOf(sel)).setY(0.09);
      this.selection.userData.size = [f.w * 1.14, f.h * 1.14];
      const e = this.meshes.get(sel.id);
      if (e && wasSelected !== sel.id && !e.anim) e.anim = { kind: 'bounce', t: 0 };
    }
    this.started = true;
    this.kick(700);
  }

  private buildGround() {
    const m = this.model!;
    this.free(this.ground);
    this.ground.clear();
    this.car = null;
    const px = 48;
    const paint = (lines: boolean) => {
      const canvas = document.createElement('canvas');
      canvas.width = m.w * px; canvas.height = m.h * px;
      const c = canvas.getContext('2d')!;
      if (!lines) {
        for (let x = 0; x < m.w; x++) for (let y = 0; y < m.h; y++) {
          c.fillStyle = (x + y) % 2 ? '#86d672' : '#7ecf6b';
          c.fillRect(x * px, y * px, px, px);
          // A few darker tufts so the grass isn't flat.
          const r = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
          const k = r - Math.floor(r);
          if (k > 0.86) { // a patch of flowers
            for (let i = 0; i < 4; i++) {
              c.fillStyle = ['#ffffff', '#ffd23f', '#ff9ae2', '#ffffff'][i];
              c.beginPath(); c.arc(x * px + 8 + ((k * 977 * (i + 1)) % 32), y * px + 8 + ((k * 613 * (i + 2)) % 32), 2.6, 0, 7); c.fill();
            }
          }
          if (k < 0.3) { c.fillStyle = 'rgba(40,120,60,0.16)'; c.fillRect(x * px + k * 90, y * px + 8 + k * 60, 5, 9); c.fillRect(x * px + 30 - k * 40, y * px + 30, 5, 8); }
        }
      } else {
        c.strokeStyle = 'rgba(255,255,255,0.55)'; c.lineWidth = 2;
        for (let x = 0; x <= m.w; x++) { c.beginPath(); c.moveTo(x * px, 0); c.lineTo(x * px, m.h * px); c.stroke(); }
        for (let y = 0; y <= m.h; y++) { c.beginPath(); c.moveTo(0, y * px); c.lineTo(m.w * px, y * px); c.stroke(); }
      }
      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 4;
      return tex;
    };
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(m.w, m.h), new THREE.MeshLambertMaterial({ map: paint(false) }));
    plane.rotation.x = -Math.PI / 2;
    plane.receiveShadow = true;
    this.ground.add(plane);
    // The tile grid shows only while placing a building.
    this.gridLines = new THREE.Mesh(new THREE.PlaneGeometry(m.w, m.h), new THREE.MeshBasicMaterial({ map: paint(true), transparent: true, opacity: 0.5, depthWrite: false }));
    this.gridLines.rotation.x = -Math.PI / 2; this.gridLines.position.y = 0.012; this.gridLines.visible = false;
    this.ground.add(this.gridLines);

    const box = (color: string, sx: number, sy: number, sz: number, x: number, top: number, z: number, receive = true) => {
      const o = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), M(color));
      o.position.set(x, top - sy / 2, z); o.receiveShadow = receive;
      this.ground.add(o);
      return o;
    };
    const W = m.w + 2 * BORDER, H = m.h + 2 * BORDER;
    const zFront = m.h / 2 + BORDER; // where the pavement starts
    box('#6dbd5e', W, 0.12, H, 0, -0.004, 0); // the lawn around the tiles
    box('#e4dcf2', W, 0.12, 0.55, 0, -0.004, zFront + 0.275); // pavement
    box('#c9bfe0', W, 0.14, 0.08, 0, 0.01, zFront + 0.55); // kerb
    box('#5b5482', W, 0.12, FRONT - 0.63, 0, -0.03, zFront + 0.63 + (FRONT - 0.63) / 2); // road
    const roadZ = zFront + 0.63 + (FRONT - 0.63) / 2;
    for (let x = -W / 2 + 0.6; x < W / 2 - 0.4; x += 1.3) box('#ffffff', 0.55, 0.02, 0.07, x, -0.025, roadZ, false);
    // The island itself: soil, then rock, stepping in underneath.
    const D = H + FRONT, zc = FRONT / 2;
    box('#b98058', W, 0.55, D, 0, -0.12, zc, false);
    box('#8c5f4c', W - 0.7, 0.5, D - 0.7, 0, -0.67, zc, false);
    box('#6a463f', W - 1.9, 0.45, D - 1.9, 0, -1.17, zc, false);
    // Hedges along the two far edges, with a round bush here and there.
    const hedge = (sx: number, sz: number, x: number, z: number) => { const o = box('#3f9a55', sx, 0.34, sz, x, 0.33, z); o.castShadow = true; };
    hedge(W - 0.1, 0.3, 0, -m.h / 2 - 0.27);
    hedge(0.3, H - 0.1, -m.w / 2 - 0.27, 0);
    for (let i = 0; i < Math.floor(m.w / 3); i++) {
      const bush = new THREE.Mesh(new THREE.IcosahedronGeometry(0.26, 0), M('#4fb36a'));
      bush.position.set(-m.w / 2 + 1.5 + i * 3, 0.36, -m.h / 2 - 0.27); bush.castShadow = true;
      this.ground.add(bush);
    }
    // The studio gate, lamps on the pavement, and the news van parked by the kerb.
    const gate = gateMesh();
    gate.position.set(-m.w / 4, 0, zFront - 0.2);
    this.ground.add(gate);
    for (const x of [-m.w / 2 + 0.4, m.w / 4, m.w / 2 - 0.2]) {
      const lamp = lampMesh();
      lamp.position.set(x, 0, zFront + 0.4);
      this.ground.add(lamp);
    }
    const van = carMesh(0, true);
    van.position.set(m.w / 2 - 1.6, -0.03, zFront + 0.92);
    this.ground.add(van);
    const car = carMesh(Math.floor(Math.random() * 6));
    car.position.set(-W / 2 - 1, -0.03, roadZ + 0.33);
    car.visible = false;
    this.ground.add(car);
    this.car = { mesh: car, wait: 2 + Math.random() * 3, dir: 1 };
    // The sun: its shadow box covers the whole island.
    const reach = Math.max(m.w, m.h) / 2 + 4;
    this.sun.position.set(-8, 12, 7);
    this.sun.target.position.set(0, 0, 0);
    Object.assign(this.sun.shadow.camera, { left: -reach, right: reach, top: reach, bottom: -reach, near: 1, far: 50 });
    this.sun.shadow.camera.updateProjectionMatrix();
  }

  private syncBuildings() {
    const m = this.model!;
    const seen = new Set<string>();
    for (const b of m.buildings) {
      seen.add(b.id);
      const key = `${b.kind}:${b.level}:${b.x}:${b.y}:${b.rot}:${b.kind === 'sign' ? m.stationName : ''}`;
      const have = this.meshes.get(b.id);
      if (have && have.key === key) continue;
      if (have) { this.buildingsGroup.remove(have.group); this.free(have.group); }
      const g = buildingMesh(b, m.stationName);
      const inner = g.rotation.y; // trees turn a little on their own
      g.position.copy(this.centerOf(b));
      g.rotation.y = inner - (b.rot % 4) * (Math.PI / 2);
      const fx: THREE.Object3D[] = [];
      const wins: THREE.Mesh[] = [];
      g.traverse((o) => {
        o.userData.buildingId = b.id;
        if (o.userData.fx) fx.push(o);
        if (o.userData.win) wins.push(o as THREE.Mesh);
      });
      g.userData.baseScale = g.scale.x;
      this.buildingsGroup.add(g);
      const entry: Entry = { group: g, key, fx, wins, anim: null, level: b.level };
      // New and moved buildings pop up in a puff of dust; an expanded one bounces under confetti.
      if (this.started) {
        const grew = have && b.level > have.level;
        entry.anim = { kind: grew ? 'bounce' : 'pop', t: 0 };
        if (!grew) g.scale.setScalar(0.01);
        const f = footprint(b);
        if (grew) this.burst(g.position.clone().setY(this.topOf(b.id) + 0.2), 22, ['#ffd23f', '#ff6b81', '#5be3a1', '#7cc4ff', '#ffffff'], { speed: 2.6, up: 3.4, gravity: 7, life: 1.1, size: 0.09, bits: true });
        else if (buildingDef(b.kind).stage) this.burst(g.position.clone().setY(0.15), 12, ['#f2e6d0', '#ffffff'], { speed: Math.max(f.w, f.h) * 0.9, up: 0.5, gravity: -0.3, life: 0.7, size: 0.16, grow: 1.6 });
      }
      this.meshes.set(b.id, entry);
    }
    for (const [id, v] of this.meshes) if (!seen.has(id)) { this.buildingsGroup.remove(v.group); this.free(v.group); this.meshes.delete(id); }
    // Windows glow in the buildings where a production is under way.
    for (const [id, e] of this.meshes) {
      const lit = this.busy.has(id);
      for (const w of e.wins) w.material = lit ? WIN_ON() : WIN_OFF();
    }
  }

  private syncGhost() {
    const gh = this.model!.ghost;
    const key = gh ? `${gh.kind}:${gh.rot}:${gh.ok}` : '';
    if (key !== this.ghostKey) {
      if (this.ghost) { this.scene.remove(this.ghost); this.free(this.ghost); }
      this.ghost = null;
      if (gh) {
        const g = buildingMesh({ kind: gh.kind, level: 1 }, this.model!.stationName);
        const tint = new THREE.MeshBasicMaterial({ color: gh.ok ? 0x7bed9f : 0xff4d6d, transparent: true, opacity: 0.6 });
        g.traverse((o) => {
          const mm = o as THREE.Mesh;
          if (o.name === 'beamCone' || (o as THREE.Sprite).isSprite) { o.visible = false; return; }
          if (mm.material) { if (!isShared(mm.material as THREE.Material)) (mm.material as THREE.Material).dispose(); mm.material = tint; }
          mm.castShadow = false;
        });
        const f = footprint(gh);
        const pad = new THREE.Mesh(new THREE.PlaneGeometry(f.w, f.h), new THREE.MeshBasicMaterial({ color: gh.ok ? 0x7bed9f : 0xff4d6d, transparent: true, opacity: 0.4, depthWrite: false }));
        pad.rotation.x = -Math.PI / 2; pad.position.y = 0.02; pad.name = 'pad';
        g.add(pad);
        this.ghost = g;
        this.scene.add(g);
      }
      this.ghostKey = key;
    }
    if (gh && this.ghost) {
      this.ghost.position.copy(this.centerOf(gh));
      this.ghost.rotation.y = -(gh.rot % 4) * (Math.PI / 2);
      const pad = this.ghost.getObjectByName('pad');
      if (pad) pad.rotation.z = (gh.rot % 4) * (Math.PI / 2);
    }
  }

  /** Where a production sits: above its building, or queued at the door of the next one. */
  private reelSpot(p: LotModel['projects'][number], index: number): THREE.Vector3 {
    const m = this.model!;
    const host = m.buildings.find((b) => b.id === (p.buildingId ?? p.waitingAt));
    if (!host) return new THREE.Vector3(0, 0.6, 0);
    const c = this.centerOf(host);
    // In work: the reel hovers by the front corner, clear of the badge above the roof.
    if (p.buildingId) { const f = footprint(host); return c.add(new THREE.Vector3(f.w / 2 - 0.1, this.topOf(host.id) * 0.55 + 0.25, f.h / 2 - 0.2 - index * 0.5)); }
    const f = footprint(host);
    return c.add(new THREE.Vector3(f.w / 2 + 0.35, 0.4, -f.h / 2 + 0.4 + index * 0.5)); // the queue outside
  }

  private syncReels() {
    const m = this.model!;
    const seen = new Set<string>();
    const perHost = new Map<string, number>();
    const tower = m.buildings.find((b) => b.kind === 'tower');
    for (const p of m.projects) {
      seen.add(p.id);
      const hostKey = (p.buildingId ?? 'q') + (p.waitingAt ?? '');
      const i = perHost.get(hostKey) ?? 0;
      perHost.set(hostKey, i + 1);
      const to = this.reelSpot(p, i);
      const key = `${p.buildingId}:${p.waitingAt}:${i}:${to.x.toFixed(1)}:${to.y.toFixed(1)}:${to.z.toFixed(1)}`;
      const have = this.reels.get(p.id);
      if (!have) {
        const mesh = reelMesh(p.color);
        mesh.scale.setScalar(this.started ? 0.01 : 1.5);
        mesh.position.copy(to);
        this.scene.add(mesh);
        this.reels.set(p.id, { mesh, from: to.clone(), to, t: 1, key });
      } else if (have.key !== key) {
        Object.assign(have, { from: have.mesh.position.clone(), to, t: 0, key });
      }
    }
    // Finished productions fly to the tower, then disappear.
    for (const [id, r] of this.reels) {
      if (seen.has(id)) continue;
      if (r.key !== 'done' && tower) {
        Object.assign(r, { from: r.mesh.position.clone(), to: this.centerOf(tower).add(new THREE.Vector3(0, this.topOf(tower.id) - 0.1, 0)), t: 0, key: 'done' });
      } else if (r.key !== 'done') {
        this.scene.remove(r.mesh); this.free(r.mesh); this.reels.delete(id);
      }
    }
  }

  /** Cards stand in a row in front of their building (scripts by the Writers' Room, programmes by the tower). */
  private syncCards() {
    const m = this.model!;
    const seen = new Set<string>();
    const perHost = new Map<string, number>();
    for (const c of m.cards) {
      seen.add(c.id);
      const host = m.buildings.find((b) => b.id === c.hostId);
      const i = perHost.get(c.hostId ?? '') ?? 0;
      perHost.set(c.hostId ?? '', i + 1);
      const spot = new THREE.Vector3(i * 1.25 - 1, 1.0, 0);
      if (host) {
        const f = footprint(host);
        spot.copy(this.centerOf(host)).add(c.kind === 'script'
          ? new THREE.Vector3(-f.w / 2 + 0.5 + i * 1.25, 1.0, f.h / 2 + 0.6)
          : new THREE.Vector3(f.w / 2 + 0.7 + i * 1.25, 1.0, f.h / 2 + 0.2));
      }
      const key = `${c.kind}:${c.title}:${c.note}:${c.icon}`;
      let have = this.cards.get(c.id);
      if (have && have.key !== key) { this.cardsGroup.remove(have.mesh); this.free(have.mesh); this.cards.delete(c.id); have = undefined; }
      if (!have) {
        const mesh = cardMesh(c);
        mesh.traverse((o) => { o.userData.cardId = c.id; o.userData.cardKind = c.kind; });
        mesh.rotation.set(0, Math.PI / 4, 0);
        mesh.position.copy(spot);
        if (this.started) {
          mesh.scale.setScalar(0.01);
          this.burst(spot, 12, ['#ffd23f', '#ffffff', '#ff9ae2'], { speed: 1.4, up: 1.8, gravity: 4, life: 0.8, size: 0.07, bits: true });
        }
        this.cardsGroup.add(mesh);
        if (!this.started) mesh.scale.setScalar(1.8);
        this.cards.set(c.id, { mesh, key, t: this.started ? 0 : 1, spot });
      } else have.spot = spot;
    }
    for (const [id, c] of this.cards) if (!seen.has(id)) { this.cardsGroup.remove(c.mesh); this.free(c.mesh); this.cards.delete(id); }
  }

  // ---------- strolling staff ----------
  private blockedTiles(): Set<number> {
    const m = this.model!;
    const out = new Set<number>();
    for (const b of m.buildings) {
      const f = footprint(b);
      for (let x = f.x; x < f.x + f.w; x++) for (let y = f.y; y < f.y + f.h; y++) out.add(y * m.w + x);
    }
    return out;
  }
  private freeSpot(blocked: Set<number>): { x: number; y: number } {
    const m = this.model!;
    for (let i = 0; i < 30; i++) {
      const x = Math.floor(Math.random() * m.w), y = Math.floor(Math.random() * m.h);
      if (!blocked.has(y * m.w + x)) return { x, y };
    }
    return { x: 0, y: m.h - 1 };
  }
  /** A walk around the buildings, tile by tile (breadth-first). */
  private route(from: THREE.Vector3): THREE.Vector3[] {
    const m = this.model!;
    const blocked = this.blockedTiles();
    const goal = this.freeSpot(blocked);
    const s = this.worldToTile(from);
    s.x = THREE.MathUtils.clamp(s.x, 0, m.w - 1); s.y = THREE.MathUtils.clamp(s.y, 0, m.h - 1);
    const start = s.y * m.w + s.x, end = goal.y * m.w + goal.x;
    const prev = new Map<number, number>([[start, -1]]);
    const queue = [start];
    while (queue.length && !prev.has(end)) {
      const cur = queue.shift()!;
      const cx = cur % m.w, cy = Math.floor(cur / m.w);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = cx + dx, ny = cy + dy, n = ny * m.w + nx;
        if (nx < 0 || ny < 0 || nx >= m.w || ny >= m.h || prev.has(n) || blocked.has(n)) continue;
        prev.set(n, cur);
        queue.push(n);
      }
    }
    const jitter = () => 0.3 + Math.random() * 0.4;
    if (!prev.has(end)) return [this.tileToWorld(goal.x + jitter(), goal.y + jitter())];
    const path: THREE.Vector3[] = [];
    for (let n = end; n !== start && n !== -1; n = prev.get(n)!) path.unshift(this.tileToWorld((n % m.w) + jitter(), Math.floor(n / m.w) + jitter()));
    return path;
  }

  private syncWalkers() {
    const m = this.model!;
    const list = m.walkers.slice(0, 10);
    const seen = new Set(list.map((w) => w.id));
    list.forEach((w, i) => {
      if (this.walkers.has(w.id)) return;
      const mesh = walkerMesh(w.color, i + w.id.length);
      mesh.scale.setScalar(1.7);
      const at = this.freeSpot(this.blockedTiles());
      mesh.position.copy(this.tileToWorld(at.x + 0.5, at.y + 0.5));
      this.scene.add(mesh);
      this.walkers.set(w.id, { mesh, path: [], speed: 0.55 + Math.random() * 0.35, wait: Math.random() * 2, phase: Math.random() * 6, legs: [mesh.getObjectByName('legL')!, mesh.getObjectByName('legR')!] });
    });
    for (const [id, w] of this.walkers) if (!seen.has(id)) { this.scene.remove(w.mesh); this.free(w.mesh); this.walkers.delete(id); }
  }

  // ---------- effects ----------
  /** A burst of little shapes: dust, confetti, smoke, sparkles. */
  private burst(at: THREE.Vector3, n: number, colors: string[], o: { speed: number; up: number; gravity: number; life: number; size: number; grow?: number; bits?: boolean }) {
    if (REDUCED()) return;
    for (let i = 0; i < n && this.particles.length < 90; i++) {
      const a = Math.random() * Math.PI * 2;
      const material = new THREE.MeshLambertMaterial({ color: colors[i % colors.length], flatShading: true, transparent: true, opacity: 0.95 });
      const mesh = new THREE.Mesh(o.bits ? this.bitGeo : this.puffGeo, material);
      mesh.position.copy(at);
      mesh.scale.setScalar(o.size * (0.7 + Math.random() * 0.6));
      mesh.userData.size = mesh.scale.x;
      this.scene.add(mesh);
      const sp = o.speed * (0.4 + Math.random() * 0.6);
      this.particles.push({ mesh, v: new THREE.Vector3(Math.cos(a) * sp, o.up * (0.6 + Math.random() * 0.5), Math.sin(a) * sp), gravity: o.gravity, life: o.life * (0.7 + Math.random() * 0.5), t: 0, grow: o.grow ?? 0, spin: o.bits ? 6 + Math.random() * 8 : 0, opacity: 0.95 });
    }
    this.kick(1500);
  }

  /** A week went on air: signal rings spread out from the tower. */
  broadcast() {
    const tower = this.model?.buildings.find((b) => b.kind === 'tower');
    if (!tower) return;
    for (let i = 0; i < 4; i++) {
      const mesh = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.035, 4, 40), new THREE.MeshBasicMaterial({ color: i % 2 ? '#ffffff' : '#ffd23f', transparent: true, opacity: 0.8, depthWrite: false }));
      mesh.rotation.x = Math.PI / 2;
      mesh.position.copy(this.centerOf(tower)).add(new THREE.Vector3(0, this.topOf(tower.id) - 0.2, 0));
      mesh.visible = false;
      this.scene.add(mesh);
      this.waves.push({ mesh, t: -i * 0.22 });
    }
    const e = this.meshes.get(tower.id);
    if (e && !e.anim) e.anim = { kind: 'bounce', t: 0 };
    this.kick(2500);
  }

  // ---------- loop ----------
  /** Wake the loop (it sleeps when nothing moves). `hot` keeps it smooth for that many ms. */
  kick(hot = 0) {
    if (hot) this.hotUntil = Math.max(this.hotUntil, performance.now() + hot);
    if (!this.raf && document.visibilityState === 'visible') this.raf = requestAnimationFrame(this.frame);
  }

  private frame = (now: number) => {
    this.raf = 0;
    if (document.visibilityState !== 'visible' || !this.model) return;
    // Smooth while something is happening; ~30 fps is plenty for the idle lot.
    if (now - this.last < (now < this.hotUntil ? 12 : 30)) { this.raf = requestAnimationFrame(this.frame); return; }
    const dt = Math.min(0.1, (now - (this.last || now)) / 1000);
    this.last = now;
    const calm = REDUCED();
    let moving = !calm && (this.walkers.size > 0 || !!this.car);
    let hot = false;

    // The camera eases to where it's asked to look.
    const dz = this.zoom - this.camZoom;
    const dp = this.camTarget.distanceTo(this.target);
    if (Math.abs(dz) > 0.001 || dp > 0.001) {
      const k = 1 - Math.exp(-dt * 9);
      this.camZoom += dz * k;
      this.camTarget.lerp(this.target, k);
      this.updateCamera();
      moving = hot = true;
    }

    // Buildings: pop up, bounce, and their moving parts.
    for (const [id, e] of this.meshes) {
      const base = (e.group.userData.baseScale as number) ?? 1;
      if (e.anim) {
        e.anim.t = Math.min(1, e.anim.t + dt / (e.anim.kind === 'pop' ? 0.45 : 0.55));
        const t = e.anim.t;
        if (e.anim.kind === 'pop') e.group.scale.setScalar(base * Math.max(0.01, easeOutBack(t)));
        else { const k = Math.sin(t * Math.PI * 3) * (1 - t) * 0.16; e.group.scale.set(base * (1 - k * 0.5), base * (1 + k), base * (1 - k * 0.5)); }
        if (t >= 1) { e.group.scale.setScalar(base); e.anim = null; }
        moving = hot = true;
      }
      const lit = this.busy.has(id);
      for (const o of e.fx) {
        switch (o.userData.fx) {
          case 'beacon': o.scale.setScalar(1 + 0.25 * Math.sin(now / 320)); break;
          case 'glow': ((o as THREE.Sprite).material as THREE.SpriteMaterial).opacity = 0.3 + 0.4 * (0.5 + 0.5 * Math.sin(now / 320)); break;
          case 'dish': if (!calm) o.rotation.y += dt * (lit ? 1.4 : 0.25); break;
          case 'beam': o.visible = true; o.getObjectByName('beamCone')!.visible = lit; o.rotation.set(0.35 * Math.sin(now / 1300 + (o.userData.phase as number)), 0, -0.35 + 0.3 * Math.cos(now / 1700 + (o.userData.phase as number))); break;
          case 'sway': if (!calm) o.rotation.z = Math.sin(now / 1100 + (o.userData.phase as number)) * 0.045; break;
          case 'jet': {
            const p = ((now / 1400 + (o.userData.phase as number)) % 1);
            const a = o.userData.angle as number;
            o.position.set(Math.cos(a) * p * 0.6, 0.78 + Math.sin(p * Math.PI) * 0.45 - p * 0.5, Math.sin(a) * p * 0.6);
            break;
          }
          case 'bulb': (o as THREE.Mesh).material = (Math.floor(now / 260) + (o.userData.i as number)) % 3 === 0 ? BULB_ON() : BULB_OFF(); break;
        }
      }
    }

    // Reels: fly along an arc with a trail of sparkles, then bob and spin over the roof.
    for (const [id, r] of this.reels) {
      const spin = r.mesh.getObjectByName('spin');
      if (r.mesh.scale.x < 1.5 && r.key !== 'done') { r.mesh.scale.setScalar(Math.min(1.5, r.mesh.scale.x + dt * 5)); hot = true; }
      if (r.t < 1) {
        r.t = Math.min(1, r.t + dt * 0.85);
        const k = easeInOut(r.t);
        r.mesh.position.lerpVectors(r.from, r.to, k);
        r.mesh.position.y += Math.sin(Math.PI * r.t) * 1.6;
        if (spin) spin.rotation.z -= dt * 9;
        if (Math.random() < 0.5) this.burst(r.mesh.position, 1, ['#fff3b0', '#ffffff'], { speed: 0.3, up: 0.1, gravity: 0.6, life: 0.5, size: 0.06 });
        if (r.key === 'done' && r.t > 0.75) r.mesh.scale.setScalar(Math.max(0.01, 1.5 * (1 - (r.t - 0.75) * 4)));
        hot = true;
        if (r.t >= 1) {
          if (r.key === 'done') {
            this.burst(r.to, 14, ['#ffd23f', '#ffffff', '#ff6b81'], { speed: 1.8, up: 1.6, gravity: 4, life: 0.8, size: 0.08, bits: true });
            this.scene.remove(r.mesh); this.free(r.mesh); this.reels.delete(id);
            continue;
          }
          const host = this.model.projects.find((p) => p.id === id)?.buildingId;
          const e = host ? this.meshes.get(host) : undefined;
          if (e && !e.anim) e.anim = { kind: 'bounce', t: 0 }; // the building takes it in
        }
      } else {
        r.mesh.position.y = r.to.y + Math.sin(now / 520 + r.to.x) * 0.07;
        if (spin && !calm) spin.rotation.z -= dt * 1.2;
      }
      r.mesh.rotation.y = Math.PI / 4;
      moving = true;
    }

    // Cards pop up, then hover and rock gently so they catch the eye.
    let n = 0;
    for (const c of this.cards.values()) {
      if (c.t < 1) { c.t = Math.min(1, c.t + dt / 0.5); c.mesh.scale.setScalar(1.8 * Math.max(0.01, easeOutBack(c.t))); hot = true; }
      const ph = now / 600 + n++ * 1.3;
      c.mesh.position.set(c.spot.x, c.spot.y + (calm ? 0 : Math.sin(ph) * 0.06), c.spot.z);
      c.mesh.rotation.set(-0.12, Math.PI / 4 + (calm ? 0 : Math.sin(ph * 0.7) * 0.18), 0);
      moving = true;
    }

    // Staff stroll around the buildings and stop for a moment now and then.
    if (!calm) for (const w of this.walkers.values()) {
      if (w.wait > 0) {
        w.wait -= dt;
        for (const leg of w.legs) leg.rotation.x *= 0.8;
        w.mesh.position.y = 0;
        if (w.wait <= 0) w.path = this.route(w.mesh.position);
        continue;
      }
      const next = w.path[0];
      if (!next) { w.wait = 0.8 + Math.random() * 2.5; continue; }
      const d = next.clone().sub(w.mesh.position);
      d.y = 0;
      const dist = d.length();
      if (dist < 0.06) { w.path.shift(); continue; }
      w.mesh.position.addScaledVector(d.normalize(), Math.min(dist, w.speed * dt));
      const want = Math.atan2(d.x, d.z);
      let turn = want - w.mesh.rotation.y;
      turn = Math.atan2(Math.sin(turn), Math.cos(turn));
      w.mesh.rotation.y += turn * Math.min(1, dt * 10);
      const step = now / 95 + w.phase;
      w.legs[0].rotation.x = Math.sin(step) * 0.7;
      w.legs[1].rotation.x = -Math.sin(step) * 0.7;
      w.mesh.position.y = Math.abs(Math.sin(step)) * 0.025;
    }

    // A car goes by on the road now and then.
    if (this.car && !calm) {
      const c = this.car;
      const edge = this.model.w / 2 + BORDER + 1.2;
      if (c.wait > 0) {
        c.wait -= dt;
        if (c.wait <= 0) {
          c.dir = Math.random() < 0.5 ? 1 : -1;
          c.mesh.visible = true;
          c.mesh.position.x = -edge * c.dir;
          c.mesh.rotation.y = c.dir === 1 ? 0 : Math.PI;
        }
      } else {
        c.mesh.position.x += c.dir * dt * 2.6;
        c.mesh.position.y = -0.03 + Math.abs(Math.sin(now / 90)) * 0.008;
        if (Math.abs(c.mesh.position.x) > edge) { c.mesh.visible = false; c.wait = 4 + Math.random() * 9; }
      }
    }

    // Busy buildings puff a little as people work inside.
    if (now > this.nextPuff && !calm) {
      this.nextPuff = now + 520;
      const ids = [...this.busy];
      const e = ids.length ? this.meshes.get(ids[Math.floor(Math.random() * ids.length)]) : undefined;
      if (e) {
        const src = e.fx.find((o) => o.userData.fx === 'smoke');
        const at = src ? src.getWorldPosition(new THREE.Vector3()) : e.group.position.clone().setY(this.topOf(ids[0]));
        this.burst(at, 1, ['#ffffff'], { speed: 0.12, up: 0.75, gravity: -0.15, life: 1.5, size: 0.1, grow: 1.4 });
      }
    }
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.t += dt / p.life;
      p.v.y -= p.gravity * dt;
      p.mesh.position.addScaledVector(p.v, dt);
      if (p.spin) { p.mesh.rotation.x += dt * p.spin; p.mesh.rotation.z += dt * p.spin * 0.7; }
      if (p.grow) p.mesh.scale.setScalar((p.mesh.userData.size as number) * (1 + p.t * p.grow));
      (p.mesh.material as THREE.MeshLambertMaterial).opacity = p.opacity * (1 - p.t * p.t);
      if (p.t >= 1 || p.mesh.position.y < -0.05) { this.scene.remove(p.mesh); (p.mesh.material as THREE.Material).dispose(); this.particles.splice(i, 1); }
      moving = true;
    }

    // On-air signal rings spread from the tower.
    for (let i = this.waves.length - 1; i >= 0; i--) {
      const w = this.waves[i];
      w.t += dt * 0.6;
      moving = hot = true;
      if (w.t < 0) continue;
      w.mesh.visible = true;
      w.mesh.scale.setScalar(0.5 + easeInOut(Math.min(1, w.t)) * 9);
      (w.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.8 * (1 - w.t));
      if (w.t >= 1) { this.scene.remove(w.mesh); w.mesh.geometry.dispose(); (w.mesh.material as THREE.Material).dispose(); this.waves.splice(i, 1); }
    }

    // The selection frame breathes; the placement ghost hovers.
    if (this.selection.visible) {
      const [sx, sy] = this.selection.userData.size as [number, number];
      const k = 1 + 0.03 * Math.sin(now / 260);
      this.selection.scale.set(sx * k, sy * k, 1);
      moving = true;
    }
    if (this.ghost) { this.ghost.position.y = 0.06 + 0.04 * Math.sin(now / 240); moving = true; }

    if (hot) this.hotUntil = Math.max(this.hotUntil, now + 200);
    this.renderer.render(this.scene, this.camera);
    this.emitLabels();
    if (moving || now < this.hotUntil) this.raf = requestAnimationFrame(this.frame);
  };

  /** Screen positions for the HTML labels over each building (sent only when they change). */
  private emitLabels() {
    const m = this.model;
    if (!m) return;
    const r = this.canvas.getBoundingClientRect();
    const out: LotLabel[] = [];
    for (const b of m.buildings) {
      if (!buildingDef(b.kind).stage && b.kind !== 'tower') continue;
      const p = this.centerOf(b).add(new THREE.Vector3(0, this.topOf(b.id) + (buildingDef(b.kind).stage ? 0.55 : 0.2), 0)).project(this.camera);
      out.push({ id: b.id, x: Math.round((p.x + 1) / 2 * r.width), y: Math.round((1 - p.y) / 2 * r.height), visible: p.z < 1 });
    }
    for (const c of m.cards) {
      const have = this.cards.get(c.id);
      if (!have) continue;
      const p = have.spot.clone().add(new THREE.Vector3(0, 0.95, 0)).project(this.camera);
      out.push({ id: c.id, x: Math.round((p.x + 1) / 2 * r.width), y: Math.round((1 - p.y) / 2 * r.height), visible: p.z < 1, card: c.kind });
    }
    const key = out.map((l) => `${l.id}:${l.x}:${l.y}`).join('|');
    if (key === this.labelKey) return;
    this.labelKey = key;
    this.handlers.onLabels(out);
  }

  /** Screen point of a building (for floating feedback). */
  screenOf(id: string): { x: number; y: number } | null {
    const b = this.model?.buildings.find((x) => x.id === id);
    if (!b) return null;
    const r = this.canvas.getBoundingClientRect();
    const p = this.centerOf(b).add(new THREE.Vector3(0, this.topOf(id) + 0.5, 0)).project(this.camera);
    return { x: (p.x + 1) / 2 * r.width, y: (1 - p.y) / 2 * r.height };
  }
}

export const supportsWebGL = () => {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch { return false; }
};
