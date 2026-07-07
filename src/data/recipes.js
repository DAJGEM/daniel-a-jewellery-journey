// Bench classics — real alloys with their recipes (weight %). Loading one fills
// the crucible with that mix; the solver should recognise it back by name.
// Facts are the "more education than a karat readout" layer.

export const RECIPES = [
  { id: 'fine-gold', name: '24K Fine Gold', mix: { au: 99.9 },
    fact: 'Pure gold — 24 karat. Gorgeous colour, but soft enough to dent with a fingernail, so it’s rare in daily-wear rings.' },
  { id: '22k-yellow', name: '22K Yellow Gold', mix: { au: 91.7, ag: 5, cu: 3.3 },
    fact: 'The traditional standard across South Asia and the Middle East. Deep colour, only lightly alloyed.' },
  { id: '18k-yellow', name: '18K Yellow Gold', mix: { au: 75, ag: 12.5, cu: 12.5 },
    fact: 'The fine-jewellery sweet spot: equal silver and copper keep the colour warm and neutral at 75% gold.' },
  { id: '18k-white', name: '18K White Gold (Pd)', mix: { au: 75, pd: 25 },
    fact: 'Palladium bleaches gold to a bright white — the premium, hypoallergenic way to make white gold.' },
  { id: '18k-rose', name: '18K Rose Gold', mix: { au: 75, cu: 22.5, ag: 2.5 },
    fact: 'Load it with copper and gold blushes pink. The colour runs all the way through — it never wears off.' },
  { id: '14k-yellow', name: '14K Yellow Gold', mix: { au: 58.5, ag: 25, cu: 16.5 },
    fact: 'Canada’s everyday workhorse: harder than 18K and easier on the budget, still unmistakably gold.' },
  { id: '14k-white', name: '14K White Gold (Ni)', mix: { au: 58.5, ni: 24, cu: 12.5, zn: 5 },
    fact: 'Nickel makes a hard, cheap white gold — but roughly 1 in 8 people react to nickel against the skin.' },
  { id: 'sterling', name: 'Sterling Silver 925', mix: { ag: 92.5, cu: 7.5 },
    fact: '92.5% silver with a little copper for strength. The “925” stamp inside your silver means exactly this.' },
  { id: 'pt950', name: 'Platinum 950', mix: { pt: 95, pd: 5 },
    fact: '95% platinum. Denser than gold, naturally white, and it wears for generations without plating.' },
  { id: 'yellow-brass', name: 'Yellow Brass', mix: { cu: 65, zn: 35 },
    fact: 'Copper + zinc, and not a speck of gold — yet it fools people daily. This is what most “gold-tone” costume jewellery really is.' },
  { id: 'bronze', name: 'Bronze', mix: { cu: 88, sn: 12 },
    fact: 'Copper + tin: humanity’s first alloy, ~5,000 years old. It literally named an age.' },
  { id: 'shakudo', name: 'Shakudō', mix: { cu: 96, au: 4 },
    fact: 'A Japanese alloy of copper with a touch of gold that patinas to a deep blue-black. Prized on antique sword fittings.' },
  { id: 'purple-gold', name: 'Purple Gold', mix: { au: 79, al: 21 },
    fact: 'Gold + aluminium forms a genuinely purple intermetallic — real 19K gold, but so brittle it shatters like glass. Used as inlay, never as a band.' },
  { id: 'nordic-gold', name: 'Nordic Gold', mix: { cu: 89, al: 5, zn: 5, sn: 1 },
    fact: 'The gold-coloured alloy in €10–€50 coins. Looks like gold, contains none — a masterclass in why colour isn’t proof.' },
];

export const RECIPE_BY_ID = Object.fromEntries(RECIPES.map((r) => [r.id, r]));
