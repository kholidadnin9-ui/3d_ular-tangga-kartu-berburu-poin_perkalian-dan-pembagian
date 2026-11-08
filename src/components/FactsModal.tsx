import { useEffect, useMemo, useState } from "react";
import { X, ChevronLeft, ChevronRight, Shuffle, BookOpen, MapPin, Clock, Quote } from "lucide-react";
import { audio } from "../game/audio";
import { FACT_CATEGORIES, ISLAMIC_FACTS } from "../game/facts";
import type { FactCategory } from "../game/facts";

const CATEGORY_LABEL: Record<FactCategory, string> = {
  sejarah: "Sejarah Ilmu",
  ilmuwan: "Ilmuwan Muslim",
  penemuan: "Penemuan & Teknologi",
  seni: "Seni & Arsitektur",
  geografi: "Penjelajahan",
};

const CATEGORY_TINT: Record<FactCategory, string> = {
  sejarah: "bg-emerald-500/25 text-emerald-100 border-emerald-300/40",
  ilmuwan: "bg-sky-500/25 text-sky-100 border-sky-300/40",
  penemuan: "bg-violet-500/25 text-violet-100 border-violet-300/40",
  seni: "bg-rose-500/25 text-rose-100 border-rose-300/40",
  geografi: "bg-amber-500/25 text-amber-100 border-amber-300/40",
};

/** Ornamen bintang 8 sudut khas seni Islam */
function StarOrnament({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M50 2 58.5 27 83 17 73 41.5 98 50 73 58.5 83 83 58.5 73 50 98 41.5 73 17 83 27 58.5 2 50 27 41.5 17 17 41.5 27 Z"
      />
      <circle cx="50" cy="50" r="13" fill="rgba(255,255,255,0.28)" />
    </svg>
  );
}

