// input.js — mouse and keyboard onto kitchen actions. The canvas is scaled
// to fit the window, so pointer coordinates are mapped back into the
// 1280x800 game space before hit-testing a station.

import { stationAt, clickStation, pickIngredient, useBoard, useGrill, usePlate, useBell, useBin } from './kitchen.js';
import { playEffect } from './audio.js';

export function canvasPoint(canvas, clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (clientX - rect.left) * (1280 / rect.width),
    y: (clientY - rect.top) * (800 / rect.height),
  };
}

const SOUND_FOR = {
  pickup: 'pickup',
  'chop-start': 'chop-start',
  'grill-start': 'grill-start',
  stack: 'stack',
  serve: 'serve',
  wrong: 'wrong',
  burnt: 'burnt',
  error: 'error',
  trash: 'trash',
};

export function handleResult(result) {
  const sound = SOUND_FOR[result];
  if (sound) playEffect(sound);
}

export function bindInput(canvas, k, hooks) {
  canvas.addEventListener('pointermove', (e) => {
    k.mouse = canvasPoint(canvas, e.clientX, e.clientY);
  });
  canvas.addEventListener('pointerleave', () => { k.mouse = null; });
  canvas.addEventListener('pointerdown', (e) => {
    const p = canvasPoint(canvas, e.clientX, e.clientY);
    k.mouse = p;
    if (k.screen === 'title' || k.screen === 'over') {
      hooks.start();
      return;
    }
    if (k.screen === 'paused') {
      hooks.resume();
      return;
    }
    const name = stationAt(p.x, p.y);
    if (name) handleResult(clickStation(k, name));
  });

  window.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    const key = e.key.toLowerCase();
    if (k.screen === 'title' || k.screen === 'over') {
      if (key === 'enter' || key === ' ') { e.preventDefault(); hooks.start(); }
      return;
    }
    if (key === 'p') { hooks.togglePause(); return; }
    if (k.screen !== 'playing') return;
    const ingredientKeys = { 1: 'bun', 2: 'beef', 3: 'tomato', 4: 'lettuce', 5: 'cheese', 6: 'sauce' };
    if (ingredientKeys[key]) { handleResult(pickIngredient(k, ingredientKeys[key])); return; }
    if (key === 'c') { handleResult(useBoard(k)); return; }
    if (key === 'g') { handleResult(useGrill(k)); return; }
    if (key === 'a') { handleResult(usePlate(k)); return; }
    if (key === 's') { handleResult(useBell(k)); return; }
    if (key === 't') { handleResult(useBin(k)); return; }
    if (key === 'm') { hooks.toggleMute(); return; }
  });
}
