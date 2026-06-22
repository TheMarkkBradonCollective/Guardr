/** Motorola-style walkie-talkie roger beep for Guardr alerts. */
export const WALKIE_CHIRP_SOUND_URL = '/sounds/walkie-chirp.wav';

let audioContext: AudioContext | null = null;
let cachedBuffer: AudioBuffer | null = null;
let loadingBuffer: Promise<AudioBuffer | null> | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioContext) {
    const Ctx = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;
    audioContext = new Ctx();
  }
  return audioContext;
}

async function loadWalkieChirpBuffer(): Promise<AudioBuffer | null> {
  if (cachedBuffer) return cachedBuffer;
  if (loadingBuffer) return loadingBuffer;

  loadingBuffer = (async () => {
    const ctx = getAudioContext();
    if (!ctx) return null;
    try {
      const res = await fetch(WALKIE_CHIRP_SOUND_URL);
      if (!res.ok) return null;
      const data = await res.arrayBuffer();
      cachedBuffer = await ctx.decodeAudioData(data.slice(0));
      return cachedBuffer;
    } catch {
      return null;
    } finally {
      loadingBuffer = null;
    }
  })();

  return loadingBuffer;
}

/** Synthesized fallback when the WAV cannot be loaded (offline, etc.). */
function playSyntheticChirp(ctx: AudioContext): void {
  const now = ctx.currentTime;
  const gain = ctx.createGain();
  gain.gain.value = 0.35;
  gain.connect(ctx.destination);

  const playTone = (freq: number, start: number, duration: number) => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const toneGain = ctx.createGain();
    toneGain.gain.setValueAtTime(0, now + start);
    toneGain.gain.linearRampToValueAtTime(1, now + start + 0.008);
    toneGain.gain.linearRampToValueAtTime(0, now + start + duration);
    osc.connect(toneGain);
    toneGain.connect(gain);
    osc.start(now + start);
    osc.stop(now + start + duration + 0.01);
  };

  playTone(2130, 0, 0.07);
  playTone(1850, 0.105, 0.09);
}

/** Play the walkie-talkie chirp for an incoming notification or message. */
export async function playWalkieChirpSound(): Promise<void> {
  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === 'suspended') {
    try {
      await ctx.resume();
    } catch {
      return;
    }
  }

  const buffer = await loadWalkieChirpBuffer();
  if (buffer) {
    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    gain.gain.value = 0.85;
    source.buffer = buffer;
    source.connect(gain);
    gain.connect(ctx.destination);
    source.start();
    return;
  }

  playSyntheticChirp(ctx);
}

/** Prime audio during a user gesture so later alerts can play without blocking. */
export function primeWalkieChirpSound(): void {
  void loadWalkieChirpBuffer();
  const ctx = getAudioContext();
  if (ctx?.state === 'suspended') {
    void ctx.resume();
  }
}
