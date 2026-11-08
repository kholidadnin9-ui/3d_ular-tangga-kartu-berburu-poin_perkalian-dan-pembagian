import { useEffect, useState } from "react";
import {
  X, Star, HelpCircle, Volume2, VolumeX, Music, Sparkles,
  MousePointer2, RotateCcw, ArrowUpFromLine, CircleHelp as Q,
  Coins, Footprints, RefreshCw, Trophy, Camera,
} from "lucide-react";
import { audio } from "../game/audio";
import { SETTINGS_KEY } from "../game/constants";

const clampVolume = (value: unknown, fallback: number) =>
  typeof value === "number" && Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : fallback;

export function loadAudioSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      const settings = typeof parsed === "object" && parsed !== null ? parsed as Record<string, unknown> : {};
      audio.muted = settings.m === true;
      audio.volume = clampVolume(settings.v, 0.9);
      audio.musicVolume = clampVolume(settings.mv, 0.35);
      return { muted: audio.muted, volume: audio.volume, music: audio.musicVolume };
    }
  } catch { /* storage may be unavailable or contain invalid data */ }
  audio.muted = false;
  audio.volume = 0.9;
  audio.musicVolume = 0.35;
  return { muted: false, volume: 0.9, music: 0.35 };
}

function saveAudioSettings() {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ m: audio.muted, v: audio.volume, mv: audio.musicVolume }));
  } catch { /* ignore */ }
}

