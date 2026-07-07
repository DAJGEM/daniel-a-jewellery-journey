// Diamond specs, 4C pricing, a light-performance score, and the bench
// gemologist's plain-language notes. Pure and deterministic — see the tests.

import { SHAPES, CUTS, COLOURS, CLARITIES, ENVIRONMENTS, SETTINGS } from '../data/diamonds.js';

const ROUND_1CT_MM = 6.5;

// Face-up dimensions in mm, keeping roughly constant face area across shapes.
export function diamondMm(shapeId, carat) {
  const shape = SHAPES[shapeId] || SHAPES.round;
  const roundDia = ROUND_1CT_MM * Math.cbrt(Math.max(0.05, carat));
  const width = roundDia / Math.sqrt(shape.lw);
  const length = width * shape.lw;
  const depth = width * 0.62;
  return { length: round1(length), width: round1(width), depth: round1(depth) };
}
function round1(n) { return Math.round(n * 10) / 10; }

// Indicative retail value in CAD — a teaching model, not a quote. Per-carat price
// climbs with size; the 4Cs and shape scale it.
export function diamondPriceCAD(shapeId, carat, cutId, colourId, clarityId) {
  const shape = SHAPES[shapeId] || SHAPES.round;
  const cut = CUTS[cutId] || CUTS.excellent;
  const colour = COLOURS[colourId] || COLOURS.H;
  const clarity = CLARITIES[clarityId] || CLARITIES.VS;
  const shapePremium = shapeId === 'round' ? 1.15 : shape.facets === 'step' ? 0.9 : 0.95;
  const basePerCt = 4000 * Math.pow(Math.max(0.2, carat), 0.35);
  return Math.round(basePerCt * carat * cut.price * colour.price * clarity.price * shapePremium);
}

// 0–100: how lively the stone looks. Cut and shape set the ceiling; the lighting
// environment reveals or flatters it.
export function lightPerformanceScore(shapeId, cutId, envId) {
  const shape = SHAPES[shapeId] || SHAPES.round;
  const cut = CUTS[cutId] || CUTS.excellent;
  const env = ENVIRONMENTS[envId] || ENVIRONMENTS.showroom;
  const raw = shape.brilliance * cut.lightReturn * (0.6 + 0.4 * env.sparkle);
  return Math.max(0, Math.min(100, Math.round(raw * 100)));
}

// The bench gemologist reacting, in Daniel's voice, to the current choices.
export function gemologistNote({ shape, cut, colour, clarity, env, setting }) {
  const s = SHAPES[shape]; const c = CUTS[cut];
  if (c && cut === 'fair') return 'Honestly? I’d stop here. A fair cut leaks light no matter how white or clean the stone is — you’re paying for weight you can’t see. Bump the cut up first, always.';
  if (s && s.facets === 'step' && (clarity === 'SI')) return 'Careful — an emerald or Asscher is a hall of mirrors, so any inclusion shows. On a step cut I’d move the clarity up to VS or better and let the stone stay clean.';
  if (cut === 'ideal') return 'Excellent choice. An ideal cut sends nearly every ray of light back at your eye — this is where a diamond earns its sparkle.';
  if (env === 'candle' || env === 'restaurant') return 'Watch it now — warm, pointed light like this is where fire shows. Those rainbow flashes are the diamond splitting light into its colours.';
  if (env === 'office' || env === 'overcast') return 'Flat, even light like this is the honest test — a great cut still glows here, while a lazy cut goes flat. Notice the difference.';
  if (colour === 'J' && setting) return 'A J colour set in yellow or rose gold is a quiet money-saver — the warm metal makes the stone read white to the eye.';
  return 'Good pairing. Turn through the lighting to see how the cut performs — that’s the part most people never get to watch.';
}

export function settingBlurb(id) { return (SETTINGS[id] || SETTINGS.solitaire).blurb; }
