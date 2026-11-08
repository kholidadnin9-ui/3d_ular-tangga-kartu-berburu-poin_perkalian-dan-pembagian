// ============================================================
// BoardManager — 10x10 tiles, snakes, ladders, kingdom diorama
// ============================================================
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import {
  TILE_COUNT, TILE_SIZE, tileWorld, SNAKES, LADDERS, QUESTION_TILES,
} from "./constants";
import { tileTexture, skyTexture, stripeTexture } from "./textures";

const M = {
  sand: new THREE.MeshStandardMaterial({ color: 0xf3e2b3, roughness: 0.95 }),
  sandDark: new THREE.MeshStandardMaterial({ color: 0xe8cf9a, roughness: 1 }),
  slab: new THREE.MeshStandardMaterial({ color: 0xd9b98a, roughness: 0.9 }),
  gold: new THREE.MeshStandardMaterial({ color: 0xf0b429, roughness: 0.28, metalness: 0.8 }),
  cream: new THREE.MeshStandardMaterial({ color: 0xfff3d9, roughness: 0.7 }),
  mint: new THREE.MeshStandardMaterial({ color: 0xc9f2ea, roughness: 0.7 }),
  violet: new THREE.MeshStandardMaterial({ color: 0xa78bfa, roughness: 0.6 }),
  green: new THREE.MeshStandardMaterial({ color: 0x34d399, roughness: 0.6 }),
  finishGold: new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.35, metalness: 0.6 }),
  white: new THREE.MeshStandardMaterial({ color: 0xfbf7ee, roughness: 0.55 }),
  turquoise: new THREE.MeshStandardMaterial({ color: 0x2ec4b6, roughness: 0.4 }),
  domeGold: new THREE.MeshStandardMaterial({ color: 0xf6c945, roughness: 0.22, metalness: 0.85 }),
  domeTeal: new THREE.MeshStandardMaterial({ color: 0x22b8a6, roughness: 0.3, metalness: 0.3 }),
  wood: new THREE.MeshStandardMaterial({ color: 0xa5713f, roughness: 0.8 }),
  leafGreen: new THREE.MeshStandardMaterial({ color: 0x3fae62, roughness: 0.7 }),
  leafDark: new THREE.MeshStandardMaterial({ color: 0x2c8a4e, roughness: 0.7 }),
  trunk: new THREE.MeshStandardMaterial({ color: 0x96633a, roughness: 0.9 }),
  water: new THREE.MeshStandardMaterial({ color: 0x4cc3e6, roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.85 }),
  window: new THREE.MeshStandardMaterial({ color: 0x1f4e5f, roughness: 0.2, metalness: 0.4 }),
  rock: new THREE.MeshStandardMaterial({ color: 0xd8cbb2, roughness: 1 }),
  cloud: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, transparent: true, opacity: 0.92 }),
};