function Shell({ title, onClose, children, icon }: { title: string; onClose: () => void; children: React.ReactNode; icon: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
      <div className="absolute inset-0 bg-[#082b38]/70 backdrop-blur-sm" onClick={onClose} />
      <div className="anim-pop-in relative w-full max-w-lg max-h-[86vh] overflow-y-auto rounded-3xl border-4 border-amber-300/80 bg-gradient-to-b from-[#0f5066] to-[#0b3b4d] p-5 sm:p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-300">
            {icon}
            <h3 className="text-xl font-extrabold tracking-wide text-white">{title}</h3>
          </div>
          <button
            onClick={() => { audio.sfx("click"); onClose(); }}
            className="rounded-full bg-white/10 p-2 text-white transition hover:bg-white/25"
            aria-label="Tutup"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function GuideModal({ onClose }: { onClose: () => void }) {
  const Item = ({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) => (
    <div className="flex gap-3 rounded-2xl bg-white/8 p-3">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-400/20 text-amber-300">{icon}</div>
      <div>
        <p className="font-bold text-white">{title}</p>
        <p className="text-sm leading-snug text-cyan-100/85">{desc}</p>
      </div>
    </div>
  );
  return (
    <Shell title="Panduan Bermain" onClose={onClose} icon={<HelpCircle size={20} />}>
      <div className="space-y-2.5">
        <Item icon={<MousePointer2 size={18} />} title="Ambil Kartu (pengganti dadu)" desc="Tekan tombol AMBIL KARTU. Kartu angka 1–6 menggerakkan robotmu sesuai angka, kartu ZONK membuatmu diam, kartu BINTANG memberi bonus." />
        <Item icon={<Star size={18} />} title="Bonus Kartu Bintang" desc="Setiap pemain punya 3 bonus yang masing-masing hanya bisa dipakai sekali: +10 Poin, Maju 6 Langkah, atau Acak Kartu 1x." />
        <Item icon={<Q size={18} />} title="Petak Soal Matematika" desc="20 petak ungu berisi soal perkalian dan pembagian. Jawaban benar mendapat +5 poin. Salah tidak mengurangi poin." />
        <Item icon={<ArrowUpFromLine size={18} />} title="Ular & Tangga" desc="Mendarat di bawah tangga akan menaikkan robotmu. Mendarat di kepala ular akan menurunkan robotmu. Hijau = tangga, merah muda = ular." />
        <Item icon={<Trophy size={18} />} title="Cara Menang" desc="Capai petak 100 (FINISH) dengan jumlah langkah yang pas. Pemenang adalah pemain pertama yang tiba di istana FINISH." />
        <Item icon={<RotateCcw size={18} />} title="Kamera 360 Derajat" desc="Seret layar/mouse untuk memutar, jentik atau scroll untuk zoom. Gunakan tombol kamera untuk tampilan atas dan reset sudut pandang." />
        <Item icon={<Camera size={18} />} title="Penyimpanan Otomatis" desc="Progres permainan tersimpan otomatis. Jika halaman dimuat ulang, pilih LANJUTKAN dari menu utama." />
      </div>
    </Shell>
  );
}

export function SettingsModal({ onClose, muted, setMuted }: { onClose: () => void; muted: boolean; setMuted: (m: boolean) => void }) {
  const [vol, setVol] = useState(audio.volume);
  const [mus, setMus] = useState(audio.musicVolume);
  useEffect(() => { saveAudioSettings(); });
  return (
    <Shell title="Pengaturan Suara" onClose={onClose} icon={muted ? <VolumeX size={20} /> : <Volume2 size={20} />}>
      <div className="space-y-4">
        <button
          onClick={() => {
            const nm = !muted;
            audio.setMuted(nm);
            setMuted(nm);
            saveAudioSettings();
          }}
          className={`flex w-full items-center justify-between rounded-2xl p-4 font-bold transition ${muted ? "bg-rose-500/25 text-rose-100" : "bg-emerald-500/25 text-emerald-100"}`}
        >
          <span className="flex items-center gap-2">{muted ? <VolumeX size={20} /> : <Volume2 size={20} />} Suara {muted ? "Nonaktif" : "Aktif"}</span>
          <span className={`relative h-7 w-12 rounded-full transition ${muted ? "bg-rose-400/60" : "bg-emerald-400/70"}`}>
            <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${muted ? "left-1" : "left-6"}`} />
          </span>
        </button>
        <div className="rounded-2xl bg-white/8 p-4">
          <label className="mb-2 flex items-center gap-2 font-bold text-white"><Volume2 size={17} /> Volume Efek</label>
          <input
            type="range" min={0} max={1} step={0.05} value={vol}
            onChange={(e) => { const v = Number(e.target.value); setVol(v); audio.setVolume(v); saveAudioSettings(); }}
            className="w-full accent-amber-400"
          />
        </div>
        <div className="rounded-2xl bg-white/8 p-4">
          <label className="mb-2 flex items-center gap-2 font-bold text-white"><Music size={17} /> Volume Musik</label>
          <input
            type="range" min={0} max={1} step={0.05} value={mus}
            onChange={(e) => { const v = Number(e.target.value); setMus(v); audio.setMusicVolume(v); saveAudioSettings(); }}
            className="w-full accent-amber-400"
          />
        </div>
        <div className="flex items-center gap-2 rounded-2xl bg-amber-400/15 p-3 text-sm font-semibold text-amber-100">
          <Sparkles size={16} /> Musik dimulai otomatis setelah kamu menekan layar pertama kali.
        </div>
      </div>
    </Shell>
  );
}

export function BonusIcons({ bonus }: { bonus: Record<"point" | "six" | "draw", boolean> }) {
  const chips: { k: "point" | "six" | "draw"; icon: React.ReactNode; label: string }[] = [
    { k: "point", icon: <Coins size={12} />, label: "+10" },
    { k: "six", icon: <Footprints size={12} />, label: "+6" },
    { k: "draw", icon: <RefreshCw size={12} />, label: "1x" },
  ];
  return (
    <div className="flex gap-1">
      {chips.map((c) => (
        <span
          key={c.k}
          title={c.label}
          className={`flex h-6 min-w-7 items-center justify-center gap-0.5 rounded-lg px-1 text-[10px] font-extrabold transition ${
            bonus[c.k] ? "bg-white/10 text-white/35 line-through" : "bg-amber-400 text-amber-950 shadow"
          }`}
        >
          {c.icon}
          {c.label}
        </span>
      ))}
    </div>
  );
}
