import { Howl, Howler } from 'howler';
import { eventBus } from '../core/eventBus';

function encodeWavBlob(samples: Float32Array, sampleRate = 22050): string {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }

  const blob = new Blob([buffer], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
}

function genTone(freqs: number[], durPerNote: number, gain = 0.25, sr = 22050): string {
  const totalSamples = Math.floor(sr * freqs.length * durPerNote);
  const out = new Float32Array(totalSamples);
  const step = Math.floor(sr * durPerNote);

  freqs.forEach((f, idx) => {
    const start = idx * step;
    for (let i = 0; i < step && start + i < totalSamples; i++) {
      const t = i / sr;
      const env = Math.min(1, t * 40) * Math.exp(-t * 6.5);
      out[start + i] +=
        (Math.sin(2 * Math.PI * f * t) * 0.75 + Math.sin(4 * Math.PI * f * t) * 0.25) * env * gain;
    }
  });
  return encodeWavBlob(out, sr);
}

function genClick(freq = 680, dur = 0.045, gain = 0.2, sr = 22050): string {
  const n = Math.floor(sr * dur);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / sr;
    const env = Math.exp(-t * 70);
    out[i] = Math.sin(2 * Math.PI * freq * t) * env * gain;
  }
  return encodeWavBlob(out, sr);
}

function genLofiLoop(sr = 22050): string {
  // 8-second warm lo-fi chill chord progression (Cmaj7 -> Am7 -> Fmaj7 -> G6)
  const duration = 8.0;
  const n = Math.floor(sr * duration);
  const out = new Float32Array(n);
  const chords = [
    [261.63, 329.63, 392.0, 493.88], // Cmaj7
    [220.0, 261.63, 329.63, 392.0],  // Am7
    [174.61, 220.0, 261.63, 329.63], // Fmaj7
    [196.0, 246.94, 293.66, 329.63], // G6
  ];

  const chordSamples = Math.floor(n / 4);
  chords.forEach((chord, cIdx) => {
    const start = cIdx * chordSamples;
    for (let i = 0; i < chordSamples; i++) {
      const t = i / sr;
      const localEnv =
        Math.min(1, t * 4) * Math.min(1, (chordSamples / sr - t) * 4) * 0.08;
      let val = 0;
      for (const f of chord) {
        val += Math.sin(2 * Math.PI * f * t) * 0.4;
      }
      // Subtle vinyl warmth
      val += (Math.random() - 0.5) * 0.012;
      out[start + i] = val * localEnv;
    }
  });
  return encodeWavBlob(out, sr);
}

function genRainLoop(sr = 22050): string {
  const duration = 3.0;
  const n = Math.floor(sr * duration);
  const out = new Float32Array(n);
  let last = 0;
  for (let i = 0; i < n; i++) {
    const white = Math.random() * 2 - 1;
    // Soft low-pass filtered rain noise
    last = last * 0.85 + white * 0.15;
    out[i] = last * 0.12;
  }
  return encodeWavBlob(out, sr);
}

class AudioManager {
  private initialized = false;
  private sfxVolume = 0.65;
  private musicVolume = 0.3;
  private muted = false;

  private sounds: Record<string, Howl> = {};
  private musicHowl: Howl | null = null;
  private rainHowl: Howl | null = null;
  private isRaining = false;

  public init(): void {
    if (this.initialized) return;
    this.initialized = true;

    this.sounds.doorbell = new Howl({ src: [genTone([880, 659.25], 0.18, 0.22)], format: ['wav'] });
    this.sounds.pos = new Howl({ src: [genTone([1046.5, 1318.5], 0.12, 0.24)], format: ['wav'] });
    this.sounds.message = new Howl({ src: [genTone([783.99, 1046.5], 0.1, 0.18)], format: ['wav'] });
    this.sounds.ring = new Howl({ src: [genTone([587.33, 783.99, 987.77], 0.16, 0.22)], format: ['wav'] });
    this.sounds.click = new Howl({ src: [genClick(620, 0.04, 0.18)], format: ['wav'] });
    this.sounds.switch = new Howl({ src: [genClick(440, 0.055, 0.24)], format: ['wav'] });

    this.musicHowl = new Howl({
      src: [genLofiLoop()],
      format: ['wav'],
      loop: true,
      volume: this.musicVolume,
    });

    this.rainHowl = new Howl({
      src: [genRainLoop()],
      format: ['wav'],
      loop: true,
      volume: 0,
    });

    eventBus.on('audio:doorbell', () => this.play('doorbell'));
    eventBus.on('audio:pos', () => this.play('pos'));
    eventBus.on('audio:message', () => this.play('message'));
    eventBus.on('audio:ring', () => this.play('ring'));
    eventBus.on('audio:click', () => this.play('click'));
    eventBus.on('audio:switch', () => this.play('switch'));
    eventBus.on('world:weather', (w) => this.setRain(w === 'rain'));
  }

  public startAmbient(): void {
    this.init();
    if (this.musicHowl && !this.musicHowl.playing()) {
      this.musicHowl.play();
    }
    if (this.rainHowl && !this.rainHowl.playing()) {
      this.rainHowl.play();
    }
  }

  public play(name: 'doorbell' | 'pos' | 'message' | 'ring' | 'click' | 'switch'): void {
    if (this.muted) return;
    this.init();
    const s = this.sounds[name];
    if (s) {
      s.volume(this.sfxVolume);
      s.play();
    }
  }

  public setRain(raining: boolean): void {
    this.isRaining = raining;
    if (!this.rainHowl) return;
    this.rainHowl.volume(this.muted ? 0 : raining ? this.sfxVolume * 0.4 : 0);
  }

  public setSettings(musicVol: number, sfxVol: number, muted: boolean): void {
    this.musicVolume = musicVol;
    this.sfxVolume = sfxVol;
    this.muted = muted;
    Howler.mute(muted);
    if (this.musicHowl) this.musicHowl.volume(muted ? 0 : musicVol);
    if (this.rainHowl) this.rainHowl.volume(muted ? 0 : this.isRaining ? sfxVol * 0.4 : 0);
  }
}

export const audioManager = new AudioManager();
