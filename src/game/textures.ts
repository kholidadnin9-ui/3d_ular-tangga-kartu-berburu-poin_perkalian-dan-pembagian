// Canvas texture helpers for tiles, cards, sky
import * as THREE from "three";
import type { CardKind } from "./constants";

function makeCanvas(size = 256) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  return { c, ctx: c.getContext("2d")! };
}

function tex(c: HTMLCanvasElement) {
  const t = new THREE.CanvasTexture(c);
  t.anisotropy = 4;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Eight-point Islamic star path */
function star8(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, rot = 0) {
  ctx.beginPath();
  for (let i = 0; i < 16; i++) {
    const rr = i % 2 === 0 ? r : r * 0.52;
    const a = rot + (i * Math.PI) / 8;
    const x = cx + Math.cos(a) * rr;
    const y = cy + Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

const numberTextures = new Map<string, THREE.Texture>();

export function tileTexture(
  num: number,
  opts: { kind: "normal" | "question" | "start" | "finish"; tint: string }
): THREE.Texture {
  const key = `${num}-${opts.kind}-${opts.tint}`;
  if (numberTextures.has(key)) return numberTextures.get(key)!;
  const { c, ctx } = makeCanvas(256);
  const s = 256;

  // rounded plate with soft inner shading
  const r = 30;
  ctx.clearRect(0, 0, s, s);
  const g = ctx.createLinearGradient(0, 0, s, s);
  g.addColorStop(0, "#ffffff");
  g.addColorStop(1, opts.tint);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.roundRect(6, 6, s - 12, s - 12, r);
  ctx.fill();

  // decorative corner diamonds
  ctx.fillStyle = "rgba(246,182,13,0.35)";
  [32, s - 32].forEach((x) =>
    [32, s - 32].forEach((y) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(-7, -7, 14, 14);
      ctx.restore();
    })
  );

  // inner border
  ctx.strokeStyle = "rgba(180,140,60,0.35)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(14, 14, s - 28, s - 28, r - 8);
  ctx.stroke();

  const isQ = opts.kind === "question";
  const isStart = opts.kind === "start";
  const isFinish = opts.kind === "finish";
  const dark = isQ ? "#ffffff" : "#16465c";

  if (isQ) {
    // violet medallion with gold star + ?
    ctx.fillStyle = "#8b5cf6";
    ctx.beginPath();
    ctx.arc(s / 2, s / 2 - 8, 58, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(246,201,69,0.9)";
    star8(ctx, s / 2, s / 2 - 8, 72);
    ctx.globalAlpha = 0.35;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#8b5cf6";
    ctx.beginPath();
    ctx.arc(s / 2, s / 2 - 8, 54, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = "900 64px 'Baloo 2', Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#fde68a";
    ctx.fillText("?", s / 2, s / 2 - 8);
  }

  const label = isStart ? "START" : isFinish ? "FINISH" : String(num);
  const mainSize = isQ ? 44 : isStart || isFinish ? 46 : 76;
  ctx.font = `900 ${mainSize}px 'Baloo 2', Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineWidth = 10;
  ctx.strokeStyle = isQ ? "rgba(76,29,149,0.9)" : "rgba(255,255,255,0.9)";
  const ty = isQ ? 208 : 128;
  ctx.strokeText(label, s / 2, ty);
  ctx.fillStyle = isFinish ? "#b8860b" : isStart ? "#0f766e" : dark;
  ctx.fillText(label, s / 2, ty);

  if (isFinish) {
    ctx.fillStyle = "#d4a012";
    star8(ctx, s / 2, 62, 34);
    ctx.fill();
    ctx.fillStyle = "#fff7dd";
    star8(ctx, s / 2, 62, 22);
    ctx.fill();
  }
  if (isStart) {
    ctx.fillStyle = "#0f766e";
    ctx.beginPath();
    ctx.moveTo(s / 2 - 22, 66);
    ctx.lineTo(s / 2 + 26, 84);
    ctx.lineTo(s / 2 - 22, 102);
    ctx.closePath();
    ctx.fill();
  }

  const t = tex(c);
  numberTextures.set(key, t);
  return t;
}

let cardBackTex: THREE.Texture | null = null;
export function cardBackTexture() {
  if (cardBackTex) return cardBackTex;
  const { c, ctx } = makeCanvas(256);
  const s = 256;
  const g = ctx.createLinearGradient(0, 0, s, s);
  g.addColorStop(0, "#0e7490");
  g.addColorStop(1, "#134e5e");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  // geometric lattice
  ctx.strokeStyle = "rgba(246,201,69,0.5)";
  ctx.lineWidth = 3;
  for (let i = -4; i < 9; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 40, 0);
    ctx.lineTo(i * 40 + s, s);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(i * 40 + s, 0);
    ctx.lineTo(i * 40, s);
    ctx.stroke();
  }
  // central medallion
  ctx.fillStyle = "#0b5563";
  ctx.beginPath();
  ctx.arc(s / 2, s / 2, 74, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f6c945";
  star8(ctx, s / 2, s / 2, 62);
  ctx.fill();
  ctx.fillStyle = "#0b5563";
  star8(ctx, s / 2, s / 2, 40, Math.PI / 8);
  ctx.fill();
  ctx.fillStyle = "#f6c945";
  ctx.beginPath();
  ctx.arc(s / 2, s / 2, 12, 0, Math.PI * 2);
  ctx.fill();
  // border
  ctx.strokeStyle = "#f6c945";
  ctx.lineWidth = 10;
  ctx.strokeRect(5, 5, s - 10, s - 10);
  cardBackTex = tex(c);
  return cardBackTex;
}

const cardFrontCache = new Map<string, THREE.Texture>();

export function cardFrontTexture(kind: CardKind): THREE.Texture {
  const key = String(kind);
  if (cardFrontCache.has(key)) return cardFrontCache.get(key)!;
  const { c, ctx } = makeCanvas(256);
  const s = 256;

  if (kind === "zonk") {
    const g = ctx.createLinearGradient(0, 0, s, s);
    g.addColorStop(0, "#7c3aed");
    g.addColorStop(1, "#4c1d95");
    ctx.fillStyle = g;
  } else if (kind === "star") {
    const g = ctx.createLinearGradient(0, 0, s, s);
    g.addColorStop(0, "#fbbf24");
    g.addColorStop(1, "#d97706");
    ctx.fillStyle = g;
  } else {
    const g = ctx.createLinearGradient(0, 0, s, s);
    g.addColorStop(0, "#fef9e7");
    g.addColorStop(1, "#d9f4f1");
    ctx.fillStyle = g;
  }
  ctx.fillRect(0, 0, s, s);

  // frame
  ctx.strokeStyle = kind === "star" ? "#fff7dd" : "#f6c945";
  ctx.lineWidth = 10;
  ctx.strokeRect(8, 8, s - 16, s - 16);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  if (kind === "star") {
    ctx.fillStyle = "#92400e";
    star8(ctx, s / 2, 112, 72);
    ctx.fill();
    ctx.fillStyle = "#fff7dd";
    star8(ctx, s / 2, 112, 50, Math.PI / 8);
    ctx.fill();
    ctx.font = "900 44px 'Baloo 2', Arial, sans-serif";
    ctx.fillStyle = "#7c2d12";
    ctx.fillText("BINTANG", s / 2, 210);
  } else if (kind === "zonk") {
    ctx.strokeStyle = "#fbbf24";
    ctx.lineWidth = 22;
    ctx.beginPath();
    ctx.arc(s / 2, 108, 52, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(s / 2 - 40, 146);
    ctx.lineTo(s / 2 + 40, 70);
    ctx.stroke();
    ctx.font = "900 52px 'Baloo 2', Arial, sans-serif";
    ctx.fillStyle = "#fde68a";
    ctx.fillText("ZONK", s / 2, 212);
  } else {
    // number card with medallion
    ctx.fillStyle = "#0e7490";
    ctx.beginPath();
    ctx.arc(s / 2, 112, 66, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(246,201,69,0.85)";
    star8(ctx, s / 2, 112, 84);
    ctx.globalAlpha = 0.4;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#0e7490";
    ctx.beginPath();
    ctx.arc(s / 2, 112, 60, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = "900 96px 'Baloo 2', Arial, sans-serif";
    ctx.lineWidth = 10;
    ctx.strokeStyle = "rgba(8,60,74,0.6)";
    ctx.strokeText(String(kind), s / 2, 116);
    ctx.fillStyle = "#fefce8";
    ctx.fillText(String(kind), s / 2, 116);
    ctx.font = "800 30px 'Baloo 2', Arial, sans-serif";
    ctx.fillStyle = "#155e75";
    ctx.fillText(`${kind} LANGKAH`, s / 2, 218);
  }
  const t = tex(c);
  cardFrontCache.set(key, t);
  return t;
}

export function skyTexture() {
  const { c, ctx } = makeCanvas(512);
  const s = 512;
  const g = ctx.createLinearGradient(0, 0, 0, s);
  g.addColorStop(0, "#4db3e8");
  g.addColorStop(0.45, "#8ed4f2");
  g.addColorStop(0.75, "#cfeef9");
  g.addColorStop(1, "#fdf3d8");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  return tex(c);
}

export function stripeTexture(a: string, b: string) {
  const { c, ctx } = makeCanvas(128);
  ctx.fillStyle = a;
  ctx.fillRect(0, 0, 128, 128);
  ctx.fillStyle = b;
  for (let i = 0; i < 4; i++) ctx.fillRect(i * 32, 0, 16, 128);
  const t = tex(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

export function glowTexture() {
  const { c, ctx } = makeCanvas(128);
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.4, "rgba(255,230,150,0.55)");
  g.addColorStop(1, "rgba(255,220,120,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  return tex(c);
}
