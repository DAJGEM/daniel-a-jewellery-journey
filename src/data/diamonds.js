// Diamond Studio data. Shapes carry a length/width ratio, a brilliance factor
// (how much they scintillate — brilliant cuts sparkle busily, step cuts flash in
// broad mirrors), and a facet style for the canvas. Cut/colour/clarity grades
// carry the price multipliers and the plain-language teaching notes.

export const SHAPES = {
  round:    { name: 'Round Brilliant', lw: 1.00, brilliance: 1.00, facets: 'brilliant', blurb: 'The benchmark. Its 57 facets are engineered for maximum brilliance — it returns more light than any other shape.' },
  oval:     { name: 'Oval',            lw: 1.40, brilliance: 0.94, facets: 'brilliant', blurb: 'Brilliant-cut like a round but stretched — it looks larger per carat and flatters the finger.' },
  cushion:  { name: 'Cushion',         lw: 1.05, brilliance: 0.90, facets: 'brilliant', blurb: 'A soft-cornered square with a romantic, candle-lit fire. Very forgiving of colour.' },
  princess: { name: 'Princess',        lw: 1.00, brilliance: 0.92, facets: 'brilliant', blurb: 'A brilliant-cut square — sharp, modern and sparkly, with a lower price per carat than a round.' },
  radiant:  { name: 'Radiant',         lw: 1.05, brilliance: 0.91, facets: 'brilliant', blurb: 'Brilliant faceting in a cropped-corner rectangle — the sparkle of a round with the shape of an emerald.' },
  pear:     { name: 'Pear',            lw: 1.55, brilliance: 0.90, facets: 'brilliant', blurb: 'A teardrop — brilliant and elongating. Point down slims the finger.' },
  marquise: { name: 'Marquise',        lw: 1.90, brilliance: 0.88, facets: 'brilliant', blurb: 'The biggest look per carat of any shape — a long, pointed boat that maximises spread.' },
  heart:    { name: 'Heart',           lw: 1.00, brilliance: 0.87, facets: 'brilliant', blurb: 'A brilliant-cut romantic statement. Needs skilled cutting to keep the lobes symmetrical.' },
  emerald:  { name: 'Emerald',         lw: 1.45, brilliance: 0.62, facets: 'step',      blurb: 'A step cut: long, straight facets give broad “hall-of-mirrors” flashes instead of busy sparkle. Shows clarity — pick a clean stone.' },
  asscher:  { name: 'Asscher',         lw: 1.00, brilliance: 0.64, facets: 'step',      blurb: 'A square emerald cut with an Art-Deco, windmill flash. Elegant and vintage; also shows clarity.' },
};

export const SHAPE_ORDER = ['round', 'oval', 'cushion', 'princess', 'radiant', 'pear', 'marquise', 'heart', 'emerald', 'asscher'];

// Cut grades — the single biggest driver of how a diamond performs.
export const CUTS = {
  ideal:     { name: 'Ideal',     lightReturn: 0.98, price: 1.15, note: 'Cut to maximise light return — every ray that enters comes back out through the top as brilliance and fire.' },
  excellent: { name: 'Excellent', lightReturn: 0.92, price: 1.00, note: 'A superb cut. Only a trained eye separates it from Ideal.' },
  verygood:  { name: 'Very Good', lightReturn: 0.84, price: 0.90, note: 'Beautiful and better value — a little light escapes out the sides.' },
  good:      { name: 'Good',      lightReturn: 0.72, price: 0.78, note: 'Noticeably less lively; more light leaks through the bottom (“windowing”).' },
  fair:      { name: 'Fair',      lightReturn: 0.55, price: 0.62, note: 'Cut for weight, not beauty — it looks dull and glassy even at a high colour and clarity.' },
};
export const CUT_ORDER = ['ideal', 'excellent', 'verygood', 'good', 'fair'];

