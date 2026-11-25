// main.js — boot, game loop, screens and the shift timer. It wires the
// kitchen state to the renderer and the input, and stages demo states for
// screenshots (?demo=start|mid|rush|over). Normal play never uses a demo.

import { newKitchen, startShift, updateKitchen } from './kitchen.js';
import { render } from './render.js';
import { bindInput } from './input.js';
import { playEffect, setMuted, isMuted } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');

const k = newKitchen();
k.demo = demoFromUrl();

// Exposed for automated play-testing only (never read by the game itself).
window.__kitchen = k;

function demoFromUrl() {
  const q = new URLSearchParams(window.location.search);
  return q.get('demo') || q.get('shot') || null;
}

// Stage a fixed scene for a screenshot: same kitchen, same code path as
// real play, just with the state pre-set so the shot shows the moment.
function stageDemo(mode) {
  if (mode === 'start' || !mode) return; // title screen is the default
  startShift(k);
  if (mode === 'mid') {
    // Two tickets waiting, a half-built burger on the plate, tomato in hand.
    k.timeLeft = 92;
    k.elapsed = 58;
    k.score = 340;
    k.served = 3;
    k.combo = 2;
    k.plate = ['bun', 'beef:cooked'];
    k.hand = 'tomato:chopped';
    k.handLabel = 'Tomat Cincang';
    k.chopping = null;
    k.grill = { state: 'cooking', t: 2.6 };
    k.message = 'Rakit burgernya sesuai pesanan, lalu bunyikan bel saji!';
    k.messageT = 99;
  } else if (mode === 'rush') {
    // A complete burger on the plate, bell ready, four tickets, clock low.
    k.timeLeft = 34;
    k.elapsed = 116;
    k.score = 1240;
    k.served = 9;
    k.combo = 3;
    k.bestCombo = 4;
    k.level = 3;
    const target = k.orders[0];
    if (target) k.plate = [...target.recipe.needs];
    k.grill = { state: 'done', t: 1.2 };
    k.message = 'SIAP SAJI! Bunyikan bel sebelum pelanggan pergi!';
    k.messageT = 99;
  } else if (mode === 'over') {
    k.timeLeft = 0;
    k.score = 1480;
    k.served = 11;
    k.failed = 2;
    k.bestCombo = 5;
    k.screen = 'over';
  }
  if (mode === 'mid' || mode === 'rush') {
    // Make the tickets deterministic-ish for the shot: keep the ones the
    // shift spawned, they already show real recipes and patience bars.
  }
}

function announceStatus() {
  if (!statusEl) return;
  if (k.screen === 'playing') {
    statusEl.textContent = 'Skor ' + k.score + ', ' + k.orders.length + ' pesanan menunggu, waktu tersisa ' + Math.ceil(k.timeLeft) + ' detik.';
  } else if (k.screen === 'over') {
    statusEl.textContent = 'Shift selesai. Skor akhir ' + k.score + ', ' + k.served + ' burger tersaji.';
  } else {
    statusEl.textContent = 'Dapur Kilat: game memasak. Klik untuk mulai.';
  }
}

function start() {
  playEffect('serve');
  startShift(k);
  announceStatus();
}

const hooks = {
  start,
  resume() { if (k.screen === 'paused') { k.screen = 'playing'; announceStatus(); } },
  togglePause() {
    if (k.screen === 'playing') { k.screen = 'paused'; announceStatus(); }
    else if (k.screen === 'paused') { k.screen = 'playing'; announceStatus(); }
  },
  toggleMute() {
    setMuted(!isMuted());
    k.muted = isMuted();
  },
};

bindInput(canvas, k, hooks);

// Fit the 1280x800 canvas into the window while keeping its shape.
function fitCanvas() {
  const scale = Math.min(window.innerWidth / 1280, window.innerHeight / 800);
  canvas.style.width = Math.floor(1280 * scale) + 'px';
  canvas.style.height = Math.floor(800 * scale) + 'px';
}
window.addEventListener('resize', fitCanvas);
fitCanvas();

stageDemo(k.demo);
announceStatus();

// Main loop: fixed logical step, render every frame.
let last = performance.now();
let statusTick = 0;
let lastTickSecond = -1;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  const wasChopping = !!k.chopping;
  const wasGrillCooking = k.grill && k.grill.state === 'cooking';
  updateKitchen(k, dt);
  if (wasChopping && !k.chopping && k.screen === 'playing') playEffect('chop-done');
  if (wasGrillCooking && k.grill && k.grill.state === 'done') playEffect('tick');
  if (k.screen === 'playing') {
    const sec = Math.ceil(k.timeLeft);
    if (sec !== lastTickSecond) {
      lastTickSecond = sec;
      if (sec <= 10 && sec > 0) playEffect('tick');
    }
  }
  render(ctx, k);
  statusTick += dt;
  if (statusTick > 2) { statusTick = 0; announceStatus(); }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
