/**
 * Plays a pleasant success chime using the Web Audio API.
 * No external audio files required.
 */
export const playOrderSuccessSound = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    const playTone = (freq: number, startTime: number, duration: number, gain: number) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, startTime);
      g.gain.setValueAtTime(0, startTime);
      g.gain.linearRampToValueAtTime(gain, startTime + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    // Pleasant ascending chime: C5 → E5 → G5 → C6
    playTone(523.25, now, 0.25, 0.15);        // C5
    playTone(659.25, now + 0.12, 0.25, 0.15); // E5
    playTone(783.99, now + 0.24, 0.3, 0.15);  // G5
    playTone(1046.5, now + 0.38, 0.5, 0.12);  // C6 (longer, softer)

    // Clean up after sound finishes
    setTimeout(() => ctx.close(), 1500);
  } catch (e) {
    // Silently fail if audio is not supported
    console.warn("Could not play order success sound:", e);
  }
};
