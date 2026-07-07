# The Journey of Gold — From Earth to Forever
## Design Spec — 2026-07-07 (approved by Daniel)

Flagship interactive experience page for danielajewellery.ca. The visitor scrolls
through the making of a piece of jewellery — mining, melting, alloying, casting,
finishing, stone setting, inspection, testing, reveal — and the choices they make
persist to the end, so they leave feeling they made their own piece.

Business goals: trust, session duration/engagement (SEO signal), custom-order and
repair inquiries, support for gold-buying and appraisal services.

---

## Scope

**Phase 1 (this project):** the full 10-act interactive journey, live metal
prices, metal/chain-weight calculator, engraving preview, certificate download.
Everything runs client-side (no server, no accounts, no API keys).

**Phase 2 (separate project, needs a small secure backend):** AI photo analysis
(heirloom/inspiration uploads), AR try-on, camera ring sizing, before/after
restoration simulator (also needs Daniel's real photos).

**Phase 1.5 opportunity (noted, not committed):** export real CAD models from
MatrixGold as GLB and swap them in for the generated jewellery meshes.

**Explicitly not doing:** copying TraxNYC; autoplaying audio; fake "loading"
theatrics; any feature requiring a server key in client code.

---

## Architecture (Approach C — hybrid, approved)

Two deliverables:

1. **Squarespace code block** on a new page `/journey-of-gold` (page title:
   "The Journey of Gold — From Earth to Forever").
   Contains: all crawlable content (H1, per-act H2s + educational copy, FAQ),
   JSON-LD, the mount `<div>`, a small loader `<script>` that pulls the engine
   from GitHub Pages, and a no-JS/no-WebGL readable fallback (the same copy,
   styled, with still imagery).
2. **Engine repo (this repo)** published via GitHub Pages on the existing
   DAJGEM account (same pattern as daniel-a-jewellery-skool). Loaded from the
   `dajgem.github.io/daniel-a-jewellery-journey/` URL — no DNS changes needed.
   - `journey.js` — one self-contained bundle (Three.js + GSAP compiled in via
     esbuild): a single HTTP request, no third-party CDN dependency at runtime.
   - `journey.css` — experience styles.
   - Dev harness `index.html` for local testing (never linked publicly).

Updates after launch ship by pushing to GitHub; the Squarespace block is never
re-pasted.

**Install method:** Chrome browser automation (claude-in-chrome) into the
Squarespace editor, same as the Live Gold Market section. Plan-tier check
(Business+ required for code blocks) verified at install time — the Gold Market
block is the precedent.

---

## The Ten Acts

One fixed full-viewport WebGL canvas behind scrolling HTML. GSAP ScrollTrigger
drives camera/scene transitions. Acts with interactions hold ("pin") until the
visitor acts or skips. A single Three.js renderer is shared; per-act scenes are
created lazily and disposed when far off-screen. Visitor state
`{grams, karat, colour, metal, form, finish, engraving, stone, caratWeight}`
flows through all acts.

1. **Hero.** Procedural molten-gold shader (noise-driven flow, emissive
   black-body glow, ember particles, heat-distortion post pass). Reacts subtly
   to pointer. Headline: "You've worn gold your entire life. / Today you'll
   create it." CTA: Begin the Journey (smooth-scrolls to Act 2).
2. **Mine.** Dark rock face, glinting vein shader. Tap/click veins → fracture
   shards animate off, nuggets fall (lightweight verlet physics), gram counter
   0.00 → ~15 g. Fact cards (all-gold-ever-mined volume; ~1 g per tonne of ore).
3. **Purify.** Nuggets in crucible. Press-and-hold heat control; gauge climbs
   20 → 1,064 °C; glow follows real black-body colour ramp; melt occurs exactly
   at 1,064 °C; "99.99% Pure" stamp animation. Copy: what refining removes.
4. **Alloy.** Selectors: 14K/18K/22K/24K × Yellow/White/Rose + Platinum.
   Material updates live with real measured alloy RGB values. Panel: hardness
   (Vickers), durability, maintenance (incl. rhodium note for white gold), and
   **value in CAD from the live price feed** × purity × grams.
5. **Cast.** Form choice: Ring / Pendant / Chain / Bracelet / Earrings.
   Shader-driven pour stream fills a mold cross-section; steam particles;
   cooling glow fade; visible ~1.7 % shrinkage with a real-shrinkage callout.
   Copy: lost-wax casting in plain language.
6. **Finish.** Drag-to-rotate piece. Finishes: mirror / satin / brushed /
   hammered (procedural roughness/normal swaps). Engraving: text input renders
   onto the band via canvas texture. Links to engraving/repair services.
7. **Stones.** Stone type (Natural / Lab / Moissanite / Sapphire / Ruby /
   Emerald) and size 0.5–2 ct. Drag with magnetic snap into setting.
   Env-mapped sparkle with dispersion approximation. Live panel: carat, cut,
   colour, clarity, indicative price range. Honest natural-vs-lab copy.
8. **Microscope.** Zoom slider 1×→1000× (camera dolly + LOD texture swaps):
   hallmark, laser inscription, grain structure, an inclusion. Trust framing:
   "the magnification we inspect at."
9. **Torch Test.** Bench with six tests: flame, acid, magnet, density,
   ultrasonic, XRF. Each runs real-vs-fake with plain-language failure
   explanation. CTA into appraisals & gold buying.
10. **Showroom.** Configured piece, reflective pedestal, three-point lighting,
    slow turntable, depth of field, dust particles. Actions: Download Photo
    (canvas → PNG), Download Certificate (generated "Certificate of Craft" PNG
    with first name + configuration — lead capture), Share, Start Custom Order
    (contact link carrying configuration summary), Book Appointment. Live
    gold/platinum/silver ticker + metal weight calculator.

**Sound:** off by default; elegant toggle; subtle ambience + UI ticks.

---

## Live data

Reuse the proven Gold Market stack: gold-api.com spot (XAU; verify XAG/XPT
endpoints at implementation) × frankfurter.dev USD→CAD. Same failure behaviour:
if a feed is down, show "visit us in store for today's rates" — never stale
numbers. Values labelled market value, not buying rate (same disclaimer).

## Performance budget

- Total transfer < ~1 MB gzipped; no model/video downloads (all geometry and
  materials procedural).
- Only the active act renders (IntersectionObserver-gated render loop).
- Mobile adaptive quality: DPR cap, particle scaling, simplified shaders.
- Fallbacks: no WebGL or `prefers-reduced-motion` → styled static version with
  full copy and still imagery. No broken pages, ever.
- Target 60 fps on a mid-range phone; measured before launch.

## SEO & AI-search

- One H1; one H2 per act; unique title + meta description.
- JSON-LD: `FAQPage` (e.g., "How do jewellers test real gold?", "Is lab-grown
  a real diamond?", "What karat is best for a ring?"), plus reference to the
  site's `JewelryStore` entity.
- Internal links per act to service pillar pages (finish → repair/engraving;
  torch test → appraisal/gold buying; stones → custom design).
- All educational copy is real HTML in the Squarespace block — crawlable
  without JS, written in plain factual style AI engines can quote.
- Canadian English ("jewellery") throughout; "jewelry" only in meta keywords
  where volume justifies.

## Accessibility

Semantic HTML, keyboard-operable controls for every interaction (buttons/
sliders mirror drag gestures), focus states, alt/aria text, contrast-checked
palette, reduced-motion support (doubles as the fallback).

## Conversion

One clear CTA per stage; persistent subtle "Book a visit" pill after Act 3;
certificate download as the lead-capture moment; custom-order CTA carries the
visitor's configuration. Real contact/booking URLs confirmed from the live site
during install (Gold Market used `/contact` as placeholder — verify).

## Rollout (safe, approved)

1. Build + test locally in Chrome (desktop and phone widths); verify 60 fps.
2. Push engine repo to GitHub, enable Pages.
3. Create `/journey-of-gold` in Squarespace **unlinked from navigation**;
   install block via Chrome automation; verify live behaviour end-to-end.
4. Daniel reviews the hidden live page.
5. On his approval only: add to navigation. (He asked to keep momentum — if he
   says "go live" earlier, steps 4–5 compress.)

## Risks & mitigations

- **Squarespace plan tier** — code blocks need Business+. Precedent: Gold
  Market block. Verified at install; if blocked, stop and report options.
- **Code block size** — kept small by design (copy + loader only).
- **GitHub Pages dependency** — extremely reliable; if unreachable, the page
  degrades to the readable fallback, never a blank section.
- **Old-device performance** — adaptive quality + static fallback.
- **TradingView/data-source terms** — same attribution rules as Gold Market
  if any widget is reused (current design uses raw APIs, no widget).
