import { useEffect, useRef } from "react";
import { Trophy, Play, Eye, Home, Crown, Sparkles, Coins, Footprints, RefreshCw } from "lucide-react";
import { audio } from "../game/audio";
import { ROBOT_COLORS } from "../game/constants";
import type { Player } from "../game/constants";
import RobotIcon from "./RobotIcon";

const FW_COLORS = ["#f6c945", "#2fd08a", "#38a5f8", "#f472b6", "#a78bfa", "#ff7a5c"];

export default function VictoryScreen({
  players,
  winnerIdx,
  onRestart,
  onViewBoard,
  onMenu,
}: {
  players: Player[];
  winnerIdx: number;
  onRestart: () => void;
  onViewBoard: () => void;
  onMenu: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const winner = players[winnerIdx];
  const sorted = [...players].sort((a, b) => {
    if (a.id === winner.id) return -1;
    if (b.id === winner.id) return 1;
    return b.score - a.score || b.position - a.position;
  });

  useEffect(() => {
    const cvs = canvasRef.current!;
    const ctx = cvs.getContext("2d")!;
    let raf = 0;
    const parts: { x: number; y: number; vx: number; vy: number; life: number; max: number; c: string; r: number }[] = [];
    const resize = () => {
      cvs.width = window.innerWidth;
      cvs.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const launch = () => {
      const cx = Math.random() * cvs.width;
      const cy = cvs.height * (0.15 + Math.random() * 0.4);
      const col = FW_COLORS[Math.floor(Math.random() * FW_COLORS.length)];
      for (let i = 0; i < 44; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = 1.4 + Math.random() * 3.6;
        parts.push({ x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1.4 + Math.random() * 0.7, max: 2, c: col, r: 1.6 + Math.random() * 2.2 });
      }
    };
    launch();
    const launcher = setInterval(launch, 700);

    let last = performance.now();
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const now = performance.now();
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      ctx.clearRect(0, 0, cvs.width, cvs.height);
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.life -= dt;
        p.vy += 2.4 * dt;
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.99;
        p.vy *= 0.99;
        if (p.life <= 0) {
          parts.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = Math.max(0, p.life / p.max) * 1.4;
        ctx.fillStyle = p.c;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };
    tick();
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(launcher);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className="absolute inset-0 z-30 overflow-y-auto">
      <canvas ref={canvasRef} className="pointer-events-none fixed inset-0" />
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-b from-[#0a3242]/70 via-[#0a3242]/40 to-[#06242f]/85" />
      <div className="relative z-10 mx-auto flex min-h-full w-full max-w-xl flex-col items-center px-4 py-8">
        <div className="anim-pop-in w-full rounded-3xl border-4 border-amber-300 bg-gradient-to-b from-[#0f5066]/95 to-[#082b38]/95 p-5 shadow-2xl sm:p-7">
          <div className="anim-floaty mx-auto -mt-12 flex h-20 w-20 items-center justify-center rounded-full border-4 border-amber-200 bg-gradient-to-b from-amber-300 to-amber-500 shadow-[0_0_44px_rgba(246,201,69,.65)]">
            <Trophy size={38} className="text-amber-900" />
          </div>
          <h2 className="text-shimmer mt-3 text-center text-3xl font-extrabold sm:text-4xl">SELAMAT!</h2>
          <p className="text-center text-lg font-extrabold text-white">PETUALANGAN SELESAI!</p>
          <p className="mt-1 text-center text-sm font-bold text-cyan-100/85">
            <span className="text-amber-300">{winner.name}</span> mencapai Istana FINISH di petak 100 terlebih dahulu
          </p>

          <div className="mt-4 overflow-hidden rounded-2xl border-2 border-white/10">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-amber-400/15 text-[11px] font-extrabold uppercase tracking-wider text-amber-200">
                  <th className="px-3 py-2">Rank</th>
                  <th className="px-3 py-2">Pemain</th>
                  <th className="px-3 py-2 text-center">Petak</th>
                  <th className="px-3 py-2 text-center">Poin</th>
                  <th className="px-3 py-2 text-center">Bonus Dipakai</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((p, i) => {
                  const def = ROBOT_COLORS.find((r) => r.id === p.colorId)!;
                  const usedCount = (p.bonus.point ? 1 : 0) + (p.bonus.six ? 1 : 0) + (p.bonus.draw ? 1 : 0);
                  return (
                    <tr key={p.id} className={`border-t border-white/8 ${p.id === winner.id ? "bg-amber-400/12" : "bg-white/3"}`}>
                      <td className="px-3 py-2 font-extrabold text-white">
                        <span className="flex items-center gap-1">
                          {i === 0 ? <Crown size={15} className="text-amber-300" /> : <span className="w-4 text-center text-white/60">{i + 1}</span>}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <span className="flex items-center gap-2 font-bold text-white">
                          <RobotIcon accent={def.accentCss} size={22} className="shrink-0 drop-shadow" />
                          <span className="max-w-[110px] truncate">{p.name}</span>
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center font-bold text-cyan-100">{p.position}</td>
                      <td className="px-3 py-2 text-center font-extrabold text-amber-200">{p.score}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          {p.bonus.point && <Coins size={13} className="text-amber-300" />}
                          {p.bonus.six && <Footprints size={13} className="text-emerald-300" />}
                          {p.bonus.draw && <RefreshCw size={13} className="text-sky-300" />}
                          {usedCount === 0 && <span className="text-white/40">-</span>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex items-center justify-center gap-1.5 text-xs font-bold text-amber-200/80">
            <Sparkles size={13} /> Poin adalah penghargaan tambahan — pemenang ditentukan oleh siapa yang tiba di FINISH lebih dulu
          </div>

          <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <button
              onClick={() => { audio.sfx("click"); onRestart(); }}
              className="flex items-center justify-center gap-2 rounded-2xl border-b-4 border-amber-600 bg-gradient-to-b from-amber-300 to-amber-500 py-3 font-extrabold text-amber-950 transition hover:brightness-110 active:translate-y-0.5"
            >
              <Play size={17} /> MAIN LAGI
            </button>
            <button
              onClick={() => { audio.sfx("click"); onViewBoard(); }}
              className="flex items-center justify-center gap-2 rounded-2xl border-b-4 border-emerald-700 bg-gradient-to-b from-emerald-400 to-emerald-600 py-3 font-extrabold text-emerald-950 transition hover:brightness-110 active:translate-y-0.5"
            >
              <Eye size={17} /> LIHAT PAPAN
            </button>
            <button
              onClick={() => { audio.sfx("click"); onMenu(); }}
              className="flex items-center justify-center gap-2 rounded-2xl border-2 border-cyan-300/40 bg-[#114d63] py-3 font-extrabold text-cyan-100 transition hover:bg-[#17617c] active:translate-y-0.5"
            >
              <Home size={17} /> MENU
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
