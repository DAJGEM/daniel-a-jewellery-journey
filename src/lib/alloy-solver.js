// The brain of The Melting Pot. Given a mixture of metals (grams), work out what
// alloy you actually made: karat, colour, a recognised name, properties, and
// Daniel's plain-language verdict. Pure and deterministic — see the tests.

import { METALS, PRICED_METALS } from '../data/metals.js';
import { RECIPES } from '../data/recipes.js';

const TROY_OZ_GRAMS = 31.1035;
const JEWELLERY_GOLD_MIN = 41.7; // 10K

function percentages(mix) {
  const total = Object.values(mix).reduce((a, b) => a + (b || 0), 0);
  if (total <= 0) return { total: 0, pct: {} };
  const pct = {};
  for (const k of Object.keys(mix)) if (mix[k]) pct[k] = (mix[k] / total) * 100;
  return { total, pct };
}

// Closest recognised recipe by summed absolute % difference, within tolerance.
function matchRecipe(pct) {
  let best = null; let bestDist = Infinity;
  for (const r of RECIPES) {
    const keys = new Set([...Object.keys(r.mix), ...Object.keys(pct)]);
    let dist = 0;
    for (const k of keys) dist += Math.abs((r.mix[k] || 0) - (pct[k] || 0));
    if (dist < bestDist) { bestDist = dist; best = r; }
  }
  return bestDist <= 16 ? best : null;
}

function goldColour(pct) {
  const au = pct.au || 0;
  const cu = pct.cu || 0;
  const ag = pct.ag || 0;
  const al = pct.al || 0;
  const whiteners = (pct.ni || 0) + (pct.pd || 0) + (pct.pt || 0);
  const nonGold = 100 - au;

  if (al >= 10 && au >= 70) return 'Purple gold';
  if (nonGold > 0 && whiteners / nonGold >= 0.45) return 'White gold';
  if (cu >= ag * 2 && cu >= 8) return 'Rose gold';
  return 'Yellow gold';
}

const COLOUR_HEX = {
  'Yellow gold': 0xf3cb7a,
  'Rose gold': 0xe4a07f,
  'White gold': 0xe9e8e2,
  'Purple gold': 0x9d6bd6,
  Silver: 0xececea,
  Platinum: 0xe5e4e2,
  Brass: 0xd7b45a,
  Bronze: 0xb87333,
  'Copper alloy': 0xc7784a,
  'Nickel silver': 0xcfd2d0,
  'Base-metal mix': 0xb7b2a6,
};

function verdictFor({ family, colour, karat, pct, recognized }) {
  const has = (m, t = 1) => (pct[m] || 0) >= t;
  if (has('pb', 5)) return 'That’s lead in there — soft, heavy and toxic. Fine for a fishing weight, never for something you wear. Empty the tray.';
  if (colour === 'Purple gold') return 'Genuinely purple and genuinely gold — but this intermetallic shatters like glass. I’d set it as an inlay, never cast a ring from it.';
  if (family === 'gold' && has('ni', 8) && colour === 'White gold') return 'A hard, bright white gold — but that’s nickel doing the whitening, and about one person in eight reacts to it. For skin contact I’d reach for palladium instead.';
  if (family === 'gold' && karat >= 22) return 'Beautiful, rich colour — but barely any alloy, so it’s soft. Lovely for earrings or a pendant; I’d think twice before a daily-wear ring.';
  if (family === 'gold' && karat >= 14) return `A clean, wearable ${karat}K ${colour.toLowerCase()}. This is the kind of recipe I actually cast on the bench.`;
  if (family === 'gold') return `Real gold at ${karat}K, but on the low side — legal to call gold, a touch pale. I’d nudge the gold up for a richer colour.`;
  if (family === 'silver') return recognized?.id === 'sterling' ? 'Textbook sterling. It’ll tarnish and love a polish, but it’s the honest silver standard.' : 'A silver-rich mix — bright and workable, though it’ll want the copper balanced for real strength.';
  if (family === 'platinum') return 'Dense, white and hypoallergenic. Melts hot and works hard — this is heirloom metal.';
  if (family === 'brass' || family === 'bronze' || family === 'base') return 'Looks like gold, isn’t gold — not a speck of it. Gorgeous for costume and hardware, but it’ll tarnish, and it’s exactly why we test everything that comes across the counter.';
  return 'An interesting mix. Pour a known recipe from the bench classics to see how the pros balance it.';
}

