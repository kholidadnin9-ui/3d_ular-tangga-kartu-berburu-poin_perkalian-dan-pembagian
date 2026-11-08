import { Play, History, HelpCircle, Volume2, VolumeX, Star, MoonStar, Lightbulb } from "lucide-react";
import { audio } from "../game/audio";

export default function MainMenu({
  hasSave,
  onPlay,
  onContinue,
  onGuide,
  onFacts,
  muted,
  onToggleMute,
}: {
  hasSave: boolean;
  onPlay: () => void;
  onContinue: () => void;
  onGuide: () => void;
  onFacts: () => void;
  muted: boolean;
  onToggleMute: () => void;
}) {
  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center bg-gradient-to-b from-[#0a3242]/55 via-transparent to-[#08303f]/80 p-4">
      {/* sound button */}
      <button
        onClick={() => { audio.sfx("click"); onToggleMute(); }}
        className="pointer-events-auto absolute right-4 top-4 rounded-full border-2 border-amber-300/60 bg-[#0d4a5f]/80 p-3 text-amber-200 shadow-lg backdrop-blur transition hover:scale-110"
        aria-label="Pengaturan suara"
      >
        {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
      </button>

      <div className="anim-pop-in flex max-w-xl flex-col items-center text-center">
        <div className="anim-floaty mb-3 flex h-20 w-20 items-center justify-center rounded-full border-4 border-amber-300 bg-gradient-to-br from-[#0e7490] to-[#155e75] shadow-[0_0_40px_rgba(246,201,69,0.5)]">
          <MoonStar size={40} className="text-amber-300" />
        </div>
        <p className="font-arab mb-1 text-lg tracking-widest text-amber-200/90">بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ</p>
        <h1 className="text-shimmer font-display text-4xl font-extrabold leading-tight drop-shadow-lg sm:text-6xl">
          JEJAK PERADABAN
        </h1>
        <h1 className="text-shimmer font-display -mt-1 text-5xl font-extrabold drop-shadow-lg sm:text-7xl">ISLAM</h1>
        <p className="anim-pop-in mt-1.5 inline-flex items-center rounded-full border border-amber-200/70 bg-[#072330]/95 px-4 py-1 text-[11px] font-extrabold tracking-[0.14em] text-amber-100 shadow-[0_2px_14px_rgba(0,0,0,0.55)] backdrop-blur-sm sm:text-xs [text-shadow:0_1px_2px_rgba(0,0,0,0.8)]">
          created by: widodo guru sd
        </p>
        <div className="mt-2 flex items-center gap-2 rounded-full border border-amber-300/50 bg-[#0d4a5f]/70 px-4 py-1.5 text-sm font-bold text-amber-100 backdrop-blur">
          <Star size={14} className="text-amber-300" />
          Petualangan Ular Tangga 3D — Kartu Berburu Poin
          <Star size={14} className="text-amber-300" />
        </div>

        <div className="pointer-events-auto mt-7 flex w-full max-w-xs flex-col gap-3">
          <button
            onClick={() => { audio.sfx("click"); onPlay(); }}
            className="anim-glow group flex items-center justify-center gap-2 rounded-2xl border-b-4 border-amber-600 bg-gradient-to-b from-amber-300 to-amber-500 px-6 py-4 text-lg font-extrabold text-amber-950 shadow-xl transition hover:brightness-110 active:translate-y-0.5"
          >
            <Play size={22} className="transition group-hover:scale-125" />
            MULAI PETUALANGAN
          </button>
          {hasSave && (
            <button
              onClick={() => { audio.sfx("click"); onContinue(); }}
              className="flex items-center justify-center gap-2 rounded-2xl border-b-4 border-emerald-700 bg-gradient-to-b from-emerald-400 to-emerald-600 px-6 py-3.5 font-extrabold text-emerald-950 shadow-lg transition hover:brightness-110 active:translate-y-0.5"
            >
              <History size={20} /> LANJUTKAN PERMAINAN
            </button>
          )}
          <button
            onClick={() => { audio.sfx("click"); onFacts(); }}
            className="flex items-center justify-center gap-2 rounded-2xl border-2 border-amber-300/60 bg-[#8a5a06]/85 px-6 py-3 font-bold text-amber-100 shadow-lg backdrop-blur transition hover:bg-[#a06c09] active:translate-y-0.5"
          >
            <Lightbulb size={20} className="text-amber-300" /> TAHUKAH ANTUM?
          </button>
          <button
            onClick={() => { audio.sfx("click"); onGuide(); }}
            className="flex items-center justify-center gap-2 rounded-2xl border-2 border-cyan-300/50 bg-[#0d4a5f]/85 px-6 py-3 font-bold text-cyan-100 shadow-lg backdrop-blur transition hover:bg-[#14607a] active:translate-y-0.5"
          >
            <HelpCircle size={20} /> PANDUAN BERMAIN
          </button>
        </div>

        <p className="mt-6 text-xs font-semibold tracking-wide text-cyan-100/70">
          Game edukasi sejarah & matematika untuk anak SD — 100 petak, 20 soal, 4 robot petualang
        </p>
      </div>
    </div>
  );
}
