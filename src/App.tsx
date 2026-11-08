import { useCallback, useEffect, useRef, useState } from "react";
import { ListOrdered } from "lucide-react";
import { GameEngine } from "./game/engine";
import { audio } from "./game/audio";
import {
  QUESTIONS, QUESTION_TILES, SNAKES, LADDERS, SAVE_KEY,
  drawCardKind, drawNonStar, hasBonusLeft,
} from "./game/constants";
import type { BonusKey, CardKind, GameSave, Player, Question } from "./game/constants";
import MainMenu from "./components/MainMenu";
import SetupScreen, { type PlayerConfig } from "./components/SetupScreen";
import GameScreen, { type Banner, type Toast, type QuestionView } from "./components/GameScreen";
import VictoryScreen from "./components/VictoryScreen";
import { GuideModal, SettingsModal, loadAudioSettings } from "./components/Modals";
import FactsModal from "./components/FactsModal";
import { Volume2 } from "lucide-react";

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const shuffle = <T,>(arr: T[]) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

type Screen = "menu" | "setup" | "game" | "victory";

interface GameState {
  players: Player[];
  current: number;
  deck: number[];
  busy: boolean;
  over: boolean;
  winner: number;
  timerOn: boolean;
}

const emptyGame: GameState = {
  players: [], current: 0, deck: [], busy: false, over: false, winner: -1, timerOn: true,
};

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const G = useRef<GameState>({ ...emptyGame });
  const tokenRef = useRef(0);
  const questionSeqRef = useRef(0);
  const answerRef = useRef<((c: boolean) => void) | null>(null);
  const bonusRef = useRef<((k: BonusKey) => void) | null>(null);

  const [screen, setScreen] = useState<Screen>("menu");
  const [peek, setPeek] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [factsOpen, setFactsOpen] = useState(false);
  const [muted, setMuted] = useState(false);
  const [hasSave, setHasSave] = useState(false);
  const [engineError, setEngineError] = useState<string | null>(null);

  // mirrored UI state
  const [players, setPlayers] = useState<Player[]>([]);
  const [current, setCurrent] = useState(0);
  const [busy, setBusy] = useState(false);
  const [cardKind, setCardKind] = useState<CardKind | null>(null);
  const [cardKey, setCardKey] = useState(0);
  const [banner, setBanner] = useState<Banner | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [question, setQuestion] = useState<QuestionView | null>(null);
  const [bonusOpen, setBonusOpen] = useState(false);

  // ---------- engine boot ----------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      setEngineError("Area papan permainan tidak berhasil disiapkan.");
      return;
    }

    let engine: GameEngine | null = null;
    const handleContextLost = (event: Event) => {
      event.preventDefault();
      setEngineError("Koneksi grafis 3D terputus. Muat ulang halaman dan pastikan akselerasi hardware browser aktif.");
    };

    try {
      engine = new GameEngine(canvas);
      engineRef.current = engine;
      engine.setShowcase(true);
    } catch (error) {
      console.error("Gagal menginisialisasi WebGL:", error);
      setEngineError("Browser atau perangkat ini belum dapat menjalankan grafis 3D (WebGL). Coba gunakan Chrome/Edge versi terbaru dan aktifkan akselerasi hardware.");
    }

    loadAudioSettings();
    setMuted(audio.muted);
    const unlock = () => {
      audio.ensure();
      audio.applyVolumes();
      audio.startBGM();
    };
    window.addEventListener("pointerdown", unlock, { once: true });
    canvas.addEventListener("webglcontextlost", handleContextLost, false);
    setHasSave(readSave() !== null);

    return () => {
      window.removeEventListener("pointerdown", unlock);
      canvas.removeEventListener("webglcontextlost", handleContextLost);
      engine?.dispose();
      audio.stopBGM();
      if (engineRef.current === engine) engineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- helpers ----------
  const mirror = useCallback(() => {
    setPlayers(G.current.players.map((p) => ({ ...p, bonus: { ...p.bonus } })));
    setCurrent(G.current.current);
  }, []);

  const toast = useCallback((text: string, tone: Toast["tone"] = "info") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t.slice(-2), { id, text, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2300);
  }, []);

  const alive = useCallback((token: number) => token === tokenRef.current, []);

  const saveGame = useCallback(() => {
    if (G.current.over) return;
    try {
      const save: GameSave = {
        players: G.current.players,
        current: G.current.current,
        deck: G.current.deck,
        timerOn: G.current.timerOn,
        savedAt: Date.now(),
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(save));
    } catch { /* ignore */ }
  }, []);

  const nextQuestionIdx = useCallback(() => {
    if (G.current.deck.length === 0) G.current.deck = shuffle(QUESTIONS.map((_, i) => i));
    return G.current.deck.pop()!;
  }, []);

  // ---------- core turn logic ----------
  const winFlow = useCallback(async (idx: number) => {
    const g = G.current;
    g.over = true;
    g.winner = idx;
    mirror();
    try { localStorage.removeItem(SAVE_KEY); } catch { /* ignore */ }
    setHasSave(false);
    audio.sfx("win");
    const engine = engineRef.current!;
    engine.celebrate(idx, 6);
    const p = g.players[idx];
    const defColor = p.colorId === "gold" ? 0xf6c945 : p.colorId === "blue" ? 0x38a5f8 : p.colorId === "green" ? 0x2fd08a : 0xf4584f;
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        const rp = engine.robots[idx];
        if (rp) engine.burst(rp.group.position, defColor, 26);
      }, i * 450);
    }
    toast(`${p.name} mencapai ISTANA FINISH!`, "good");
    await wait(2200);
    setScreen("victory");
    setPeek(false);
  }, [mirror, toast]);

  const postLanding = useCallback(async (idx: number, token: number) => {
    const g = G.current;
    const engine = engineRef.current!;
    const p = g.players[idx];

    // ---- question tile ----
    if (!g.over && QUESTION_TILES.includes(p.position) && alive(token)) {
      const qi = nextQuestionIdx();
      const q: Question = QUESTIONS[qi];
      setQuestion({ id: ++questionSeqRef.current, q, tile: p.position, auto: p.isAI });
      audio.sfx("flip");
      const correct = await new Promise<boolean>((res) => { answerRef.current = res; });
      answerRef.current = null;
      setQuestion(null);
      if (!alive(token)) return;
      if (correct) {
        p.score += 5;
        mirror();
        saveGame();
        toast(`BENAR! +5 POIN untuk ${p.name}`, "good");
        audio.sfx("point");
        await engine.celebrate(idx, 1.5);
      } else {
        toast(`COBA LAGI! Tidak ada poin kali ini`, "bad");
        await engine.shakeNo(idx);
      }
    }

    if (g.over || !alive(token)) return;

    // ---- snake / ladder ----
    const pos = p.position;
    if (SNAKES[pos] !== undefined) {
      toast(`${p.name} mendarat di kepala ular! Turun…`, "bad");
      await wait(350);
      const to = await engine.followPath(idx, pos);
      if (!alive(token)) return;
      p.position = to;
      mirror();
      saveGame();
    } else if (LADDERS[pos] !== undefined) {
      toast(`${p.name} menemukan tangga emas! Naik!`, "good");
      await wait(350);
      const to = await engine.followPath(idx, pos);
      if (!alive(token)) return;
      p.position = to;
      mirror();
      saveGame();
      if (to === 100) await winFlow(idx);
    }
  }, [alive, mirror, nextQuestionIdx, saveGame, toast, winFlow]);

  const moveNumeric = useCallback(async (idx: number, steps: number, token: number) => {
    const g = G.current;
    const engine = engineRef.current!;
    const p = g.players[idx];
    const target = p.position + steps;
    if (target > 100) {
      setBanner({ title: "TERLALU JAUH!", sub: `Butuh tepat ${100 - p.position} langkah menuju FINISH`, tone: "bad" });
      audio.sfx("wrong");
      await engine.shakeNo(idx);
      await wait(1200);
      setBanner(null);
      return;
    }
    const landed = await engine.moveSteps(idx, p.position, steps);
    if (!alive(token)) return;
    p.position = landed;
    mirror();
    saveGame();
    if (landed === 100) {
      await winFlow(idx);
      return;
    }
    await postLanding(idx, token);
  }, [alive, mirror, postLanding, saveGame, winFlow]);

  const zonkFlow = useCallback(async (idx: number) => {
    const engine = engineRef.current!;
    setBanner({ title: "ZONK!", sub: "Kesempatan bergerak terlewat.", tone: "bad" });
    audio.sfx("zonk");
    await engine.zonkPulse(idx);
    await wait(900);
    setBanner(null);
  }, []);

  const starFlow = useCallback(async (idx: number, token: number) => {
    const g = G.current;
    const engine = engineRef.current!;
    const p = g.players[idx];
    audio.sfx("star");
    engine.celebrate(idx, 1.2);

    let key: BonusKey;
    if (p.isAI) {
      await wait(1100);
      const avail: BonusKey[] = (["point", "six", "draw"] as BonusKey[]).filter((k) => !p.bonus[k]);
      key = avail[Math.floor(Math.random() * avail.length)];
      toast(`${p.name} memilih bonus ${key === "point" ? "+10 POIN" : key === "six" ? "6 LANGKAH" : "ACAK KARTU"}`, "info");
    } else {
      setBonusOpen(true);
      key = await new Promise<BonusKey>((res) => { bonusRef.current = res; });
      bonusRef.current = null;
      setBonusOpen(false);
    }
    if (!alive(token)) return;
    p.bonus[key] = true;
    mirror();
    saveGame();

    if (key === "point") {
      p.score += 10;
      mirror();
      saveGame();
      audio.sfx("point");
      toast(`+10 POIN BONUS untuk ${p.name}!`, "good");
      const rp = engine.robots[idx];
      if (rp) engine.burst(rp.group.position, 0xffd54a, 26);
      await engine.happyJump(idx);
    } else if (key === "six") {
      const steps = Math.min(6, 100 - p.position);
      toast(`${p.name} berjalan bonus ${steps} langkah!`, "good");
      if (steps > 0) await moveNumeric(idx, steps, token);
    } else {
      toast(`Kartu tambahan untuk ${p.name}!`, "good");
      await wait(600);
      const kind2 = drawNonStar();
      setCardKey((k) => k + 1);
      await engine.playDraw(kind2, () => setCardKind(kind2));
      if (!alive(token)) return;
      await wait(1000);
      setCardKind(null);
      if (kind2 === "zonk") await zonkFlow(idx);
      else await moveNumeric(idx, kind2 as number, token);
    }
  }, [alive, mirror, moveNumeric, saveGame, toast, zonkFlow]);

  const runTurn = useCallback(async () => {
    const g = G.current;
    if (g.busy || g.over) return;
    const engine = engineRef.current;
    if (!engine) return;
    const token = ++tokenRef.current;
    g.busy = true;
    setBusy(true);

    try {
      const idx = g.current;
      const p = g.players[idx];
      let kind: CardKind = drawCardKind();
      if (kind === "star" && !hasBonusLeft(p)) {
        toast("Semua bonus bintang habis! Sistem mengacak ulang…", "info");
        kind = drawNonStar();
      }
      setCardKey((k) => k + 1);
      await engine.playDraw(kind, () => setCardKind(kind));
      if (!alive(token)) return;
      await wait(1000);
      setCardKind(null);

      if (kind === "star") await starFlow(idx, token);
      else if (kind === "zonk") await zonkFlow(idx);
      else await moveNumeric(idx, kind as number, token);
    } finally {
      if (alive(token)) {
        G.current.busy = false;
        setBusy(false);
      }
    }

    if (!G.current.over && alive(token)) {
      // advance turn with slight delay
      await wait(650);
      if (!alive(token)) return;
      G.current.current = (G.current.current + 1) % G.current.players.length;
      mirror();
      saveGame();
      engineRef.current?.setMarker(G.current.current);
      const np = G.current.players[G.current.current];
      toast(`Giliran: ${np.name}`, "info");
      if (np.isAI) {
        setTimeout(() => {
          if (tokenRef.current === token && !G.current.busy && !G.current.over) runTurn();
        }, 1300);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alive, mirror, moveNumeric, saveGame, starFlow, toast, zonkFlow]);

  // ---------- screen actions ----------
  const startGame = useCallback((configs: PlayerConfig[], timerOn: boolean) => {
    const engine = engineRef.current!;
    tokenRef.current++;
    const newPlayers: Player[] = configs.map((c, i) => ({
      id: i,
      name: c.name.trim() || `Petualang ${i + 1}`,
      colorId: c.colorId,
      position: 1,
      score: 0,
      bonus: { point: false, six: false, draw: false },
      isAI: c.isAI,
    }));
    G.current = {
      players: newPlayers,
      current: 0,
      deck: shuffle(QUESTIONS.map((_, i) => i)),
      busy: false,
      over: false,
      winner: -1,
      timerOn,
    };
    engine.spawnRobots(newPlayers);
    engine.setMarker(0);
    engine.setShowcase(false);
    engine.resetCamera();
    setBonusOpen(false);
    setQuestion(null);
    setBanner(null);
    setCardKind(null);
    mirror();
    setBusy(false);
    setScreen("game");
    setPeek(false);
    saveGame();
    setHasSave(true);
    toast(`Giliran pertama: ${newPlayers[0].name}`, "good");
    if (newPlayers[0].isAI) {
      const token = tokenRef.current;
      setTimeout(() => { if (tokenRef.current === token && !G.current.busy) runTurn(); }, 1600);
    }
  }, [mirror, runTurn, saveGame, toast]);

  const continueGame = useCallback((save: GameSave) => {
    const engine = engineRef.current!;
    tokenRef.current++;
    G.current = {
      players: save.players,
      current: save.current,
      deck: save.deck,
      busy: false,
      over: false,
      winner: -1,
      timerOn: save.timerOn,
    };
    engine.spawnRobots(save.players);
    engine.setMarker(save.current);
    engine.setShowcase(false);
    engine.resetCamera();
    mirror();
    setBusy(false);
    setScreen("game");
    toast("Permainan dilanjutkan!", "good");
    const cur = save.players[save.current];
    if (cur.isAI) {
      const token = tokenRef.current;
      setTimeout(() => { if (tokenRef.current === token && !G.current.busy) runTurn(); }, 1500);
    }
  }, [mirror, runTurn, toast]);

  const goMenu = useCallback(() => {
    tokenRef.current++;
    G.current.busy = false;
    setBusy(false);
    setQuestion(null);
    setBonusOpen(false);
    setBanner(null);
    setCardKind(null);
    answerRef.current?.(false);
    bonusRef.current?.("point");
    engineRef.current?.setShowcase(true);
    engineRef.current?.menuCamera();
    setHasSave(readSave() !== null);
    setScreen("menu");
  }, []);

  const restartSame = useCallback(() => {
    const old = G.current.players;
    startGame(old.map((p) => ({ name: p.name, colorId: p.colorId, isAI: p.isAI })), G.current.timerOn);
  }, [startGame]);

  // ---------- render ----------
  const canDraw =
    screen === "game" && !busy && !G.current.over && !question && !bonusOpen && !banner &&
    players[current] !== undefined && !players[current].isAI;

  const showHUD = screen === "game" || (screen === "victory" && peek);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      {screen === "menu" && (
        <MainMenu
          hasSave={hasSave}
          muted={muted}
          onToggleMute={() => { const m = !muted; audio.setMuted(m); setMuted(m); }}
          onPlay={() => setScreen("setup")}
          onContinue={() => {
            const s = readSave();
            if (s) continueGame(s);
            else setScreen("setup");
          }}
          onGuide={() => setGuideOpen(true)}
          onFacts={() => setFactsOpen(true)}
        />
      )}

      {screen === "setup" && (
        <SetupScreen onStart={startGame} onBack={() => setScreen("menu")} />
      )}

      {showHUD && (
        <GameScreen
          players={players}
          current={current}
          busy={busy}
          canDraw={!!canDraw}
          questionOpen={!!question}
          bonusOpen={bonusOpen}
          cardView={cardKind}
          cardKey={cardKey}
          banner={banner}
          toasts={toasts}
          question={question}
          timerOn={G.current.timerOn}
          muted={muted}
          onDraw={runTurn}
          onAnswer={(c) => answerRef.current?.(c)}
          onPickBonus={(k) => bonusRef.current?.(k)}
          onResetCam={() => engineRef.current?.resetCamera()}
          onTopView={() => engineRef.current?.topView()}
          onHelp={() => setGuideOpen(true)}
          onFacts={() => setFactsOpen(true)}
          onToggleMute={() => { const m = !muted; audio.setMuted(m); setMuted(m); }}
          onQuit={goMenu}
        />
      )}

      {screen === "victory" && !peek && G.current.winner >= 0 && (
        <VictoryScreen
          players={players}
          winnerIdx={G.current.winner}
          onRestart={restartSame}
          onViewBoard={() => setPeek(true)}
          onMenu={goMenu}
        />
      )}

      {screen === "victory" && peek && (
        <button
          onClick={() => { audio.sfx("click"); setPeek(false); }}
          className="anim-pop-in absolute left-1/2 top-3 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full border-2 border-amber-300 bg-[#0d4a5f]/90 px-5 py-2.5 font-extrabold text-amber-200 shadow-xl backdrop-blur transition hover:scale-105"
        >
          <ListOrdered size={17} /> LIHAT HASIL AKHIR
        </button>
      )}

      {guideOpen && <GuideModal onClose={() => setGuideOpen(false)} />}
      {factsOpen && <FactsModal onClose={() => setFactsOpen(false)} />}
      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} muted={muted} setMuted={setMuted} />}

      {/* settings entry on menu */}
      {screen === "menu" && (
        <button
          onClick={() => { audio.sfx("click"); setSettingsOpen(true); }}
          className="absolute bottom-4 left-4 z-20 flex items-center gap-2 rounded-full border-2 border-amber-300/60 bg-[#0d4a5f]/85 px-4 py-2 text-sm font-extrabold text-amber-200 shadow-lg backdrop-blur transition hover:scale-105"
        >
          <Volume2 size={16} /> PENGATURAN SUARA
        </button>
      )}

      {engineError && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-[#082b38]/95 p-6 text-center" role="alert">
          <div className="max-w-lg rounded-3xl border-2 border-amber-300/70 bg-[#0f5066] p-7 shadow-2xl">
            <h1 className="text-2xl font-extrabold text-amber-200">Papan 3D belum dapat dibuka</h1>
            <p className="mt-3 text-sm leading-relaxed text-cyan-50">{engineError}</p>
            <p className="mt-3 text-xs text-cyan-100/70">Permainan ini membutuhkan browser modern dengan dukungan WebGL.</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-5 rounded-xl border-b-4 border-amber-700 bg-amber-300 px-5 py-3 font-extrabold text-amber-950 transition hover:brightness-110"
            >
              MUAT ULANG HALAMAN
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readSave(): GameSave | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || !Array.isArray(parsed.players) || parsed.players.length < 1 || parsed.players.length > 4) {
      return null;
    }

    const validColors = ["gold", "blue", "green", "red"] as const;
    const players: Player[] = [];
    for (const [index, item] of parsed.players.entries()) {
      if (!isRecord(item) || !isRecord(item.bonus)) return null;
      if (typeof item.name !== "string" || !validColors.includes(item.colorId as typeof validColors[number])) return null;
      if (!Number.isInteger(item.position) || (item.position as number) < 1 || (item.position as number) > 100) return null;
      if (!Number.isInteger(item.score) || (item.score as number) < 0 || typeof item.isAI !== "boolean") return null;
      if (![item.bonus.point, item.bonus.six, item.bonus.draw].every((v) => typeof v === "boolean")) return null;

      players.push({
        id: index,
        name: item.name.trim().slice(0, 14) || `Petualang ${index + 1}`,
        colorId: item.colorId as Player["colorId"],
        position: item.position as number,
        score: item.score as number,
        bonus: {
          point: item.bonus.point as boolean,
          six: item.bonus.six as boolean,
          draw: item.bonus.draw as boolean,
        },
        isAI: item.isAI,
      });
    }

    if (!Number.isInteger(parsed.current) || (parsed.current as number) < 0 || (parsed.current as number) >= players.length) return null;
    if (!Array.isArray(parsed.deck)) return null;
    const deck = [...new Set(parsed.deck.filter(
      (value): value is number => typeof value === "number" && Number.isInteger(value) && value >= 0 && value < QUESTIONS.length,
    ))].slice(0, QUESTIONS.length);

    return {
      players,
      current: parsed.current as number,
      deck,
      timerOn: typeof parsed.timerOn === "boolean" ? parsed.timerOn : true,
      savedAt: typeof parsed.savedAt === "number" && Number.isFinite(parsed.savedAt) ? parsed.savedAt : Date.now(),
    };
  } catch {
    return null;
  }
}