export function solveAlloy(mix) {
  const { total, pct } = percentages(mix);
  if (total === 0) {
    return { family: 'empty', total: 0, pct: {}, karat: null, colour: null, colourHex: 0x2a2622,
      title: 'Empty crucible', recognized: null, hardness: null, wearable: false,
      verdict: 'Nothing in the pot yet — press and hold a jar to pour some grain in.', facts: [] };
  }

  const au = pct.au || 0;
  const recognized = matchRecipe(pct);
  let family; let colour; let karat = null; let wearable = true; let hardness;

  if (au >= JEWELLERY_GOLD_MIN) {
    family = 'gold';
    karat = Math.round((au / 100) * 24);
    colour = goldColour(pct);
    hardness = karat >= 22 ? 'Soft' : karat >= 18 ? 'Medium' : 'Hard';
    if (colour === 'Purple gold') { wearable = false; hardness = 'Brittle'; }
  } else if ((pct.pt || 0) >= 50) {
    family = 'platinum'; colour = 'Platinum'; hardness = 'Hard';
  } else if ((pct.ag || 0) >= 50) {
    family = 'silver'; colour = 'Silver'; hardness = 'Medium';
  } else if ((pct.cu || 0) >= 30) {
    if ((pct.zn || 0) >= 5 && (pct.zn || 0) >= (pct.sn || 0)) { family = 'brass'; colour = 'Brass'; }
    else if ((pct.sn || 0) >= 5) { family = 'bronze'; colour = 'Bronze'; }
    else if ((pct.ni || 0) >= 8) { family = 'base'; colour = 'Nickel silver'; }
    else { family = 'base'; colour = 'Copper alloy'; }
    hardness = 'Hard';
  } else {
    family = 'base'; colour = 'Base-metal mix'; hardness = 'Varies';
  }

  const title = recognized ? recognized.name
    : family === 'gold' ? `${karat}K ${colour}` : colour;

  const facts = [];
  if (recognized) facts.push(recognized.fact);
  // Compose an education line from the dominant metals.
  const dom = Object.entries(pct).sort((a, b) => b[1] - a[1]).slice(0, 3);
  facts.push('Your recipe: ' + dom.map(([k, v]) => `${Math.round(v)}% ${METALS[k].name.toLowerCase()}`).join(', ') + '.');
  if (family === 'gold') facts.push(`Karat is just gold content: ${Math.round(au)}% gold ≈ ${karat}K (pure gold is 24K).`);
  const verdict = verdictFor({ family, colour, karat, pct, recognized });

  return {
    family, total, pct, karat, colour, colourHex: COLOUR_HEX[colour] || 0xb7b2a6,
    title, recognized, hardness, wearable, verdict, facts,
  };
}

// Live melt value in CAD — only the priced precious metals carry value.
export function meltValueCAD(mix, prices) {
  if (!prices || !prices.usdCad) return 0;
  const priceOf = { au: prices.gold, ag: prices.silver, pt: prices.platinum, pd: prices.palladium };
  let cad = 0;
  for (const k of Object.keys(PRICED_METALS)) {
    const grams = mix[k] || 0;
    const p = priceOf[k];
    if (grams && p && p.usdPerOz) cad += grams * (p.usdPerOz / TROY_OZ_GRAMS) * prices.usdCad;
  }
  return cad;
}
