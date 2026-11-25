// kitchen.js — the kitchen itself: state plus every action the player can
// take. The player carries exactly one item in hand, so each order becomes
// a small route through the stations: crate -> board or grill -> plate.
//
// Stations (rectangles in canvas space, shared with render.js):
//   crates along the bottom, chopping board centre-left, grill centre,
//   assembly plate centre-right, service bell far right, bin bottom-right.

import {
  INGREDIENTS, MENU, choppedId, cookedId, baseId, isReady,
  plateMatchesRecipe, pickRecipe, patienceFor, orderIntervalFor,
} from './recipes.js';

export const VIEW_W = 1280;
export const VIEW_H = 800;
export const SHIFT_SECONDS = 150;

export const STATIONS = {
  bun:     { x: 30,  y: 620, w: 150, h: 140, kind: 'crate', ing: 'bun' },
  beef:    { x: 195, y: 620, w: 150, h: 140, kind: 'crate', ing: 'beef' },
  tomato:  { x: 360, y: 620, w: 150, h: 140, kind: 'crate', ing: 'tomato' },
  lettuce: { x: 525, y: 620, w: 150, h: 140, kind: 'crate', ing: 'lettuce' },
  cheese:  { x: 690, y: 620, w: 150, h: 140, kind: 'crate', ing: 'cheese' },
  sauce:   { x: 855, y: 620, w: 150, h: 140, kind: 'crate', ing: 'sauce' },
  board:   { x: 1020, y: 470, w: 230, h: 130, kind: 'board' },
  grill:   { x: 1020, y: 300, w: 230, h: 150, kind: 'grill' },
  plate:   { x: 560, y: 300, w: 430, h: 200, kind: 'plate' },
  bell:    { x: 1020, y: 120, w: 230, h: 150, kind: 'bell' },
  bin:     { x: 1130, y: 620, w: 120, h: 140, kind: 'bin' },
};

export const CHOP_SECONDS = 1.4;
export const GRILL_SECONDS = 5.0;
export const BURN_SECONDS = 4.0;

export function newKitchen() {
  return {
    screen: 'title', // title | playing | paused | over
    score: 0,
    coins: 0,
    combo: 0,
    bestCombo: 0,
    served: 0,
    failed: 0,
    level: 1,
    timeLeft: SHIFT_SECONDS,
    elapsed: 0,
    orders: [],          // { id, recipe, patience, maxPatience, born }
    nextOrderIn: 4,
    nextOrderId: 1,
    lastRecipeId: null,
    hand: null,          // stacked id string, e.g. 'tomato:chopped'
    handLabel: '',
    chopping: null,      // { ing, t } while the board is busy
    grill: null,         // { state: 'cooking'|'done'|'burnt', t }
    plate: [],           // stacked ids, bottom to top
    plateFlash: 0,       // >0 while the plate glows after a serve
    popups: [],          // { x, y, text, color, t }
    particles: [],       // { x, y, vx, vy, color, t, size }
    shake: 0,
    message: '',
    messageT: 0,
    muted: false,
    demo: null,
  };
}

export function startShift(k) {
  const fresh = newKitchen();
  fresh.screen = 'playing';
  fresh.muted = k.muted;
  fresh.demo = k.demo;
  Object.assign(k, fresh);
  spawnOrder(k);
  spawnOrder(k);
  k.nextOrderIn = orderIntervalFor(1);
  k.message = 'Shift dimulai! Layani pelanggan sebelum sabar mereka habis.';
  k.messageT = 3;
}

export function spawnOrder(k) {
  if (k.orders.length >= 4) return;
  const recipe = pickRecipe(k.level, k.lastRecipeId);
  const patience = patienceFor(k.level);
  k.orders.push({
    id: k.nextOrderId,
    recipe,
    patience,
    maxPatience: patience,
    born: k.elapsed,
  });
  k.nextOrderId += 1;
  k.lastRecipeId = recipe.id;
}

export function addPopup(k, x, y, text, color) {
  k.popups.push({ x, y, text, color: color || '#ffffff', t: 0 });
  if (k.popups.length > 12) k.popups.shift();
}

export function burst(k, x, y, color, n) {
  for (let i = 0; i < (n || 10); i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = 60 + Math.random() * 160;
    k.particles.push({
      x, y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp - 60,
      color: color || '#ffd34d',
      t: 0,
      size: 3 + Math.random() * 4,
    });
  }
  if (k.particles.length > 160) k.particles.splice(0, k.particles.length - 160);
}

export function say(k, text, seconds) {
  k.message = text;
  k.messageT = seconds || 2.2;
}

