// ============================================================
// CardTable — 8 kartu fisik TERTUMPUK seperti deck sungguhan,
// kocok riffle, kartu teratas terbang + flip menghadap kamera
// ============================================================
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import type { CardKind } from "./constants";
import { cardBackTexture, cardFrontTexture, glowTexture } from "./textures";

interface Tween {
  dur: number;
  t: number;
  fn: (k: number) => void;
  done: () => void;
  ease: (k: number) => number;
}

const easeOut = (k: number) => 1 - Math.pow(1 - k, 3);
const easeInOut = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
const easeBack = (k: number) => {
  const c = 2.2;
  return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2);
};
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

const TAU = Math.PI * 2;
const HOME_RX = Math.PI / 2 - 0.07; // kartu tidur, sedikit miring ke arah kamera

function nearest(target: number, ref: number) {
  let d = (target - ref) % TAU;
  if (d > Math.PI) d -= TAU;
  if (d < -Math.PI) d += TAU;
  return ref + d;
}
function jitter(slot: number, seed: number) {
  const x = Math.sin(slot * 127.1 + seed * 311.7) * 43758.5453;
  return x - Math.floor(x) - 0.5;
}
/** posisi kartu pada tumpukan menurut slot (0 = paling bawah, 7 = paling atas) */
function slotPos(slot: number) {
  return new THREE.Vector3(
    jitter(slot, 1) * 0.24,
    0.9 + slot * 0.052,
    0.32 + jitter(slot, 2) * 0.24
  );
}
function slotRotY(slot: number) {
  return jitter(slot, 3) * 0.6;
}

export class CardTable {
  group = new THREE.Group();
  private cards: THREE.Mesh[] = [];
  private tweens: Tween[] = [];
  private sideMat = new THREE.MeshStandardMaterial({ color: 0xf0b429, roughness: 0.3, metalness: 0.7 });
  private revealing = false;
  private revealCard: THREE.Mesh | null = null;
  private billboardOn = false;
  private disposed = false;
  private glow: THREE.Mesh;
  private camRef: THREE.Camera | null = null;

  constructor(scene: THREE.Scene) {
    this.group.position.set(8.6, 0, 14.4);
    this.group.rotation.y = -0.45;

    // pedestal emas + bantal biru
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(3.4, 3.9, 0.5, 24),
      new THREE.MeshStandardMaterial({ color: 0xcfa14a, roughness: 0.5, metalness: 0.4 })
    );
    base.position.y = 0.25;
    base.castShadow = true;
    base.receiveShadow = true;
    this.group.add(base);
    const cushion = new THREE.Mesh(
      new THREE.CylinderGeometry(3.1, 3.3, 0.35, 24),
      new THREE.MeshStandardMaterial({ color: 0x0e7490, roughness: 0.7 })
    );
    cushion.position.y = 0.65;
    cushion.receiveShadow = true;
    this.group.add(cushion);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(3.25, 0.09, 8, 32), this.sideMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.84;
    this.group.add(rim);
    // token bintang 8 sebagai hiasan meja
    const starTok = new THREE.Mesh(
      new THREE.CylinderGeometry(0.55, 0.55, 0.07, 8),
      new THREE.MeshStandardMaterial({ color: 0xf6c945, roughness: 0.25, metalness: 0.8 })
    );
    starTok.position.set(-2.15, 0.87, -1.0);
    starTok.castShadow = true;
    this.group.add(starTok);

    // cahaya di belakang kartu saat reveal
    this.glow = new THREE.Mesh(
      new THREE.PlaneGeometry(4.4, 4.4),
      new THREE.MeshBasicMaterial({ map: glowTexture(), transparent: true, opacity: 0, depthWrite: false })
    );
    this.glow.position.set(0, 4.5, 1.1);
    this.group.add(this.glow);