// Colour: D (icy white) → J (faint warmth).
export const COLOURS = {
  D: { name: 'D', tint: 0xffffff, price: 1.30, note: 'Absolutely colourless — the rarest, whitest grade.' },
  F: { name: 'F', tint: 0xfffdf5, price: 1.12, note: 'Colourless to the naked eye; excellent value near the top.' },
  H: { name: 'H', tint: 0xfff8e6, price: 1.00, note: 'Near-colourless — faces up white in most settings, especially yellow gold.' },
  J: { name: 'J', tint: 0xfff0cf, price: 0.82, note: 'A faint warmth. Set in yellow or rose gold it reads white and saves you plenty.' },
};
export const COLOUR_ORDER = ['D', 'F', 'H', 'J'];

// Clarity: internal purity.
export const CLARITIES = {
  VVS: { name: 'VVS', price: 1.22, note: 'Inclusions so tiny even a gemologist strains to find them at 10×.' },
  VS:  { name: 'VS',  price: 1.00, note: 'Eye-clean with minor inclusions only visible under magnification — the sweet spot for value.' },
  SI:  { name: 'SI',  price: 0.82, note: 'Usually still eye-clean, with inclusions easily seen at 10×. Best bang for the buck.' },
};
export const CLARITY_ORDER = ['VVS', 'VS', 'SI'];

// Lighting environments change how a stone performs — bright, directional light
// makes a well-cut diamond dance; flat light hides a poor cut's flaws.
export const ENVIRONMENTS = {
  showroom:   { name: 'Jewellery showroom', bg: '#0c0e14', warmth: 0.0, intensity: 1.0, sparkle: 1.0, fire: 0.5 },
  sunlight:   { name: 'Bright sunlight',    bg: '#20242e', warmth: 0.05, intensity: 1.2, sparkle: 1.3, fire: 1.0 },
  overcast:   { name: 'Overcast day',       bg: '#1a1d24', warmth: 0.0, intensity: 0.7, sparkle: 0.5, fire: 0.2 },
  candle:     { name: 'Candlelight',        bg: '#181009', warmth: 0.6, intensity: 0.6, sparkle: 0.7, fire: 0.9 },
  office:     { name: 'Office lighting',    bg: '#14171c', warmth: -0.15, intensity: 0.85, sparkle: 0.45, fire: 0.2 },
  restaurant: { name: 'Restaurant',         bg: '#1a1410', warmth: 0.35, intensity: 0.55, sparkle: 0.8, fire: 0.7 },
  night:      { name: 'Night city lights',  bg: '#0a0c12', warmth: 0.1, intensity: 0.9, sparkle: 1.1, fire: 0.8 },
};
export const ENV_ORDER = ['showroom', 'sunlight', 'overcast', 'candle', 'office', 'restaurant', 'night'];

// Setting styles for placing the stone into the piece.
export const SETTINGS = {
  solitaire: { name: 'Solitaire', blurb: 'One stone, four or six prongs. Timeless, and it lets the most light in.' },
  halo:      { name: 'Halo',      blurb: 'A ring of small diamonds around the centre — makes the stone look bigger and adds sparkle.' },
  hidden:    { name: 'Hidden Halo', blurb: 'A secret halo tucked under the centre stone — sparkle from the side profile only.' },
  bezel:     { name: 'Bezel',     blurb: 'A metal rim wraps the stone. The most protective setting — great for active hands.' },
  threestone:{ name: 'Three Stone', blurb: 'A centre flanked by two — past, present and future. Adds width and brilliance.' },
  cathedral: { name: 'Cathedral', blurb: 'Arches of metal sweep up to hold the stone high and proud.' },
  tension:   { name: 'Tension',   blurb: 'The stone appears suspended, gripped by the band’s spring pressure. Modern and airy.' },
  eastwest:  { name: 'East–West', blurb: 'An elongated stone set sideways — an unexpected, contemporary twist.' },
};
export const SETTING_ORDER = ['solitaire', 'halo', 'hidden', 'bezel', 'threestone', 'cathedral', 'tension', 'eastwest'];
