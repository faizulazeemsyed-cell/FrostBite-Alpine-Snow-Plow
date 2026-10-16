/**
 * Procedural Web Audio API Synthesizer for FrostBite Alpine Snow Plow
 * 100% code-generated sound effects & cozy winter music - Zero external audio files!
 */

class SynthAudioManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;

  // Engine synth nodes
  private engineOsc1: OscillatorNode | null = null;
  private engineOsc2: OscillatorNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private engineGain: GainNode | null = null;
  private isEngineRunning: boolean = false;

  // Snow crunch nodes
  private snowNoiseNode: AudioBufferSourceNode | null = null;
  private snowGain: GainNode | null = null;
  private snowFilter: BiquadFilterNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  // Music loop state
  private isMusicPlaying: boolean = false;
  private musicTimer: number | null = null;
  private currentChordIndex: number = 0;

  // Pentatonic scale frequencies for combo progression (C4, D4, E4, G4, A4, C5, D5, E5, G5, A5, C6)
  private readonly comboScale = [
    261.63, 293.66, 329.63, 392.0, 440.0,
    523.25, 587.33, 659.25, 783.99, 880.0, 1046.5
  ];

  // Cozy chord progressions (Fmaj7, Cmaj7, Am7, Gadd9)
  private readonly chords = [
    [174.61, 261.63, 329.63, 392.0], // F3, C4, E4, G4
    [130.81, 196.00, 261.63, 329.63], // C3, G3, C4, E4
    [110.00, 164.81, 220.00, 261.63], // A2, E3, A3, C4
    [196.00, 293.66, 392.00, 440.00], // G3, D4, G4, A4
  ];

  constructor() {
    // AudioContext will be initialized on user interaction
  }

  public init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(0.28, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      this.buildNoiseBuffer();
      this.setupEngineSynth();
      this.setupSnowCrunchSynth();
      this.startMusic();
    } catch {
      console.warn('Web Audio API not supported in this browser');
    }
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 0.7, this.ctx.currentTime, 0.05);
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  private buildNoiseBuffer() {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 2;
    this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
  }

  private setupEngineSynth() {
    if (!this.ctx || !this.sfxGain) return;

    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.setValueAtTime(0.001, this.ctx.currentTime);

    this.engineFilter = this.ctx.createBiquadFilter();
    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.setValueAtTime(140, this.ctx.currentTime);
    this.engineFilter.Q.setValueAtTime(3, this.ctx.currentTime);

    // Warm sub-saw engine osc
    this.engineOsc1 = this.ctx.createOscillator();
    this.engineOsc1.type = 'sawtooth';
    this.engineOsc1.frequency.setValueAtTime(42, this.ctx.currentTime);

    // Subtle sub harmonic
    this.engineOsc2 = this.ctx.createOscillator();
    this.engineOsc2.type = 'triangle';
    this.engineOsc2.frequency.setValueAtTime(84, this.ctx.currentTime);

    this.engineOsc1.connect(this.engineFilter);
    this.engineOsc2.connect(this.engineFilter);
    this.engineFilter.connect(this.engineGain);
    this.engineGain.connect(this.sfxGain);

    this.engineOsc1.start();
    this.engineOsc2.start();
    this.isEngineRunning = true;
  }

  private setupSnowCrunchSynth() {
    if (!this.ctx || !this.sfxGain || !this.noiseBuffer) return;

    this.snowGain = this.ctx.createGain();
    this.snowGain.gain.setValueAtTime(0, this.ctx.currentTime);

    this.snowFilter = this.ctx.createBiquadFilter();
    this.snowFilter.type = 'bandpass';
    this.snowFilter.frequency.setValueAtTime(1200, this.ctx.currentTime);
    this.snowFilter.Q.setValueAtTime(1.8, this.ctx.currentTime);

    this.snowNoiseNode = this.ctx.createBufferSource();
    this.snowNoiseNode.buffer = this.noiseBuffer;
    this.snowNoiseNode.loop = true;

    this.snowNoiseNode.connect(this.snowFilter);
    this.snowFilter.connect(this.snowGain);
    this.snowGain.connect(this.sfxGain);

    this.snowNoiseNode.start();
  }

  /**
   * Update engine sound based on throttle (0-1), current speed (0-max), and boost active
   */
  public updateEngineSound(speedRatio: number, isAccelerating: boolean, isBoosting: boolean) {
    if (!this.ctx || !this.engineOsc1 || !this.engineOsc2 || !this.engineFilter || !this.engineGain) return;

    const baseFreq = isBoosting ? 88 : 42 + speedRatio * 45 + (isAccelerating ? 12 : 0);
    const filterFreq = isBoosting ? 650 : 130 + speedRatio * 320;
    const targetGain = isBoosting ? 0.35 : 0.12 + speedRatio * 0.15;

    const now = this.ctx.currentTime;
    this.engineOsc1.frequency.setTargetAtTime(baseFreq, now, 0.08);
    this.engineOsc2.frequency.setTargetAtTime(baseFreq * 1.5, now, 0.08);
    this.engineFilter.frequency.setTargetAtTime(filterFreq, now, 0.08);
    this.engineGain.gain.setTargetAtTime(targetGain, now, 0.08);
  }

  /**
   * Modulate snow plowing crunch sound based on whether plow is actively slicing snow
   */
  public updateSnowCrunch(isPlowing: boolean, intensity: number = 1.0) {
    if (!this.ctx || !this.snowGain || !this.snowFilter) return;

    const targetGain = isPlowing ? Math.min(0.28, 0.12 + intensity * 0.16) : 0;
    const targetFreq = 1000 + intensity * 600;

    const now = this.ctx.currentTime;
    this.snowGain.gain.setTargetAtTime(targetGain, now, 0.05);
    this.snowFilter.frequency.setTargetAtTime(targetFreq, now, 0.08);
  }

  /**
   * Play combo chime scaling up in pentatonic pitch
   */
  public playComboChime(comboCount: number, multiplier: number) {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const index = Math.min(comboCount, this.comboScale.length - 1);
    const freq = this.comboScale[index];

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    // Subtle overtone
    const osc2 = this.ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 2, this.ctx.currentTime);

    const now = this.ctx.currentTime;
    const duration = 0.22 + Math.min(0.2, multiplier * 0.04);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    osc2.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc2.start(now);
    osc.stop(now + duration);
    osc2.stop(now + duration);
  }

  /**
   * Cozy vintage two-tone truck horn (H key)
   */
  public playHorn() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'sawtooth';
    osc1.frequency.setValueAtTime(329.63, now); // E4
    osc2.frequency.setValueAtTime(392.00, now); // G4

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(850, now);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.4);
    osc2.stop(now + 0.4);
  }

  /**
   * Turbo Boost Snow Jet activation sound
   */
  public playBoostSound() {
    if (!this.ctx || !this.sfxGain || this.isMuted || !this.noiseBuffer) return;

    const now = this.ctx.currentTime;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.setValueAtTime(3, now);
    filter.frequency.setValueAtTime(300, now);
    filter.frequency.exponentialRampToValueAtTime(2400, now + 0.4);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(now);
    noise.stop(now + 0.6);
  }

  /**
   * Collectible pickup ping (Frozen coin, Hot cocoa, Mitten, Snowflake)
   */
  public playPickupSound(type: 'coin' | 'cocoa' | 'mitten' | 'snowflake') {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    let f1 = 587.33; // D5
    let f2 = 880.00; // A5

    if (type === 'cocoa') {
      f1 = 440; f2 = 659.25;
    } else if (type === 'snowflake') {
      f1 = 880; f2 = 1318.5;
    } else if (type === 'mitten') {
      f1 = 523.25; f2 = 783.99;
    }

    osc.type = 'sine';
    osc.frequency.setValueAtTime(f1, now);
    osc.frequency.setValueAtTime(f2, now + 0.07);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.32);
  }

  /**
   * Collision impact bump
   */
  public playCollisionSound() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.22);
  }

  /**
   * Sector cleared / upgrade purchase celebration jingle
   */
  public playSectorCompletedSound() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    const now = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.1);

      gain.gain.setValueAtTime(0, now + idx * 0.1);
      gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.1 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(now + idx * 0.1);
      osc.stop(now + idx * 0.1 + 0.4);
    });
  }

  /**
   * Cozy winter ambient synth pad chord loop
   */
  private startMusic() {
    if (this.isMusicPlaying || !this.ctx || !this.musicGain) return;
    this.isMusicPlaying = true;

    const playNextChord = () => {
      if (!this.ctx || !this.musicGain || !this.isMusicPlaying) return;

      const chord = this.chords[this.currentChordIndex];
      this.currentChordIndex = (this.currentChordIndex + 1) % this.chords.length;

      const now = this.ctx.currentTime;
      const duration = 4.0; // 4 seconds per chord

      chord.forEach((freq) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        const filter = this.ctx!.createBiquadFilter();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        // Soft warm lowpass filter
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(450, now);
        filter.frequency.linearRampToValueAtTime(650, now + duration * 0.5);
        filter.frequency.linearRampToValueAtTime(400, now + duration);

        // Gentle swell envelope
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.08, now + 1.2);
        gain.gain.setValueAtTime(0.08, now + duration - 1.0);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain!);

        osc.start(now);
        osc.stop(now + duration + 0.1);
      });

      this.musicTimer = window.setTimeout(playNextChord, 3800);
    };

    playNextChord();
  }

  public dispose() {
    if (this.musicTimer) {
      clearTimeout(this.musicTimer);
    }
    this.isMusicPlaying = false;
    if (this.engineOsc1) {
      try {
        this.engineOsc1.stop();
        this.engineOsc2?.stop();
        this.snowNoiseNode?.stop();
      } catch {
        // Ignored
      }
    }
    if (this.ctx && this.ctx.state !== 'closed') {
      this.ctx.close();
    }
  }
}

export const synthAudio = new SynthAudioManager();
