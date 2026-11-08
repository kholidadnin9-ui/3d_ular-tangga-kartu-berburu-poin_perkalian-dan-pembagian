// ============================================================
// JEJAK PERADABAN ISLAM — Game constants & data
// ============================================================

export const TILE_COUNT = 100;
export const GRID = 10;
export const TILE_SIZE = 2.3;
export const SAVE_KEY = "jejak-peradaban-save-v1";
export const SETTINGS_KEY = "jejak-peradaban-settings-v1";

/** Boustrophedon (zig-zag) grid helpers */
export function tileGrid(n: number) {
  const i = n - 1;
  const row = Math.floor(i / GRID);
  const colRaw = i % GRID;
  const col = row % 2 === 0 ? colRaw : GRID - 1 - colRaw;
  return { row, col };
}

export function tileWorld(n: number) {
  const { row, col } = tileGrid(n);
  return { x: (col - 4.5) * TILE_SIZE, z: (4.5 - row) * TILE_SIZE };
}

/** Snakes: head -> tail (turun) */
export const SNAKES: Record<number, number> = {
  99: 41,
  89: 53,
  73: 28,
  62: 19,
  48: 16,
  36: 6,
};

/** Ladders: base -> top (naik) */
export const LADDERS: Record<number, number> = {
  4: 25,
  13: 46,
  30: 52,
  42: 68,
  55: 79,
  71: 92,
};

/** Exactly 20 question tiles (never overlapping snake/ladder endpoints, START, FINISH) */
export const QUESTION_TILES = [
  3, 7, 11, 15, 21, 27, 32, 39, 44, 51,
  57, 60, 64, 67, 74, 77, 83, 86, 90, 94,
];

export interface Question {
  q: string;
  answer: number;
  options: number[];
}

/** 20 soal: perkalian 1–10 & pembagian sederhana (level SD) */
export const QUESTIONS: Question[] = [
  { q: "3 × 4 = ?", answer: 12, options: [10, 12, 14] },
  { q: "5 × 6 = ?", answer: 30, options: [30, 25, 35] },
  { q: "7 × 8 = ?", answer: 56, options: [54, 56, 48] },
  { q: "6 × 7 = ?", answer: 42, options: [36, 42, 48] },
  { q: "4 × 9 = ?", answer: 36, options: [36, 32, 40] },
  { q: "8 × 8 = ?", answer: 64, options: [56, 64, 72] },
  { q: "9 × 6 = ?", answer: 54, options: [45, 54, 63] },
  { q: "7 × 5 = ?", answer: 35, options: [30, 35, 40] },
  { q: "6 × 9 = ?", answer: 54, options: [48, 54, 56] },
  { q: "9 × 9 = ?", answer: 81, options: [72, 81, 90] },
  { q: "24 ÷ 4 = ?", answer: 6, options: [5, 6, 8] },
  { q: "36 ÷ 6 = ?", answer: 6, options: [5, 6, 7] },
  { q: "45 ÷ 5 = ?", answer: 9, options: [8, 9, 7] },
  { q: "56 ÷ 8 = ?", answer: 7, options: [6, 7, 8] },
  { q: "63 ÷ 9 = ?", answer: 7, options: [6, 7, 9] },
  { q: "48 ÷ 6 = ?", answer: 8, options: [6, 8, 9] },
  { q: "81 ÷ 9 = ?", answer: 9, options: [8, 9, 10] },
  { q: "32 ÷ 4 = ?", answer: 8, options: [6, 8, 7] },
  { q: "72 ÷ 8 = ?", answer: 9, options: [9, 7, 8] },
  { q: "27 ÷ 3 = ?", answer: 9, options: [6, 9, 8] },
];

export type CardKind = 1 | 2 | 3 | 4 | 5 | 6 | "star" | "zonk";

/** Weighted pool: angka 75%, bintang 12.5%, zonk 12.5% */
export const CARD_POOL: CardKind[] = [
  1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, "star", "star", "zonk", "zonk",
];

export function drawCardKind(): CardKind {
  return CARD_POOL[Math.floor(Math.random() * CARD_POOL.length)];
}

export function drawNonStar(): CardKind {
  const choices = CARD_POOL.filter((kind) => kind !== "star");
  return choices[Math.floor(Math.random() * choices.length)];
}

export type RobotColorId = "gold" | "blue" | "green" | "red";

export interface RobotColorDef {
  id: RobotColorId;
  label: string;
  accent: number;
  accentCss: string;
  soft: string;
}

export const ROBOT_COLORS: RobotColorDef[] = [
  { id: "gold", label: "Robot Emas", accent: 0xf6b60d, accentCss: "#f6b60d", soft: "#fdf3d0" },
  { id: "blue", label: "Robot Biru", accent: 0x38a5f8, accentCss: "#38a5f8", soft: "#d8ecfe" },
  { id: "green", label: "Robot Zamrud", accent: 0x2fd08a, accentCss: "#2fd08a", soft: "#d7f5e7" },
  { id: "red", label: "Robot Merah", accent: 0xf4584f, accentCss: "#f4584f", soft: "#fee1df" },
];

export type BonusKey = "point" | "six" | "draw";

export interface Player {
  id: number;
  name: string;
  colorId: RobotColorId;
  position: number; // tile number 1..100
  score: number;
  bonus: Record<BonusKey, boolean>; // true = sudah digunakan
  isAI: boolean;
}

export function hasBonusLeft(p: Player) {
  return !p.bonus.point || !p.bonus.six || !p.bonus.draw;
}

export interface GameSave {
  players: Player[];
  current: number;
  deck: number[];
  timerOn: boolean;
  savedAt: number;
}
