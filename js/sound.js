// Tiny Web Audio synth for SFX. No external files.

let ctx = null;
let muted = false;

function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) ctx = new AC();
  }
  return ctx;
}

export function setMuted(m) { muted = m; }
export function isMuted() { return muted; }

export function resumeAudio() {
  const c = ac();
  if (c && c.state === 'suspended') c.resume();
}

function tone({ freq = 440, type = 'sine', dur = 0.1, vol = 0.15, freqEnd = null, delay = 0 }) {
  if (muted) return;
  const c = ac(); if (!c) return;
  const t0 = c.currentTime + delay;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (freqEnd !== null) osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), t0 + dur);
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(vol, t0 + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

function noise({ dur = 0.12, vol = 0.12, filter = 800 }) {
  if (muted) return;
  const c = ac(); if (!c) return;
  const t0 = c.currentTime;
  const bufferSize = Math.floor(c.sampleRate * dur);
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  const src = c.createBufferSource();
  src.buffer = buffer;
  const bp = c.createBiquadFilter();
  bp.type = 'lowpass';
  bp.frequency.value = filter;
  const g = c.createGain();
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(bp).connect(g).connect(c.destination);
  src.start(t0);
}

// Named SFX
export const sfx = {
  shoot()    { tone({ freq: 900, freqEnd: 500, type: 'square',   dur: 0.06, vol: 0.05 }); },
  laser()    { tone({ freq: 1400, freqEnd: 1200, type: 'sawtooth', dur: 0.05, vol: 0.05 }); },
  cannon()   { tone({ freq: 220, freqEnd: 80,  type: 'triangle', dur: 0.2, vol: 0.18 }); noise({ dur: 0.18, vol: 0.12, filter: 400 }); },
  zap()      { tone({ freq: 1800, freqEnd: 300, type: 'sawtooth', dur: 0.15, vol: 0.08 }); },
  freeze()   { tone({ freq: 1200, freqEnd: 900, type: 'sine',    dur: 0.12, vol: 0.07 }); },
  poison()   { tone({ freq: 420, freqEnd: 200, type: 'square',   dur: 0.18, vol: 0.05 }); },
  enemyDie() { tone({ freq: 320, freqEnd: 100, type: 'square',   dur: 0.12, vol: 0.08 }); },
  bossDie()  { tone({ freq: 520, freqEnd: 120, type: 'sawtooth', dur: 0.5,  vol: 0.2 }); noise({ dur: 0.4, vol: 0.15, filter: 500 }); },
  leak()     { tone({ freq: 220, freqEnd: 120, type: 'square',   dur: 0.25, vol: 0.15 }); },
  place()    { tone({ freq: 700, freqEnd: 950, type: 'triangle', dur: 0.12, vol: 0.1 }); },
  upgrade()  { tone({ freq: 550, freqEnd: 1100, type: 'triangle', dur: 0.18, vol: 0.12 }); },
  sell()     { tone({ freq: 600, freqEnd: 350, type: 'triangle', dur: 0.16, vol: 0.1 }); },
  wave()     { tone({ freq: 520, type: 'triangle', dur: 0.18, vol: 0.12 }); tone({ freq: 780, type: 'triangle', dur: 0.24, vol: 0.1, delay: 0.12 }); },
  boss()     { tone({ freq: 120, type: 'sawtooth', dur: 0.4, vol: 0.25 }); tone({ freq: 180, type: 'sawtooth', dur: 0.4, vol: 0.2, delay: 0.1 }); },
  gameOver() { tone({ freq: 440, freqEnd: 120, type: 'sawtooth', dur: 0.9, vol: 0.2 }); },
  error()    { tone({ freq: 220, type: 'square', dur: 0.12, vol: 0.1 }); },
};
