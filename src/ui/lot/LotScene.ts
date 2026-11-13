import * as THREE from 'three';
import type { Building, BuildingKind } from '../../engine';
import { buildingDef, footprint } from '../../engine';

/** What the scene draws: the lot, its buildings, productions in flight, a placement ghost. */
export interface LotModel {
  w: number;
  h: number;
  stationName: string;
  buildings: Building[];
  /** Productions: which building they're in (null = waiting outside its next one). */
  projects: { id: string; buildingId: string | null; waitingAt: string | null; color: string }[];
  /** Free people strolling on the lot. */
  walkers: { id: string; color: string }[];
  ghost: { kind: BuildingKind; x: number; y: number; rot: number; ok: boolean } | null;
  selectedId: string | null;
}

const REDUCED = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export interface LotLabel { id: string; x: number; y: number; visible: boolean }

const PALETTE = { grass: 0x2f6b4f, grassDark: 0x285c44, border: 0x1c0f33, path: 0x8a7da8, roof: 0x34205a, glass: 0x1c0f33, white: 0xffffff };
const mat = (color: number | string, opts: Partial<THREE.MeshLambertMaterialParameters> = {}) => new THREE.MeshLambertMaterial({ color, flatShading: true, ...opts });

/** One low-poly building, built from simple shapes. Height grows with its level. */
function buildingMesh(b: Pick<Building, 'kind' | 'level'>, stationName: string): THREE.Group {
  const def = buildingDef(b.kind);
  const g = new THREE.Group();
  const [w, d] = def.size;
  const body = (color: string | number, x: number, y: number, z: number, sx: number, sy: number, sz: number) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat(color));
    m.position.set(x, y + sy / 2, z);
    m.castShadow = true; m.receiveShadow = true;
    g.add(m);
    return m;
  };
  const lv = b.level ?? 1;
  switch (b.kind) {
    case 'writers': {
      const floorH = 0.55;
      for (let i = 0; i < lv; i++) {
        body(def.color, 0, 0.05 + i * floorH, 0, w * 0.8, floorH - 0.04, d * 0.8);
        for (let k = -1; k <= 1; k++) body(PALETTE.glass, k * 0.45, 0.22 + i * floorH, d * 0.4 + 0.01, 0.26, 0.2, 0.04);
      }
      body(PALETTE.roof, 0, 0.05 + lv * floorH, 0, w * 0.86, 0.08, d * 0.86);
      // a big pencil on the roof
      const pencil = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.7, 6), mat('#ffd23f'));
      pencil.rotation.z = Math.PI / 2.6; pencil.position.set(0.1, 0.4 + lv * floorH, 0);
      g.add(pencil);
      break;
    }
    case 'stage': {
      const len = w * 0.86;
      const wallH = 0.3 + (lv - 1) * 0.22;
      body(def.color, 0, 0.05, 0, len, wallH, d * 0.84);
      // A barrel roof: a cylinder lying along the hall, its lower half hidden in the walls.
      const roof = new THREE.Mesh(new THREE.CylinderGeometry(d * 0.42, d * 0.42, len, 12), mat('#f5b82e'));
      roof.rotation.z = Math.PI / 2;
      roof.position.set(0, 0.05 + wallH, 0);
      roof.castShadow = true;
      g.add(roof);
      body(PALETTE.border, len / 2 - 0.02, 0.05, 0, 0.06, Math.min(0.45, wallH + 0.1), d * 0.45); // big door
      for (let i = 0; i < lv; i++) body('#ff4d6d', -len / 2 + 0.25 + i * 0.3, 0.12, -d * 0.43, 0.16, 0.16, 0.03); // a star per level
      break;
    }
    case 'post': {
      const floorH = 0.5;
      for (let i = 0; i < lv; i++) {
        body(def.color, 0, 0.05 + i * floorH, 0, w * 0.78, floorH - 0.04, d * 0.78);
        body(PALETTE.glass, 0, 0.2 + i * floorH, d * 0.39 + 0.01, w * 0.6, 0.16, 0.04);
      }
      const dish = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2.4), mat('#e8e8f0', { side: THREE.DoubleSide }));
      dish.rotation.x = -Math.PI / 1.5; dish.position.set(-0.25, 0.25 + lv * floorH, 0);
      g.add(dish);
      body('#ffd23f', 0.35, 0.05 + lv * floorH, 0.2, 0.05, 0.5, 0.05);
      break;
    }
    case 'tower': {
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.28, 2.4, 4, 4, true), mat(def.color, { wireframe: false }));
      mast.position.y = 1.2; mast.castShadow = true;
      g.add(mast);
      for (let i = 1; i <= 4; i++) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.28 - i * 0.05, 0.02, 4, 8), mat('#ffffff'));
        ring.rotation.x = Math.PI / 2; ring.position.y = i * 0.48;
        g.add(ring);
      }
      const light = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 6), new THREE.MeshBasicMaterial({ color: '#ff4d6d' }));
      light.position.y = 2.45; light.name = 'beacon';
      g.add(light);
      break;
    }
    case 'tree': {
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.3, 5), mat('#7a4b2a'));
      trunk.position.y = 0.15; g.add(trunk);
      const crown = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.7, 6), mat(def.color));
      crown.position.y = 0.6; crown.castShadow = true; g.add(crown);
      break;
    }
    case 'fountain': {
      const basin = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.85, 0.2, 10), mat('#cfc7e8'));
      basin.position.y = 0.1; g.add(basin);
      const water = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.05, 10), mat(def.color));
      water.position.y = 0.2; water.name = 'water'; g.add(water);
      const spout = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.6, 6), mat('#a6f0ff', { transparent: true, opacity: 0.85 }));
      spout.position.y = 0.5; g.add(spout);
      break;
    }
    case 'sign': {
      for (const sx of [-0.7, 0.7]) body(PALETTE.border, sx, 0, 0, 0.06, 0.5, 0.06);
      const canvas = document.createElement('canvas');
      canvas.width = 256; canvas.height = 64;
      const c = canvas.getContext('2d')!;
      c.fillStyle = '#ffd23f'; c.fillRect(0, 0, 256, 64);
      c.fillStyle = '#1c0f33'; c.font = 'bold 30px Figtree, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(stationName.toUpperCase().slice(0, 16), 128, 34);
      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      const board = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.42, 0.06), [mat('#ffd23f'), mat('#ffd23f'), mat('#ffd23f'), mat('#ffd23f'), new THREE.MeshBasicMaterial({ map: tex }), new THREE.MeshBasicMaterial({ map: tex })]);
      board.position.y = 0.62; g.add(board);
      break;
    }
  }
  return g;
}

