// ============================================================
// AudioManager — Web Audio API, no external files
// ============================================================

type SfxName =
  | "click" | "shuffle" | "flip" | "step" | "correct" | "wrong"
  | "star" | "zonk" | "win" | "ladder" | "snake" | "jump" | "point";

class AudioManager {
  ctx: AudioContext | null = null;
  master: GainNode | null = null;
  musicGain: GainNode | null = null;
  sfxGain: GainNode | null = null;
  muted = false;
  volume = 0.9;
  musicVolume = 0.35;
  private bgmTimer: number | null = null;
  private bgmStep = 0;
  private stepFlip = false;

  ensure() {
    if (this.ctx) {
      if (this.ctx.state === "suspended") void this.ctx.resume().catch(() => undefined);
      return;
    }

    const AC = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;

    try {
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain();
      this.musicGain.connect(this.master);
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.connect(this.master);
      this.applyVolumes();
    } catch (error) {
      console.warn("Audio tidak tersedia pada browser ini:", error);
      this.ctx = null;
      this.master = null;
      this.musicGain = null;
      this.sfxGain = null;
    }
  }

  applyVolumes() {
    if (!this.master) return;
    this.master.gain.value = this.muted ? 0 : this.volume;
    if (this.musicGain) this.musicGain.gain.value = this.musicVolume;
    if (this.sfxGain) this.sfxGain.gain.value = 1;
  }

  setMuted(m: boolean) {
    this.muted = m;
    this.applyVolumes();
  }
  setVolume(v: number) {
    this.volume = v;
    this.applyVolumes();
  }
  setMusicVolume(v: number) {
    this.musicVolume = v;
    this.applyVolumes();
  }

  private tone(
    freq: number, dur: number, type: OscillatorType = "sine",
    vol = 0.22, when = 0, glideTo?: number, dest?: GainNode
  ) {
    if (!this.ctx || !this.sfxGain) return;
    const t0 = this.ctx.currentTime + when;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (glideTo) o.frequency.exponentialRampToValueAtTime(Math.max(30, glideTo), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(dest ?? this.sfxGain);
    o.start(t0);
    o.stop(t0 + dur + 0.05);
  }

  private noise(dur: number, vol = 0.15, when = 0, filterFrom = 800, filterTo = 2400) {
    if (!this.ctx || !this.sfxGain) return;
    const t0 = this.ctx.currentTime + when;
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const f = this.ctx.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.setValueAtTime(filterFrom, t0);
    f.frequency.exponentialRampToValueAtTime(filterTo, t0 + dur);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f).connect(g).connect(this.sfxGain);
    src.start(t0);
  }

  sfx(name: SfxName) {
    if (!this.ctx || this.muted) return;
    switch (name) {
      case "click":
        this.tone(640, 0.07, "triangle", 0.18);
        this.tone(920, 0.05, "triangle", 0.1, 0.03);
        break;
      case "shuffle":
        this.noise(0.28, 0.16, 0, 500, 1600);
        this.noise(0.22, 0.13, 0.16, 700, 2000);
        this.noise(0.2, 0.12, 0.32, 900, 2400);
        this.tone(520, 0.06, "square", 0.05, 0.1);
        this.tone(660, 0.06, "square", 0.05, 0.3);
        break;
      case "flip":
        this.noise(0.32, 0.14, 0, 600, 2800);
        this.tone(880, 0.22, "sine", 0.1, 0.12, 1320);
        break;
      case "step":
        this.stepFlip = !this.stepFlip;
        this.tone(this.stepFlip ? 420 : 500, 0.09, "triangle", 0.16);
        this.noise(0.05, 0.05, 0, 1200, 1200);
        break;
      case "jump":
        this.tone(420, 0.18, "sine", 0.14, 0, 840);
        break;
      case "correct":
        [523, 659, 784, 1047].forEach((f, i) =>
          this.tone(f, 0.16, "triangle", 0.2, i * 0.09)
        );
        this.noise(0.4, 0.06, 0, 3000, 5000);
        break;
      case "wrong":
        this.tone(233, 0.22, "sawtooth", 0.12);
        this.tone(196, 0.3, "sawtooth", 0.12, 0.18);
        break;
      case "star":
        [880, 1109, 1319, 1760].forEach((f, i) =>
          this.tone(f, 0.22, "sine", 0.14, i * 0.07)
        );
        this.tone(900, 0.5, "sine", 0.06, 0, 2200);
        break;
      case "zonk":
        [392, 330, 262, 196].forEach((f, i) =>
          this.tone(f, 0.22, "square", 0.09, i * 0.13)
        );
        this.noise(0.25, 0.05, 0.1, 300, 150);
        break;
      case "ladder":
        [392, 494, 587, 784, 988].forEach((f, i) =>
          this.tone(f, 0.14, "triangle", 0.14, i * 0.1)
        );
        break;
      case "snake":
        this.tone(620, 0.8, "sawtooth", 0.07, 0, 140);
        this.noise(0.7, 0.05, 0, 900, 240);
        break;
      case "point":
        this.tone(1047, 0.12, "triangle", 0.18);
        this.tone(1568, 0.24, "triangle", 0.14, 0.1);
        break;
      case "win":
        [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) =>
          this.tone(f, 0.28, "triangle", 0.2, i * 0.14)
        );
        [262, 330, 392].forEach((f) => this.tone(f, 1.6, "sine", 0.08, 0.9));
        this.noise(1.2, 0.04, 0.2, 4000, 6000);
        break;
    }
  }

  /** Looping ambient BGM — Hijaz-flavored pluck melody over a soft drone */
  startBGM() {
    this.ensure();
    if (this.bgmTimer !== null || !this.ctx) return;
    const scale = [293.66, 311.13, 369.99, 392.0, 440.0, 466.16, 554.37, 587.33]; // D hijaz-ish
    const melody = [0, 2, 3, 2, 4, 3, 2, 0, 1, 2, 0, -1, 0, 3, 2, 1, 0, 2, 4, 7, 4, 3, 2, 0, 2, 3, 1, 0, -2];
    const stepDur = 0.42;
    let nextTime = this.ctx.currentTime + 0.1;
    this.bgmTimer = window.setInterval(() => {
      if (!this.ctx || !this.musicGain) return;
      while (nextTime < this.ctx.currentTime + 0.6) {
        const idx = melody[this.bgmStep % melody.length];
        const when = nextTime - this.ctx.currentTime;
        if (idx >= 0) {
          const f = scale[idx % scale.length];
          // oud-ish pluck: triangle + detuned sine
          this.tone(f, 0.5, "triangle", 0.055, when, undefined, this.musicGain);
          this.tone(f * 1.005, 0.42, "sine", 0.04, when, undefined, this.musicGain);
        }
        if (this.bgmStep % 8 === 0)
          this.tone(146.83, 1.4, "sine", 0.05, when, undefined, this.musicGain); // drone D3
        if (this.bgmStep % 16 === 8)
          this.tone(220, 1.2, "sine", 0.035, when, undefined, this.musicGain);
        this.bgmStep++;
        nextTime += stepDur;
      }
    }, 180);
  }

  stopBGM() {
    if (this.bgmTimer !== null) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
  }
}

export const audio = new AudioManager();
