/**
 * Retro-style Web Audio API sound synthesiser for portfolio game mode.
 * Generates sound effects purely via code to avoid broken external asset dependencies.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  // Resume context in case it was suspended by browser autoplay policy
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Plays a quick high-pitch subtle retro blip (ideal for cursor button clicks).
 */
export function playClickSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'sine'; // Soft round sine wave
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.08);

    gainNode.gain.setValueAtTime(0.04, ctx.currentTime); // keep it extremely subtle and pleasant
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  } catch (e) {
    console.warn("Audio failure:", e);
  }
}

/**
 * Plays a beautiful dual-tone electronic chime (when the player unlocks/enters a zone).
 * Fine-tuned 'C5-E5-G5' transition with tight, responsive micro-timing (50ms offsets).
 */
export function playNewZoneSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const baseTime = ctx.currentTime;

    // Snappy chime synth with elegant soft decay envelopes
    const playNote = (freq: number, startTime: number, duration: number) => {
      // Create a hybrid tone using dual oscillators: physical triangle shape + elegant sine shape
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc1.type = 'triangle'; // Mellow retro body
      osc1.frequency.setValueAtTime(freq, startTime);

      osc2.type = 'sine'; // Soft, pure glassy high frequency
      osc2.frequency.setValueAtTime(freq * 1.002, startTime); // Subtle detuning for chorused depth

      // High quality attack-decay output gain control
      gainNode.gain.setValueAtTime(0, startTime);
      // Fast attack level ramp (instant, 5ms)
      gainNode.gain.linearRampToValueAtTime(0.05, startTime + 0.005);
      // Beautiful exponential decay envelope mapping to zero
      gainNode.gain.exponentialRampToValueAtTime(0.0005, startTime + duration);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc1.start(startTime);
      osc2.start(startTime);
      
      osc1.stop(startTime + duration + 0.05);
      osc2.stop(startTime + duration + 0.05);
    };

    // Fast, perfectly synchronized musical upward chord sequence (50ms spacing)
    playNote(523.25, baseTime, 0.12);        // C5
    playNote(659.25, baseTime + 0.055, 0.15); // E5
    playNote(783.99, baseTime + 0.11, 0.22);  // G5
  } catch (e) {
    console.warn("Audio failure:", e);
  }
}

/**
 * Plays a deep soft teleport sweep sound (when quick teleport buttons are pressed).
 */
export function playTeleportSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.3);

    gainNode.gain.setValueAtTime(0.03, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch (e) {
    console.warn("Audio failure:", e);
  }
}
