// Raw stock — the metals you pour into the crucible. Melting points, densities
// and colours are physical fact; `family` drives the alloy colour maths.

export const METALS = {
  au: { symbol: 'Au', name: 'Gold', meltC: 1064, density: 19.32, colourHex: 0xffd34e, family: 'noble-yellow',
        note: 'The only truly yellow metal. Never tarnishes. Too soft to wear pure.' },
  ag: { symbol: 'Ag', name: 'Silver', meltC: 962, density: 10.49, colourHex: 0xf2f2ef, family: 'white',
        note: 'The whitest, most reflective metal. Tarnishes in air; cools a gold alloy’s colour.' },
  cu: { symbol: 'Cu', name: 'Copper', meltC: 1085, density: 8.96, colourHex: 0xc7784a, family: 'red',
        note: 'The reddener. A little warms gold; a lot turns it rose. The backbone of brass and bronze.' },
  zn: { symbol: 'Zn', name: 'Zinc', meltC: 420, density: 7.14, colourHex: 0xc3c7cb, family: 'white',
        note: 'Lowers melting point and whitens. The partner metal in brass and white gold.' },
  ni: { symbol: 'Ni', name: 'Nickel', meltC: 1455, density: 8.90, colourHex: 0xcac4b4, family: 'white',
        note: 'A hard, cheap whitener for white gold — but a common skin-allergy trigger.' },
  pd: { symbol: 'Pd', name: 'Palladium', meltC: 1555, density: 12.02, colourHex: 0xcecabc, family: 'white',
        note: 'A platinum-group whitener. Hypoallergenic and the premium way to make white gold.' },
  pt: { symbol: 'Pt', name: 'Platinum', meltC: 1768, density: 21.45, colourHex: 0xe5e4e2, family: 'white',
        note: 'Naturally white, dense and hypoallergenic. Melts far hotter than gold.' },
  sn: { symbol: 'Sn', name: 'Tin', meltC: 232, density: 7.29, colourHex: 0xd0d4d8, family: 'grey',
        note: 'Soft and low-melting. Alloyed with copper it becomes bronze.' },
  al: { symbol: 'Al', name: 'Aluminium', meltC: 660, density: 2.70, colourHex: 0xd6d7da, family: 'grey',
        note: 'Light and modern. With gold it forms a purple intermetallic — beautiful but brittle.' },
  pb: { symbol: 'Pb', name: 'Lead', meltC: 327, density: 11.34, colourHex: 0x74777d, family: 'grey',
        note: 'Heavy, soft and toxic. Never used in real jewellery — here only to prove a point.' },
};

// Order the jars appear in the raw-stock rack.
export const METAL_ORDER = ['au', 'ag', 'cu', 'zn', 'ni', 'pd', 'pt', 'sn', 'al', 'pb'];

// Live-priced metals (per troy oz via gold-api symbols). Others valued near zero.
export const PRICED_METALS = { au: 'XAU', ag: 'XAG', pt: 'XPT', pd: 'XPD' };
