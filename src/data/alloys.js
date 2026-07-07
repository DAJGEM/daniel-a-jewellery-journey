// Alloy truth table. Purity and density are physical fact; Vickers hardness is
// the typical annealed value for jewellery alloys; colours are PBR base colours
// tuned to read true under ACES tone mapping.

export const TROY_OZ_GRAMS = 31.1035;

export const ALLOYS = {
  'gold-24k-yellow': {
    label: '24K Yellow Gold',
    purity: 0.999,
    colourHex: 0xffc356,
    vickers: 25,
    density: 19.32,
    maintenance: 'Too soft for daily-wear rings — best for investment pieces and ceremonial jewellery.',
    blurb: 'Pure gold, exactly as it leaves the refinery. Unmatched colour and value, but soft enough to scratch with a fingernail.',
  },
  'gold-22k-yellow': {
    label: '22K Yellow Gold',
    purity: 0.916,
    colourHex: 0xffc964,
    vickers: 52,
    density: 17.7,
    maintenance: 'Handle with care — wears faster than 18K in daily use.',
    blurb: 'The traditional standard across South Asia and the Middle East. Rich, deep colour with just enough alloy to hold a shape.',
  },
  'gold-18k-yellow': {
    label: '18K Yellow Gold',
    purity: 0.75,
    colourHex: 0xf3cb7a,
    vickers: 125,
    density: 15.5,
    maintenance: 'Occasional professional polish keeps it showroom-bright.',
    blurb: 'Three-quarters pure gold — the fine-jewellery sweet spot. Warm colour, real durability, and it never causes the skin reactions cheaper alloys can.',
  },
  'gold-18k-white': {
    label: '18K White Gold',
    purity: 0.75,
    colourHex: 0xe9e8e4,
    vickers: 180,
    density: 15.8,
    maintenance: 'Rhodium re-plating every 1–2 years keeps the bright white finish.',
    blurb: 'Gold alloyed with palladium or nickel, then rhodium-plated for a bright platinum-like white at a friendlier price.',
  },
  'gold-18k-rose': {
    label: '18K Rose Gold',
    purity: 0.75,
    colourHex: 0xe7a186,
    vickers: 150,
    density: 15.0,
    maintenance: 'No plating to wear off — the colour is the metal itself.',
    blurb: 'Copper in the alloy gives rose gold its blush. The colour goes all the way through, so it never fades or peels.',
  },
  'gold-14k-yellow': {
    label: '14K Yellow Gold',
    purity: 0.585,
    colourHex: 0xeec26b,
    vickers: 165,
    density: 13.6,
    maintenance: 'The workhorse — shrugs off daily wear with minimal care.',
    blurb: 'Over half pure gold and noticeably harder than 18K. The most popular choice in Canada for rings that get worn every day.',
  },
  'gold-14k-white': {
    label: '14K White Gold',
    purity: 0.585,
    colourHex: 0xe7e6e1,
    vickers: 200,
    density: 13.0,
    maintenance: 'Rhodium re-plating every 1–2 years keeps the bright white finish.',
    blurb: 'The hardest of the classic golds — a practical white metal for engagement rings on a real-world budget.',
  },
  'gold-14k-rose': {
    label: '14K Rose Gold',
    purity: 0.585,
    colourHex: 0xdd9273,
    vickers: 175,
    density: 13.1,
    maintenance: 'No plating to wear off — the colour is the metal itself.',
    blurb: 'A deeper, coppery rose with excellent hardness. Vintage warmth that stands up to modern life.',
  },
  'platinum-950': {
    label: 'Platinum 950',
    purity: 0.95,
    colourHex: 0xe5e4e2,
    vickers: 135,
    density: 20.7,
    maintenance: 'Develops a soft satin patina; a periodic polish restores the mirror.',
    blurb: 'Naturally white, denser than gold, and hypoallergenic. When platinum scratches, metal is displaced, not lost — pieces last generations.',
  },
};

// Market value in CAD of the metal content only. Caller passes the matching
// spot price (gold or platinum, USD per troy ounce).
export function alloyValueCAD(alloyKey, grams, spotUsdPerOz, usdCad) {
  const alloy = ALLOYS[alloyKey];
  return grams * alloy.purity * (spotUsdPerOz / TROY_OZ_GRAMS) * usdCad;
}