export default function FactsModal({ onClose }: { onClose: () => void }) {
  const [cat, setCat] = useState<FactCategory | "semua">("semua");
  const [idx, setIdx] = useState(0);

  const list = useMemo(
    () => (cat === "semua" ? ISLAMIC_FACTS : ISLAMIC_FACTS.filter((f) => f.category === cat)),
    [cat]
  );
  const fact = list[Math.min(idx, Math.max(0, list.length - 1))];

  const go = (step: number) => {
    setIdx((i) => (i + step + list.length) % list.length);
    audio.sfx("click");
  };

  const random = () => {
    if (list.length < 2) return;
    let n = Math.floor(Math.random() * list.length);
    if (n === idx) n = (n + 1) % list.length;
    setIdx(n);
    audio.sfx("flip");
  };

  useEffect(() => setIdx(0), [cat]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list.length]);

  return (
    <div
      className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Tahukah Antum"
    >
      <div className="absolute inset-0 bg-[#082b38]/75 backdrop-blur-sm" onClick={onClose} />
      <div className="anim-pop-in relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border-4 border-amber-300/80 bg-gradient-to-b from-[#0f5066] to-[#0a3242] shadow-2xl">
        {/* header */}
        <div className="relative flex items-center gap-3 border-b-2 border-amber-300/25 px-5 py-4">
          <StarOrnament className="h-9 w-9 shrink-0 text-amber-300/80 anim-spin-slow" />
          <div className="min-w-0 flex-1">
            <h3 className="text-xl font-extrabold leading-tight text-white sm:text-2xl">Tahukah Antum?</h3>
            <p className="flex flex-wrap items-center gap-x-2 text-xs font-bold text-amber-200/85">
              <span className="font-arab text-base leading-none">هل تعلم؟</span>
              <span>{ISLAMIC_FACTS.length} fakta nyata dari sejarah peradaban Islam</span>
            </p>
          </div>
          <button
            onClick={() => { audio.sfx("click"); onClose(); }}
            className="rounded-full bg-white/10 p-2 text-white transition hover:bg-white/25"
            aria-label="Tutup"
          >
            <X size={18} />
          </button>
        </div>

        {/* kategori */}
        <div className="flex gap-2 overflow-x-auto px-4 pt-3 pb-1">
          {FACT_CATEGORIES.map((c) => {
            const active = cat === c.id;
            return (
              <button
                key={c.id}
                onClick={() => { setCat(c.id); audio.sfx("click"); }}
                aria-pressed={active}
                className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-extrabold transition ${
                  active
                    ? "border-amber-300 bg-amber-300 text-amber-950"
                    : "border-white/15 bg-white/8 text-cyan-100 hover:bg-white/18"
                }`}
              >
                <span aria-hidden="true">{c.emoji}</span>
                {c.label}
              </button>
            );
          })}
        </div>

        {/* isi fakta */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {fact ? (
            <article key={fact.id} className="anim-toast rounded-2xl border-2 border-amber-300/30 bg-white/8 p-4 sm:p-5">
              <div className="mb-2.5 flex flex-wrap items-center gap-2">
                <span className={`rounded-full border px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider ${CATEGORY_TINT[fact.category]}`}>
                  {CATEGORY_LABEL[fact.category]}
                </span>
                <span className="flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold text-cyan-100">
                  <Clock size={11} /> {fact.period}
                </span>
                <span className="flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold text-cyan-100">
                  <MapPin size={11} /> {fact.place}
                </span>
              </div>

              <h4 className="text-2xl font-extrabold leading-snug text-amber-200 sm:text-3xl">{fact.title}</h4>

              <div className="mt-2.5 flex items-start gap-2 text-[15px] leading-relaxed text-cyan-50/95">
                <Quote size={18} className="mt-1 shrink-0 text-amber-300/70" />
                <p>{fact.body}</p>
              </div>

              <div className="mt-4 rounded-xl border border-amber-300/25 bg-amber-300/10 p-3">
                <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-amber-200">
                  <BookOpen size={13} /> Referensi
                </p>
                <ul className="space-y-1">
                  {fact.sources.map((s, i) => (
                    <li key={i} className="flex gap-1.5 text-xs leading-snug text-amber-50/90">
                      <span className="text-amber-300">•</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ) : (
            <div className="flex h-full min-h-[180px] flex-col items-center justify-center text-center text-cyan-100/70">
              <BookOpen size={34} className="mb-2 text-amber-300/60" />
              <p className="font-bold">Belum ada fakta pada kategori ini.</p>
              <p className="text-sm">Coba pilih kategori lain ya.</p>
            </div>
          )}
        </div>

        {/* footer navigasi */}
        <div className="flex items-center justify-between gap-2 border-t-2 border-amber-300/25 px-4 py-3">
          <button
            onClick={() => go(-1)}
            disabled={list.length < 2}
            className="flex items-center gap-1 rounded-2xl border-b-4 border-[#0a3140] bg-[#114d63] px-3.5 py-2.5 text-sm font-extrabold text-cyan-100 shadow-lg transition hover:bg-[#17617c] active:translate-y-0.5 disabled:opacity-40"
          >
            <ChevronLeft size={17} /> Sebelumnya
          </button>

          <button
            onClick={random}
            disabled={list.length < 2}
            className="flex items-center gap-1.5 rounded-2xl border-b-4 border-amber-600 bg-gradient-to-b from-amber-300 to-amber-500 px-3.5 py-2.5 text-sm font-extrabold text-amber-950 shadow-lg transition hover:brightness-110 active:translate-y-0.5 disabled:opacity-40"
          >
            <Shuffle size={16} /> Acak
          </button>

          <p className="min-w-14 text-center text-xs font-extrabold text-amber-200/80">
            {list.length ? `${Math.min(idx + 1, list.length)} / ${list.length}` : "0 / 0"}
          </p>

          <button
            onClick={() => go(1)}
            disabled={list.length < 2}
            className="flex items-center gap-1 rounded-2xl border-b-4 border-[#0a3140] bg-[#114d63] px-3.5 py-2.5 text-sm font-extrabold text-cyan-100 shadow-lg transition hover:bg-[#17617c] active:translate-y-0.5 disabled:opacity-40"
          >
            Berikutnya <ChevronRight size={17} />
          </button>
        </div>
        <p className="bg-[#0a3242]/80 px-4 pb-2.5 text-center text-[10px] font-semibold text-cyan-100/55">
          Fakta disusun dari jurnal, buku akademik, dan ensiklopedia terpercaya — lihat bagian Referensi di setiap kartu
        </p>
      </div>
    </div>
  );
}
