// render.js — every pixel of the kitchen, drawn on one canvas. No images,
// no fonts from the network: all food, the chef and the counters are shapes
// and system fonts, so the game renders identically offline.

import { INGREDIENTS, baseId } from './recipes.js';
import { STATIONS, VIEW_W, VIEW_H, SHIFT_SECONDS, plateReadyOrder } from './kitchen.js';

const FONT = "'Trebuchet MS', 'Segoe UI', Verdana, sans-serif";

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, weight, align) {
  ctx.fillStyle = color;
  ctx.font = (weight || 'bold') + ' ' + size + 'px ' + FONT;
  ctx.textAlign = align || 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

// --- food ------------------------------------------------------------------

export function drawIngredient(ctx, stacked, x, y, s) {
  const base = baseId(stacked);
  const ing = INGREDIENTS[base];
  if (!ing) return;
  ctx.save();
  ctx.translate(x, y);
  const u = s / 40; // unit scale, art drawn in a 40px box
  if (base === 'bun') {
    ctx.fillStyle = '#e8a54b';
    rr(ctx, -18 * u, -8 * u, 36 * u, 16 * u, 8 * u); ctx.fill();
    ctx.fillStyle = '#f7cf8a';
    rr(ctx, -18 * u, -14 * u, 36 * u, 10 * u, 5 * u); ctx.fill();
    ctx.fillStyle = '#fff3d6';
    for (const [dx, dy] of [[-10, -10], [0, -12], [10, -10], [-5, -8], [6, -8]]) {
      ctx.beginPath(); ctx.ellipse(dx * u, dy * u, 1.8 * u, 1.1 * u, 0, 0, Math.PI * 2); ctx.fill();
    }
  } else if (base === 'beef') {
    const cooked = stacked === 'beef:cooked';
    const burnt = stacked === 'beef:burnt';
    ctx.fillStyle = burnt ? '#2b1a12' : cooked ? '#6b3a1f' : '#a85a68';
    rr(ctx, -19 * u, -8 * u, 38 * u, 16 * u, 8 * u); ctx.fill();
    if (cooked && !burnt) {
      ctx.strokeStyle = '#4a2412';
      ctx.lineWidth = 2 * u;
      for (const dx of [-10, 0, 10]) {
        ctx.beginPath(); ctx.moveTo(dx * u, -6 * u); ctx.lineTo(dx * u, 6 * u); ctx.stroke();
      }
    }
    if (!cooked && !burnt) {
      ctx.fillStyle = '#c97a86';
      ctx.beginPath(); ctx.ellipse(-6 * u, -2 * u, 5 * u, 3 * u, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(7 * u, 2 * u, 4 * u, 2.5 * u, 0, 0, Math.PI * 2); ctx.fill();
    }
  } else if (base === 'tomato') {
    const chopped = stacked === 'tomato:chopped';
    ctx.fillStyle = '#e0483e';
    if (chopped) {
      for (const [dx, dy] of [[-9, -2], [9, -2], [0, 4]]) {
        ctx.beginPath(); ctx.arc(dx * u, dy * u, 8 * u, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = '#ff8a7a';
      for (const [dx, dy] of [[-9, -2], [9, -2], [0, 4]]) {
        ctx.beginPath(); ctx.arc(dx * u, dy * u, 4 * u, 0, Math.PI * 2); ctx.fill();
      }
    } else {
      ctx.beginPath(); ctx.arc(0, 0, 14 * u, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ff8a7a';
      ctx.beginPath(); ctx.arc(-4 * u, -4 * u, 6 * u, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#3c8a2e';
      ctx.beginPath(); ctx.ellipse(0, -14 * u, 5 * u, 2.5 * u, 0, 0, Math.PI * 2); ctx.fill();
    }
  } else if (base === 'lettuce') {
    const chopped = stacked === 'lettuce:chopped';
    ctx.fillStyle = '#5fbf4a';
    if (chopped) {
      for (const [dx, dy] of [[-11, 0], [0, -3], [11, 0]]) {
        ctx.beginPath(); ctx.ellipse(dx * u, dy * u, 9 * u, 5 * u, 0, 0, Math.PI * 2); ctx.fill();
      }
      ctx.strokeStyle = '#3c8a2e'; ctx.lineWidth = 1.5 * u;
      ctx.beginPath(); ctx.moveTo(-18 * u, 0); ctx.lineTo(18 * u, 0); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.ellipse(0, 0, 17 * u, 11 * u, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#8edd6a';
      ctx.beginPath(); ctx.ellipse(-4 * u, -3 * u, 10 * u, 6 * u, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#3c8a2e'; ctx.lineWidth = 1.5 * u;
      ctx.beginPath(); ctx.moveTo(-14 * u, 0); ctx.quadraticCurveTo(0, -6 * u, 14 * u, 0); ctx.stroke();
    }
  } else if (base === 'cheese') {
    ctx.fillStyle = '#f5c542';
    ctx.beginPath();
    ctx.moveTo(-17 * u, 8 * u); ctx.lineTo(17 * u, 8 * u); ctx.lineTo(0, -12 * u);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#d99e18';
    for (const [dx, dy] of [[-7, 2], [5, 3], [0, -4]]) {
      ctx.beginPath(); ctx.arc(dx * u, dy * u, 2 * u, 0, Math.PI * 2); ctx.fill();
    }
  } else if (base === 'sauce') {
    ctx.fillStyle = '#d94f2b';
    ctx.beginPath();
    ctx.moveTo(-16 * u, 6 * u);
    ctx.quadraticCurveTo(-8 * u, -10 * u, 0, 4 * u);
    ctx.quadraticCurveTo(8 * u, -10 * u, 16 * u, 6 * u);
    ctx.quadraticCurveTo(0, 12 * u, -16 * u, 6 * u);
    ctx.fill();
    ctx.fillStyle = '#ff8a6a';
    ctx.beginPath(); ctx.ellipse(-5 * u, 0, 4 * u, 2 * u, -0.4, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

// A finished-looking burger stacked on the plate, bottom ingredient first.
export function drawBurgerStack(ctx, plate, cx, baseY, s) {
  let y = baseY;
  const gap = 13 * (s / 40);
  for (let i = 0; i < plate.length; i++) {
    drawIngredient(ctx, plate[i], cx, y, s);
    y -= gap;
  }
  // A little flag on top when the stack is complete enough to serve.
  if (plate.length >= 3) {
    ctx.strokeStyle = '#5a3d1e';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx + 14, y + 8); ctx.lineTo(cx + 14, y - 14); ctx.stroke();
    ctx.fillStyle = '#ff5e4d';
    ctx.beginPath(); ctx.moveTo(cx + 14, y - 14); ctx.lineTo(cx + 30, y - 9); ctx.lineTo(cx + 14, y - 4); ctx.closePath(); ctx.fill();
  }
}

// --- kitchen ----------------------------------------------------------------

function drawRoom(ctx, k) {
  // Warm wall above, checker floor below.
  ctx.fillStyle = '#f2c184';
  ctx.fillRect(0, 0, VIEW_W, 150);
  ctx.fillStyle = '#e8a76a';
  for (let x = 0; x < VIEW_W; x += 90) ctx.fillRect(x, 146, 90, 4);
  ctx.fillStyle = '#c98d5f';
  ctx.fillRect(0, 150, VIEW_W, 6);
  // A row of warm tiles trims the top of the wall, behind the ticket rail.
  ctx.fillStyle = '#d9a05f';
  for (let x = 0; x < VIEW_W; x += 60) ctx.fillRect(x, 138, 52, 8);
  const tile = 64;
  for (let ty = 156; ty < VIEW_H; ty += tile) {
    for (let tx = 0; tx < VIEW_W; tx += tile) {
      const even = ((tx / tile) + (ty / tile)) % 2 === 0;
      ctx.fillStyle = even ? '#efe3cf' : '#e2cfae';
      ctx.fillRect(tx, ty, tile, tile);
    }
  }
}

function drawTickets(ctx, k) {
  text(ctx, 'ORDER BOARD', 34, 12, 13, '#7a4a1e', 'bold', 'left');
  if (k.orders.length === 0) {
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    rr(ctx, 30, 26, 950, 104, 12); ctx.fill();
    text(ctx, 'Belum ada pesanan — santai dulu, chef!', 60, 78, 20, '#8a6a3e');
    return;
  }
  k.orders.forEach((o, i) => {
    const x = 30 + i * 242;
    const y = 26;
    const w = 230;
    const h = 108;
    const frac = Math.max(0, o.patience / o.maxPatience);
    const urgent = frac < 0.35;
    ctx.save();
    if (urgent && Math.floor(k.elapsed * 4) % 2 === 0) ctx.translate(0, 2);
    ctx.fillStyle = '#fffdf6';
    rr(ctx, x, y, w, h, 12); ctx.fill();
    ctx.strokeStyle = urgent ? '#e0483e' : '#d9b06a';
    ctx.lineWidth = urgent ? 3 : 2;
    rr(ctx, x, y, w, h, 12); ctx.stroke();
    text(ctx, '#' + o.id + '  ' + o.recipe.name.toUpperCase(), x + 12, y + 18, 15, '#3a2a18');
    // Ingredient icons for the recipe.
    o.recipe.needs.forEach((need, j) => {
      drawIngredient(ctx, need, x + 26 + j * 34, y + 52, 30);
    });
    // Patience bar.
    ctx.fillStyle = '#e8dcc8';
    rr(ctx, x + 12, y + 84, w - 24, 12, 6); ctx.fill();
    ctx.fillStyle = frac > 0.5 ? '#5fbf4a' : frac > 0.25 ? '#f5a623' : '#e0483e';
    if (frac > 0) { rr(ctx, x + 12, y + 84, (w - 24) * frac, 12, 6); ctx.fill(); }
    text(ctx, Math.ceil(o.patience) + ' dtk', x + w - 12, y + 18, 12, urgent ? '#e0483e' : '#8a6a3e', 'bold', 'right');
    ctx.restore();
  });
}

function drawScorePanel(ctx, k) {
  const x = 1010, y = 8, w = 240, h = 106;
  ctx.fillStyle = '#3a2a18';
  rr(ctx, x, y, w, h, 12); ctx.fill();
  const mm = Math.floor(k.timeLeft / 60);
  const ss = Math.floor(k.timeLeft % 60).toString().padStart(2, '0');
  const lowTime = k.timeLeft < 30 && k.screen === 'playing';
  text(ctx, 'WAKTU  ' + mm + ':' + ss, x + w / 2, y + 24, 26, lowTime ? '#ff8a7a' : '#ffe9a8', 'bold', 'center');
  text(ctx, 'SKOR  ' + k.score, x + 16, y + 54, 18, '#ffffff');
  text(ctx, 'Tersaji ' + k.served + '   Kombo x' + Math.max(1, k.combo), x + 16, y + 80, 15, '#ffd34d');
  text(ctx, 'RUSH LEVEL ' + k.level, x + 16, y + 100, 13, '#9fe8ff');
}

function drawCrate(ctx, k, name) {
  const s = STATIONS[name];
  const ing = INGREDIENTS[s.ing];
  const hover = k.mouse && k.mouse.x >= s.x && k.mouse.x <= s.x + s.w && k.mouse.y >= s.y && k.mouse.y <= s.y + s.h;
  ctx.fillStyle = hover ? '#8a5a2e' : '#6b4423';
  rr(ctx, s.x, s.y, s.w, s.h, 12); ctx.fill();
  ctx.fillStyle = '#a9743f';
  rr(ctx, s.x + 6, s.y + 6, s.w - 12, s.h - 12, 9); ctx.fill();
  ctx.fillStyle = '#7d5027';
  ctx.fillRect(s.x + 6, s.y + 6, s.w - 12, 10);
  drawIngredient(ctx, ing.id, s.x + s.w / 2, s.y + 58, 62);
  text(ctx, ing.name.toUpperCase(), s.x + s.w / 2, s.y + 112, 16, '#fff3dc', 'bold', 'center');
  text(ctx, '[' + { bun: '1', beef: '2', tomato: '3', lettuce: '4', cheese: '5', sauce: '6' }[name] + ']', s.x + s.w / 2, s.y + 130, 12, '#e8c890', 'bold', 'center');
}

function drawBoard(ctx, k) {
  const s = STATIONS.board;
  ctx.fillStyle = '#8a5a2e';
  rr(ctx, s.x - 6, s.y - 6, s.w + 12, s.h + 12, 12); ctx.fill();
  ctx.fillStyle = '#f7e8c8';
  rr(ctx, s.x, s.y, s.w, s.h, 10); ctx.fill();
  ctx.strokeStyle = '#d9c49a';
  ctx.lineWidth = 2;
  for (let i = 1; i < 4; i++) {
    ctx.beginPath(); ctx.moveTo(s.x + 12, s.y + i * 30); ctx.lineTo(s.x + s.w - 12, s.y + i * 30); ctx.stroke();
  }
  text(ctx, 'TALENAN  [C]', s.x + s.w / 2, s.y + 16, 14, '#7a5a2e', 'bold', 'center');
  if (k.chopping) {
    const ing = INGREDIENTS[k.chopping.ing];
    drawIngredient(ctx, k.chopping.ing, s.x + 70, s.y + 68, 56);
    // Knife.
    ctx.save();
    ctx.translate(s.x + 150, s.y + 62);
    ctx.rotate(-0.5 + Math.sin(k.elapsed * 18) * 0.25);
    ctx.fillStyle = '#cfd6dd';
    rr(ctx, 0, -6, 64, 12, 4); ctx.fill();
    ctx.fillStyle = '#3a2a18';
    rr(ctx, -26, -5, 26, 10, 4); ctx.fill();
    ctx.restore();
    const frac = Math.min(1, k.chopping.t / 1.4);
    ctx.fillStyle = '#e8dcc8';
    rr(ctx, s.x + 20, s.y + 104, s.w - 40, 10, 5); ctx.fill();
    ctx.fillStyle = '#5fbf4a';
    rr(ctx, s.x + 20, s.y + 104, (s.w - 40) * frac, 10, 5); ctx.fill();
    text(ctx, 'Mencincang ' + ing.name + '...', s.x + s.w / 2, s.y + 84, 13, '#5a3d1e', 'bold', 'center');
  } else {
    text(ctx, 'Tomat & selada', s.x + s.w / 2, s.y + 58, 14, '#8a6a3e', 'bold', 'center');
    text(ctx, 'dicincang di sini', s.x + s.w / 2, s.y + 80, 14, '#8a6a3e', 'bold', 'center');
    drawIngredient(ctx, 'tomato', s.x + 70, s.y + 100, 34);
    drawIngredient(ctx, 'lettuce', s.x + 150, s.y + 100, 34);
  }
}

function drawGrill(ctx, k) {
  const s = STATIONS.grill;
  ctx.fillStyle = '#4a4a52';
  rr(ctx, s.x - 6, s.y - 6, s.w + 12, s.h + 12, 12); ctx.fill();
  ctx.fillStyle = '#2e2e33';
  rr(ctx, s.x, s.y, s.w, s.h, 10); ctx.fill();
  ctx.strokeStyle = '#55555e';
  ctx.lineWidth = 5;
  for (let i = 0; i < 5; i++) {
    const gy = s.y + 22 + i * 24;
    ctx.beginPath(); ctx.moveTo(s.x + 12, gy); ctx.lineTo(s.x + s.w - 12, gy); ctx.stroke();
  }
  text(ctx, 'PANGGANGAN  [G]', s.x + s.w / 2, s.y + 16, 14, '#ffb46a', 'bold', 'center');
  if (k.grill) {
    const cx = s.x + s.w / 2;
    const cy = s.y + 78;
    if (k.grill.state === 'burnt') {
      drawIngredient(ctx, 'beef:burnt', cx, cy, 70);
      text(ctx, 'GOSONG! Ambil & buang', cx, s.y + 126, 14, '#ff8a7a', 'bold', 'center');
    } else {
      drawIngredient(ctx, k.grill.state === 'done' ? 'beef:cooked' : 'beef', cx, cy, 70);
      const frac = k.grill.state === 'done' ? 1 : Math.min(1, k.grill.t / 5.0);
      ctx.fillStyle = '#e8dcc8';
      rr(ctx, s.x + 20, s.y + 118, s.w - 40, 10, 5); ctx.fill();
      ctx.fillStyle = k.grill.state === 'done' ? '#7be07b' : '#ff9a3d';
      rr(ctx, s.x + 20, s.y + 118, (s.w - 40) * frac, 10, 5); ctx.fill();
      text(ctx, k.grill.state === 'done' ? 'MATANG! Cepat ambil!' : 'Memanggang...', cx, s.y + 138, 13, k.grill.state === 'done' ? '#7be07b' : '#ffd34d', 'bold', 'center');
    }
    // Heat shimmer dots while cooking.
    if (k.grill.state === 'cooking') {
      ctx.fillStyle = 'rgba(255,150,60,0.7)';
      for (let i = 0; i < 4; i++) {
        const px = cx - 40 + i * 26 + Math.sin(k.elapsed * 6 + i) * 4;
        ctx.beginPath(); ctx.arc(px, cy - 26 - ((k.elapsed * 30 + i * 17) % 30), 3, 0, Math.PI * 2); ctx.fill();
      }
    }
  } else {
    text(ctx, 'Taruh daging', s.x + s.w / 2, s.y + 70, 15, '#9a9aa5', 'bold', 'center');
    text(ctx, 'mentah di sini', s.x + s.w / 2, s.y + 94, 15, '#9a9aa5', 'bold', 'center');
    text(ctx, '5 detik sampai matang', s.x + s.w / 2, s.y + 126, 12, '#7a7a85', 'bold', 'center');
  }
}

function drawPlateArea(ctx, k) {
  const s = STATIONS.plate;
  const ready = plateReadyOrder(k);
  ctx.fillStyle = '#8a5a2e';
  rr(ctx, s.x - 8, s.y - 8, s.w + 16, s.h + 16, 14); ctx.fill();
  ctx.fillStyle = '#c98d5f';
  rr(ctx, s.x, s.y, s.w, s.h, 12); ctx.fill();
  text(ctx, 'PIRING RAKITAN  [A]', s.x + 18, s.y + 22, 15, '#fff3dc', 'bold', 'left');
  if (ready) {
    text(ctx, 'SIAP SAJI: ' + ready.recipe.name.toUpperCase(), s.x + s.w - 18, s.y + 22, 14, '#7be07b', 'bold', 'right');
  }
  // The plate itself.
  const cx = s.x + 150;
  const cy = s.y + 118;
  ctx.fillStyle = '#fdfdf8';
  ctx.beginPath(); ctx.ellipse(cx, cy, 118, 52, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#c9b896';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.ellipse(cx, cy, 118, 52, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = '#f0e8d2';
  ctx.beginPath(); ctx.ellipse(cx, cy, 92, 38, 0, 0, Math.PI * 2); ctx.fill();
  if (k.plate.length > 0) {
    drawBurgerStack(ctx, k.plate, cx, cy - 6, 54);
  } else {
    text(ctx, 'Piring kosong', cx, cy - 4, 16, '#b39a72', 'bold', 'center');
    text(ctx, 'klik bahan di tangan untuk menumpuk', cx, cy + 20, 12, '#b39a72', 'bold', 'center');
  }
  // Plate contents checklist, right side.
  const lx = s.x + 300;
  text(ctx, 'Isi piring:', lx, s.y + 52, 14, '#fff3dc', 'bold', 'left');
  if (k.plate.length === 0) {
    text(ctx, '—', lx, s.y + 78, 15, '#ffe9c4');
  }
  k.plate.forEach((item, i) => {
    const ing = INGREDIENTS[baseId(item)];
    drawIngredient(ctx, item, lx + 16, s.y + 78 + i * 26, 24);
    text(ctx, ing.name + (item.includes(':') ? ' ✓' : ''), lx + 36, s.y + 78 + i * 26, 14, '#fff3dc');
  });
  if (k.plateFlash > 0) {
    ctx.fillStyle = 'rgba(123,224,123,' + (k.plateFlash * 0.5) + ')';
    rr(ctx, s.x, s.y, s.w, s.h, 12); ctx.fill();
  }
}

function drawBell(ctx, k) {
  const s = STATIONS.bell;
  const ready = plateReadyOrder(k);
  ctx.fillStyle = '#7a4a1e';
  rr(ctx, s.x, s.y, s.w, s.h, 12); ctx.fill();
  ctx.fillStyle = ready ? '#2f7d32' : '#a9743f';
  rr(ctx, s.x + 6, s.y + 6, s.w - 12, s.h - 12, 9); ctx.fill();
  // Service bell dome.
  const cx = s.x + s.w / 2;
  const cy = s.y + 74;
  ctx.fillStyle = '#ffd34d';
  ctx.beginPath(); ctx.arc(cx, cy, 42, Math.PI, 0); ctx.fill();
  ctx.fillRect(cx - 42, cy - 4, 84, 8);
  ctx.fillStyle = '#e8a54b';
  ctx.beginPath(); ctx.arc(cx, cy - 44, 7, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#3a2a18';
  ctx.fillRect(cx - 3, cy - 50, 6, 10);
  text(ctx, ready ? 'SAJIKAN!  [S]' : 'BEL SAJI  [S]', cx, s.y + 128, 17, '#ffffff', 'bold', 'center');
  if (ready) {
    text(ctx, 'Pesanan #' + ready.id + ' cocok!', cx, s.y + 108, 13, '#d6ffd6', 'bold', 'center');
  }
}

function drawBin(ctx, k) {
  const s = STATIONS.bin;
  ctx.fillStyle = '#5a5a62';
  rr(ctx, s.x, s.y, s.w, s.h, 12); ctx.fill();
  ctx.fillStyle = '#3e3e45';
  rr(ctx, s.x + 14, s.y + 22, s.w - 28, s.h - 34, 8); ctx.fill();
  ctx.strokeStyle = '#8a8a95';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(s.x + 14, s.y + 22); ctx.lineTo(s.x + s.w - 14, s.y + 22); ctx.stroke();
  text(ctx, 'SAMPAH', s.x + s.w / 2, s.y + 52, 14, '#ffffff', 'bold', 'center');
  text(ctx, '[T]', s.x + s.w / 2, s.y + 76, 13, '#c9c9d2', 'bold', 'center');
  text(ctx, 'buang isi tangan', s.x + s.w / 2, s.y + 118, 11, '#c9c9d2', 'bold', 'center');
}

function drawChef(ctx, k) {
  // Little warung chef standing by the plate, holding nothing but pride.
  const x = 180, y = 470;
  ctx.save();
  ctx.translate(x, y);
  // Body / apron.
  ctx.fillStyle = '#ffffff';
  rr(ctx, -52, -40, 104, 120, 26); ctx.fill();
  ctx.fillStyle = '#3f7d4e';
  rr(ctx, -52, 20, 104, 60, 20); ctx.fill();
  text(ctx, 'DAPUR KILAT', 0, 52, 14, '#ffffff', 'bold', 'center');
  // Arms.
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 16;
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-48, -18); ctx.lineTo(-78, 18); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(48, -18); ctx.lineTo(78, 18); ctx.stroke();
  // Head.
  ctx.fillStyle = '#f2c184';
  ctx.beginPath(); ctx.arc(0, -66, 34, 0, Math.PI * 2); ctx.fill();
  // Chef hat.
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.ellipse(0, -96, 40, 22, 0, Math.PI, 0); ctx.fill();
  ctx.fillRect(-40, -98, 80, 12);
  // Face.
  ctx.fillStyle = '#2b2b2b';
  ctx.beginPath(); ctx.arc(-12, -70, 3.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(12, -70, 3.5, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#2b2b2b';
  ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.arc(0, -58, 12, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
  // Moustache, because every warung chef has one.
  ctx.strokeStyle = '#3a2a18';
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(-12, -52); ctx.quadraticCurveTo(0, -46, 12, -52); ctx.stroke();
  ctx.restore();
  // Speech hint.
  if (k.screen === 'playing' && k.hand) {
    text(ctx, 'Bawa: ' + k.handLabel, x, y + 110, 14, '#5a3d1e', 'bold', 'center');
  }
}

function drawHandCursor(ctx, k) {
  if (!k.mouse || !k.hand) return;
  const mx = k.mouse.x;
  const my = k.mouse.y;
  ctx.save();
  ctx.globalAlpha = 0.95;
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.beginPath(); ctx.arc(mx + 26, my - 26, 24, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#8a6a3e';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(mx + 26, my - 26, 24, 0, Math.PI * 2); ctx.stroke();
  drawIngredient(ctx, k.hand, mx + 26, my - 26, 34);
  ctx.restore();
}

function drawPopups(ctx, k) {
  for (const p of k.popups) {
    const a = p.t < 1.0 ? 1 : Math.max(0, 1 - (p.t - 1.0) / 0.4);
    ctx.save();
    ctx.globalAlpha = a;
    text(ctx, p.text, p.x, p.y - p.t * 34, 20, p.color, 'bold', 'center');
    ctx.restore();
  }
}

function drawParticles(ctx, k) {
  for (const p of k.particles) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - p.t / 0.8);
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
}

function drawMessage(ctx, k) {
  if (k.messageT <= 0 || !k.message) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1, k.messageT);
  // Measure with the same font the text is drawn in, or the pill is too narrow.
  ctx.font = 'bold 15px ' + FONT;
  const w = Math.min(980, ctx.measureText(k.message).width + 56);
  ctx.fillStyle = 'rgba(58,42,24,0.92)';
  rr(ctx, (VIEW_W - w) / 2, 566, w, 40, 20); ctx.fill();
  text(ctx, k.message, VIEW_W / 2, 587, 15, '#ffe9a8', 'bold', 'center');
  ctx.restore();
}

function overlay(ctx, title, lines, accent) {
  ctx.fillStyle = 'rgba(30,20,10,0.72)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = '#fff8ea';
  rr(ctx, 290, 130, 700, 540, 20); ctx.fill();
  ctx.strokeStyle = accent || '#e8a54b';
  ctx.lineWidth = 4;
  rr(ctx, 290, 130, 700, 540, 20); ctx.stroke();
  text(ctx, title, 640, 190, 44, '#3a2a18', 'bold', 'center');
  let y = 250;
  for (const line of lines) {
    text(ctx, line.text, 640, y, line.size || 18, line.color || '#5a3d1e', line.weight || 'normal', 'center');
    y += line.gap || 34;
  }
}

export function render(ctx, k) {
  ctx.save();
  if (k.shake > 0) {
    ctx.translate((Math.random() - 0.5) * k.shake * 24, (Math.random() - 0.5) * k.shake * 24);
  }
  drawRoom(ctx, k);
  drawTickets(ctx, k);
  drawScorePanel(ctx, k);
  drawChef(ctx, k);
  drawPlateArea(ctx, k);
  drawGrill(ctx, k);
  drawBoard(ctx, k);
  drawBell(ctx, k);
  drawBin(ctx, k);
  for (const name of ['bun', 'beef', 'tomato', 'lettuce', 'cheese', 'sauce']) drawCrate(ctx, k, name);
  drawParticles(ctx, k);
  drawPopups(ctx, k);
  drawMessage(ctx, k);
  drawHandCursor(ctx, k);

  if (k.screen === 'title') {
    overlay(ctx, 'DAPUR KILAT', [
      { text: 'Warung Rush — masak burger secepat kilat!', size: 22, color: '#b97a26', weight: 'bold' },
      { text: 'Pesanan muncul di papan atas. Rakit burgernya', gap: 30 },
      { text: 'tepat seperti pesanan, lalu bunyikan bel saji.' },
      { text: 'Tomat & selada dicincang, daging dipanggang —', gap: 44 },
      { text: 'jangan sampai gosong!', color: '#a92c25', weight: 'bold' },
      { text: 'Klik konter / talenan / panggangan / piring / bel.', gap: 44 },
      { text: 'Tombol: 1-6 bahan · C cincang · G panggang · A piring · S saji · T buang · P jeda', size: 15, color: '#8a6a3e' },
      { text: 'Satu shift: 150 detik. Kombo menaikkan skor!', size: 15, color: '#8a6a3e' },
      { text: 'KLIK DI MANA SAJA UNTUK MULAI', size: 20, color: '#2f7d32', weight: 'bold', gap: 48 },
    ], '#e8a54b');
  } else if (k.screen === 'paused') {
    overlay(ctx, 'JEDA', [
      { text: 'Istirahat sebentar, chef.', size: 22 },
      { text: 'Tekan P atau klik untuk lanjut masak.', gap: 44 },
      { text: 'Skor sementara: ' + k.score, size: 20, weight: 'bold', gap: 40 },
    ], '#9fe8ff');
  } else if (k.screen === 'over') {
    const best = k.served > 0 ? Math.round(k.score / Math.max(1, k.served)) : 0;
    overlay(ctx, 'SHIFT SELESAI!', [
      { text: 'Dapur tutup. Kerja bagus, chef!', size: 22, color: '#b97a26', weight: 'bold' },
      { text: 'SKOR AKHIR: ' + k.score, size: 34, color: '#2f7d32', weight: 'bold', gap: 52 },
      { text: 'Burger tersaji: ' + k.served + '   ·   Pesanan gagal: ' + k.failed, gap: 36 },
      { text: 'Kombo terbaik: x' + Math.max(1, k.bestCombo) + '   ·   Rata-rata ' + best + ' poin/burger', gap: 36 },
      { text: k.served >= 10 ? 'Warungmu ramai sekali hari ini!' : k.served >= 5 ? 'Lumayan! Besok lebih cepat lagi.' : 'Latihan lagi, besok pasti lebih ramai!', gap: 44 },
      { text: 'Tekan Enter atau klik untuk main lagi', size: 19, color: '#2f7d32', weight: 'bold', gap: 48 },
    ], '#2f7d32');
  }
  ctx.restore();
}