// --- actions ---------------------------------------------------------------

export function pickIngredient(k, ingId) {
  if (k.screen !== 'playing') return 'idle';
  if (k.hand) { say(k, 'Tangan sudah penuh! Letakkan dulu di piring atau buang.'); return 'error'; }
  const ing = INGREDIENTS[ingId];
  if (!ing) return 'idle';
  k.hand = ingId;
  k.handLabel = ing.name;
  burst(k, STATIONS[ingId].x + 75, STATIONS[ingId].y + 40, ing.color, 6);
  return 'pickup';
}

export function useBoard(k) {
  if (k.screen !== 'playing') return 'idle';
  if (k.chopping) return 'idle';
  if (!k.hand) { say(k, 'Bawa tomat atau selada ke talenan dulu.'); return 'error'; }
  const base = baseId(k.hand);
  const ing = INGREDIENTS[base];
  if (!ing || !ing.chop || k.hand !== base) {
    say(k, ing ? ing.name + ' tidak perlu dicincang.' : 'Bahan itu tidak bisa dicincang.');
    return 'error';
  }
  k.chopping = { ing: base, t: 0 };
  k.hand = null;
  k.handLabel = '';
  return 'chop-start';
}

export function useGrill(k) {
  if (k.screen !== 'playing') return 'idle';
  // Take a finished patty off the grill.
  if (k.grill && (k.grill.state === 'done' || k.grill.state === 'burnt')) {
    if (k.hand) { say(k, 'Tangan penuh — letakkan dulu isi tanganmu.'); return 'error'; }
    if (k.grill.state === 'burnt') {
      k.grill = null;
      say(k, 'Daging gosong! Buang dan panggang lagi.');
      return 'burnt';
    }
    k.grill = null;
    k.hand = cookedId('beef');
    k.handLabel = 'Daging Matang';
    return 'pickup';
  }
  // Put a raw patty on the grill.
  if (!k.grill) {
    if (k.hand !== 'beef') {
      say(k, k.hand ? 'Hanya daging mentah yang bisa dipanggang.' : 'Bawa daging mentah ke panggangan.');
      return 'error';
    }
    k.grill = { state: 'cooking', t: 0 };
    k.hand = null;
    k.handLabel = '';
    return 'grill-start';
  }
  return 'idle';
}

export function usePlate(k) {
  if (k.screen !== 'playing') return 'idle';
  if (!k.hand) {
    say(k, 'Piring kosong — ambil bahan dulu dari konter.');
    return 'error';
  }
  if (!isReady(k.hand)) {
    const base = baseId(k.hand);
    const ing = INGREDIENTS[base];
    if (ing && ing.chop) say(k, ing.name + ' harus dicincang dulu di talenan!');
    else if (ing && ing.grill) say(k, ing.name + ' harus dipanggang dulu!');
    else say(k, 'Bahan itu belum siap disajikan.');
    return 'error';
  }
  k.plate.push(k.hand);
  burst(k, STATIONS.plate.x + 215, STATIONS.plate.y + 100, '#ffe9a8', 8);
  k.hand = null;
  k.handLabel = '';
  return 'stack';
}

export function useBell(k) {
  if (k.screen !== 'playing') return 'idle';
  if (k.plate.length === 0) {
    say(k, 'Bel berbunyi tapi piring masih kosong!');
    return 'error';
  }
  const idx = k.orders.findIndex((o) => plateMatchesRecipe(k.plate, o.recipe));
  if (idx === -1) {
    k.score = Math.max(0, k.score - 50);
    k.combo = 0;
    k.failed += 1;
    k.plate = [];
    k.shake = 0.35;
    addPopup(k, 1135, 200, '-50  PESANAN SALAH', '#ff6b5e');
    say(k, 'Itu bukan pesanan siapa pun! Piring dikosongkan, -50 poin.');
    return 'wrong';
  }
  const order = k.orders[idx];
  k.orders.splice(idx, 1);
  const timeBonus = Math.round((order.patience / order.maxPatience) * 60);
  k.combo += 1;
  k.bestCombo = Math.max(k.bestCombo, k.combo);
  const gained = (order.recipe.base + timeBonus) * (1 + Math.min(k.combo - 1, 4) * 0.25);
  const pts = Math.round(gained);
  k.score += pts;
  k.coins += order.recipe.base / 10;
  k.served += 1;
  k.plate = [];
  k.plateFlash = 0.6;
  burst(k, 1135, 200, '#7be07b', 18);
  addPopup(k, 1135, 200, '+' + pts + '  ' + order.recipe.name.toUpperCase(), '#7be07b');
  if (k.combo >= 3) addPopup(k, 1135, 235, 'KOMBO x' + k.combo + '!', '#ffd34d');
  if (k.served % 5 === 0) {
    k.level = Math.min(4, k.level + 1);
    say(k, 'RUSH LEVEL ' + k.level + '! Pesanan datang lebih cepat!');
    k.messageT = 3;
  } else {
    say(k, order.recipe.name + ' tersaji! +' + pts + ' poin.');
  }
  return 'serve';
}