/** A little film reel: one production. */
function reelMesh(color: string): THREE.Group {
  const g = new THREE.Group();
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.07, 10), mat(color));
  disc.rotation.x = Math.PI / 2;
  g.add(disc);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.09, 6), mat('#ffffff'));
  hub.rotation.x = Math.PI / 2;
  g.add(hub);
  return g;
}

/** A little person: body and head in their card colour. */
function walkerMesh(color: string): THREE.Group {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.22, 6), mat(color));
  body.position.y = 0.11; g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.065, 6, 5), mat('#f3c9a8'));
  head.position.y = 0.28; g.add(head);
  return g;
}

interface Reel { mesh: THREE.Group; from: THREE.Vector3; to: THREE.Vector3; t: number; key: string }
interface Walker { mesh: THREE.Group; target: THREE.Vector3; speed: number }

/**
 * The studio lot in 3D: a fixed isometric camera you pan and zoom, low-poly buildings,
 * production reels that fly between buildings, staff strolling about. Draws only while
 * something moves (and at most ~30 fps), and pauses when the page is hidden.
 */
export class LotScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.OrthographicCamera;
  private target = new THREE.Vector3();
  private zoom = 1;
  private ground = new THREE.Group();
  private buildingsGroup = new THREE.Group();
  private meshes = new Map<string, { group: THREE.Group; key: string }>();
  private reels = new Map<string, Reel>();
  private walkers = new Map<string, Walker>();
  private ghost: THREE.Group | null = null;
  private ghostKey = '';
  private selection: THREE.Mesh;
  private model: LotModel | null = null;
  private raf = 0;
  private last = 0;
  private pointers = new Map<number, { x: number; y: number }>();
  private dragStart: { x: number; y: number; target: THREE.Vector3; moved: boolean } | null = null;
  private pinch: { dist: number; zoom: number } | null = null;
  private waves: { mesh: THREE.Mesh; t: number }[] = [];
  private puffs: { mesh: THREE.Mesh; t: number }[] = [];
  private nextPuff = 0;
  private onVisibility = () => { if (document.visibilityState === 'visible') this.kick(); };

  constructor(private canvas: HTMLCanvasElement, private handlers: {
    onTile: (x: number, y: number) => void;
    onBuilding: (id: string) => void;
    onLabels: (labels: LotLabel[]) => void;
  }) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 200);
    this.scene.add(new THREE.HemisphereLight(0xfff4e0, 0x3a2266, 1.6));
    const sun = new THREE.DirectionalLight(0xfff1d6, 1.6);
    sun.position.set(-8, 14, 6);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16 });
    this.scene.add(sun);
    this.scene.add(this.ground, this.buildingsGroup);
    this.selection = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.58, 24), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 }));
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
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      m.geometry?.dispose?.();
      const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
      mats.forEach((x) => { (x as THREE.MeshBasicMaterial).map?.dispose(); x.dispose(); });
    });
    this.renderer.dispose();
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

  resize() {
    const r = this.canvas.getBoundingClientRect();
    const w = Math.max(1, r.width);
    const h = Math.max(1, r.height);
    this.renderer.setSize(w, h, false);
    this.aspect = w / h;
    this.updateCamera();
    this.kick();
  }
  private aspect = 1;

  private updateCamera() {
    const m = this.model;
    const span = m ? Math.max(m.w, m.h) * 0.62 : 8;
    const half = span / this.zoom;
    const c = this.camera;
    c.left = -half * this.aspect; c.right = half * this.aspect; c.top = half; c.bottom = -half;
    c.position.copy(this.target).add(new THREE.Vector3(14, 16, 14));
    c.lookAt(this.target);
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
      this.setZoom(this.pinch.zoom * (Math.hypot(a.x - b.x, a.y - b.y) / this.pinch.dist));
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
    const next = d.target.clone().addScaledVector(right, -dx * worldPerPx).addScaledVector(fwd, -dy * worldPerPx * 1.4);
    const m = this.model;
    if (m) { next.x = THREE.MathUtils.clamp(next.x, -m.w / 2, m.w / 2); next.z = THREE.MathUtils.clamp(next.z, -m.h / 2, m.h / 2); }
    this.target.copy(next);
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
  private setZoom(z: number) { this.zoom = THREE.MathUtils.clamp(z, 0.7, 3); this.updateCamera(); this.kick(); }
  zoomBy(f: number) { this.setZoom(this.zoom * f); }

  private pick(cx: number, cy: number) {
    if (!this.model) return;
    const r = this.canvas.getBoundingClientRect();
    const ndc = new THREE.Vector2(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
    const ray = new THREE.Raycaster();
    ray.setFromCamera(ndc, this.camera);
    if (!this.model.ghost) {
      const hits = ray.intersectObjects(this.buildingsGroup.children, true);
      for (const h of hits) {
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
    this.model = m;
    if (sizeChanged) { this.buildGround(); this.updateCamera(); }
    this.syncBuildings();
    this.syncGhost();
    this.syncReels();
    this.syncWalkers();
    const sel = m.selectedId ? m.buildings.find((b) => b.id === m.selectedId) : undefined;
    this.selection.visible = !!sel;
    if (sel) {
      const f = footprint(sel);
      this.selection.position.copy(this.centerOf(sel)).setY(0.03);
      this.selection.scale.setScalar(Math.max(f.w, f.h) * 0.95);
    }
    this.kick();
  }

  private buildGround() {
    const m = this.model!;
    this.ground.clear();
    const canvas = document.createElement('canvas');
    const px = 32;
    canvas.width = m.w * px; canvas.height = m.h * px;
    const c = canvas.getContext('2d')!;
    for (let x = 0; x < m.w; x++) for (let y = 0; y < m.h; y++) {
      c.fillStyle = (x + y) % 2 ? '#2f6b4f' : '#2c6449';
      c.fillRect(x * px, y * px, px, px);
    }
    c.strokeStyle = 'rgba(255,255,255,0.07)';
    for (let x = 0; x <= m.w; x++) { c.beginPath(); c.moveTo(x * px, 0); c.lineTo(x * px, m.h * px); c.stroke(); }
    for (let y = 0; y <= m.h; y++) { c.beginPath(); c.moveTo(0, y * px); c.lineTo(m.w * px, y * px); c.stroke(); }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.magFilter = THREE.NearestFilter;
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(m.w, m.h), new THREE.MeshLambertMaterial({ map: tex }));
    plane.rotation.x = -Math.PI / 2;
    plane.receiveShadow = true;
    this.ground.add(plane);
    // The lot's raised edge.
    const edge = new THREE.Mesh(new THREE.BoxGeometry(m.w + 0.6, 0.4, m.h + 0.6), mat(PALETTE.border));
    edge.position.y = -0.21;
    this.ground.add(edge);
  }

  private syncBuildings() {
    const m = this.model!;
    const seen = new Set<string>();
    for (const b of m.buildings) {
      seen.add(b.id);
      const key = `${b.kind}:${b.level}:${b.x}:${b.y}:${b.rot}:${b.kind === 'sign' ? m.stationName : ''}`;
      const have = this.meshes.get(b.id);
      if (have && have.key === key) continue;
      if (have) this.buildingsGroup.remove(have.group);
      const g = buildingMesh(b, m.stationName);
      g.position.copy(this.centerOf(b));
      g.rotation.y = -(b.rot % 4) * (Math.PI / 2);
      g.userData.buildingId = b.id;
      g.traverse((o) => { o.userData.buildingId = b.id; });
      this.buildingsGroup.add(g);
      // A new building pops up.
      if (!have) g.scale.setScalar(0.01);
      this.meshes.set(b.id, { group: g, key });
    }
    for (const [id, v] of this.meshes) if (!seen.has(id)) { this.buildingsGroup.remove(v.group); this.meshes.delete(id); }
  }

  private syncGhost() {
    const gh = this.model!.ghost;
    const key = gh ? `${gh.kind}:${gh.rot}:${gh.ok}` : '';
    if (key !== this.ghostKey) {
      if (this.ghost) this.scene.remove(this.ghost);
      this.ghost = null;
      if (gh) {
        const g = buildingMesh({ kind: gh.kind, level: 1 }, this.model!.stationName);
        g.traverse((o) => {
          const mm = o as THREE.Mesh;
          if (mm.material) mm.material = new THREE.MeshBasicMaterial({ color: gh.ok ? 0x7bed9f : 0xff4d6d, transparent: true, opacity: 0.55 });
        });
        const f = footprint(gh);
        const pad = new THREE.Mesh(new THREE.PlaneGeometry(f.w, f.h), new THREE.MeshBasicMaterial({ color: gh.ok ? 0x7bed9f : 0xff4d6d, transparent: true, opacity: 0.35 }));
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
    if (p.buildingId) return c.add(new THREE.Vector3((index % 3 - 1) * 0.45, 1.6 + host.level * 0.35, 0));
    const f = footprint(host);
    return c.add(new THREE.Vector3(f.w / 2 + 0.3, 0.35, -f.h / 2 + 0.4 + index * 0.45)); // the queue outside
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
      const key = `${p.buildingId}:${p.waitingAt}:${i}`;
      const have = this.reels.get(p.id);
      if (!have) {
        const mesh = reelMesh(p.color);
        mesh.scale.setScalar(1.4);
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
        Object.assign(r, { from: r.mesh.position.clone(), to: this.centerOf(tower).add(new THREE.Vector3(0, 2.5, 0)), t: 0, key: 'done' });
      } else if (r.key !== 'done') {
        this.scene.remove(r.mesh); this.reels.delete(id);
      }
    }
  }

  private randomSpot(): THREE.Vector3 {
    const m = this.model!;
    return this.tileToWorld(0.5 + Math.random() * (m.w - 1), 0.5 + Math.random() * (m.h - 1));
  }

  private syncWalkers() {
    const m = this.model!;
    const seen = new Set(m.walkers.slice(0, 10).map((w) => w.id));
    for (const w of m.walkers.slice(0, 10)) {
      if (this.walkers.has(w.id)) continue;
      const mesh = walkerMesh(w.color);
      mesh.scale.setScalar(1.6);
      mesh.position.copy(this.randomSpot());
      this.scene.add(mesh);
      this.walkers.set(w.id, { mesh, target: this.randomSpot(), speed: 0.5 + Math.random() * 0.4 });
    }
    for (const [id, w] of this.walkers) if (!seen.has(id)) { this.scene.remove(w.mesh); this.walkers.delete(id); }
  }

  // ---------- loop ----------
  /** Wake the loop (it sleeps when nothing moves). */
  kick() {
    if (!this.raf && document.visibilityState === 'visible') this.raf = requestAnimationFrame(this.frame);
  }

  private frame = (now: number) => {
    this.raf = 0;
    if (document.visibilityState !== 'visible') return;
    const dt = Math.min(0.1, (now - (this.last || now)) / 1000);
    if (now - this.last < 30) { this.raf = requestAnimationFrame(this.frame); return; } // ~30 fps is plenty
    this.last = now;
    let moving = this.walkers.size > 0; // strolling staff keep the lot alive
    // New buildings pop up.
    for (const { group } of this.meshes.values()) {
      if (group.scale.x < 1) { group.scale.setScalar(Math.min(1, group.scale.x + dt * 3.5)); moving = true; }
    }
    // Reels: fly along an arc, then bob and spin.
    for (const [id, r] of this.reels) {
      if (r.t < 1) {
        r.t = Math.min(1, r.t + dt * 0.9);
        const k = r.t < 0.5 ? 2 * r.t * r.t : 1 - Math.pow(-2 * r.t + 2, 2) / 2;
        r.mesh.position.lerpVectors(r.from, r.to, k);
        r.mesh.position.y += Math.sin(Math.PI * r.t) * 1.4;
        moving = true;
        if (r.t >= 1 && r.key === 'done') { this.scene.remove(r.mesh); this.reels.delete(id); continue; }
      }
      r.mesh.rotation.y += dt * 1.6;
      r.mesh.position.y = (r.t < 1 ? r.mesh.position.y : r.to.y + Math.sin(now / 500 + r.to.x) * 0.06);
      moving = true;
    }
    for (const w of this.walkers.values()) {
      const d = w.target.clone().sub(w.mesh.position);
      d.y = 0;
      const dist = d.length();
      if (dist < 0.1) { w.target = this.randomSpot(); continue; }
      w.mesh.position.addScaledVector(d.normalize(), Math.min(dist, w.speed * dt));
      w.mesh.rotation.y = Math.atan2(d.x, d.z);
      w.mesh.position.y = Math.abs(Math.sin(now / 120)) * 0.03;
    }
    // Busy buildings puff a little as people work inside.
    if (this.puffs.length) moving = true;
    if (now > this.nextPuff && this.model && !REDUCED()) {
      this.nextPuff = now + 450;
      const busy = [...new Set(this.model.projects.map((p) => p.buildingId).filter((x): x is string => !!x))];
      const id = busy[Math.floor(Math.random() * busy.length)];
      const b = id ? this.model.buildings.find((x) => x.id === id) : undefined;
      if (b) {
        const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(0.12, 0), mat('#ffffff', { transparent: true, opacity: 0.8 }));
        mesh.position.copy(this.centerOf(b)).add(new THREE.Vector3((Math.random() - 0.5) * 0.8, 1 + b.level * 0.3, (Math.random() - 0.5) * 0.8));
        this.scene.add(mesh);
        this.puffs.push({ mesh, t: 0 });
      }
    }
    for (const p of [...this.puffs]) {
      p.t += dt * 0.8;
      p.mesh.position.y += dt * 0.6;
      p.mesh.scale.setScalar(1 + p.t * 1.5);
      (p.mesh.material as THREE.MeshLambertMaterial).opacity = Math.max(0, 0.8 * (1 - p.t));
      if (p.t >= 1) { this.scene.remove(p.mesh); p.mesh.geometry.dispose(); (p.mesh.material as THREE.Material).dispose(); this.puffs.splice(this.puffs.indexOf(p), 1); }
    }
    // On-air signal rings spread from the tower.
    for (const w of [...this.waves]) {
      w.t += dt * 0.7;
      if (w.t < 0) { w.mesh.visible = false; moving = true; continue; }
      w.mesh.visible = true;
      w.mesh.scale.setScalar(0.5 + w.t * 7);
      (w.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.7 * (1 - w.t));
      moving = true;
      if (w.t >= 1) { this.scene.remove(w.mesh); w.mesh.geometry.dispose(); (w.mesh.material as THREE.Material).dispose(); this.waves.splice(this.waves.indexOf(w), 1); }
    }
    // The tower's light blinks.
    for (const { group } of this.meshes.values()) {
      const beacon = group.getObjectByName('beacon') as THREE.Mesh | undefined;
      if (beacon) beacon.visible = Math.floor(now / 600) % 2 === 0;
    }
    this.renderer.render(this.scene, this.camera);
    this.emitLabels();
    if (moving) this.raf = requestAnimationFrame(this.frame);
  };

  /** Screen positions for the HTML labels over each building. */
  private emitLabels() {
    const m = this.model;
    if (!m) return;
    const r = this.canvas.getBoundingClientRect();
    const out: LotLabel[] = [];
    for (const b of m.buildings) {
      if (!buildingDef(b.kind).stage && b.kind !== 'tower') continue;
      const p = this.centerOf(b).add(new THREE.Vector3(0, 1.1 + b.level * 0.35, 0)).project(this.camera);
      out.push({ id: b.id, x: (p.x + 1) / 2 * r.width, y: (1 - p.y) / 2 * r.height, visible: p.z < 1 });
    }
    this.handlers.onLabels(out);
  }

  /** A week went on air: signal rings spread out from the tower. */
  broadcast() {
    const tower = this.model?.buildings.find((b) => b.kind === 'tower');
    if (!tower) return;
    for (let i = 0; i < 3; i++) {
      const mesh = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.04, 4, 32), new THREE.MeshBasicMaterial({ color: '#5ce1ff', transparent: true, opacity: 0.7 }));
      mesh.rotation.x = Math.PI / 2;
      mesh.position.copy(this.centerOf(tower)).add(new THREE.Vector3(0, 2.4, 0));
      mesh.visible = false;
      this.scene.add(mesh);
      this.waves.push({ mesh, t: -i * 0.3 });
    }
    this.kick();
  }

  /** Screen point of a building (for floating feedback). */
  screenOf(id: string): { x: number; y: number } | null {
    const b = this.model?.buildings.find((x) => x.id === id);
    if (!b) return null;
    const r = this.canvas.getBoundingClientRect();
    const p = this.centerOf(b).add(new THREE.Vector3(0, 2, 0)).project(this.camera);
    return { x: (p.x + 1) / 2 * r.width, y: (1 - p.y) / 2 * r.height };
  }
}

export const supportsWebGL = () => {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch { return false; }
};