function put(parent: THREE.Object3D, geo: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number, rx = 0, ry = 0, rz = 0, cast = true) {
  const mesh = new THREE.Mesh(geo, m);
  mesh.position.set(x, y, z);
  mesh.rotation.set(rx, ry, rz);
  mesh.castShadow = cast;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

const SNAKE_COLORS = [0x2ecc71, 0x9b59b6, 0xe67e22, 0x16a0a6, 0xd3549b, 0x3498db];

export interface PathInfo {
  curve: THREE.CatmullRomCurve3;
  to: number;
  type: "snake" | "ladder";
}

export class Board {
  group = new THREE.Group();
  paths = new Map<number, PathInfo>();
  clouds: THREE.Group[] = [];
  fountains: THREE.Object3D[] = [];
  private pulses = new Map<THREE.Mesh, number>();
  private ringGeo = new THREE.RingGeometry(0.75, 0.98, 36);
  private tileBoxes: THREE.Mesh[] = [];

  build(scene: THREE.Scene) {
    this.buildGround();
    this.buildTiles();
    this.buildSnakesLadders();
    this.buildDecor();
    this.buildClouds();
    scene.add(this.group);
  }

  // ---------- ground ----------
  private buildGround() {
    put(this.group, new RoundedBoxGeometry(64, 2.4, 64, 4, 1.1), M.sand, 0, -1.35, 0, 0, 0, 0, false);
    put(this.group, new RoundedBoxGeometry(26.6, 1.1, 26.6, 3, 0.5), M.slab, 0, -0.62, 0, 0, 0, 0, false);
    // gold trim around tile field
    const half = (TILE_SIZE * 10) / 2 + 0.25;
    const trimGeoLong = new THREE.BoxGeometry(half * 2 + 0.5, 0.16, 0.5);
    const trimGeoDeep = new THREE.BoxGeometry(0.5, 0.16, half * 2 + 0.5);
    put(this.group, trimGeoLong, M.gold, 0, 0.02, half, 0, 0, 0, false);
    put(this.group, trimGeoLong, M.gold, 0, 0.02, -half, 0, 0, 0, false);
    put(this.group, trimGeoDeep, M.gold, half, 0.02, 0, 0, 0, 0, false);
    put(this.group, trimGeoDeep, M.gold, -half, 0.02, 0, 0, 0, 0, false);
    // corner jewel studs
    [[-half, -half], [half, -half], [-half, half], [half, half]].forEach(([x, z]) => {
      put(this.group, new THREE.OctahedronGeometry(0.34), M.turquoise, x, 0.25, z);
    });
  }

  // ---------- tiles ----------
  private buildTiles() {
    const boxGeo = new RoundedBoxGeometry(TILE_SIZE * 0.92, 0.5, TILE_SIZE * 0.92, 2, 0.09);
    const topGeo = new THREE.PlaneGeometry(TILE_SIZE * 0.88, TILE_SIZE * 0.88);
    const zoneCols = [M.cream, M.mint];

    for (let n = 1; n <= TILE_COUNT; n++) {
      const { x, z } = tileWorld(n);
      const isQ = QUESTION_TILES.includes(n);
      const isStart = n === 1;
      const isFinish = n === TILE_COUNT;
      const { row, col } = (() => {
        const i = n - 1, r = Math.floor(i / 10), cr = i % 10;
        return { row: r, col: r % 2 === 0 ? cr : 9 - cr };
      })();

      const baseMat = isFinish ? M.finishGold : isStart ? M.green : isQ ? M.violet : zoneCols[(row + col) % 2];
      const box = new THREE.Mesh(boxGeo, baseMat);
      box.position.set(x, 0.25, z);
      box.receiveShadow = true;
      box.castShadow = false;
      this.group.add(box);
      this.tileBoxes.push(box);

      const tint = isFinish ? "#ffe3a3" : isStart ? "#b7f0d4" : isQ ? "#c9b8f5" : (row + col) % 2 ? "#d9f7f1" : "#fdeeda";
      const tPlane = new THREE.Mesh(
        topGeo,
        new THREE.MeshBasicMaterial({
          map: tileTexture(n, { kind: isQ ? "question" : isStart ? "start" : isFinish ? "finish" : "normal", tint }),
          transparent: true,
        })
      );
      tPlane.rotation.x = -Math.PI / 2;
      tPlane.position.set(x, 0.505, z);
      this.group.add(tPlane);

      // snake/ladder endpoint indicator rings
      if (SNAKES[n] !== undefined || LADDERS[n] !== undefined) {
        const isSnake = SNAKES[n] !== undefined;
        const ring = new THREE.Mesh(
          this.ringGeo,
          new THREE.MeshBasicMaterial({
            color: isSnake ? 0xf43f5e : 0x22c55e,
            transparent: true,
            opacity: 0.55,
            side: THREE.DoubleSide,
          })
        );
        ring.rotation.x = -Math.PI / 2;
        ring.position.set(x, 0.52, z);
        this.group.add(ring);
      }
    }
  }

  pulse(n: number) {
    const { x, z } = tileWorld(n);
    const ring = new THREE.Mesh(
      this.ringGeo,
      new THREE.MeshBasicMaterial({ color: 0xffd54a, transparent: true, opacity: 0.9, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(x, 0.53, z);
    ring.scale.setScalar(1.15);
    this.group.add(ring);
    this.pulses.set(ring, 1);
  }

  update(dt: number) {
    // pulse rings expand & fade
    const done: THREE.Mesh[] = [];
    this.pulses.forEach((v, mesh) => {
      const nv = v - dt * 1.4;
      mesh.scale.setScalar(1.15 + (1 - nv) * 0.55);
      (mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, nv) * 0.9;
      if (nv <= 0) {
        this.group.remove(mesh);
        (mesh.material as THREE.Material).dispose();
        done.push(mesh);
      } else this.pulses.set(mesh, nv);
    });
    done.forEach((m) => this.pulses.delete(m));

    // clouds drift
    for (const c of this.clouds) {
      c.position.x += dt * (c.userData.speed as number);
      if (c.position.x > 40) c.position.x = -40;
    }
    // fountains spin
    for (const f of this.fountains) f.rotation.y += dt * 1.2;
  }

  // ---------- snakes & ladders ----------
  private buildSnakesLadders() {
    let si = 0;
    for (const [head, tail] of Object.entries(SNAKES)) {
      this.buildSnake(Number(head), Number(tail), SNAKE_COLORS[si % SNAKE_COLORS.length]);
      si++;
    }
    for (const [base, top] of Object.entries(LADDERS)) {
      this.buildLadder(Number(base), Number(top));
    }
  }

  private buildSnake(headN: number, tailN: number, color: number) {
    const a = tileWorld(headN);
    const b = tileWorld(tailN);
    const start = new THREE.Vector3(a.x, 0.75, a.z);
    const end = new THREE.Vector3(b.x, 0.55, b.z);
    const dir = new THREE.Vector3().subVectors(end, start);
    const perp = new THREE.Vector3(-dir.z, 0, dir.x).normalize();
    const pts = [start.clone()];
    const segs = 3;
    for (let i = 1; i < segs; i++) {
      const t = i / segs;
      const p = start.clone().lerp(end, t);
      p.y = 0.8 + Math.sin(t * Math.PI) * 1.5;
      p.addScaledVector(perp, Math.sin(t * Math.PI * 2) * 1.4);
      pts.push(p);
    }
    pts.push(end);
    const curve = new THREE.CatmullRomCurve3(pts);
    const matSnake = new THREE.MeshStandardMaterial({ color, roughness: 0.4 });
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 32, 0.2, 10, false), matSnake);
    tube.castShadow = true;
    this.group.add(tube);

    // head at start
    const headPos = curve.getPointAt(0);
    const g = new THREE.Group();
    g.position.copy(headPos);
    const skull = put(g, new THREE.SphereGeometry(0.36, 18, 18), matSnake, 0, 0.08, 0);
    skull.scale.set(1.15, 0.9, 1.25);
    const eyeW = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const eyeB = new THREE.MeshBasicMaterial({ color: 0x222222 });
    [-1, 1].forEach((s) => {
      put(g, new THREE.SphereGeometry(0.1, 10, 10), eyeW, s * 0.17, 0.22, 0.24, 0, 0, 0, false);
      put(g, new THREE.SphereGeometry(0.05, 8, 8), eyeB, s * 0.17, 0.22, 0.32, 0, 0, 0, false);
    });
    // crown of gold (king cobra hood hint)
    const hood = put(g, new THREE.ConeGeometry(0.3, 0.4, 10), M.gold, 0, 0.42, -0.1, -0.5);
    hood.castShadow = false;
    g.lookAt(curve.getPointAt(0.06).setY(headPos.y));
    this.group.add(g);

    // tail cone
    const tailPos = curve.getPointAt(1);
    const tail = put(this.group, new THREE.ConeGeometry(0.12, 0.5, 8), matSnake, tailPos.x, tailPos.y - 0.05, tailPos.z, Math.PI);
    tail.castShadow = false;

    this.paths.set(headN, { curve, to: tailN, type: "snake" });
  }

  private buildLadder(baseN: number, topN: number) {
    const a = tileWorld(baseN);
    const b = tileWorld(topN);
    const start = new THREE.Vector3(a.x, 0.5, a.z);
    const end = new THREE.Vector3(b.x, 0.5, b.z);
    const mid = start.clone().lerp(end, 0.5);
    mid.y = 3.1 + start.distanceTo(end) * 0.08;
    const curve = new THREE.CatmullRomCurve3([start, mid.clone(), end]);

    // perpendicular
    const dir = new THREE.Vector3().subVectors(end, start).setY(0).normalize();
    const perp = new THREE.Vector3(-dir.z, 0, dir.x).multiplyScalar(0.3);
    const mkOffset = (s: number) =>
      new THREE.CatmullRomCurve3([
        start.clone().addScaledVector(perp, s),
        mid.clone().addScaledVector(perp, s),
        end.clone().addScaledVector(perp, s),
      ]);
    const left = mkOffset(-1);
    const right = mkOffset(1);
    const railMat = M.gold;
    [left, right].forEach((c) => {
      const tube = new THREE.Mesh(new THREE.TubeGeometry(c, 24, 0.09, 8, false), railMat);
      tube.castShadow = true;
      this.group.add(tube);
    });
    // rungs
    const rungGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.66, 8);
    const up = new THREE.Vector3(0, 1, 0);
    for (let i = 1; i <= 7; i++) {
      const t = i / 8;
      const pL = left.getPointAt(t);
      const pR = right.getPointAt(t);
      const midP = pL.clone().lerp(pR, 0.5);
      const rung = new THREE.Mesh(rungGeo, M.white);
      rung.position.copy(midP);
      const d = pR.clone().sub(pL).normalize();
      rung.quaternion.setFromUnitVectors(up, d);
      rung.castShadow = true;
      this.group.add(rung);
    }
    this.paths.set(baseN, { curve, to: topN, type: "ladder" });
  }

  // ---------- decorations ----------
  private onionDome(parent: THREE.Object3D, x: number, y: number, z: number, r: number, mat = M.domeGold) {
    const d = put(parent, new THREE.SphereGeometry(r, 24, 18, 0, Math.PI * 2, 0, Math.PI * 0.62), mat, x, y, z);
    d.scale.y = 1.25;
    put(parent, new THREE.ConeGeometry(r * 0.16, r * 0.7, 10), mat, x, y + r * 1.25, z);
    put(parent, new THREE.SphereGeometry(r * 0.1, 10, 10), mat, x, y + r * 1.6, z);
    return d;
  }

  private minaret(parent: THREE.Object3D, x: number, z: number, h = 5, base = 0) {
    const g = new THREE.Group();
    g.position.set(x, base, z);
    put(g, new THREE.CylinderGeometry(0.55, 0.7, h, 12), M.white, 0, h / 2, 0);
    const balc = put(g, new THREE.CylinderGeometry(0.85, 0.85, 0.22, 12), M.turquoise, 0, h * 0.78, 0);
    balc.castShadow = true;
    put(g, new THREE.CylinderGeometry(0.42, 0.5, h * 0.22, 12), M.white, 0, h * 0.92, 0);
    this.onionDome(g, 0, h * 1.02, 0, 0.55, M.domeTeal);
    parent.add(g);
    return g;
  }

  private palm(parent: THREE.Object3D, x: number, z: number, s = 1, ry = 0) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = ry;
    g.scale.setScalar(s);
    const trunk = put(g, new THREE.CylinderGeometry(0.14, 0.24, 2.6, 8), M.trunk, 0, 1.3, 0);
    trunk.rotation.z = 0.09;
    for (let i = 0; i < 6; i++) {
      const frond = put(
        g, new THREE.SphereGeometry(0.9, 8, 6), i % 2 ? M.leafGreen : M.leafDark,
        Math.cos((i * Math.PI) / 3) * 0.8, 2.75, Math.sin((i * Math.PI) / 3) * 0.8
      );
      frond.scale.set(1.25, 0.16, 0.42);
      frond.rotation.y = (i * Math.PI) / 3;
      frond.rotation.z = -0.35;
      frond.castShadow = true;
    }
    put(g, new THREE.SphereGeometry(0.2, 8, 8), M.trunk, 0, 2.62, 0, 0, 0, 0, false);
    parent.add(g);
  }

  private cypress(parent: THREE.Object3D, x: number, z: number, s = 1) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.scale.setScalar(s);
    put(g, new THREE.CylinderGeometry(0.1, 0.14, 0.5, 8), M.trunk, 0, 0.25, 0);
    put(g, new THREE.ConeGeometry(0.55, 1.9, 10), M.leafDark, 0, 1.5, 0);
    put(g, new THREE.ConeGeometry(0.42, 1.3, 10), M.leafGreen, 0, 2.3, 0);
    parent.add(g);
  }

  private lantern(parent: THREE.Object3D, x: number, z: number) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    put(g, new THREE.CylinderGeometry(0.06, 0.09, 2.2, 8), M.wood, 0, 1.1, 0);
    put(g, new RoundedBoxGeometry(0.42, 0.5, 0.42, 2, 0.06), M.gold, 0, 2.4, 0);
    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 10, 10),
      new THREE.MeshStandardMaterial({ color: 0xffe9a3, emissive: 0xffc94d, emissiveIntensity: 1.6 })
    );
    glow.position.y = 2.4;
    g.add(glow);
    put(g, new THREE.ConeGeometry(0.3, 0.3, 8), M.domeTeal, 0, 2.8, 0);
    parent.add(g);
  }

  private buildDecor() {
    const D = this.group;

    // ============ SOUTH: Grand Gate (near tile 1) ============
    const gate = new THREE.Group();
    gate.position.set(-7.5, 0, 16.4);
    put(gate, new RoundedBoxGeometry(9.5, 0.7, 3, 2, 0.2), M.slab, 0, 0.3, 0, 0, 0, 0, false);
    [-3.4, 3.4].forEach((x) => {
      put(gate, new THREE.CylinderGeometry(1.05, 1.25, 5.4, 12), M.cream, x, 3.2, 0);
      this.onionDome(gate, x, 6.1, 0, 1.15, M.domeGold);
      // crenellations
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        put(gate, new THREE.BoxGeometry(0.3, 0.35, 0.3), M.cream, x + Math.cos(a) * 1.05, 5.9, Math.sin(a) * 1.05);
      }
    });
    put(gate, new RoundedBoxGeometry(5.2, 3.6, 1.6, 2, 0.15), M.cream, 0, 2.4, 0);
    // arch cutout look: dark inset + inner arch
    put(gate, new RoundedBoxGeometry(2.6, 2.9, 1.7, 2, 0.4), M.window, 0, 1.9, 0, 0, 0, 0, false);
    this.onionDome(gate, 0, 4.6, 0, 1.5, M.domeTeal);
    // crescent
    const cres = put(gate, new THREE.TorusGeometry(0.55, 0.14, 10, 24, Math.PI * 1.45), M.gold, 0, 7.8, 0, 0, 0, -0.4);
    cres.castShadow = false;
    D.add(gate);

    // ============ NORTH: Grand Palace behind tile 100 ============
    const palace = new THREE.Group();
    palace.position.set(0, 0, -17.6);
    put(palace, new RoundedBoxGeometry(17, 1, 5.5, 2, 0.25), M.slab, 0, 0.45, 0, 0, 0, 0, false);
    put(palace, new RoundedBoxGeometry(10.5, 5, 4.6, 2, 0.3), M.cream, 0, 3.2, 0);
    put(palace, new RoundedBoxGeometry(7, 3, 3.8, 2, 0.25), M.cream, 0, 6.6, -0.2);
    // arched windows
    for (let i = -3; i <= 3; i++) {
      put(palace, new RoundedBoxGeometry(0.8, 1.5, 0.3, 2, 0.35), M.window, i * 1.45, 3.4, 2.32, 0, 0, 0, false);
    }
    // grand dome
    this.onionDome(palace, 0, 8.3, -0.2, 2.7, M.domeGold);
    [-5.4, 5.4].forEach((x) => this.onionDome(palace, x, 5.9, 0, 1.15, M.domeTeal));
    // palace minarets
    this.minaret(palace, -8.6, -0.5, 8);
    this.minaret(palace, 8.6, -0.5, 8);
    // gold flags
    [-3, 3].forEach((x) => {
      put(palace, new THREE.CylinderGeometry(0.05, 0.05, 1.6, 6), M.gold, x, 9.6, -0.2, 0, 0, 0, false);
      put(palace, new THREE.ConeGeometry(0.45, 0.9, 4), M.turquoise, x + 0.42, 10.1, -0.2, 0, 0, -Math.PI / 2.3, false);
    });
    D.add(palace);

    // cypress row in front of palace
    for (let i = -2; i <= 2; i++) this.cypress(D, i * 2.4 + 0.6, -13.6, 0.85);

    // ============ EAST: Mosque with dome & minarets ============
    const mosque = new THREE.Group();
    mosque.position.set(17.6, 0, -4.5);
    mosque.rotation.y = -0.35;
    put(mosque, new RoundedBoxGeometry(6.4, 0.7, 6.4, 2, 0.2), M.slab, 0, 0.3, 0, 0, 0, 0, false);
    put(mosque, new RoundedBoxGeometry(4.8, 3, 4.8, 2, 0.25), M.white, 0, 2.1, 0);
    this.onionDome(mosque, 0, 3.8, 0, 1.9, M.domeTeal);
    [-1.9, 1.9].forEach((x) =>
      [-1.9, 1.9].forEach((z) => this.onionDome(mosque, x, 3.7, z, 0.55, M.domeGold))
    );
    this.minaret(mosque, -3.2, -3.2, 6);
    this.minaret(mosque, 3.2, -3.2, 6);
    D.add(mosque);

    // ============ WEST: Library of wisdom ============
    const lib = new THREE.Group();
    lib.position.set(-17.4, 0, 2.4);
    lib.rotation.y = 0.3;
    put(lib, new RoundedBoxGeometry(6, 0.7, 6, 2, 0.2), M.slab, 0, 0.3, 0, 0, 0, 0, false);
    put(lib, new RoundedBoxGeometry(4.6, 2.7, 4.6, 2, 0.2), M.cream, 0, 1.9, 0);
    [-1.7, 1.7].forEach((x) =>
      [-1.7, 1.7].forEach((z) => put(lib, new THREE.CylinderGeometry(0.28, 0.32, 2.7, 10), M.white, x, 1.9, z))
    );
    this.onionDome(lib, 0, 3.4, 0, 1.5, M.domeTeal);
    // open book sculpture on top
    const bookL = put(lib, new RoundedBoxGeometry(1.3, 0.12, 0.95, 2, 0.04), M.white, -0.6, 5.6, 0, 0, 0, 0.28);
    const bookR = put(lib, new RoundedBoxGeometry(1.3, 0.12, 0.95, 2, 0.04), M.white, 0.6, 5.6, 0, 0, 0, -0.28);
    bookL.castShadow = bookR.castShadow = false;
    put(lib, new THREE.SphereGeometry(0.16, 8, 8), M.gold, 0, 5.45, 0, 0, 0, 0, false);
    D.add(lib);

    // ============ NW: Observation tower ============
    const tower = new THREE.Group();
    tower.position.set(-16.6, 0, -11.4);
    put(tower, new RoundedBoxGeometry(4, 0.7, 4, 2, 0.2), M.slab, 0, 0.3, 0, 0, 0, 0, false);
    put(tower, new THREE.CylinderGeometry(1.3, 1.7, 5.4, 12), M.cream, 0, 3.1, 0);
    put(tower, new THREE.CylinderGeometry(1.7, 1.7, 0.4, 12), M.wood, 0, 5.6, 0);
    this.onionDome(tower, 0, 5.9, 0, 1.1, M.domeGold);
    // astrolabe ring
    const ring = put(tower, new THREE.TorusGeometry(1.5, 0.09, 8, 28), M.gold, 0, 8, 0, 0.5, 0.3);
    ring.castShadow = false;
    D.add(tower);

    // ============ NE + W: Oasis ponds & palms ============
    const oasis = (x: number, z: number, s: number) => {
      const g = new THREE.Group();
      g.position.set(x, -0.04, z);
      g.scale.setScalar(s);
      const pond = put(g, new THREE.CylinderGeometry(2.3, 2.5, 0.18, 24), M.water, 0, 0.05, 0, 0, 0, 0, false);
      pond.receiveShadow = true;
      put(g, new THREE.TorusGeometry(2.4, 0.22, 8, 28), M.sandDark, 0, 0.1, 0, Math.PI / 2, 0, 0, false);
      this.palm(g, -2.2, -1.2, 0.95, 0.4);
      this.palm(g, 2.3, -0.6, 1.15, 2.2);
      this.palm(g, 0.6, 2.5, 0.9, 4.0);
      put(g, new THREE.SphereGeometry(0.4, 8, 8), M.rock, 1.6, 0.2, 1.8, 0, 0, 0, false);
      D.add(g);
    };
    oasis(-16.4, 9.6, 1);
    oasis(16.8, 4.4, 0.8);

    // ============ SE: Market stalls ============
    const stall = (x: number, z: number, cA: string, cB: string, ry: number) => {
      const g = new THREE.Group();
      g.position.set(x, 0, z);
      g.rotation.y = ry;
      put(g, new RoundedBoxGeometry(2.4, 1.1, 1.6, 2, 0.1), M.wood, 0, 0.85, 0);
      const canopy = new THREE.Mesh(
        new THREE.CylinderGeometry(1.6, 1.9, 0.7, 4, 1),
        new THREE.MeshStandardMaterial({ map: stripeTexture(cA, cB), roughness: 0.8 })
      );
      canopy.position.y = 2.4;
      canopy.rotation.y = Math.PI / 4;
      canopy.scale.z = 0.72;
      canopy.castShadow = true;
      g.add(canopy);
      // goods
      put(g, new THREE.SphereGeometry(0.24, 8, 8), M.domeGold, -0.6, 1.55, 0.3, 0, 0, 0, false);
      put(g, new THREE.SphereGeometry(0.22, 8, 8), M.turquoise, 0.1, 1.55, 0.25, 0, 0, 0, false);
      put(g, new THREE.SphereGeometry(0.2, 8, 8), M.violet, 0.7, 1.52, 0.32, 0, 0, 0, false);
      [-1, 1].forEach((s) =>
        put(g, new THREE.CylinderGeometry(0.06, 0.06, 2.2, 6), M.wood, s * 1.05, 1.35, 0.62)
      );
      D.add(g);
    };
    stall(16.6, 10.4, "#f59e0b", "#fff7e0", -0.6);
    stall(19.2, 8.6, "#0d9488", "#fef9e7", -1.1);

    // ============ Fountain plaza (SE inner) ============
    const f = new THREE.Group();
    f.position.set(14.6, 0, -13.4);
    put(f, new THREE.CylinderGeometry(1.7, 1.9, 0.45, 18), M.turquoise, 0, 0.22, 0);
    const waterTop = put(f, new THREE.CylinderGeometry(1.45, 1.45, 0.1, 18), M.water, 0, 0.48, 0, 0, 0, 0, false);
    put(f, new THREE.CylinderGeometry(0.24, 0.34, 1.3, 10), M.white, 0, 0.9, 0);
    const spray = put(f, new THREE.ConeGeometry(0.6, 1.1, 10), M.water, 0, 1.9, 0, 0, 0, 0, false);
    spray.castShadow = false;
    this.fountains.push(spray, waterTop);
    D.add(f);

    // NW plaza fountain small
    const f2 = new THREE.Group();
    f2.position.set(-14.2, 0, -5.2);
    put(f2, new THREE.CylinderGeometry(1.2, 1.4, 0.4, 14), M.turquoise, 0, 0.2, 0);
    const sp2 = put(f2, new THREE.ConeGeometry(0.45, 0.9, 8), M.water, 0, 1.1, 0, 0, 0, 0, false);
    sp2.castShadow = false;
    this.fountains.push(sp2);
    D.add(f2);

    // gardens: bushes & flowers along slab edges
    const bush = (x: number, z: number, s: number, flowerC?: number) => {
      const g = new THREE.Group();
      g.position.set(x, 0, z);
      put(g, new THREE.SphereGeometry(0.5, 10, 10), M.leafGreen, 0, 0.35 * s, 0).scale.setScalar(s);
      if (flowerC)
        [-0.25, 0.2, 0.05].forEach((ox, i) =>
          put(g, new THREE.SphereGeometry(0.13, 8, 8), new THREE.MeshStandardMaterial({ color: flowerC, roughness: 0.5 }), ox, 0.72 * s, (i - 1) * 0.2, 0, 0, 0, false)
        );
      D.add(g);
    };
    const edgePts: [number, number][] = [
      [-12.6, 12.9], [12.7, 12.9], [-12.9, -12.7], [12.8, -12.8],
      [-12.9, 6], [-12.9, -6], [12.9, 9], [12.9, -8],
      [-6, 12.9], [6.5, -12.9], [-12.9, 0.5], [12.9, 0.2],
    ];
    edgePts.forEach(([x, z], i) => bush(x, z, 0.9 + (i % 3) * 0.18, [0xf472b6, 0xfbbf24, 0xc084fc][i % 3]));

    // lantern posts around slab
    this.lantern(D, -13.1, 12.2);
    this.lantern(D, 13.1, -12.2);
    this.lantern(D, -13.1, -12.2);
    this.lantern(D, 13.1, 12.2);

    // dunes at far corners
    const dune = (x: number, z: number, sx: number) => {
      const d = put(D, new THREE.SphereGeometry(4, 14, 10), M.sandDark, x, -1.2, z, 0, 0, 0, false);
      d.scale.set(sx, 0.5, 1);
    };
    dune(-24, 20, 1.4);
    dune(24, -22, 1.6);
    dune(-23, -21, 1.2);
    dune(22, 22, 1.3);
    // scattered rocks
    [[-14.5, 14.2], [14, -15.6], [-20, 0], [21, -8], [8, 16.5]].forEach(([x, z], i) =>
      put(D, new THREE.SphereGeometry(0.5 + (i % 2) * 0.25, 8, 6), M.rock, x, 0.15, z, 0, 0, 0, false)
    );
  }

  private buildClouds() {
    const mk = (x: number, y: number, z: number, s: number) => {
      const g = new THREE.Group();
      [[0, 0, 0, 1.6], [1.5, 0.2, 0.3, 1.1], [-1.4, 0.1, -0.2, 1.2], [0.4, 0.5, -0.5, 0.9]].forEach(
        ([ox, oy, oz, os]) => {
          const m = new THREE.Mesh(new THREE.SphereGeometry(os, 10, 8), M.cloud);
          m.position.set(ox, oy, oz);
          m.scale.y = 0.55;
          g.add(m);
        }
      );
      g.position.set(x, y, z);
      g.scale.setScalar(s);
      g.userData.speed = 0.4 + Math.random() * 0.5;
      this.group.add(g);
      this.clouds.push(g);
    };
    mk(-18, 17, -14, 1.6);
    mk(10, 19, -20, 1.9);
    mk(22, 16, 8, 1.3);
    mk(-8, 21, 16, 1.5);
    mk(4, 18, 4, 1.1);
  }
}

// re-export for engine convenience
export { skyTexture };
