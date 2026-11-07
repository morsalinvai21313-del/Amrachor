/**
 * Amra Chor - Procedural Web Audio Sound Engine
 * All sound effects generated via Web Audio API oscillators and noise buffers.
 * Includes Bengali megaphone announcements and speech synthesis.
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

  private megaphoneInterval: number | null = null;

  constructor() {
    // Lazy initialized on first user interaction
  }

  private initContext() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();
      this.masterGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();

      this.masterGain.connect(this.ctx.destination);
      this.sfxGain.connect(this.masterGain);

      this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.sfxGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
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
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.7, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  // Cartoon Slap / Punch Sound ("ঢিসুম!")
  public playPunch() {
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(35, t + 0.18);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, t);

    gain.gain.setValueAtTime(0.9, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.18);

    // Punch white noise crack
    const bufferSize = this.ctx.sampleRate * 0.08;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.6, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);

    noise.connect(noiseGain);
    noiseGain.connect(this.sfxGain);
    noise.start(t);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.2);
  }

  // Rickshaw Bell ("টিং টিং!")
  public playRickshawBell() {
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const chime = (delay: number, freq: number) => {
      if (!this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime + delay;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.25);
    };

    chime(0, 1950);
    chime(0.1, 2300);
  }

  // Dhaka Car / Bus Horn ("প্যাঁ প্যাঁ!")
  public playHorn() {
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'sawtooth';
    osc1.frequency.setValueAtTime(370, t);
    osc2.frequency.setValueAtTime(460, t);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.setValueAtTime(0.35, t + 0.25);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.sfxGain);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.3);
    osc2.stop(t + 0.3);
  }

  // Money Coin / Cash Pickup ("খন খন!")
  public playCoin() {
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(987, t); // B5
    osc.frequency.setValueAtTime(1318, t + 0.08); // E6

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.35);
  }

  // Jump Sound
  public playJump() {
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(420, t + 0.15);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.18);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.2);
  }

  // Footstep Sound
  public playFootstep(isSprinting: boolean) {
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.04;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(isSprinting ? 600 : 400, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(isSprinting ? 0.18 : 0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(t);
  }

  // CNG Engine Drone / Accel Sound
  private cngOsc: OscillatorNode | null = null;
  private cngGain: GainNode | null = null;

  public setCngEngine(active: boolean, speedNorm: number = 0) {
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

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
        const freq = 65 + speedNorm * 110;
        this.cngOsc.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.1);
        this.cngGain.gain.setTargetAtTime(0.1 + speedNorm * 0.08, this.ctx.currentTime, 0.1);
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

  // Bengali Voiceover / Speech Synthesis for comical dialogues
  public speakBengali(text: string, pitch = 1.1, rate = 1.05) {
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.pitch = pitch;
      utterance.rate = rate;
      utterance.volume = this.isMuted ? 0 : 0.9;

      const voices = window.speechSynthesis.getVoices();
      const bengaliVoice = voices.find(v => v.lang.includes('bn') || v.lang.includes('bd') || v.lang.includes('in'));
      if (bengaliVoice) {
        utterance.voice = bengaliVoice;
      }
      window.speechSynthesis.speak(utterance);
    } catch {
      // Graceful fallback
    }
  }

  // Start background Dhaka street announcements on megaphone
  public startDhakaMegaphone() {
    if (this.megaphoneInterval) return;

    const announcements = [
      'শুনুন শুনুন! তাজা ইলিশ মাছ মাত্র পাঁচশ টাকা!',
      'ভাই ভাই মিষ্টির দোকানে গরম জিলাপি ও চমচম পাওয়া যাচ্ছে!',
      'সাবধান! এলাকায় চোরের উৎপাত বেড়েছে!',
      'মায়ের দোয়া রিকশা গ্যারেজ, নতুন সিট কভার পাওয়া যায়!',
      'পুলিশের জরুরি ঘোষণা: সন্দেহভাজন চোর দেখলে পুলিশে খবর দিন!',
    ];

    let index = 0;
    this.megaphoneInterval = window.setInterval(() => {
      if (Math.random() > 0.4 && !this.isMuted) {
        const text = announcements[index % announcements.length];
        this.speakBengali(text, 1.25, 1.1);
        index++;
      }
    }, 28000);
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
      this.ctx.close();
    }
  }
}

export const soundEngine = new SoundEngine();
