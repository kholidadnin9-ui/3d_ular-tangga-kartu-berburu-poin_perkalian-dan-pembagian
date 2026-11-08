// ============================================================
// Robot — modular chibi robot built from primitives
// Pearl-white armor, colored trim, black joints, glowing eyes
// ============================================================
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import type { RobotColorId } from "./constants";
import { ROBOT_COLORS } from "./constants";

export type RobotMode = "idle" | "walk" | "celebrate" | "zonk" | "jump";

const WHITE = 0xf8f6f0;
const BLACK = 0x23262e;
const EYE = 0xffa726;

function mat(color: number, rough = 0.35, metal = 0.45) {
  return new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal });
}

export class Robot {
  group = new THREE.Group();
  body = new THREE.Group();
  head!: THREE.Group;
  armL!: THREE.Group;
  armR!: THREE.Group;
  legL!: THREE.Group;
  legR!: THREE.Group;
  eyeL!: THREE.Mesh;
  eyeR!: THREE.Mesh;
  antennaTip!: THREE.Mesh;
  mode: RobotMode = "idle";
  private t = Math.random() * 10;
  private celebrateUntil = 0;
  private zonkUntil = 0;
  private blinkTimer = 2 + Math.random() * 3;
  colorId: RobotColorId;

  constructor(colorId: RobotColorId) {
    this.colorId = colorId;
    const def = ROBOT_COLORS.find((r) => r.id === colorId)!;
    const accent = def.accent;

    const mWhite = mat(WHITE, 0.3, 0.25);
    const mBlack = mat(BLACK, 0.5, 0.35);
    const mAccent = mat(accent, 0.28, 0.75);
    const mGold = mat(0xf0b429, 0.25, 0.85);
    const mEye = new THREE.MeshStandardMaterial({
      color: EYE, emissive: EYE, emissiveIntensity: 1.6, roughness: 0.2,
    });

    const add = (parent: THREE.Object3D, geo: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number) => {
      const mesh = new THREE.Mesh(geo, m);
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      parent.add(mesh);
      return mesh;
    };

    this.body.position.y = 0;
    this.group.add(this.body);

    // ---------- LEGS ----------
    const mkLeg = (side: number) => {
      const leg = new THREE.Group();
      leg.position.set(side * 0.19, 0.52, 0);
      // hip joint
      add(leg, new THREE.SphereGeometry(0.11, 16, 16), mBlack, 0, 0, 0);
      // thigh
      add(leg, new THREE.CapsuleGeometry(0.1, 0.16, 6, 12), mWhite, 0, -0.16, 0);
      // knee
      add(leg, new THREE.SphereGeometry(0.1, 14, 14), mBlack, 0, -0.32, 0);
      // shin with accent band
      add(leg, new THREE.CapsuleGeometry(0.1, 0.14, 6, 12), mWhite, 0, -0.46, 0);
      const band = add(leg, new THREE.TorusGeometry(0.11, 0.028, 8, 20), mAccent, 0, -0.46, 0);
      band.rotation.x = Math.PI / 2;
      // boot
      add(leg, new RoundedBoxGeometry(0.24, 0.14, 0.34, 3, 0.05), mWhite, 0, -0.62, 0.04);
      add(leg, new RoundedBoxGeometry(0.26, 0.05, 0.36, 2, 0.02), mBlack, 0, -0.68, 0.04);
      // gold toe cap
      const toe = add(leg, new RoundedBoxGeometry(0.24, 0.1, 0.1, 2, 0.04), mAccent, 0, -0.6, 0.2);
      toe.castShadow = true;
      this.body.add(leg);
      return leg;
    };
    this.legL = mkLeg(-1);
    this.legR = mkLeg(1);

    // ---------- TORSO ----------
    const torso = new THREE.Group();
    torso.position.y = 0.62;
    this.body.add(torso);
    // pelvis
    add(torso, new THREE.SphereGeometry(0.24, 18, 18), mBlack, 0, 0, 0);
    // belly capsule
    add(torso, new THREE.CapsuleGeometry(0.32, 0.3, 8, 18), mWhite, 0, 0.3, 0);
    // accent belt
    const belt = add(torso, new THREE.TorusGeometry(0.33, 0.045, 8, 24), mAccent, 0, 0.08, 0);
    belt.rotation.x = Math.PI / 2;
    // chest plate
    add(torso, new RoundedBoxGeometry(0.4, 0.32, 0.1, 3, 0.04), mAccent, 0, 0.34, 0.28);
    // chest emblem (octagon)
    const emb = add(torso, new THREE.CylinderGeometry(0.09, 0.09, 0.05, 8), mGold, 0, 0.34, 0.35);
    emb.rotation.x = Math.PI / 2;
    const embCore = add(
      torso, new THREE.CylinderGeometry(0.04, 0.04, 0.055, 8),
      new THREE.MeshStandardMaterial({ color: 0xfff3c4, emissive: 0xffc94d, emissiveIntensity: 0.8 }),
      0, 0.34, 0.35
    );
    embCore.rotation.x = Math.PI / 2;

    // ---------- ARMS ----------
    const mkArm = (side: number) => {
      const arm = new THREE.Group();
      arm.position.set(side * 0.42, 1.06, 0);
      // shoulder pauldron
      add(arm, new THREE.SphereGeometry(0.17, 16, 16), mAccent, 0, 0.04, 0);
      add(arm, new THREE.SphereGeometry(0.09, 12, 12), mWhite, 0, -0.02, 0);
      // upper arm
      add(arm, new THREE.CapsuleGeometry(0.08, 0.16, 6, 12), mWhite, 0, -0.18, 0);
      // elbow
      add(arm, new THREE.SphereGeometry(0.09, 12, 12), mBlack, 0, -0.34, 0);
      // forearm with band
      add(arm, new THREE.CapsuleGeometry(0.085, 0.16, 6, 12), mWhite, 0, -0.5, 0);
      const band = add(arm, new THREE.TorusGeometry(0.095, 0.024, 8, 18), mAccent, 0, -0.5, 0);
      band.rotation.x = Math.PI / 2;
      // wrist ring + black hand
      const ring = add(arm, new THREE.TorusGeometry(0.08, 0.024, 8, 18), mGold, 0, -0.64, 0);
      ring.rotation.x = Math.PI / 2;
      add(arm, new RoundedBoxGeometry(0.2, 0.15, 0.2, 3, 0.05), mBlack, 0, -0.76, 0);
      this.body.add(arm);
      return arm;
    };
    this.armL = mkArm(-1);
    this.armR = mkArm(1);

    // ---------- HEAD (big & friendly) ----------
    const head = new THREE.Group();
    head.position.y = 1.28;
    this.body.add(head);
    this.head = head;
    // neck
    add(head, new THREE.CylinderGeometry(0.13, 0.15, 0.14, 14), mBlack, 0, -0.06, 0);
    // cranium
    add(head, new RoundedBoxGeometry(0.72, 0.6, 0.62, 6, 0.2), mWhite, 0, 0.3, 0);
    // face plate
    add(head, new RoundedBoxGeometry(0.5, 0.34, 0.08, 4, 0.06), mBlack, 0, 0.28, 0.29);
    // eyes
    this.eyeL = add(head, new THREE.SphereGeometry(0.075, 12, 12), mEye, -0.13, 0.3, 0.33);
    this.eyeR = add(head, new THREE.SphereGeometry(0.075, 12, 12), mEye, 0.13, 0.3, 0.33);
    this.eyeL.castShadow = false;
    this.eyeR.castShadow = false;
    // mouth light
    const mouth = add(
      head, new RoundedBoxGeometry(0.16, 0.035, 0.03, 2, 0.015),
      new THREE.MeshStandardMaterial({ color: EYE, emissive: EYE, emissiveIntensity: 0.9 }),
      0, 0.16, 0.33
    );
    mouth.castShadow = false;
    // crown band + crest (reference: angular golden helm)
    const band2 = add(head, new THREE.TorusGeometry(0.37, 0.05, 8, 26), mAccent, 0, 0.46, 0);
    band2.rotation.x = Math.PI / 2;
    band2.scale.z = 0.86;
    // crest fins
    const finL = add(head, new RoundedBoxGeometry(0.09, 0.26, 0.3, 2, 0.03), mAccent, -0.16, 0.68, 0);
    finL.rotation.z = 0.45;
    const finR = add(head, new RoundedBoxGeometry(0.09, 0.26, 0.3, 2, 0.03), mAccent, 0.16, 0.68, 0);
    finR.rotation.z = -0.45;
    const diamond = add(head, new THREE.OctahedronGeometry(0.1), mGold, 0, 0.62, 0.22);
    diamond.scale.y = 1.4;
    // ear pods
    [-1, 1].forEach((s) => {
      const pod = add(head, new THREE.CylinderGeometry(0.13, 0.13, 0.1, 16), mAccent, s * 0.4, 0.3, 0);
      pod.rotation.z = Math.PI / 2;
      const inner = add(head, new THREE.CylinderGeometry(0.07, 0.07, 0.11, 12), mBlack, s * 0.4, 0.3, 0);
      inner.rotation.z = Math.PI / 2;
    });
    // antenna with glowing tip
    add(head, new THREE.CylinderGeometry(0.02, 0.02, 0.2, 8), mBlack, 0, 0.72, -0.12);
    this.antennaTip = add(
      head, new THREE.SphereGeometry(0.05, 10, 10),
      new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 1.4 }),
      0, 0.84, -0.12
    );
    this.antennaTip.castShadow = false;

    this.group.scale.setScalar(1);
  }

  setMode(mode: RobotMode, dur = 0) {
    this.mode = mode;
    const now = performance.now() / 1000;
    if (mode === "celebrate") this.celebrateUntil = now + Math.max(dur, 1.4);
    if (mode === "zonk") this.zonkUntil = now + Math.max(dur, 1.6);
  }

  /** face toward world direction (dx, dz) */
  face(dx: number, dz: number) {
    if (Math.abs(dx) + Math.abs(dz) < 0.001) return;
    const target = Math.atan2(dx, dz);
    let cur = this.group.rotation.y;
    let diff = target - cur;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    this.group.rotation.y = cur + diff * 0.35;
  }

  update(dt: number) {
    this.t += dt;
    const t = this.t;
    const now = performance.now() / 1000;
    let mode = this.mode;
    if (mode === "celebrate" && now > this.celebrateUntil) mode = this.mode = "idle";
    if (mode === "zonk" && now > this.zonkUntil) mode = this.mode = "idle";

    const armL = this.armL, armR = this.armR, legL = this.legL, legR = this.legR;

    if (mode === "walk") {
      const s = Math.sin(t * 11);
      legL.rotation.x = s * 0.65;
      legR.rotation.x = -s * 0.65;
      armL.rotation.x = -s * 0.55;
      armR.rotation.x = s * 0.55;
      armL.rotation.z = 0.12;
      armR.rotation.z = -0.12;
      this.body.position.y = Math.abs(Math.cos(t * 11)) * 0.05;
      this.body.rotation.z = Math.sin(t * 11) * 0.045;
    } else if (mode === "jump") {
      legL.rotation.x = -0.55;
      legR.rotation.x = 0.45;
      armL.rotation.z = 1.9;
      armR.rotation.z = -1.9;
      armL.rotation.x = 0;
      armR.rotation.x = 0;
      this.body.rotation.z = 0;
    } else if (mode === "celebrate") {
      const s = Math.sin(t * 8);
      armL.rotation.z = 2.4 + s * 0.25;
      armR.rotation.z = -2.4 - s * 0.25;
      armL.rotation.x = armR.rotation.x = 0;
      legL.rotation.x = legR.rotation.x = 0;
      this.body.position.y = Math.abs(Math.sin(t * 8)) * 0.16;
      this.body.rotation.y += dt * 3.2;
      this.body.rotation.z = 0;
      (this.eyeL.material as THREE.MeshStandardMaterial).emissiveIntensity = 2.4;
      (this.eyeR.material as THREE.MeshStandardMaterial).emissiveIntensity = 2.4;
      return;
    } else if (mode === "zonk") {
      const s = Math.sin(t * 9);
      this.body.rotation.z = s * 0.16;
      this.head.rotation.z = s * 0.22;
      armL.rotation.z = 0.5 + s * 0.15;
      armR.rotation.z = -0.5 - s * 0.15;
      legL.rotation.x = legR.rotation.x = 0;
      this.body.position.y = 0;
      (this.eyeL.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.5;
      (this.eyeR.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.5;
      return;
    } else {
      // idle breathing
      const s = Math.sin(t * 2.2);
      legL.rotation.x *= 0.85;
      legR.rotation.x *= 0.85;
      armL.rotation.x = s * 0.06;
      armR.rotation.x = -s * 0.06;
      armL.rotation.z = 0.1 + s * 0.02;
      armR.rotation.z = -0.1 - s * 0.02;
      this.body.position.y = s * 0.015;
      this.body.rotation.z = 0;
      this.body.rotation.y *= 0.9;
      this.head.rotation.z *= 0.85;
      this.head.rotation.y = Math.sin(t * 0.7) * 0.16;
    }

    (this.eyeL.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.6;
    (this.eyeR.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.6;

    // blink
    this.blinkTimer -= dt;
    if (this.blinkTimer < 0.12 && this.blinkTimer > 0) {
      this.eyeL.scale.y = this.eyeR.scale.y = 0.15;
    } else if (this.blinkTimer <= 0) {
      this.eyeL.scale.y = this.eyeR.scale.y = 1;
      this.blinkTimer = 2 + Math.random() * 3.5;
    } else {
      this.eyeL.scale.y = this.eyeR.scale.y = 1;
    }
    // antenna pulse
    const at = this.antennaTip.material as THREE.MeshStandardMaterial;
    at.emissiveIntensity = 1.1 + Math.sin(t * 4) * 0.5;
  }

  dispose() {
    this.group.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.geometry.dispose();
        const m = o.material as THREE.Material;
        m.dispose();
      }
    });
  }
}
