// audio.js — a tiny WebAudio synth so the kitchen has sound with no audio
// files at all. Every effect is a short oscillator or filtered-noise burst,
// created lazily on the first user gesture (browsers block audio before
// interaction). Mute is a single flag the game loop reads.

let ctx = null;
let muted = false;

export function setMuted(m) { muted = !!m; }
export function isMuted() { return muted; }

function audioCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, dur, type, vol, slideTo) {
  if (muted) return;
  const ac = audioCtx();
  if (!ac) return;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type || 'sine';
  osc.frequency.setValueAtTime(freq, ac.currentTime);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, ac.currentTime + dur);
  gain.gain.setValueAtTime(vol || 0.12, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start();
  osc.stop(ac.currentTime + dur + 0.02);
}

function noiseBurst(dur, vol, cutoff) {
  if (muted) return;
  const ac = audioCtx();
  if (!ac) return;
  const len = Math.floor(ac.sampleRate * dur);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ac.createBufferSource();
  src.buffer = buf;
  const filter = ac.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = cutoff || 1200;
  const gain = ac.createGain();
  gain.gain.setValueAtTime(vol || 0.1, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(ac.destination);
  src.start();
}

// One named effect per kitchen event, so main.js just says what happened.
export function playEffect(name) {
  if (muted) return;
  switch (name) {
    case 'pickup':
      tone(520, 0.09, 'triangle', 0.1, 700);
      break;
    case 'chop-start':
      noiseBurst(0.12, 0.16, 2400);
      break;
    case 'chop-done':
      tone(880, 0.08, 'triangle', 0.1);
      setTimeout(() => tone(1174, 0.1, 'triangle', 0.1), 70);
      break;
    case 'grill-start':
      noiseBurst(0.5, 0.06, 900); // the sizzle
      break;
    case 'stack':
      tone(392, 0.08, 'sine', 0.12, 523);
      break;
    case 'serve':
      tone(1046, 0.12, 'sine', 0.14);
      setTimeout(() => tone(1318, 0.16, 'sine', 0.14), 110);
      setTimeout(() => tone(1568, 0.22, 'sine', 0.12), 220);
      break;
    case 'wrong':
      tone(220, 0.25, 'sawtooth', 0.08, 140);
      break;
    case 'burnt':
      tone(180, 0.3, 'sawtooth', 0.07, 90);
      break;
    case 'error':
      tone(160, 0.12, 'square', 0.05, 120);
      break;
    case 'trash':
      noiseBurst(0.15, 0.08, 700);
      break;
    case 'tick':
      tone(980, 0.05, 'sine', 0.05);
      break;
    case 'level':
      [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 0.14, 'triangle', 0.12), i * 90));
      break;
    default:
      break;
  }
}
