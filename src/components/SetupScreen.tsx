import { useMemo, useState } from "react";
import { ArrowLeft, Play, Bot, Users, Timer, TimerOff, Eye, Sparkles } from "lucide-react";
import { audio } from "../game/audio";
import { ROBOT_COLORS } from "../game/constants";
import type { RobotColorId } from "../game/constants";
import RobotPreview from "./RobotPreview";
import RobotIcon from "./RobotIcon";

export interface PlayerConfig {
  name: string;
  colorId: RobotColorId;
  isAI: boolean;
}

export default function SetupScreen({
  onStart,
  onBack,
}: {
  onStart: (players: PlayerConfig[], timerOn: boolean) => void;
  onBack: () => void;
}) {
  const [count, setCount] = useState(2);
  const [names, setNames] = useState(["Petualang 1", "Petualang 2", "Petualang 3", "Petualang 4"]);
  const [colors, setColors] = useState<RobotColorId[]>(["gold", "blue", "green", "red"]);
  const [vsAI, setVsAI] = useState(true);
  const [timerOn, setTimerOn] = useState(true);
  const [focusedPlayer, setFocusedPlayer] = useState(0);
  const [poseKey, setPoseKey] = useState(0);

  const effCount = count === 1 && vsAI ? 2 : count;

  const pickColor = (idx: number, c: RobotColorId) => {
    setFocusedPlayer(idx);
    setColors((prev) => {
      const next = [...prev];
      const other = next.indexOf(c);
      if (other !== -1 && other !== idx) next[other] = next[idx];
      next[idx] = c;
      return next;
    });
    audio.sfx("click");
  };

  const roster = useMemo(() => {
    return Array.from({ length: effCount }, (_, i) => ({
      name: i === 1 && count === 1 && vsAI ? "Robot AI" : names[i] || `Petualang ${i + 1}`,
      colorId: colors[i],
      isAI: i === 1 && count === 1 && vsAI,
    }));
  }, [count, vsAI, names, colors, effCount]);

  const focused = Math.min(focusedPlayer, effCount - 1);
  const selectedPlayer = roster[focused];
  const selectedColor = ROBOT_COLORS.find((r) => r.id === selectedPlayer.colorId)!;

  return (
    <div className="absolute inset-0 z-20 overflow-y-auto bg-gradient-to-b from-[#0a3242]/70 via-[#0b3b4d]/60 to-[#08303f]/85 backdrop-blur-[2px]">
      <div className="mx-auto flex min-h-full w-full max-w-4xl flex-col items-center px-4 py-6">
        <div className="anim-pop-in w-full rounded-3xl border-4 border-amber-300/70 bg-gradient-to-b from-[#0f5066]/95 to-[#0b3b4d]/95 p-5 shadow-2xl sm:p-7">
          <h2 className="text-center text-2xl font-extrabold text-white sm:text-3xl">
            Siapkan <span className="text-amber-300">Para Petualang</span>
          </h2>
          <p className="mt-1 text-center text-sm font-semibold text-cyan-100/80">
            Pilih jumlah pemain, nama, dan robot favoritmu
          </p>

          {/* count toggle */}
          <div className="mt-5">
            <p className="mb-2 flex items-center gap-2 text-sm font-extrabold uppercase tracking-wider text-amber-200">
              <Users size={16} /> Jumlah Pemain
            </p>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => { setCount(n); setFocusedPlayer(0); audio.sfx("click"); }}
                  className={`rounded-2xl border-b-4 py-3 text-xl font-extrabold transition active:translate-y-0.5 ${
                    count === n
                      ? "border-amber-600 bg-gradient-to-b from-amber-300 to-amber-500 text-amber-950"
                      : "border-[#0a3140] bg-[#114457] text-cyan-100 hover:bg-[#155a71]"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* AI toggle for solo */}
          {count === 1 && (
            <button
              type="button"
              onClick={() => { setVsAI(!vsAI); setFocusedPlayer(0); audio.sfx("click"); }}
              className={`mt-3 flex w-full items-center justify-between rounded-2xl p-3.5 font-bold transition ${
                vsAI ? "bg-violet-500/25 text-violet-100" : "bg-white/8 text-cyan-100"
              }`}
            >
              <span className="flex items-center gap-2">
                <Bot size={19} /> Lawan Robot AI {vsAI ? "(Aktif)" : "(Main sendiri)"}
              </span>
              <span className={`relative h-7 w-12 rounded-full transition ${vsAI ? "bg-violet-400/80" : "bg-white/20"}`}>
                <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${vsAI ? "left-6" : "left-1"}`} />
              </span>
            </button>
          )}

          {/* timer toggle */}
          <button
            type="button"
            onClick={() => { setTimerOn(!timerOn); audio.sfx("click"); }}
            className={`mt-3 flex w-full items-center justify-between rounded-2xl p-3.5 font-bold transition ${
              timerOn ? "bg-sky-500/25 text-sky-100" : "bg-white/8 text-cyan-100"
            }`}
          >
            <span className="flex items-center gap-2">
              {timerOn ? <Timer size={19} /> : <TimerOff size={19} />} Timer Soal 15 detik {timerOn ? "(Aktif)" : "(Mati)"}
            </span>
            <span className={`relative h-7 w-12 rounded-full transition ${timerOn ? "bg-sky-400/80" : "bg-white/20"}`}>
              <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${timerOn ? "left-6" : "left-1"}`} />
            </span>
          </button>

          {/* daftar pemain + preview robot 3D */}
          <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_290px] lg:items-start">
            <div className="order-2 space-y-3 lg:order-1">
              <p className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wider text-amber-200">
                <Bot size={16} /> Nama & warna robot
              </p>
              {roster.map((p, i) => {
                const def = ROBOT_COLORS.find((r) => r.id === p.colorId)!;
                const isFocused = focused === i;
                return (
                  <div
                    key={i}
                    className={`rounded-2xl border-2 p-3 transition-colors ${
                      isFocused ? "border-amber-300/70 bg-amber-300/10" : "border-white/10 bg-white/6"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {/* ikon robot — bukan lagi kotak warna */}
                      <button
                        type="button"
                        onClick={() => { setFocusedPlayer(i); audio.sfx("click"); }}
                        className="relative shrink-0 rounded-2xl bg-white/10 p-0.5 ring-1 ring-white/30 transition hover:bg-white/20"
                        aria-label={`Lihat preview robot ${p.name}`}
                      >
                        <RobotIcon accent={def.accentCss} size={40} className="-mt-0.5 drop-shadow-md" />
                        {p.isAI && (
                          <span className="absolute -right-1.5 -top-1.5 rounded-full bg-violet-500 px-1.5 py-px text-[8px] font-extrabold text-white shadow">
                            AI
                          </span>
                        )}
                      </button>
                      <input
                        type="text"
                        value={p.isAI ? "Robot AI" : names[i]}
                        maxLength={14}
                        disabled={p.isAI}
                        onFocus={() => setFocusedPlayer(i)}
                        onChange={(e) => {
                          const v = e.target.value;
                          setNames((prev) => prev.map((n, j) => (j === i ? v : n)));
                        }}
                        className="w-full min-w-0 rounded-xl border-2 border-white/15 bg-[#0a3140]/70 px-3 py-2 font-bold text-white outline-none transition placeholder:text-white/40 focus:border-amber-300 disabled:opacity-60"
                        placeholder={`Nama pemain ${i + 1}`}
                        aria-label={`Nama pemain ${i + 1}`}
                      />
                      <button
                        type="button"
                        onClick={() => { setFocusedPlayer(i); audio.sfx("click"); }}
                        className={`flex shrink-0 items-center gap-1 text-xs font-bold transition hover:text-amber-200 ${
                          isFocused ? "text-amber-200" : "text-cyan-200/70"
                        }`}
                        aria-label={`Preview robot pemain ${i + 1}`}
                      >
                        <Eye size={14} /> Preview
                      </button>
                    </div>
                    {/* pilihan warna: ikon kepala robot, bukan kotak */}
                    <div className="mt-2.5 grid grid-cols-4 gap-1.5">
                      {ROBOT_COLORS.map((c) => {
                        const active = p.colorId === c.id;
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => pickColor(i, c.id)}
                            aria-label={`Pilih ${c.label} untuk pemain ${i + 1}`}
                            aria-pressed={active}
                            className={`flex min-w-0 flex-col items-center gap-0.5 rounded-xl border-2 px-1 py-1.5 transition hover:bg-white/10 active:scale-95 ${
                              active
                                ? "border-amber-300 bg-amber-300/15 text-white shadow-[0_0_12px_rgba(246,201,69,0.35)]"
                                : "border-white/10 text-cyan-100/70"
                            }`}
                          >
                            <RobotIcon accent={c.accentCss} size={30} className="drop-shadow" />
                            <span className="text-[10px] font-extrabold leading-none">
                              {c.id === "gold" ? "Emas" : c.id === "blue" ? "Biru" : c.id === "green" ? "Hijau" : "Merah"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* panel preview robot 3D */}
            <div className="order-1 rounded-2xl border-2 border-amber-300/40 bg-[#082f3f]/85 p-3 lg:sticky lg:top-4 lg:order-2">
              <p className="mb-2 flex items-center gap-2 text-sm font-extrabold uppercase tracking-wider text-amber-200">
                <Eye size={16} /> Preview Robot 3D
              </p>
              <div
                className="relative h-[200px] overflow-hidden rounded-xl sm:h-[245px] lg:h-[285px]"
                style={{ background: "radial-gradient(circle at 50% 64%, #247d8e 0%, #0b455a 58%, #082f3f 100%)" }}
              >
                <RobotPreview colorId={selectedPlayer.colorId} poseKey={poseKey} />
                <span className="pointer-events-none absolute bottom-2 left-0 right-0 text-center text-[11px] font-bold text-white/75">
                  Geser robot untuk melihat dari segala sisi
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <RobotIcon accent={selectedColor.accentCss} size={38} className="shrink-0 drop-shadow" />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-cyan-100/70">Untuk {selectedPlayer.name}</p>
                    <p className="truncate text-lg font-extrabold leading-tight" style={{ color: selectedColor.accentCss }}>
                      {selectedColor.label}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setPoseKey((k) => k + 1); audio.sfx("jump"); }}
                  className="flex shrink-0 items-center gap-1 rounded-xl border border-amber-300/50 bg-amber-300/15 px-2.5 py-2 text-xs font-bold text-amber-100 transition hover:bg-amber-300/25"
                >
                  <Sparkles size={14} /> Coba pose
                </button>
              </div>
              <div className="mt-2.5 flex gap-1.5">
                {roster.map((player, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => { setFocusedPlayer(i); audio.sfx("click"); }}
                    aria-label={`Preview robot pemain ${i + 1}: ${player.name}`}
                    aria-pressed={focused === i}
                    className={`flex-1 rounded-lg px-2 py-1 text-xs font-extrabold transition ${
                      focused === i ? "bg-amber-300 text-amber-950" : "bg-white/10 text-cyan-100 hover:bg-white/20"
                    }`}
                  >
                    P{i + 1}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* actions */}
          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={() => { audio.sfx("click"); onBack(); }}
              className="flex items-center gap-2 rounded-2xl border-2 border-cyan-300/40 bg-[#114457] px-5 py-3.5 font-extrabold text-cyan-100 transition hover:bg-[#155a71] active:translate-y-0.5"
            >
              <ArrowLeft size={18} /> KEMBALI
            </button>
            <button
              type="button"
              onClick={() => { audio.sfx("win"); onStart(roster, timerOn); }}
              className="anim-glow flex flex-1 items-center justify-center gap-2 rounded-2xl border-b-4 border-amber-600 bg-gradient-to-b from-amber-300 to-amber-500 px-5 py-3.5 text-lg font-extrabold text-amber-950 shadow-xl transition hover:brightness-110 active:translate-y-0.5"
            >
              <Play size={20} /> MULAI PETUALANGAN
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
