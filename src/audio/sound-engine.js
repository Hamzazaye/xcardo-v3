/**
 * XcardO: Warlords of the Obsidian Altar
 * Gothic Cathedral Audio Synthesizer (Stone Slam, Shatter Clatter, Bell Toll, Pipe Organ) + MP3 Player
 */

import { SOUNDTRACKS } from '../data/gothic-config.js';

export class GothicSoundEngine {
  constructor(saveManager) {
    this.save = saveManager;
    this.ctx = null;
    this.bgmAudio = null;
    this.currentTrackIndex = 0;
    this.isMuted = false;
  }

  _ensureContext() {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  getSfxVolume() {
    if (this.isMuted) return 0;
    const state = this.save?.getState();
    return state?.sfxVolume ?? 0.85;
  }

  getMusicVolume() {
    if (this.isMuted) return 0;
    const state = this.save?.getState();
    return state?.musicVolume ?? 0.45;
  }

  /**
   * Play heavy 3D Stone Altar Slam SFX
   */
  playStoneSlam(symbol = 'X') {
    const ctx = this._ensureContext();
    const vol = this.getSfxVolume();
    if (!ctx || vol <= 0) return;

    const now = ctx.currentTime;
    // Deep sub-altar stone thud
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    const baseFreq = symbol === 'X' ? 115 : 88;
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(34, now + 0.22);

    gain.gain.setValueAtTime(0.45 * vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);

    // Chisel ring overtone
    const chime = ctx.createOscillator();
    const chimeGain = ctx.createGain();
    chime.type = 'sine';
    chime.frequency.setValueAtTime(symbol === 'X' ? 528 : 396, now);
    chimeGain.gain.setValueAtTime(0.14 * vol, now);
    chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
    chime.connect(chimeGain);
    chimeGain.connect(ctx.destination);
    chime.start(now);
    chime.stop(now + 0.34);
  }

  /**
   * Play Multi-Grain 3D Stone Shatter & Marble Debris Clatter SFX
   */
  playStoneShatter(intensity = 1.2) {
    const ctx = this._ensureContext();
    const vol = this.getSfxVolume();
    if (!ctx || vol <= 0) return;

    const now = ctx.currentTime;

    // 1. Primary Fracture Crack (White-Noise Burst + Low Impact)
    const bufferSize = Math.floor(ctx.sampleRate * 0.28);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.08));
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(920, now);
    filter.Q.setValueAtTime(1.4, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(Math.min(0.65, 0.42 * intensity) * vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);

    // 2. Cascading Stone Shard Bounces (6 staggered high-stone clicks)
    for (let i = 0; i < 6; i++) {
      const delay = 0.05 + i * 0.055 + Math.random() * 0.03;
      const shardOsc = ctx.createOscillator();
      const shardGain = ctx.createGain();
      shardOsc.type = 'triangle';
      shardOsc.frequency.setValueAtTime(700 + Math.random() * 1100, now + delay);
      shardOsc.frequency.exponentialRampToValueAtTime(220, now + delay + 0.06);

      shardGain.gain.setValueAtTime(0.14 * vol * (1 - i * 0.12), now + delay);
      shardGain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.065);

      shardOsc.connect(shardGain);
      shardGain.connect(ctx.destination);
      shardOsc.start(now + delay);
      shardOsc.stop(now + delay + 0.07);
    }
  }

  /**
   * Play Cathedral Pipe Organ Chord on Sacred Geometry Alignment
   */
  playSacredChord(tier = 'minor') {
    const ctx = this._ensureContext();
    const vol = this.getSfxVolume();
    if (!ctx || vol <= 0) return;

    const now = ctx.currentTime;
    const freqs =
      tier === 'grand'
        ? [220, 277.18, 329.63, 440, 659.25]
        : tier === 'major'
        ? [220, 261.63, 329.63, 440]
        : [220, 329.63, 440];

    for (const f of freqs) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, now);

      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(1450, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.09 * vol, now + 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.78);

      osc.connect(lp);
      lp.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.8);
    }
  }

  /**
   * Play Deep Cathedral Bronze Bell Toll
   */
  playCathedralBell() {
    const ctx = this._ensureContext();
    const vol = this.getSfxVolume();
    if (!ctx || vol <= 0) return;

    const now = ctx.currentTime;
    const partials = [196, 392, 466.16, 587.33, 784];
    partials.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      const amp = (0.24 / (idx + 1)) * vol;
      gain.gain.setValueAtTime(amp, now);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + 1.45);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 1.5);
    });
  }

  playUIHover() {
    const ctx = this._ensureContext();
    const vol = this.getSfxVolume();
    if (!ctx || vol <= 0) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(480, now);
    gain.gain.setValueAtTime(0.035 * vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  playHeroAbility() {
    const ctx = this._ensureContext();
    const vol = this.getSfxVolume();
    if (!ctx || vol <= 0) return;

    const now = ctx.currentTime;
    const notes = [293.66, 440, 587.33, 880];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.045);
      gain.gain.setValueAtTime(0.16 * vol, now + i * 0.045);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.045 + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.045);
      osc.stop(now + i * 0.045 + 0.36);
    });
  }

  playBossWarning() {
    const ctx = this._ensureContext();
    const vol = this.getSfxVolume();
    if (!ctx || vol <= 0) return;

    const now = ctx.currentTime;
    const freqs = [110, 116.54]; // Dissonant tritone/semitone horn warning
    freqs.forEach((f) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, now);
      osc.frequency.linearRampToValueAtTime(f * 0.92, now + 0.55);

      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(620, now);

      gain.gain.setValueAtTime(0.18 * vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.58);
      osc.connect(lp);
      lp.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.6);
    });
  }

  playScoreTick() {
    const ctx = this._ensureContext();
    const vol = this.getSfxVolume();
    if (!ctx || vol <= 0) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(660, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.06);
    gain.gain.setValueAtTime(0.08 * vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
  }

  startMusic(trackIndex = 0) {
    if (typeof window === 'undefined' || typeof Audio === 'undefined') return;
    this.currentTrackIndex = ((trackIndex % SOUNDTRACKS.length) + SOUNDTRACKS.length) % SOUNDTRACKS.length;
    const track = SOUNDTRACKS[this.currentTrackIndex];
    if (!track) return;

    if (!this.bgmAudio) {
      this.bgmAudio = new Audio();
      this.bgmAudio.loop = false;
      this.bgmAudio.addEventListener('ended', () => {
        this.nextTrack();
      });
    }
    this.bgmAudio.src = track.src;
    this.bgmAudio.volume = this.getMusicVolume();
    this.bgmAudio.play().catch(() => {});
  }

  nextTrack() {
    this.startMusic(this.currentTrackIndex + 1);
    return SOUNDTRACKS[this.currentTrackIndex];
  }

  syncVolumes() {
    if (this.bgmAudio) {
      this.bgmAudio.volume = this.getMusicVolume();
    }
  }
}
