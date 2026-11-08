import { useEffect, useMemo, useRef, useState } from "react";
import {
  Star, Ban, HelpCircle, Volume2, VolumeX, Home, RotateCcw,
  ArrowDownToDot, Bot, Sparkles, Coins, Footprints, RefreshCw,
  Crown, Check, X as XIcon, BrainCircuit, Lightbulb,
} from "lucide-react";
import { audio } from "../game/audio";
import { ROBOT_COLORS } from "../game/constants";
import type { BonusKey, CardKind, Player, Question } from "../game/constants";
import { BonusIcons } from "./Modals";
import RobotIcon from "./RobotIcon";

export interface Toast { id: number; text: string; tone: "info" | "good" | "bad" }
export interface Banner { title: string; sub: string; tone: "bad" | "good" }
export interface QuestionView { id: number; q: Question; tile: number; auto?: boolean }

// ================= DOM 3D Card =================
function FlipCard({ kind, ukey }: { kind: CardKind | null; ukey: number }) {
  const [flipped, setFlipped] = useState(false);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (kind !== null) {
      setVisible(true);
      setFlipped(false);
      const t1 = setTimeout(() => setFlipped(true), 420);
      return () => clearTimeout(t1);
    }
    const t = setTimeout(() => setVisible(false), 250);
    setFlipped(false);
    return () => clearTimeout(t);
  }, [kind, ukey]);

  if (!visible && kind === null) return null;

  const front = (
    <div
      className={`flex h-full w-full flex-col items-center justify-center border-4 p-2 ${
        kind === "star"
          ? "border-amber-200 bg-gradient-to-b from-amber-300 to-amber-500"
          : kind === "zonk"
            ? "border-violet-300 bg-gradient-to-b from-violet-500 to-purple-800"
            : "border-amber-400 bg-gradient-to-b from-[#fef9e7] to-[#d9f4f1]"
      } rounded-[1.2rem]`}
    >
      {kind === "star" ? (
        <>
          <Star size={84} className="fill-amber-100 text-amber-100 drop-shadow-[0_2px_6px_rgba(120,53,15,.5)]" strokeWidth={1.4} />
          <p className="mt-1 text-xl font-extrabold tracking-wide text-amber-950">KARTU BINTANG</p>
          <p className="text-xs font-bold text-amber-900/80">Pilih satu bonus!</p>
        </>
      ) : kind === "zonk" ? (
        <>
          <Ban size={84} className="text-amber-300 drop-shadow" strokeWidth={2.4} />
          <p className="mt-1 text-2xl font-extrabold tracking-wide text-amber-200">ZONK!</p>
          <p className="text-xs font-bold text-violet-200/90">Tidak bisa bergerak</p>
        </>
      ) : (
        <>
          <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-amber-400 bg-gradient-to-b from-[#0e7490] to-[#155e75] shadow-inner">
            <span className="text-7xl font-extrabold text-amber-100 drop-shadow">{kind}</span>
          </div>
          <p className="mt-2 text-xl font-extrabold tracking-wide text-[#155e75]">{kind} LANGKAH</p>
          <div className="mt-1 flex gap-1">
            {Array.from({ length: Number(kind) }).map((_, i) => (
              <Footprints key={i} size={13} className="text-teal-600" />
            ))}
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center">
      <div className="flip-stage">
        <div
          className={`anim-pop-in h-[290px] w-[205px] sm:h-[330px] sm:w-[232px] ${kind === null ? "scale-75 opacity-0 transition-all duration-200" : ""}`}
        >
          <div className={`flip-inner h-full w-full ${flipped ? "flipped" : ""}`}>
            <div className="flip-face flip-back card-pattern border-4 border-amber-400 shadow-2xl">
              <div className="flex h-full w-full items-center justify-center">
                <div className="star8 h-28 w-28 border-2 border-amber-200/70 shadow-inner" />
              </div>
            </div>
            <div className="flip-face flip-front shadow-2xl">{front}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ================= Question modal =================
function QuestionModal({
  view, timerOn, onResolve,
}: {
  view: QuestionView;
  timerOn: boolean;
  onResolve: (correct: boolean) => void;
}) {
  const opts = useMemo(() => {
    const arr = [...view.q.options];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [view]);
  const [picked, setPicked] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(15);
  const doneRef = useRef(false);
  const resolveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => {
    if (resolveTimerRef.current !== null) clearTimeout(resolveTimerRef.current);
    if (countdownRef.current !== null) clearInterval(countdownRef.current);
  }, []);

  // AI auto-answers after thinking a moment (55% benar supaya menantang)
  useEffect(() => {
    if (!view.auto || doneRef.current) return;
    const t = setTimeout(() => {
      if (doneRef.current) return;
      const idxCorrect = opts.indexOf(view.q.answer);
      const smart = Math.random() < 0.55;
      const idx = smart ? idxCorrect : Math.floor(Math.random() * opts.length);
      pick(idx);
    }, 1700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, opts]);

  useEffect(() => {
    if (!timerOn || view.auto) return;
    countdownRef.current = setInterval(() => {
      setTimeLeft((remaining) => Math.max(0, remaining - 0.1));
    }, 100);
    return () => {
      if (countdownRef.current !== null) clearInterval(countdownRef.current);
      countdownRef.current = null;
    };
  }, [timerOn, view.auto]);

  useEffect(() => {
    if (timeLeft > 0 || !timerOn || view.auto || doneRef.current) return;
    doneRef.current = true;
    if (countdownRef.current !== null) clearInterval(countdownRef.current);
    countdownRef.current = null;
    audio.sfx("wrong");
    setPicked(-1);
    resolveTimerRef.current = setTimeout(() => onResolve(false), 1200);
  }, [timeLeft, timerOn, view.auto, onResolve]);

  function pick(idx: number) {
    if (doneRef.current) return;
    doneRef.current = true;
    setPicked(idx);
    const correct = opts[idx] === view.q.answer;
    audio.sfx(correct ? "correct" : "wrong");
    resolveTimerRef.current = setTimeout(() => onResolve(correct), 1400);
  }

  return (
    <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Soal matematika">
      <div className="absolute inset-0 bg-[#2a1259]/55 backdrop-blur-[2px]" />
      <div className="anim-pop-in relative w-full max-w-md rounded-3xl border-4 border-violet-300/80 bg-gradient-to-b from-[#4c1d95] to-[#2e1065] p-5 shadow-2xl sm:p-6">
        <div className="mb-2 flex items-center justify-between">
          <span className="flex items-center gap-2 rounded-full bg-violet-400/25 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-violet-100">
            <BrainCircuit size={14} /> Petak Soal #{view.tile}
          </span>
          {timerOn && (
            <span className={`rounded-full px-3 py-1 text-sm font-extrabold ${timeLeft <= 5 ? "bg-rose-500/40 text-rose-100" : "bg-white/15 text-white"}`}>
              {Math.ceil(timeLeft)}s
            </span>
          )}
        </div>
        {timerOn && (
          <div className="mb-3 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className={`h-full rounded-full transition-all duration-100 ${timeLeft <= 5 ? "bg-rose-400" : "bg-amber-300"}`}
              style={{ width: `${(timeLeft / 15) * 100}%` }}
            />
          </div>
        )}
        <p className="text-center text-sm font-bold text-violet-200">
          {view.auto ? "Robot AI sedang menjawab…" : "Jawab soal ini untuk +5 POIN!"}
        </p>
        <p className="my-4 text-center text-5xl font-extrabold tracking-wide text-white drop-shadow-lg sm:text-6xl">
          {view.q.q}
        </p>
        <div className="grid grid-cols-3 gap-2.5">
          {opts.map((o, i) => {
            const isCorrect = o === view.q.answer;
            const isPicked = picked === i;
            let cls = "border-[#7c3aed] bg-violet-400/25 text-white hover:bg-violet-400/45";
            if (picked !== null) {
              if (isCorrect) cls = "border-emerald-300 bg-emerald-400 text-emerald-950";
              else if (isPicked) cls = "border-rose-300 bg-rose-500 text-white";
              else cls = "border-[#7c3aed] bg-violet-400/15 text-white/40";
            }
            return (
              <button
                key={i}
                type="button"
                disabled={picked !== null || view.auto}
                onClick={() => pick(i)}
                aria-label={`Jawaban ${String.fromCharCode(65 + i)}: ${o}`}
                className={`relative touch-manipulation rounded-2xl border-b-4 py-4 text-3xl font-extrabold transition active:translate-y-0.5 disabled:cursor-default ${cls}`}
              >
                {o}
                {picked !== null && isCorrect && <Check size={18} className="absolute right-1.5 top-1.5" />}
                {picked !== null && isPicked && !isCorrect && <XIcon size={18} className="absolute right-1.5 top-1.5" />}
              </button>
            );
          })}
        </div>
        {picked !== null && (
          <p className={`anim-toast mt-3 text-center text-lg font-extrabold ${picked >= 0 && opts[picked] === view.q.answer ? "text-emerald-300" : "text-rose-300"}`}>
            {picked >= 0 && opts[picked] === view.q.answer ? "BENAR! +5 POIN" : picked === -1 ? "WAKTU HABIS!" : "COBA LAGI YA!"}
          </p>
        )}
      </div>
    </div>
  );
}

// ================= Star bonus modal =================
function BonusModal({ player, onPick }: { player: Player; onPick: (k: BonusKey) => void }) {
  const items: { k: BonusKey; icon: React.ReactNode; title: string; desc: string }[] = [
    { k: "point", icon: <Coins size={26} />, title: "BONUS A", desc: "Tambah +10 POIN" },
    { k: "six", icon: <Footprints size={26} />, title: "BONUS B", desc: "Maju 6 LANGKAH" },
    { k: "draw", icon: <RefreshCw size={26} />, title: "BONUS C", desc: "ACAK KARTU 1x" },
  ];
  return (
    <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Pilih bonus bintang">
      <div className="absolute inset-0 bg-[#3d2a04]/60 backdrop-blur-[2px]" />
      <div className="anim-pop-in relative w-full max-w-lg rounded-3xl border-4 border-amber-300 bg-gradient-to-b from-[#8a5a06] to-[#5c3c04] p-5 shadow-2xl sm:p-6">
        <div className="mb-1 flex items-center justify-center gap-2">
          <Star size={30} className="fill-amber-200 text-amber-200" />
          <h3 className="text-2xl font-extrabold text-amber-100">KARTU BINTANG!</h3>
          <Star size={30} className="fill-amber-200 text-amber-200" />
        </div>
        <p className="mb-4 text-center text-sm font-bold text-amber-200/90">
          {player.name}, pilih SATU bonus (tiap bonus hanya bisa dipakai sekali)
        </p>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          {items.map((it) => {
            const used = player.bonus[it.k];
            return (
              <button
                key={it.k}
                type="button"
                disabled={used}
                onClick={() => { audio.sfx("star"); onPick(it.k); }}
                className={`flex flex-col items-center gap-1.5 rounded-2xl border-b-4 p-4 transition active:translate-y-0.5 ${
                  used
                    ? "cursor-not-allowed border-white/10 bg-white/10 text-white/35"
                    : "border-amber-600 bg-gradient-to-b from-amber-200 to-amber-400 text-amber-950 hover:brightness-110"
                }`}
              >
                {it.icon}
                <span className="text-sm font-extrabold tracking-wide">{it.title}</span>
                <span className="text-xs font-bold">{it.desc}</span>
                <span className={`mt-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase ${used ? "bg-white/10" : "bg-emerald-500/90 text-white"}`}>
                  {used ? "Sudah digunakan" : "Tersedia"}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ================= HUD =================
export default function GameScreen(props: {
  players: Player[];
  current: number;
  busy: boolean;
  canDraw: boolean;
  questionOpen: boolean;
  bonusOpen: boolean;
  cardView: CardKind | null;
  cardKey: number;
  banner: Banner | null;
  toasts: Toast[];
  question: QuestionView | null;
  timerOn: boolean;
  muted: boolean;
  onDraw: () => void;
  onAnswer: (correct: boolean) => void;
  onPickBonus: (k: BonusKey) => void;
  onResetCam: () => void;
  onTopView: () => void;
  onHelp: () => void;
  onFacts: () => void;
  onToggleMute: () => void;
  onQuit: () => void;
}) {
  const { players, current } = props;
  const cur = players[current];

  const PlayerCard = ({ p, i }: { p: Player; i: number }) => {
    const def = ROBOT_COLORS.find((r) => r.id === p.colorId)!;
    const active = i === current;
    return (
      <div
        className={`relative shrink-0 rounded-2xl border-2 p-2.5 transition sm:p-3 ${
          active ? "border-amber-300 bg-[#0f5066]/95 shadow-[0_0_18px_rgba(246,201,69,.35)]" : "border-white/10 bg-[#0b3b4d]/85"
        } min-w-[168px] sm:min-w-0`}
      >
        {active && (
          <span className="absolute -top-2.5 left-3 flex items-center gap-1 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-extrabold uppercase text-amber-950">
            <Crown size={10} /> Giliran
          </span>
        )}
        <div className="flex items-center gap-2">
          <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/30">
            <RobotIcon accent={def.accentCss} size={38} className="-mt-0.5 drop-shadow" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1 text-sm font-extrabold leading-tight text-white">
              <span className="truncate">{p.name}</span>
              {p.isAI && (
                <span className="rounded bg-violet-400/40 px-1 py-px text-[8px] font-extrabold text-violet-100">AI</span>
              )}
            </p>
            <p className="flex items-center gap-1 text-[10px] font-bold" style={{ color: def.accentCss }}>
              <Bot size={10} /> {def.label}
            </p>
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs font-bold">
          <span className="rounded-lg bg-white/10 px-1.5 py-0.5 text-cyan-100">Petak {p.position}</span>
          <span className="flex items-center gap-1 rounded-lg bg-amber-400/20 px-1.5 py-0.5 text-amber-200">
            <Sparkles size={11} /> {p.score}
          </span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${p.position}%`, background: def.accentCss }} />
        </div>
        <div className="mt-1.5">
          <BonusIcons bonus={p.bonus} />
        </div>
      </div>
    );
  };

  const iconBtn =
    "flex h-10 w-10 items-center justify-center rounded-2xl border-b-4 border-[#0a3140] bg-[#114d63] text-cyan-100 shadow-lg transition hover:bg-[#17617c] active:translate-y-0.5 disabled:opacity-50 sm:h-11 sm:w-11";

  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      {/* ===== Sidebar / top strip ===== */}
      <div className="pointer-events-auto absolute left-0 right-0 top-0 flex gap-2 overflow-x-auto p-2 sm:left-auto sm:right-2 sm:top-2 sm:max-h-[calc(100%-120px)] sm:w-[248px] sm:flex-col sm:overflow-y-auto sm:overflow-x-visible sm:p-0">
        {players.map((p, i) => (
          <PlayerCard key={p.id} p={p} i={i} />
        ))}
      </div>

      {/* ===== Toasts ===== */}
      <div className="absolute left-1/2 top-[86px] flex -translate-x-1/2 flex-col items-center gap-1.5 sm:top-3">
        {props.toasts.map((t) => (
          <div
            key={t.id}
            className={`anim-toast whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-extrabold shadow-lg ${
              t.tone === "good"
                ? "border-emerald-300 bg-emerald-500/95 text-white"
                : t.tone === "bad"
                  ? "border-rose-300 bg-rose-500/95 text-white"
                  : "border-cyan-300 bg-[#0e7490]/95 text-white"
            }`}
          >
            {t.text}
          </div>
        ))}
      </div>

      {/* ===== Banner (ZONK / blocked etc) ===== */}
      {props.banner && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className={`anim-banner rounded-3xl border-4 px-8 py-5 text-center shadow-2xl ${
              props.banner.tone === "bad"
                ? "border-rose-300 bg-gradient-to-b from-rose-500 to-rose-700"
                : "border-emerald-300 bg-gradient-to-b from-emerald-500 to-emerald-700"
            }`}
          >
            <p className="text-4xl font-extrabold tracking-wide text-white drop-shadow sm:text-5xl">{props.banner.title}</p>
            <p className="mt-1 text-sm font-bold text-white/85">{props.banner.sub}</p>
          </div>
        </div>
      )}

      {/* ===== Bottom control deck ===== */}
      <div className="pointer-events-auto absolute bottom-0 left-0 right-0 flex flex-col items-center gap-2 bg-gradient-to-t from-[#06242f]/95 via-[#06242f]/60 to-transparent px-3 pb-3 pt-10 sm:pb-4">
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          {/* utility buttons */}
          <button onClick={() => { audio.sfx("click"); props.onQuit(); }} className={iconBtn} title="Menu utama"><Home size={19} /></button>
          <button onClick={() => { audio.sfx("click"); props.onResetCam(); }} className={iconBtn} title="Reset kamera"><RotateCcw size={19} /></button>
          <button onClick={() => { audio.sfx("click"); props.onTopView(); }} className={iconBtn} title="Tampilan atas"><ArrowDownToDot size={19} /></button>

          {/* draw button */}
          <button
            onClick={props.onDraw}
            disabled={!props.canDraw}
            className={`group relative flex h-[76px] min-w-[200px] flex-col items-center justify-center rounded-3xl border-b-[6px] px-6 shadow-2xl transition sm:min-w-[240px] ${
              props.canDraw
                ? "anim-glow border-amber-600 bg-gradient-to-b from-amber-300 to-amber-500 text-amber-950 hover:brightness-110 active:translate-y-1"
                : "cursor-not-allowed border-[#2a4550] bg-[#23414d] text-white/50"
            }`}
          >
            <span className="text-xl font-extrabold leading-none sm:text-2xl">AMBIL KARTU</span>
            <span className={`mt-1 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider ${props.canDraw ? "text-amber-900/80" : "text-white/40"}`}>
              {cur?.isAI ? (
                <><Bot size={12} /> {cur.name} berpikir…</>
              ) : (
                <>Giliran: {cur?.name}</>
              )}
            </span>
          </button>

          <button onClick={() => { audio.sfx("click"); props.onFacts(); }} className={iconBtn} title="Tahukah Antum?"><Lightbulb size={19} /></button>
          <button onClick={() => { audio.sfx("click"); props.onHelp(); }} className={iconBtn} title="Panduan"><HelpCircle size={19} /></button>
          <button
            onClick={() => { audio.sfx("click"); props.onToggleMute(); }}
            className={iconBtn}
            title="Suara"
          >
            {props.muted ? <VolumeX size={19} /> : <Volume2 size={19} />}
          </button>
        </div>
        <p className="text-center text-[10px] font-bold text-cyan-100/50">
          Seret untuk memutar papan • Scroll / cubit untuk zoom • Papan tersusun 10×10 zig-zag
        </p>
      </div>

      {/* ===== overlays ===== */}
      <FlipCard kind={props.cardView} ukey={props.cardKey} />
      {props.question && <QuestionModal key={props.question.id} view={props.question} timerOn={props.timerOn} onResolve={props.onAnswer} />}
      {props.bonusOpen && cur && <BonusModal player={cur} onPick={props.onPickBonus} />}
    </div>
  );
}
