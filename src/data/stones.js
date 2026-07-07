// Stone data. Price bands are honest typical CAD retail ranges per carat for
// good-quality 1 ct stones — labelled everywhere as "typical range, not a quote".

export const STONES = {
  'natural-diamond': {
    label: 'Natural Diamond',
    dispersion: 0.044,
    ior: 2.42,
    colourHex: 0xffffff,
    pricePerCaratCAD: [4500, 12000],
    blurb: 'Formed over a billion years, deep in the earth. Graded on the 4 Cs — cut matters most, because cut is what makes a diamond dance.',
  },
  'lab-diamond': {
    label: 'Lab-Grown Diamond',
    dispersion: 0.044,
    ior: 2.42,
    colourHex: 0xffffff,
    pricePerCaratCAD: [900, 2500],
    blurb: 'Chemically and optically identical to natural diamond — a jeweller needs lab equipment to tell them apart. The same fire, for far less.',
  },
  moissanite: {
    label: 'Moissanite',
    dispersion: 0.104,
    ior: 2.65,
    colourHex: 0xfdfdf6,
    pricePerCaratCAD: [400, 700],
    blurb: 'Not a diamond and not pretending to be — moissanite has more than double the fire, a rainbow sparkle you can spot across a room.',
  },
  sapphire: {
    label: 'Sapphire',
    dispersion: 0.018,
    ior: 1.77,
    colourHex: 0x2456b8,
    pricePerCaratCAD: [800, 4000],
    blurb: 'Second only to diamond in hardness among classic gems. Royal blue is the icon, but sapphires come in nearly every colour.',
  },
  ruby: {
    label: 'Ruby',
    dispersion: 0.018,
    ior: 1.77,
    colourHex: 0xb1002e,
    pricePerCaratCAD: [1200, 8000],
    blurb: 'The same mineral as sapphire, coloured red by chromium. Fine untreated rubies are rarer than diamonds of the same size.',
  },
  emerald: {
    label: 'Emerald',
    dispersion: 0.014,
    ior: 1.58,
    colourHex: 0x1b8a5a,
    pricePerCaratCAD: [900, 6000],
    blurb: 'Prized for colour above all. Nearly every emerald has internal "jardin" — gardens of inclusions that prove it grew in the earth.',
  },
};
