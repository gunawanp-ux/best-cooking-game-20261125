// recipes.js — the warung menu: every ingredient and every burger on it.
//
// Ingredients carry their own rules: some need chopping, beef needs the
// grill, the rest go straight onto the plate. A burger is just a multiset
// of ingredient ids, so two burgers can share ingredients and still be
// different orders.

export const INGREDIENTS = {
  bun:    { id: 'bun',     name: 'Roti',   short: 'Roti',   color: '#e8a54b', dark: '#b97a26', chop: false, grill: false, price: 10 },
  beef:   { id: 'beef',    name: 'Daging', short: 'Daging', color: '#8a4b2d', dark: '#5e2f1a', chop: false, grill: true,  price: 25 },
  tomato: { id: 'tomato',  name: 'Tomat',  short: 'Tomat',  color: '#e0483e', dark: '#a92c25', chop: true,  grill: false, price: 8 },
  lettuce:{ id: 'lettuce', name: 'Selada', short: 'Selada', color: '#5fbf4a', dark: '#3c8a2e', chop: true,  grill: false, price: 8 },
  cheese: { id: 'cheese',  name: 'Keju',   short: 'Keju',   color: '#f5c542', dark: '#c99a1e', chop: false, grill: false, price: 12 },
  sauce:  { id: 'sauce',   name: 'Saus',   short: 'Saus',   color: '#d94f2b', dark: '#9e3016', chop: false, grill: false, price: 6 },
};

// Chopped versions keep the same id with a flag; the kitchen stores them as
// "tomato:chopped" so the plate can tell raw from ready.
export function choppedId(id) { return id + ':chopped'; }
export function cookedId(id) { return id + ':cooked'; }
export function baseId(stacked) { return stacked.split(':')[0]; }
export function isReady(stacked) {
  const ing = INGREDIENTS[baseId(stacked)];
  if (!ing) return false;
  if (ing.chop) return stacked === choppedId(ing.id);
  if (ing.grill) return stacked === cookedId(ing.id);
  return stacked === ing.id;
}

export const MENU = [
  { id: 'klasik', name: 'Burger Klasik', needs: ['bun', 'beef:cooked', 'lettuce:chopped'], tier: 1, base: 100 },
  { id: 'keju',   name: 'Burger Keju',   needs: ['bun', 'beef:cooked', 'cheese', 'tomato:chopped'], tier: 1, base: 120 },
  { id: 'pedas',  name: 'Burger Pedas',  needs: ['bun', 'beef:cooked', 'sauce', 'tomato:chopped'], tier: 1, base: 120 },
  { id: 'sayur',  name: 'Burger Sayur',  needs: ['bun', 'lettuce:chopped', 'tomato:chopped', 'cheese'], tier: 1, base: 110 },
  { id: 'sultan', name: 'Burger Sultan', needs: ['bun', 'beef:cooked', 'cheese', 'lettuce:chopped', 'tomato:chopped', 'sauce'], tier: 2, base: 180 },
  { id: 'dobel',  name: 'Burger Dobel',  needs: ['bun', 'beef:cooked', 'beef:cooked', 'cheese', 'sauce'], tier: 2, base: 200 },
];

// Compare a plate stack with a recipe, ignoring order. Duplicates matter:
// a double-beef burger really needs two patties.
export function plateMatchesRecipe(plate, recipe) {
  if (plate.length !== recipe.needs.length) return false;
  const have = [...plate].sort();
  const want = [...recipe.needs].sort();
  return have.every((item, i) => item === want[i]);
}

export function recipeById(id) {
  return MENU.find((r) => r.id === id) || null;
}

// Pick the next order. Early on only tier-1 burgers appear; fancier ones
// join the menu as the rush level climbs. Never repeat the ticket that was
// just served, so the rail stays varied.
export function pickRecipe(level, avoidId) {
  const pool = MENU.filter((r) => r.tier === 1 || level >= 2);
  let choice = pool[Math.floor(Math.random() * pool.length)];
  if (pool.length > 1) {
    let guard = 0;
    while (choice.id === avoidId && guard < 8) {
      choice = pool[Math.floor(Math.random() * pool.length)];
      guard += 1;
    }
  }
  return choice;
}

// Patience in seconds: long enough to cook one burger calmly at level 1,
// tight enough at level 4 that you must overlap chopping and grilling.
export function patienceFor(level) {
  return Math.max(26, 46 - (level - 1) * 5);
}

export function orderIntervalFor(level) {
  return Math.max(7, 13 - (level - 1) * 1.5);
}
