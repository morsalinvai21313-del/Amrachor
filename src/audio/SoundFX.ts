/**
 * Amra Chor - Zero-Latency Procedural Web Audio Sound Engine
 * All sound effects generated via Web Audio API oscillators and pre-baked noise buffers.
 * Non-blocking, asynchronous Bengali speech synthesis with voice caching.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private isMuted: boolean = false;
  private sirenOsc: OscillatorNode | null = null;
  private sirenGain: GainNode | null = null;
  private sirenLfo: OscillatorNode | null = null;
  private isSirenPlaying: boolean = false;

  private cngOsc: OscillatorNode | null = null;
  private cngGain: GainNode | null = null;

  private megaphoneInterval: number | null = null;
  private punchNoiseBuffer: AudioBuffer | null = null;
  private footstepNoiseBuffer: AudioBuffer | null = null;

  // Cached Bengali voices to eliminate main-thread speech blocking
  private cachedVoices: SpeechSynthesisVoice[] = [];
  private lastVoiceTime: number = 0;
  private voiceCooldown: number = 2200; // ms

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const updateVoices = () => {
        try {
          this.cachedVoices = window.speechSynthesis.getVoices();
        } catch {
          // ignore
        }
      };
      updateVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = updateVoices;
      }
    }
  }

  public initContext() {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;

      this.ctx = new AudioContextClass();
      this.masterGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();

      this.masterGain.connect(this.ctx.destination);
      this.sfxGain.connect(this.masterGain);

      this.masterGain.gain.setValueAtTime(0.75, this.ctx.currentTime);
      this.sfxGain.gain.setValueAtTime(0.85, this.ctx.currentTime);

      // Pre-bake punch noise buffer (80ms)
      const pLen = Math.floor(this.ctx.sampleRate * 0.08);
      this.punchNoiseBuffer = this.ctx.createBuffer(1, pLen, this.ctx.sampleRate);
      const pData = this.punchNoiseBuffer.getChannelData(0);
      for (let i = 0; i < pLen; i++) {
        pData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (pLen * 0.25));
      }

      // Pre-bake footstep noise buffer (40ms)
      const fLen = Math.floor(this.ctx.sampleRate * 0.04);
      this.footstepNoiseBuffer = this.ctx.createBuffer(1, fLen, this.ctx.sampleRate);
      const fData = this.footstepNoiseBuffer.getChannelData(0);
      for (let i = 0; i < fLen; i++) {
        fData[i] = (Math.random() * 2 - 1) * (1 - i / fLen);
      }
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setVolume(val: number) {
    this.initContext();
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, val)), this.ctx.currentTime);
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.75, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  // Instant Cartoon Slap / Punch Sound ("ঢিসুম!") - < 1ms execution
  public playPunch() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;

    // Pitch dropping punch body
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(38, t + 0.16);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(850, t);

    gain.gain.setValueAtTime(0.9, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.16);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.17);

    // Punch transient noise crack using pre-baked buffer
    if (this.punchNoiseBuffer) {
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.punchNoiseBuffer;
      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.65, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);

      noise.connect(noiseGain);
      noiseGain.connect(this.sfxGain);
      noise.start(t);
    }
  }

  // Rickshaw Bell ("টিং টিং!")
  public playRickshawBell() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const chime = (delay: number, freq: number) => {
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime + delay;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.45, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.23);
    };

    chime(0, 1950);
    chime(0.1, 2300);
  }

  // Dhaka Car / Bus Horn ("প্যাঁ প্যাঁ!")
  public playHorn() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'sawtooth';
    osc1.frequency.setValueAtTime(380, t);
    osc2.frequency.setValueAtTime(475, t);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.setValueAtTime(0.4, t + 0.22);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.28);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.sfxGain);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.29);
    osc2.stop(t + 0.29);
  }

  // Money Coin / Cash Pickup ("খন খন!")
  public playCoin() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(987, t); // B5
    osc.frequency.setValueAtTime(1318, t + 0.07); // E6

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.33);
  }

  // Responsive Jump Sound
  public playJump() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(450, t + 0.14);

    gain.gain.setValueAtTime(0.28, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.16);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.17);
  }

  // Rapid Footstep Sound using pre-baked buffer
  public playFootstep(isSprinting: boolean) {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted || !this.footstepNoiseBuffer) return;

    const t = this.ctx.currentTime;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.footstepNoiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(isSprinting ? 650 : 420, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(isSprinting ? 0.16 : 0.09, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(t);
  }

  // Police Whistle
  public playPoliceWhistle() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(2400, t);

    lfo.frequency.setValueAtTime(25, t); // 25 Hz flutter trill
    lfoGain.gain.setValueAtTime(120, t);

    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    lfo.start(t);
    osc.start(t);
    lfo.stop(t + 0.3);
    osc.stop(t + 0.3);
  }

  // CNG Engine Drone / Accel Sound
  public setCngEngine(active: boolean, speedNorm = 0) {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    if (active) {
      if (!this.cngOsc) {
        this.cngOsc = this.ctx.createOscillator();
        this.cngGain = this.ctx.createGain();
        this.cngOsc.type = 'sawtooth';
        this.cngGain.gain.setValueAtTime(0.12, this.ctx.currentTime);
        this.cngOsc.connect(this.cngGain);
        this.cngGain.connect(this.sfxGain);
        this.cngOsc.start();
      }
      if (this.cngOsc && this.cngGain && this.ctx) {
        const freq = 65 + speedNorm * 115;
        this.cngOsc.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.08);
        this.cngGain.gain.setTargetAtTime(0.1 + speedNorm * 0.08, this.ctx.currentTime, 0.08);
      }
    } else {
      if (this.cngOsc) {
        try {
          this.cngOsc.stop();
          this.cngOsc.disconnect();
        } catch {
          // Ignore
        }
        this.cngOsc = null;
        this.cngGain = null;
      }
    }
  }

  // Police Siren (Wanted Level >= 1)
  public setPoliceSiren(active: boolean) {
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    if (active && !this.isSirenPlaying) {
      this.isSirenPlaying = true;
      this.sirenOsc = this.ctx.createOscillator();
      this.sirenGain = this.ctx.createGain();
      this.sirenLfo = this.ctx.createOscillator();

      const lfoGain = this.ctx.createGain();
      this.sirenLfo.frequency.setValueAtTime(1.5, this.ctx.currentTime); // 1.5 Hz wail
      lfoGain.gain.setValueAtTime(220, this.ctx.currentTime); // modulate ±220 Hz

      this.sirenOsc.type = 'sine';
      this.sirenOsc.frequency.setValueAtTime(750, this.ctx.currentTime);

      this.sirenLfo.connect(lfoGain);
      lfoGain.connect(this.sirenOsc.frequency);

      this.sirenGain.gain.setValueAtTime(0.2, this.ctx.currentTime);

      this.sirenOsc.connect(this.sirenGain);
      this.sirenGain.connect(this.sfxGain);

      this.sirenLfo.start();
      this.sirenOsc.start();
    } else if (!active && this.isSirenPlaying) {
      this.isSirenPlaying = false;
      if (this.sirenGain && this.ctx) {
        this.sirenGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.2);
        setTimeout(() => {
          try {
            this.sirenOsc?.stop();
            this.sirenLfo?.stop();
            this.sirenOsc?.disconnect();
            this.sirenLfo?.disconnect();
          } catch {
            // ignore
          }
          this.sirenOsc = null;
          this.sirenLfo = null;
        }, 250);
      }
    }
  }

  // Non-blocking, Async Bengali Voiceover / Speech Synthesis
  // Debounced with zero main-thread block
  public speakBengali(text: string, pitch = 1.1, rate = 1.05) {
    if (this.isMuted) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const now = performance.now();
    if (now - this.lastVoiceTime < this.voiceCooldown) {
      return; // Debounce rapid speech requests to keep device responsive
    }
    this.lastVoiceTime = now;

    // Run completely decoupled from current frame
    setTimeout(() => {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.pitch = pitch;
        utterance.rate = rate;
        utterance.volume = 0.85;

        // Use pre-cached voices - NEVER call getVoices() synchronously on touch
        const voices = this.cachedVoices.length > 0 ? this.cachedVoices : window.speechSynthesis.getVoices();
        const bengaliVoice = voices.find(
          (v) =>
            v.lang.toLowerCase().includes('bn') ||
            v.lang.toLowerCase().includes('bd') ||
            v.lang.toLowerCase().includes('in')
        );
        if (bengaliVoice) {
          utterance.voice = bengaliVoice;
        }

        window.speechSynthesis.speak(utterance);
      } catch {
        // Graceful non-blocking fallback
      }
    }, 10);
  }

  // Start background Dhaka street announcements on megaphone
  public startDhakaMegaphone() {
    if (this.megaphoneInterval) return;

    const announcements = [
      'শুনুন শুনুন! তাজা ইলিশ মাছ মাত্র পাঁচশ টাকা!',
      'ভাই ভাই মিষ্টির দোকানে গরম জিলাপি ও চমচম পাওয়া যাচ্ছে!',
      'সাবধান! এলাকায় চোরের উৎপাত বেড়েছে!',
      'মায়ের দোয়া রিকশা গ্যারেজ, নতুন সিট কভার পাওয়া যায়!',
      'জরুরি ঘোষণা: সন্দেহভাজন চোর দেখলে পুলিশে খবর দিন!',
    ];

    let index = 0;
    this.megaphoneInterval = window.setInterval(() => {
      if (Math.random() > 0.4 && !this.isMuted) {
        const text = announcements[index % announcements.length];
        this.speakBengali(text, 1.25, 1.1);
        index++;
      }
    }, 32000);
  }

  public stopDhakaMegaphone() {
    if (this.megaphoneInterval) {
      clearInterval(this.megaphoneInterval);
      this.megaphoneInterval = null;
    }
  }

  public dispose() {
    this.stopDhakaMegaphone();
    this.setPoliceSiren(false);
    this.setCngEngine(false);
    if (this.ctx && this.ctx.state !== 'closed') {
      this.ctx.close().catch(() => {});
    }
  }
}

export const soundEngine = new SoundEngine();
