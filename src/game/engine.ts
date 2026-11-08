// ============================================================
// GameEngine — Three.js scene, camera, robots, animations
// ============================================================
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { Board } from "./board";
import { CardTable } from "./cards3d";
import { Robot } from "./robot";
import { tileWorld, ROBOT_COLORS } from "./constants";
import type { CardKind, Player } from "./constants";
import { audio } from "./audio";
import { skyTexture } from "./textures";

interface Tween {
  dur: number;
  t: number;
  fn: (k: number) => void;
  done: () => void;
  ease: (k: number) => number;
}
const easeInOut = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
const easeOut = (k: number) => 1 - Math.pow(1 - k, 3);

const SLOT_OFFSETS: [number, number][] = [
  [-0.42, -0.42],
  [0.42, -0.42],
  [-0.42, 0.42],
  [0.42, 0.42],
];

interface Spark {
  points: THREE.Points;
  vel: Float32Array;
  life: number;
  max: number;
}

export class GameEngine {
  renderer: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  board = new Board();
  cards: CardTable;
  robots: Robot[] = [];
  private tweens: Tween[] = [];
  private sparks: Spark[] = [];
  private marker: THREE.Mesh;
  private markerIdx = -1;
  private raf = 0;
  private last = performance.now();
  showcase = true;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;