    // ---- 8 kartu tertumpuk rapi, tidur menelungkup ----
    const geo = new RoundedBoxGeometry(1.02, 1.45, 0.08, 2, 0.03);
    for (let i = 0; i < 8; i++) {
      const mats: THREE.Material[] = [
        this.sideMat, this.sideMat, this.sideMat, this.sideMat, // ketebalan emas terlihat pada tumpukan
        new THREE.MeshStandardMaterial({ map: cardBackTexture(), roughness: 0.35 }), // sisi depan (tersembunyi)
        new THREE.MeshStandardMaterial({ map: cardBackTexture(), roughness: 0.35 }), // sisi belakang (menghadap atas)
      ];
      const card = new THREE.Mesh(geo, mats);
      card.position.copy(slotPos(i));
      card.rotation.order = "YXZ";
      card.rotation.x = HOME_RX;
      card.rotation.y = slotRotY(i);
      card.castShadow = true;
      card.receiveShadow = true;
      card.userData.slot = i;
      this.group.add(card);
      this.cards.push(card);
    }
    scene.add(this.group);
  }

  setCamera(cam: THREE.Camera) {
    this.camRef = cam;
  }

  private tween(dur: number, fn: (k: number) => void, ease: (k: number) => number = easeInOut): Promise<void> {
    return new Promise((resolve) => {
      if (this.disposed) {
        resolve();
        return;
      }
      this.tweens.push({ dur, t: 0, fn, done: resolve, ease });
    });
  }

  /** kocok riffle: tumpukan terangkat lalu tersusun ulang dengan urutan acak */
  private async riffle() {
    for (let round = 0; round < 2; round++) {
      if (this.disposed) return;
      const from = this.cards.map((c) => c.position.clone());
      await this.tween(0.16, (k) => {
        this.cards.forEach((c, i) => {
          const s = c.userData.slot as number;
          c.position.y = from[i].y + Math.sin(k * Math.PI) * (0.5 + s * 0.045);
        });
      }, easeOut);
      if (this.disposed) return;

      const order = [0, 1, 2, 3, 4, 5, 6, 7];
      for (let i = 7; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
      }
      this.cards.forEach((c, i) => {
        c.userData.slot = order[i];
      });

      const from2 = this.cards.map((c) => c.position.clone());
      const ry2 = this.cards.map((c) => c.rotation.y);
      await this.tween(0.22, (k) => {
        this.cards.forEach((c, i) => {
          const s = c.userData.slot as number;
          const tgt = slotPos(s);
          c.position.x = from2[i].x + (tgt.x - from2[i].x) * k;
          c.position.z = from2[i].z + (tgt.z - from2[i].z) * k;
          c.position.y = from2[i].y + (tgt.y - from2[i].y) * k + Math.sin(k * Math.PI) * 0.4;
          const ty = nearest(slotRotY(s), ry2[i]);
          c.rotation.y = ry2[i] + (ty - ry2[i]) * k;
        });
      }, easeOut);
    }
  }

  /** kocok → kartu teratas terbang → flip 3D menghadap kamera */
  async playDraw(kind: CardKind, onReveal?: () => void): Promise<void> {
    if (this.disposed) return;
    while (this.revealing && !this.disposed) await sleep(120);
    if (this.disposed) return;
    this.revealing = true;

    await this.riffle();
    if (this.disposed) return;

    const card = this.cards.find((c) => (c.userData.slot as number) === 7)!;
    this.revealCard = card;

    // pasang tekstur depan sesuai jenis kartu
    const mats = card.material as THREE.Material[];
    mats[4].dispose();
    mats[4] = new THREE.MeshStandardMaterial({
      map: cardFrontTexture(kind),
      roughness: 0.3,
      emissive: kind === "star" ? 0x8a5a00 : kind === "zonk" ? 0x3b0764 : 0x0b4a5c,
      emissiveIntensity: 0.25,
      emissiveMap: cardFrontTexture(kind),
    });

    const p0 = card.position.clone();
    const rx0 = card.rotation.x;
    const ry0 = card.rotation.y;
    const anchor = new THREE.Vector3(0, 4.5, 1.6);
    const wp = this.group.localToWorld(anchor.clone());
    const cam = this.camRef?.position ?? new THREE.Vector3(0, 30, 40);
    const faceCam = Math.atan2(cam.x - wp.x, cam.z - wp.z) - this.group.rotation.y;
    const backAng = nearest(faceCam + Math.PI, ry0);

    // angkat kartu: berdiri dengan punggung menghadap kamera
    await this.tween(0.55, (k) => {
      card.position.lerpVectors(p0, anchor, k);
      card.position.y = p0.y + (anchor.y - p0.y) * k + Math.sin(k * Math.PI) * 0.7;
      card.scale.setScalar(1 + 0.8 * k);
      card.rotation.x = rx0 + (0.03 - rx0) * k;
      card.rotation.y = ry0 + (backAng - ry0) * k;
    }, easeOut);
    if (this.disposed) return;

    // flip reveal
    onReveal?.();
    const g = this.glow.material as THREE.MeshBasicMaterial;
    void this.tween(0.5, (k) => (g.opacity = Math.min(0.85, k)));
    const flipFrom = card.rotation.y;
    await this.tween(0.5, (k) => {
      card.rotation.y = flipFrom - Math.PI * easeBack(k);
    }, (x) => x);
    if (this.disposed) return;
    this.billboardOn = true;

    // kartu ditahan agar terbaca
    await sleep(900);
    if (this.disposed) return;

    // kembalikan ke puncak tumpukan (di latar belakang)
    this.billboardOn = false;
    void this.tween(0.4, (k) => (g.opacity = 0.85 * (1 - k)));
    const p1 = card.position.clone();
    const ryNow = card.rotation.y;
    const home = slotPos(7);
    const homeRY = nearest(slotRotY(7), ryNow);
    void (async () => {
      await this.tween(0.5, (k) => {
        card.position.lerpVectors(p1, home, k);
        card.position.y = p1.y + (home.y - p1.y) * k + Math.sin(k * Math.PI) * 0.5;
        card.scale.setScalar(1.8 - 0.8 * k);
        card.rotation.x = 0.03 + (HOME_RX - 0.03) * k;
        card.rotation.y = ryNow + (homeRY - ryNow) * k;
      }, easeOut);
      if (this.disposed) return;
      const mats2 = card.material as THREE.Material[];
      mats2[4].dispose();
      mats2[4] = new THREE.MeshStandardMaterial({ map: cardBackTexture(), roughness: 0.35 });
      this.revealCard = null;
      this.revealing = false;
    })();
  }

  dispose() {
    this.disposed = true;
    for (const tween of this.tweens.splice(0)) tween.done();
    this.revealing = false;
    this.revealCard = null;
    this.billboardOn = false;
  }

  update(dt: number) {
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

    // napas halus pada kartu teratas tumpukan
    const t = performance.now() / 1000;
    if (this.tweens.length === 0) {
      for (const c of this.cards) {
        if (c === this.revealCard) continue;
        const s = c.userData.slot as number;
        const home = slotPos(s);
        c.position.y = home.y + (s === 7 ? Math.sin(t * 2.2) * 0.035 : 0);
      }
    }

    // kartu hasil bukaan selalu menghadap kamera pemain
    if (this.revealCard && this.billboardOn && this.camRef) {
      const wpos = new THREE.Vector3();
      this.revealCard.getWorldPosition(wpos);
      const cam = this.camRef.position;
      const want = Math.atan2(cam.x - wpos.x, cam.z - wpos.z) - this.group.rotation.y;
      const near = nearest(want, this.revealCard.rotation.y);
      this.revealCard.rotation.y += (near - this.revealCard.rotation.y) * Math.min(1, dt * 5);
    }

    const g = this.glow.material as THREE.MeshBasicMaterial;
    if (g.opacity > 0) this.glow.scale.setScalar(1 + Math.sin(t * 5) * 0.06);
  }
}