export function useBin(k) {
  if (k.screen !== 'playing') return 'idle';
  if (k.hand) {
    k.hand = null;
    k.handLabel = '';
    return 'trash';
  }
  if (k.plate.length > 0) {
    k.plate = [];
    say(k, 'Piring dikosongkan.');
    return 'trash';
  }
  say(k, 'Tidak ada yang perlu dibuang.');
  return 'idle';
}

// --- per-frame update ------------------------------------------------------

export function updateKitchen(k, dt) {
  if (k.screen !== 'playing') {
    // Popups and particles still settle on the end screen.
    for (const p of k.popups) p.t += dt;
    for (const p of k.particles) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 260 * dt; }
    k.popups = k.popups.filter((p) => p.t < 1.4);
    k.particles = k.particles.filter((p) => p.t < 0.8);
    return;
  }
  k.elapsed += dt;
  k.timeLeft -= dt;
  if (k.timeLeft <= 0) {
    k.timeLeft = 0;
    k.screen = 'over';
    return;
  }
  if (k.messageT > 0) k.messageT -= dt;
  if (k.plateFlash > 0) k.plateFlash -= dt;
  if (k.shake > 0) k.shake -= dt;

  // New orders arrive on a timer, faster as the rush level climbs.
  k.nextOrderIn -= dt;
  if (k.nextOrderIn <= 0) {
    spawnOrder(k);
    k.nextOrderIn = orderIntervalFor(k.level);
  }

  // Patience drains; an expired ticket walks out angry.
  for (let i = k.orders.length - 1; i >= 0; i--) {
    const o = k.orders[i];
    o.patience -= dt;
    if (o.patience <= 0) {
      k.orders.splice(i, 1);
      k.combo = 0;
      k.failed += 1;
      k.score = Math.max(0, k.score - 30);
      k.shake = 0.3;
      addPopup(k, 200 + i * 260, 150, 'PELANGGAN PERGI  -30', '#ff6b5e');
      say(k, 'Satu pelanggan kehabisan sabar dan pergi! -30 poin.');
    }
  }

  // Chopping finishes by itself; the chopped item lands back in hand.
  if (k.chopping) {
    k.chopping.t += dt;
    if (k.chopping.t >= CHOP_SECONDS) {
      const ing = INGREDIENTS[k.chopping.ing];
      k.hand = choppedId(k.chopping.ing);
      k.handLabel = ing.name + ' Cincang';
      k.chopping = null;
      burst(k, STATIONS.board.x + 115, STATIONS.board.y + 60, '#bfe8a8', 10);
    }
  }

  // The grill cooks, then overcooks: timing matters.
  if (k.grill) {
    k.grill.t += dt;
    if (k.grill.state === 'cooking' && k.grill.t >= GRILL_SECONDS) {
      k.grill.state = 'done';
      k.grill.t = 0;
    } else if (k.grill.state === 'done' && k.grill.t >= BURN_SECONDS) {
      k.grill.state = 'burnt';
    }
  }

  for (const p of k.popups) p.t += dt;
  for (const p of k.particles) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 260 * dt; }
  k.popups = k.popups.filter((p) => p.t < 1.4);
  k.particles = k.particles.filter((p) => p.t < 0.8);
}

export function stationAt(x, y) {
  for (const [name, s] of Object.entries(STATIONS)) {
    if (x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h) return name;
  }
  return null;
}

export function clickStation(k, name) {
  switch (name) {
    case 'bun': case 'beef': case 'tomato':
    case 'lettuce': case 'cheese': case 'sauce':
      return pickIngredient(k, name);
    case 'board': return useBoard(k);
    case 'grill': return useGrill(k);
    case 'plate': return usePlate(k);
    case 'bell': return useBell(k);
    case 'bin': return useBin(k);
    default: return 'idle';
  }
}

// A plate is "ready to serve" when it exactly matches some open ticket.
export function plateReadyOrder(k) {
  return k.orders.find((o) => plateMatchesRecipe(k.plate, o.recipe)) || null;
}

export { MENU };