    // sky dome + fog
    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(160, 24, 16),
      new THREE.MeshBasicMaterial({ map: skyTexture(), side: THREE.BackSide, fog: false, depthWrite: false })
    );
    this.scene.add(sky);
    this.scene.fog = new THREE.Fog(0xcfeef9, 80, 160);

    // lights
    const hemi = new THREE.HemisphereLight(0xd8ecff, 0xffe6bd, 0.95);
    this.scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xfff3d6, 1.9);
    sun.position.set(28, 46, 18);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -30;
    sun.shadow.camera.right = 30;
    sun.shadow.camera.top = 30;
    sun.shadow.camera.bottom = -30;
    sun.shadow.camera.far = 120;
    sun.shadow.bias = -0.0004;
    this.scene.add(sun);
    const fill = new THREE.DirectionalLight(0xbfe3ff, 0.45);
    fill.position.set(-24, 20, -18);
    this.scene.add(fill);

    // camera + controls
    this.camera = new THREE.PerspectiveCamera(46, 1, 0.1, 400);
    this.camera.position.set(30, 24, 30);
    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.07;
    this.controls.enablePan = false;
    this.controls.minDistance = 16;
    this.controls.maxDistance = 78;
    this.controls.minPolarAngle = 0.06;
    this.controls.maxPolarAngle = 1.44;
    this.controls.target.set(0, 0, 0);
    this.controls.autoRotateSpeed = 0.7;

    this.board.build(this.scene);
    this.cards = new CardTable(this.scene);
    this.cards.setCamera(this.camera);

    // current-player marker ring
    this.marker = new THREE.Mesh(
      new THREE.RingGeometry(0.62, 0.8, 32),
      new THREE.MeshBasicMaterial({ color: 0xffd54a, transparent: true, opacity: 0.85, side: THREE.DoubleSide })
    );
    this.marker.rotation.x = -Math.PI / 2;
    this.marker.visible = false;
    this.scene.add(this.marker);

    this.resize();
    window.addEventListener("resize", this.resize);
    this.loop();
  }

  resize = () => {
    const w = this.renderer.domElement.clientWidth || window.innerWidth;
    const h = this.renderer.domElement.clientHeight || window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  };

  // ---------- tween helper ----------
  private tween(dur: number, fn: (k: number) => void, ease = easeInOut): Promise<void> {
    return new Promise((resolve) => {
      this.tweens.push({ dur, t: 0, fn, done: resolve, ease });
    });
  }

  // ---------- robots ----------
  spawnRobots(players: Player[]) {
    this.clearRobots();
    players.forEach((p, i) => {
      const r = new Robot(p.colorId);
      const pos = this.tilePos(p.position, i);
      r.group.position.copy(pos);
      r.group.rotation.y = Math.PI;
      this.scene.add(r.group);
      this.robots.push(r);
    });
  }

  clearRobots() {
    this.robots.forEach((r) => {
      this.scene.remove(r.group);
      r.dispose();
    });
    this.robots = [];
    this.markerIdx = -1;
    this.marker.visible = false;
  }

  placeRobots(players: Player[]) {
    players.forEach((p, i) => {
      const r = this.robots[i];
      if (r) r.group.position.copy(this.tilePos(p.position, i));
    });
  }

  tilePos(n: number, slot: number) {
    const { x, z } = tileWorld(n);
    const [ox, oz] = SLOT_OFFSETS[slot % 4];
    return new THREE.Vector3(x + ox * 0.7, 0.5, z + oz * 0.7);
  }

  setMarker(idx: number) {
    this.markerIdx = idx;
    this.marker.visible = idx >= 0;
  }

  /** move robot `steps` tiles forward with hop-walk animation */
  async moveSteps(idx: number, fromTile: number, steps: number): Promise<number> {
    const r = this.robots[idx];
    if (!r) return fromTile;
    let current = fromTile;
    r.setMode("walk");
    for (let i = 0; i < steps; i++) {
      const next = current + 1;
      if (next > 100) break;
      const a = this.tilePos(current, idx);
      const b = this.tilePos(next, idx);
      audio.sfx("step");
      await this.tween(0.3, (k) => {
        r.face(b.x - a.x, b.z - a.z);
        r.group.position.x = a.x + (b.x - a.x) * k;
        r.group.position.z = a.z + (b.z - a.z) * k;
        r.group.position.y = 0.5 + Math.sin(k * Math.PI) * 0.5;
      }, (x) => x);
      this.board.pulse(next);
      current = next;
    }
    r.setMode("idle");
    r.group.position.copy(this.tilePos(current, idx));
    return current;
  }

  /** traverse a snake (slide down) or ladder (climb up) path */
  async followPath(idx: number, fromTile: number): Promise<number> {
    const info = this.board.paths.get(fromTile);
    const r = this.robots[idx];
    if (!info || !r) return fromTile;
    const { curve, to, type } = info;
    if (type === "snake") audio.sfx("snake");
    else audio.sfx("ladder");
    r.setMode(type === "ladder" ? "walk" : "jump");
    const dur = type === "snake" ? 1.5 : 1.7;
    const t0 = performance.now();
    await this.tween(dur, (k) => {
      const p = curve.getPointAt(k);
      const tan = curve.getTangentAt(Math.min(0.99, k));
      r.group.position.set(p.x, p.y, p.z);
      r.face(tan.x, tan.z);
      if (type === "snake") r.body.rotation.z = Math.sin((performance.now() - t0) / 90) * 0.22;
      else r.group.position.y = p.y + Math.abs(Math.sin(k * 14 * Math.PI)) * 0.06;
    }, type === "snake" ? easeInOut : easeOut);
    r.body.rotation.z = 0;
    r.setMode("idle");
    audio.sfx("jump");
    const land = this.tilePos(to, idx);
    const p0 = r.group.position.clone();
    await this.tween(0.3, (k) => {
      r.group.position.lerpVectors(p0, land, k);
      r.group.position.y = p0.y + (land.y - p0.y) * k + Math.sin(k * Math.PI) * 0.4;
    }, easeOut);
    this.board.pulse(to);
    return to;
  }

  async celebrate(idx: number, dur = 1.6) {
    const r = this.robots[idx];
    if (!r) return;
    r.setMode("celebrate", dur);
    const c = ROBOT_COLORS.find((x) => x.id === r.colorId)!;
    const p = r.group.position.clone();
    this.burst(p, c.accent, 16);
    await new Promise((res) => setTimeout(res, dur * 1000));
    r.setMode("idle");
  }

  async zonkPulse(idx: number) {
    const r = this.robots[idx];
    if (!r) return;
    r.setMode("zonk", 1.6);
    await new Promise((res) => setTimeout(res, 1500));
  }

  async happyJump(idx: number) {
    const r = this.robots[idx];
    if (!r) return;
    audio.sfx("jump");
    r.setMode("jump");
    const p0 = r.group.position.clone();
    await this.tween(0.55, (k) => {
      r.group.position.y = p0.y + Math.sin(k * Math.PI) * 1.1;
    }, (x) => x);
    r.setMode("idle");
  }

  /** shake head side-to-side (blocked move) */
  async shakeNo(idx: number) {
    const r = this.robots[idx];
    if (!r) return;
    await this.tween(0.6, (k) => {
      r.group.rotation.y = Math.PI + Math.sin(k * Math.PI * 6) * 0.35 * (1 - k);
    }, (x) => x);
  }

  // ---------- particles ----------
  burst(pos: THREE.Vector3, colorHex: number, count = 22) {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = pos.x;
      positions[i * 3 + 1] = pos.y + 1;
      positions[i * 3 + 2] = pos.z;
      const a = Math.random() * Math.PI * 2;
      const sp = 1.2 + Math.random() * 2.6;
      vel[i * 3] = Math.cos(a) * sp;
      vel[i * 3 + 1] = 2.2 + Math.random() * 3.4;
      vel[i * 3 + 2] = Math.sin(a) * sp;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: colorHex,
      size: 0.28,
      transparent: true,
      opacity: 1,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const points = new THREE.Points(geo, mat);
    this.scene.add(points);
    this.sparks.push({ points, vel, life: 1.2, max: 1.2 });
  }

  // ---------- camera ----------
  private async camTo(pos: THREE.Vector3, target: THREE.Vector3, dur = 0.9) {
    const c0 = this.camera.position.clone();
    const t0 = this.controls.target.clone();
    this.controls.enabled = false;
    await this.tween(dur, (k) => {
      this.camera.position.lerpVectors(c0, pos, k);
      this.controls.target.lerpVectors(t0, target, k);
    }, easeInOut);
    this.controls.enabled = true;
  }

  resetCamera() {
    return this.camTo(new THREE.Vector3(0, 30, 40), new THREE.Vector3(0, 0, -0.5), 0.9);
  }

  topView() {
    return this.camTo(new THREE.Vector3(0.01, 64, 4), new THREE.Vector3(0, 0, 0), 0.9);
  }

  menuCamera() {
    return this.camTo(new THREE.Vector3(31, 23, 31), new THREE.Vector3(0, 1, 0), 1.2);
  }

  setShowcase(on: boolean) {
    this.showcase = on;
    this.controls.autoRotate = on;
  }

  // ---------- main loop ----------
  private loop = () => {
    this.raf = requestAnimationFrame(this.loop);
    const now = performance.now();
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;

    // tweens
    const finished: Tween[] = [];
    for (const tw of this.tweens) {
      tw.t += dt / tw.dur;
      const k = Math.min(1, tw.t);
      tw.fn(tw.ease(k));
      if (k >= 1) finished.push(tw);
    }
    for (const tw of finished) {
      this.tweens.splice(this.tweens.indexOf(tw), 1);
      tw.done();
    }

    this.robots.forEach((r) => r.update(dt));
    this.board.update(dt);
    this.cards.update(dt);

    // sparks
    const dead: Spark[] = [];
    for (const s of this.sparks) {
      s.life -= dt;
      const attr = s.points.geometry.getAttribute("position") as THREE.BufferAttribute;
      for (let i = 0; i < attr.count; i++) {
        s.vel[i * 3 + 1] -= 6.5 * dt;
        attr.array[i * 3] += s.vel[i * 3] * dt;
        attr.array[i * 3 + 1] += s.vel[i * 3 + 1] * dt;
        attr.array[i * 3 + 2] += s.vel[i * 3 + 2] * dt;
      }
      attr.needsUpdate = true;
      (s.points.material as THREE.PointsMaterial).opacity = Math.max(0, s.life / s.max);
      if (s.life <= 0) dead.push(s);
    }
    for (const s of dead) {
      this.scene.remove(s.points);
      s.points.geometry.dispose();
      (s.points.material as THREE.Material).dispose();
      this.sparks.splice(this.sparks.indexOf(s), 1);
    }

    // current player marker follows robot
    if (this.markerIdx >= 0 && this.robots[this.markerIdx]) {
      const rp = this.robots[this.markerIdx].group.position;
      this.marker.position.set(rp.x, 0.55, rp.z);
      const mm = this.marker.material as THREE.MeshBasicMaterial;
      mm.opacity = 0.5 + Math.sin(now / 240) * 0.3;
      this.marker.rotation.z += dt * 1.4;
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };

  async playDraw(kind: CardKind, onReveal?: () => void) {
    audio.sfx("shuffle");
    await this.cards.playDraw(kind, () => {
      audio.sfx("flip");
      onReveal?.();
      const wp = new THREE.Vector3();
      this.cards.group.getWorldPosition(wp);
      this.burst(wp.add(new THREE.Vector3(0, 4.6, 2)), kind === "zonk" ? 0xa78bfa : 0xffd54a, 18);
    });
  }

  dispose() {
    cancelAnimationFrame(this.raf);
    window.removeEventListener("resize", this.resize);
    this.controls.dispose();

    // Finish pending animation promises so no turn remains suspended on teardown.
    for (const tween of this.tweens.splice(0)) tween.done();
    this.cards.dispose();
    this.clearRobots();

    // Release geometries, materials, and their textures from the main scene.
    this.scene.traverse((object) => {
      if (!(object instanceof THREE.Mesh || object instanceof THREE.Points || object instanceof THREE.Line)) return;
      object.geometry.dispose();
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of materials) {
        for (const value of Object.values(material)) {
          if (value instanceof THREE.Texture) value.dispose();
        }
        material.dispose();
      }
    });

    this.sparks = [];
    this.renderer.dispose();
  }
}
