# The Journey of Gold — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A scroll-driven 10-act interactive WebGL experience ("The Journey of Gold — From Earth to Forever") installed on danielajewellery.ca via a small Squarespace code block that loads a self-contained engine bundle from GitHub Pages.

**Architecture:** One repo (`~/Desktop/daniel-a-jewellery-journey`). esbuild bundles Three.js + GSAP + our code into a single `dist/journey.js` + `dist/journey.css`. Crawlable page content lives in `src/content/page-content.html` — the build injects it into both the local dev harness (`index.html`) and the paste-ready `dist/code-block.html`. A sticky full-viewport canvas renders one shared Three.js renderer; acts are lazily created scenes driven by GSAP ScrollTrigger. Visitor choices persist in a tiny pub/sub state store.

**Tech Stack:** three@0.166.x, gsap@3.12.x (ScrollTrigger), esbuild, vitest, vanilla JS (no framework), GitHub Pages, Squarespace code block.

## Global Constraints

- Canadian English in ALL visitor-facing copy ("jewellery"); "jewelry" only inside SEO meta where noted.
- No autoplaying audio; sound toggle default OFF.
- Payload budget: `journey.js` + `journey.css` < 1 MB gzipped; no runtime 3D-model/video/texture downloads (all procedural).
- Runtime network calls allowed ONLY to: our GitHub Pages files, `api.gold-api.com`, `api.frankfurter.dev`, Google Fonts.
- Price failure behaviour: never show stale/wrong numbers — show "Live pricing temporarily unavailable — visit us in store for today's rates."
- All prices labelled market value, not buying rate.
- No WebGL / `prefers-reduced-motion` → page must remain fully readable (class `journey-static` on `#journey-root`; engine skipped; CSS shows static styling). Never a blank section.
- Every pointer interaction has a keyboard-operable equivalent (buttons/sliders/inputs).
- Melting point of gold everywhere: **1,064 °C**. Casting shrinkage callout: **~1.7 %**.
- Commit after every task (this repo is already a git repo with the spec committed).
- Published URL base (Task 21): `https://dajgem.github.io/daniel-a-jewellery-journey/dist/`.

---

### Task 1: Scaffold, build pipeline, dev harness

**Files:**
- Create: `package.json`, `.gitignore`, `build.mjs`, `src/content/page-content.html` (skeleton), `src/styles/journey.css` (shell), `src/main.js` (stub), `index.html` (generated), `squarespace/` note in README later (none yet)

**Interfaces:**
- Produces: `npm run build` → `dist/journey.js`, `dist/journey.css`, `dist/code-block.html`, regenerated `index.html`. `npm run dev` → watch + local server on :8123. `npm test` → vitest.

- [ ] **Step 1: package.json + deps**

```json
{
  "name": "daniel-a-jewellery-journey",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "node build.mjs",
    "dev": "node build.mjs --watch",
    "test": "vitest run"
  }
}
```

Run: `npm i -D esbuild vitest && npm i three@0.166.1 gsap@3.12.5`
`.gitignore`: `node_modules/`

- [ ] **Step 2: build.mjs**

esbuild API script that: (a) bundles `src/main.js` → `dist/journey.js` (format `iife`, minify, target `es2019`); (b) copies/minifies `src/styles/journey.css` → `dist/journey.css`; (c) reads `src/content/page-content.html` and writes BOTH:
- `index.html` = dev shell: `<meta viewport>` + `<link href="dist/journey.css">` + content + `<script src="dist/journey.js" defer>`
- `dist/code-block.html` = same content but asset URLs pointing at the published base URL (Global Constraints) + the Google Fonts `<link>` block (Cormorant Garamond 500/600 + Montserrat 400/500/600 — same families as the Gold Market section).
With `--watch`: esbuild context watch + `serve({ servedir: '.', port: 8123 })`.

- [ ] **Step 3: skeleton content + stub main**

`src/content/page-content.html`: `<div id="journey-root">` containing `<div id="journey-canvas-holder"></div>` and ten `<section class="journey-act" data-act="01">…<h2>…</h2><p>placeholder copy</p></section>` (acts 01–10, real copy comes in Task 19; use one-line placeholder sentences now, replaced in Task 19). `src/main.js`: `console.log('journey boot')`. CSS shell: `#journey-root { background:#0a0a0c; color:#f4efe6; }` + act section min-height 100vh.

- [ ] **Step 4: verify**

Run: `npm run build && npm test -- --passWithNoTests` → build succeeds, dist files exist. Open `http://localhost:8123` under `npm run dev`: ten dark sections, console logs "journey boot".

- [ ] **Step 5: Commit** `git add -A && git commit -m "feat: scaffold build pipeline and dev harness"`

---

### Task 2: Visitor state store (TDD)

**Files:** Create: `src/core/state.js`, `tests/state.test.js`

**Interfaces:**
- Produces: `createState(initial?) → { get(), set(patch), subscribe(fn) → unsub }`; `DEFAULT_STATE = { grams: 0, alloy: 'gold-18k-yellow', form: null, finish: 'mirror', engraving: '', stone: null, stoneCarat: 1.0, firstName: '' }`. `subscribe` callbacks receive `(state, changedKeys)`.

- [ ] **Step 1: failing tests**

```js
import { describe, it, expect, vi } from 'vitest';
import { createState, DEFAULT_STATE } from '../src/core/state.js';

describe('state', () => {
  it('starts with defaults merged with initial', () => {
    const s = createState({ grams: 5 });
    expect(s.get().grams).toBe(5);
    expect(s.get().alloy).toBe(DEFAULT_STATE.alloy);
  });
  it('set merges and notifies with changed keys', () => {
    const s = createState(); const fn = vi.fn();
    s.subscribe(fn);
    s.set({ form: 'ring', finish: 'satin' });
    expect(s.get().form).toBe('ring');
    expect(fn).toHaveBeenCalledWith(expect.objectContaining({ form: 'ring' }), ['form', 'finish']);
  });
  it('unsubscribe stops notifications', () => {
    const s = createState(); const fn = vi.fn();
    s.subscribe(fn)();
    s.set({ grams: 1 });
    expect(fn).not.toHaveBeenCalled();
  });
  it('get returns a copy, not live reference', () => {
    const s = createState(); s.get().grams = 99;
    expect(s.get().grams).toBe(0);
  });
});
```

- [ ] **Step 2: run, expect FAIL** — `npm test` fails: cannot find module.
- [ ] **Step 3: implement** — plain object store: spread-merge, compute changedKeys by comparing patch values to previous, notify Set of subscribers, `get()` returns `{ ...state }`.
- [ ] **Step 4: run, expect PASS** — `npm test` green.
- [ ] **Step 5: Commit** `git commit -m "feat: visitor state store"`

---

### Task 3: Metallurgy data — alloys, stones, black-body glow (TDD)

**Files:** Create: `src/data/alloys.js`, `src/data/stones.js`, `src/lib/blackbody.js`, `tests/alloys.test.js`, `tests/blackbody.test.js`

**Interfaces:**
- Produces:
  - `ALLOYS` map keyed by `gold-{24k|22k|18k|14k}-{yellow}`, `gold-{18k|14k}-{white|rose}`, `platinum-950` → `{ label, purity, colourHex, vickers, density, maintenance, blurb }`
  - `alloyValueCAD(alloyKey, grams, spotUsdPerOz, usdCad) → number`
  - `STONES` map: `natural-diamond|lab-diamond|moissanite|sapphire|ruby|emerald` → `{ label, dispersion, colourHex, pricePerCaratCAD: [lo, hi], blurb }`
  - `glow(celsius) → { r, g, b, intensity }` (0–255 channels, intensity 0–1)

- [ ] **Step 1: failing tests**

```js
// tests/alloys.test.js
import { ALLOYS, alloyValueCAD } from '../src/data/alloys.js';
it('18k yellow has correct purity/density/hardness', () => {
  const a = ALLOYS['gold-18k-yellow'];
  expect(a.purity).toBe(0.75); expect(a.density).toBeCloseTo(15.5, 1); expect(a.vickers).toBe(125);
});
it('value: 10g 18k at $2400/oz, 1.37 CAD', () => {
  expect(alloyValueCAD('gold-18k-yellow', 10, 2400, 1.37)).toBeCloseTo(792.85, 0);
});
// tests/blackbody.test.js
import { glow } from '../src/lib/blackbody.js';
it('room temperature: no glow', () => expect(glow(20).intensity).toBe(0));
it('melting point: full intensity, red channel saturated', () => {
  const g = glow(1064); expect(g.intensity).toBe(1); expect(g.r).toBe(255); expect(g.g).toBeGreaterThan(60); expect(g.b).toBe(0);
});
it('900°C is dimmer and redder than 1064°C', () => {
  expect(glow(900).intensity).toBeLessThan(1); expect(glow(900).g).toBeLessThan(glow(1064).g);
});
```

- [ ] **Step 2: run, expect FAIL**
- [ ] **Step 3: implement with these exact values**

Alloys (per-key): 24k-yellow `purity .999, colour 0xFFC356, vickers 25, density 19.32`; 22k-yellow `.916, 0xFFC964, 52, 17.7`; 18k-yellow `.75, 0xF3CB7A, 125, 15.5`; 18k-white `.75, 0xE9E8E4, 180, 15.8, maintenance: rhodium re-plating every 1–2 years`; 18k-rose `.75, 0xE7A186, 150, 15.0`; 14k-yellow `.585, 0xEEC26B, 165, 13.6`; 14k-white `.585, 0xE7E6E1, 200, 13.0`; 14k-rose `.585, 0xDD9273, 175, 13.1`; platinum-950 `.95, 0xE5E4E2, 135, 20.7, maintenance: develops patina; periodic polish`. `alloyValueCAD = grams × purity × (spot/31.1035) × fx` (platinum uses its own spot — caller passes the right one). Each entry gets a one-sentence plain-language `blurb` (write final copy now, Canadian English).
Stones: natural-diamond `dispersion .044, [4500, 12000]/ct`; lab-diamond `.044, [900, 2500]`; moissanite `.104, [400, 700]`; sapphire `0x2456B8`, ruby `0xB1002E`, emerald `0x1B8A5A` with honest price bands and blurbs.
`glow()`: Kelvin = C + 273.15; intensity = clamp((K − 750) / (1337 − 750), 0, 1) with `intensity=0` below 480 °C; colour via Tanner-Helland approximation clamped to ≤ 6600 K (red = 255; green = 99.4708 × ln(K/100) − 161.12; blue = 0 below 1900 K), channels rounded + clamped 0–255.

- [ ] **Step 4: run, expect PASS**
- [ ] **Step 5: Commit** `git commit -m "feat: alloy/stone data and black-body glow"`

---

### Task 4: Live prices + weight calculator (TDD)

**Files:** Create: `src/data/prices.js`, `src/lib/calculator.js`, `tests/prices.test.js`, `tests/calculator.test.js`

**Interfaces:**
- Produces: `fetchSpotPrices(fetchImpl = fetch) → Promise<{ gold, silver, platinum|null, usdCad, fetchedAt }>` (each metal `{ usdPerOz }`; platinum `null` if its request fails; **throws** if gold or FX fails); `pricePerGramCAD(usdPerOz, usdCad, purity) → number`; `FORM_VOLUMES_CM3 = { ring: .26, pendant: .35, bracelet: 1.1, chain: .9, earrings: .2 }`; `estimateWeightGrams(form, alloyKey, scale = 1)`.

- [ ] **Step 1: failing tests** — mock `fetchImpl` returning `{ price: 2400 }` for `XAU`, `{ price: 29 }` for `XAG`, rejected promise for `XPT`, `{ rates: { CAD: 1.37 } }` for frankfurter. Assert: platinum is `null`, gold.usdPerOz 2400, usdCad 1.37; `pricePerGramCAD(2400, 1.37, .75)` ≈ 79.29; `estimateWeightGrams('ring','gold-18k-yellow')` ≈ 4.03; gold-endpoint rejection → whole call rejects.
- [ ] **Step 2: run, expect FAIL**
- [ ] **Step 3: implement** — endpoints exactly: `https://api.gold-api.com/price/XAU` (also `XAG`, `XPT`) and `https://api.frankfurter.dev/v1/latest?base=USD&symbols=CAD` (same sources as the proven Gold Market section; parsing shape `{price}` / `{rates:{CAD}}` — confirm against `~/Desktop/daniel-a-jewellery-gold-market/split-version/3-script.js` lines 60–65 while implementing). `Promise.allSettled` for metals; gold+FX mandatory. `estimateWeightGrams = FORM_VOLUMES_CM3[form] × ALLOYS[alloyKey].density × scale`.
- [ ] **Step 4: run, expect PASS**
- [ ] **Step 5: Commit** `git commit -m "feat: live spot prices and weight calculator"`

---

### Task 5: Stage — shared renderer, quality tiers, scroll wiring

**Files:** Create: `src/core/stage.js`, `src/core/quality.js`, `src/core/scroll.js`; Modify: `src/main.js`, `src/styles/journey.css`

**Interfaces:**
- Produces:
  - `detectQuality() → { tier: 'high'|'mid'|'low', dpr, particleScale }` (dpr = min(devicePixelRatio, tier high 2 / mid 1.5 / low 1); tier from `navigator.hardwareConcurrency`, `deviceMemory`, UA mobile hint)
  - `createStage(holderEl, quality) → { THREE renderer bound to a sticky full-viewport canvas, registerAct(act), dispose() }`
  - **Act interface (every act module implements):** `createAct({ THREE, gsap, state, quality, sectionEl, hud }) → { id, init(scene, camera), enter(), update(progress, dt), exit(), dispose() }`. Stage renders ONLY the active act; acts init lazily on first `enter()`; `dispose()` called when > 2 sections away.
  - `wireScroll(acts, stage)` — per `section.journey-act` a ScrollTrigger (`start 'top top'`, `end '+=150%'`, `pin: true, scrub: 0.6`) mapping progress → `act.update(progress)`; sets active act on enter/enterBack.
- Consumes: `createState` (Task 2), quality/DPR constraints (Global).

- [ ] **Step 1: implement** — canvas is `position: sticky; top: 0; height: 100vh` inside `#journey-canvas-holder` which spans the whole `#journey-root` via CSS grid layering (sections have `position: relative; z-index: 1`). Renderer: `antialias: tier !== 'low'`, `setPixelRatio(quality.dpr)`, `outputColorSpace = SRGBColorSpace`, `toneMapping = ACESFilmicToneMapping`. Environment: `RoomEnvironment` + `PMREMGenerator` once, shared via ctx. Render loop gated by `document.visibilityState` and an IntersectionObserver on `#journey-root`.
- [ ] **Step 2: two stub acts to prove lifecycle** — temporary `stub-a` (rotating gold torus, MeshStandardMaterial metalness 1 roughness .15) and `stub-b` (blue cube); register on sections 01/02.
- [ ] **Step 3: visual verify** — dev server: torus renders with env reflections; scrolling into section 02 pins, swaps to cube; back-scroll returns torus; fps meter (temporary `?fps=1` query showing `requestAnimationFrame` delta avg) ≥ 55 on this Mac; resizing window keeps canvas full-viewport.
- [ ] **Step 4: Commit** `git commit -m "feat: shared WebGL stage with quality tiers and scroll-driven act lifecycle"`

---

### Task 6: Material + procedural jewellery geometry library

**Files:** Create: `src/lib/materials.js`, `src/lib/geometry.js`

**Interfaces:**
- Produces:
  - `makeMetalMaterial(THREE, { alloyKey, finish }) → MeshPhysicalMaterial` — colour from `ALLOYS`, finish presets: mirror `roughness .06`, satin `.28`, brushed `.35 + anisotropic-look normal map (procedural canvas: 1px horizontal streaks)`, hammered `.2 + procedural bump (canvas radial dents)`; metalness 1.
  - `makeGemMaterial(THREE, stoneKey) → MeshPhysicalMaterial` — `transmission .95, ior 2.4 (diamond/moissanite) / 1.77 (corundum) / 1.58 (emerald), dispersion via iridescence approximation, colourHex from STONES`.
  - `buildForm(THREE, form, { alloyKey, finish, stoneKey?, stoneCarat? }) → Group` for `ring | pendant | bracelet | chain | earrings`: ring = torus band (major r 1, tube .12) + tapered prong head (4 cylinders) + gem (octahedron-ish: `SphereGeometry(…, 8, 6)` flat-shaded or `ConeGeometry` pair) when stoneKey set; pendant = teardrop lathe + bail + gem; chain = 24 interlocked torus links along a `CatmullRomCurve3` drape; bracelet = 12 larger links closed loop; earrings = mirrored pair of pendant-minis. Engraving applied later by act 6 via canvas texture on band inner face — expose `group.userData.engraveTarget` mesh.
  - `applyEngraving(THREE, group, text)` — CanvasTexture (Cormorant Garamond italic, 512×64) mapped to `engraveTarget`.

- [ ] **Step 1: implement library**
- [ ] **Step 2: gallery verify** — temporary `?gallery=1` mode in main.js: render all 5 forms × cycling finishes on keypress; verify each form reads as jewellery at a glance, finishes visibly differ, gem sparkles with env reflections. Phone-width check via responsive dev tools.
- [ ] **Step 3: Commit** `git commit -m "feat: PBR metal/gem materials and procedural jewellery geometry"`

---

### Task 7: Shared particle system

**Files:** Create: `src/lib/particles.js`

**Interfaces:**
- Produces: `createParticles(THREE, { kind: 'embers'|'steam'|'dust'|'sparks', count, area, colour? }) → { points, update(dt), setRate(r), dispose() }`. Points-based, additive blending for embers/sparks, soft-alpha sprite (procedural radial-gradient CanvasTexture) for steam/dust. `count` multiplied by `quality.particleScale`.

- [ ] **Step 1: implement**; **Step 2: verify** in gallery mode (`?gallery=1` adds one of each kind on keys 1–4, smooth at 60fps); **Step 3: Commit** `git commit -m "feat: shared particle system"`

---

### Task 8: Act 1 — Hero: molten gold

**Files:** Create: `src/acts/act01-hero.js`; Modify: `src/main.js` (register acts array, remove stubs as replaced)

**Interfaces:** Consumes act interface (Task 5), particles (Task 7), glow (Task 3).

- [ ] **Step 1: implement** — Fullscreen quad `ShaderMaterial`: fbm-noise-driven flowing liquid gold (3-octave value noise, domain-warped by time + slight pointer parallax uniform `uPointer`), colour ramp black→deep red→`glow(1200)` orange→near-white highlights; subtle heat-distortion by refracting the noise field into itself. Ember particles rising. HTML overlay in section 01 (already in content): H1 lines "You've worn gold your entire life." / "Today you'll create it." + `Begin the Journey` button → `gsap.to(window, { scrollTo: section02 })` (ScrollToPlugin). Reduced-motion: shader time frozen at a good frame.
- [ ] **Step 2: verify** — molten surface flows organically (no tiling artifacts), pointer moves highlight subtly, button smooth-scrolls, 60fps desktop / ≥ 40fps at `tier=low` override (`?tier=low`).
- [ ] **Step 3: Commit** `git commit -m "feat: act 1 hero molten gold"`

---

### Task 9: Act 2 — Mine

**Files:** Create: `src/acts/act02-mine.js`

**Interfaces:** Consumes state (`set({ grams })`), particles.

- [ ] **Step 1: implement** — Dark cave wall: icosahedron-based rock chunks (flat-shaded, displaced vertices, near-black material) with 6 embedded "vein" meshes (thin boxes, gold material + pulsing emissive shimmer). Click/tap or Enter on focused vein → vein's parent chunk splits into 5–8 precomputed shards that tumble out (gsap physics-ish: gravity tween + rotation), 2–3 nugget meshes (small displaced spheres, gold) drop to a ledge; `state.set({ grams: +2–3 g each })`; HUD gram counter (overlay `<output>` in section, count-up tween, "0.00 g → 15.1 g"). All 6 veins mined → "Carry your gold to the furnace ↓" prompt. Keyboard: veins are `<button>`s positioned over canvas. Fact cards (HTML, from content file) fade in per mined vein.
- [ ] **Step 2: verify** — each vein breaks once, counter accumulates to ~15 g, keyboard-only run works, mobile tap targets ≥ 44px.
- [ ] **Step 3: Commit** `git commit -m "feat: act 2 interactive mining"`

---

### Task 10: Act 3 — Purify

**Files:** Create: `src/acts/act03-purify.js`

**Interfaces:** Consumes `glow()` (exact black-body colours), particles (embers), state (`grams`).

- [ ] **Step 1: implement** — Crucible (lathe geometry, dark ceramic) holding the nuggets. Press-and-hold "HEAT" button (`pointerdown/up` + spacebar) raises `tempC` 20 → 1120 at ~150 °C/s with easing; releasing decays slowly. Vertical gauge (HTML) shows °C ticking; nugget emissive = `glow(tempC)`. At ≥ 1064: nuggets morph-scale down while a molten pool plane (act 1's shader, small) rises in the crucible — melt happens AT 1064, not before (test by holding just below). Then "99.99 % PURE" stamp: letter-spaced serif, gsap scale-settle + gold shimmer sweep. Sets `state.set({ purified: true })` — add `purified: false` to DEFAULT_STATE in this task.
- [ ] **Step 2: verify** — melt triggers exactly at 1,064 °C; glow colours progress dull red → orange → yellow-white; spacebar path works.
- [ ] **Step 3: Commit** `git commit -m "feat: act 3 furnace purification with black-body glow"`

---

### Task 11: Act 4 — Choose alloy

**Files:** Create: `src/acts/act04-alloy.js`

**Interfaces:** Consumes `ALLOYS`, `alloyValueCAD`, `fetchSpotPrices` (fetched once, cached module-level, failure → value row hidden with the standard unavailable message), state (`alloy`, `grams`).

- [ ] **Step 1: implement** — Molten pool + a dipped test ingot rendered in current alloy material. Controls (HTML radio groups styled as luxury pills): karat 14/18/22/24 + colour Yellow/White/Rose + "Platinum 950" override; illegal combos (24K white/rose) disabled with explanation tooltip. On change: gsap-tween material colour, update side panel — hardness bar (Vickers), durability meter (inverse of purity for gold), maintenance line, **value: `alloyValueCAD(alloy, state.grams, spot, fx)` formatted CAD** with "market value of the metal — not a retail price" note. Copy from `blurb` fields.
- [ ] **Step 2: verify** — colour changes < 300 ms, values match hand-calc for 18K at current spot, price-API-blocked run (devtools offline) shows the unavailable message and nothing else breaks.
- [ ] **Step 3: Commit** `git commit -m "feat: act 4 live alloy selection"`

---

### Task 12: Act 5 — Cast

**Files:** Create: `src/acts/act05-cast.js`

**Interfaces:** Consumes `buildForm`, particles (steam), state (`form`).

- [ ] **Step 1: implement** — Form picker (5 illustrated buttons: Ring/Pendant/Chain/Bracelet/Earrings — inline SVG icons). On pick: cutaway mold (two boxes with the form's silhouette gap) + pour: a tapering cylinder "stream" (molten shader) scales down from crucible lip while an emissive fill plane rises in the mold cavity; steam particles at contact; glow fades via `glow()` ramp reversed over 4 s; mold halves part; the real `buildForm` piece is revealed and **scales 1.0 → 0.983** with callout "metal shrinks ~1.7 % as it cools — we design for it." Educational copy (lost-wax) alongside. `state.set({ form })`; re-picking re-runs cast with new form.
- [ ] **Step 2: verify** — all 5 forms cast, shrinkage visibly announced, steam reads as steam on `tier=low`.
- [ ] **Step 3: Commit** `git commit -m "feat: act 5 casting with cooling and shrinkage"`

---

### Task 13: Act 6 — Hand finishing + engraving

**Files:** Create: `src/acts/act06-finish.js`

**Interfaces:** Consumes `makeMetalMaterial` finish presets, `applyEngraving`, state (`finish`, `engraving`).

- [ ] **Step 1: implement** — The cast piece centre-stage; drag (pointer) / arrow-keys rotates (gsap inertia). Finish selector (Mirror/Satin/Brushed/Hammered) hot-swaps material with 300 ms cross-tween; a small polishing-wheel mesh briefly touches the piece with spark particles on each change. Engraving: text input (max 20 chars) + "Engrave" → laser dot sweeps the band (moving point light + spark particles) revealing `applyEngraving` texture. Service tie-in copy + link (from content file) to repair/engraving page.
- [ ] **Step 2: verify** — finishes visually distinct, engraving text renders legibly and persists in state, rotation works via keyboard.
- [ ] **Step 3: Commit** `git commit -m "feat: act 6 finishing and laser engraving"`

---

### Task 14: Act 7 — Stone setting

**Files:** Create: `src/acts/act07-stones.js`

**Interfaces:** Consumes `STONES`, `makeGemMaterial`, state (`stone`, `stoneCarat`).

- [ ] **Step 1: implement** — Stone tray (6 gems on velvet-dark shelf) + the piece with an empty glinting setting. Drag a stone (pointer capture moves it on a camera-facing plane); within 0.35 world-units of the setting → magnetic snap (gsap elastic settle) + sparkle burst (sparks particles). Keyboard path: focus stone, Enter = place. Carat slider 0.5–2.0 scales gem (`r ∝ ∛carat`). Live panel: carat, cut ("Round brilliant — our reference cut"), colour/clarity honest band per stone type, price range = `pricePerCaratCAD`-style band from `STONES` × carat, labelled "typical range, not a quote". Natural-vs-lab copy block from content.
- [ ] **Step 2: verify** — snap feels magnetic (no jump-cut), swap stones freely, price band updates with carat, keyboard placement works.
- [ ] **Step 3: Commit** `git commit -m "feat: act 7 magnetic stone setting"`

---

### Task 15: Act 8 — Microscope

**Files:** Create: `src/acts/act08-microscope.js`

**Interfaces:** Consumes finished piece config from state.

- [ ] **Step 1: implement** — Zoom slider (log scale 1×→1000×, also pinch on touch) = camera dolly toward the band. Four LOD reveal layers as thresholds cross (crossfade CanvasTexture decals): 10× hallmark stamp "DAJ 750" (dynamic: 585 for 14K, 916 for 22K, 999 for 24K, PT950 for platinum), 100× laser inscription (their engraving text, micro-font), 400× procedural grain-structure texture (voronoi-ish canvas), 1000× (if stone set) a tiny feather inclusion drawn inside the gem. Vignette + circular reticle overlay = microscope framing. Copy: "the magnification we inspect at."
- [ ] **Step 2: verify** — hallmark matches chosen alloy, all four layers appear at their thresholds, pinch works at phone width.
- [ ] **Step 3: Commit** `git commit -m "feat: act 8 microscope zoom"`

---

### Task 16: Act 9 — Torch test

**Files:** Create: `src/acts/act09-test.js`

**Interfaces:** Consumes particles, glow.

- [ ] **Step 1: implement** — Bench with two chains: "solid gold" (gold material) vs "fake" (brass-ish 0xC9A86A, slightly wrong). Six test buttons, each a 4–6 s scripted scene (gsap timeline) + verdict cards for both pieces: **Flame** (torch cone + glow: real stays bright, fake darkens/oxidizes), **Acid** (drop decal: real unchanged, fake fizzes green-black), **Magnet** (bar magnet approaches: fake chain leaps to it), **Density** (both dip in graduated cylinder, displacement readout: 19.3 vs 8.5 g/cm³), **Ultrasonic** (waveform overlay: clean echo vs scattered), **XRF** (scanner gun + readout panel: "Au 75.0 % Ag 12.5 % Cu 12.5 %" vs "Cu 60 % Zn 37 % Au 0.5 % plating"). Each verdict ends with one plain-language line why fakes fail. Closing CTA: "We test every piece we buy and appraise — bring yours in." → appraisal/gold-buying link.
- [ ] **Step 2: verify** — all six run and re-run cleanly, copy readable on phone, no test relies on colour alone (icons + text verdicts).
- [ ] **Step 3: Commit** `git commit -m "feat: act 9 six-test authenticity bench"`

---

### Task 17: Act 10 — Showroom, certificate, conversion

**Files:** Create: `src/acts/act10-showroom.js`, `src/lib/certificate.js`

**Interfaces:**
- Consumes full state, `buildForm`, `estimateWeightGrams`, `fetchSpotPrices` cache, `alloyValueCAD`.
- Produces: `renderCertificate(state, canvas) → dataURL` and `snapshotPiece(renderer, scene, camera) → dataURL` (both PNG).

- [ ] **Step 1: implement showroom** — Their exact configured piece on a glossy black pedestal: reflective floor (`MeshPhysicalMaterial` clearcoat + mirrored render — or fake with radial-gradient + env intensity, decide by fps), 3-point lighting rig, slow turntable (pausable, drag override), dust particles, bokeh vignette via CSS (cheaper than post-processing DoF on low tier; use real `BokehPass` only on `tier=high`).
- [ ] **Step 2: implement actions row** — **Download Photo** (`snapshotPiece` → `<a download="my-journey-of-gold.png">`); **Download Certificate**: first-name input (stored to state) → `renderCertificate`: 1200×1600 canvas, dark ground, gold border, serif headline "Certificate of Craft", their name, date, configuration table (alloy, form, finish, engraving, stone + carat, est. weight via `estimateWeightGrams`, metal market value line when prices available), "Daniel A Jewellery — London, Ontario"; **Share** (`navigator.share` if available else copy-link button); **Start Custom Order** → contact page URL with `?subject=` config summary querystring; **Book Appointment** → contact page. Contact URLs read from `window.JOURNEY_CONFIG = { contactUrl: '/contact' }` set in the code block (single place to correct during install — real URL verified in Task 22). Ticker strip: gold/silver(/platinum if available) per-gram CAD from Task 4 + metal weight calculator (form/alloy/scale selects → grams + market value).
- [ ] **Step 3: verify** — downloaded PNGs open correctly and contain the configured piece/details; every earlier choice is visibly reflected; offline-price run hides value lines gracefully.
- [ ] **Step 4: Commit** `git commit -m "feat: act 10 showroom, certificate and conversion actions"`

---

### Task 18: HUD, sound toggle, CTA pill, fallbacks, accessibility pass

**Files:** Create: `src/ui/hud.js`, `src/ui/audio.js`; Modify: `src/main.js`, `src/styles/journey.css`, `src/content/page-content.html`

- [ ] **Step 1: HUD + pill** — progress dots (10 acts, current highlighted, click-to-jump), persistent bottom-right "Book a visit" pill appearing after act 3 (dismissable, remembers via sessionStorage), act-transition micro-labels ("Act IV — The Alloy").
- [ ] **Step 2: audio** — WebAudio synthesized ambience: filtered brown noise "furnace bed" + occasional soft chime on milestone events; master toggle (top-right, speaker icon, `aria-pressed`), DEFAULT OFF, state in sessionStorage.
- [ ] **Step 3: fallbacks** — boot guard in main.js: no WebGL2 OR `prefers-reduced-motion` OR boot error → add `journey-static` class: canvas hidden, sections get static gold-gradient backdrops (pure CSS), all copy/FAQ/calculator (calculator still works — it's DOM-only) remain. Test via `?static=1` override.
- [ ] **Step 4: accessibility sweep** — tab through entire page: every interaction reachable, visible focus rings (gold outline), aria-labels on icon buttons, contrast ≥ 4.5:1 for body copy (check the gold-on-dark values), `alt`/`aria-hidden` decorative split.
- [ ] **Step 5: verify + commit** — full keyboard journey start-to-finish; `git commit -m "feat: HUD, sound toggle, fallbacks, accessibility"`

---

### Task 19: Final page content — copy, FAQ, JSON-LD, meta

**Files:** Modify: `src/content/page-content.html`, `build.mjs` (only if injection needs escaping fixes)

- [ ] **Step 1: write final copy** — Replace all placeholder copy. Per act: H2 + 60–120 words plain, factual, quotable Canadian-English copy with the act's facts (gold facts, 1,064 °C, alloy truths, lost-wax, ~1.7 % shrinkage, 4 Cs, natural-vs-lab, testing methods). One H1 (in hero): "The Journey of Gold". Subtitle: "From Earth to Forever". Service links inline: act 6 → engraving/repairs, act 7 → custom design, act 9 → appraisals + gold buying (URLs confirmed in Task 22; use `/contact` placeholders wired through `JOURNEY_CONFIG`).
- [ ] **Step 2: FAQ section (bottom, real HTML)** — six Q&As, full answers written now, 40–80 words each: How do jewellers test if gold is real? · Is lab-grown diamond a real diamond? · What karat of gold is best for a ring? · Why does white gold need rhodium plating? · What temperature does gold melt at? · What is lost-wax casting?
- [ ] **Step 3: JSON-LD** — one `<script type="application/ld+json">`: `@graph` of `FAQPage` (the six Q&As verbatim) + `WebPage` with `about: { "@type": "JewelryStore", "name": "Daniel A Jewellery", "email": "danielajewellery@gmail.com", "address": { "@type": "PostalAddress", "addressLocality": "London", "addressRegion": "ON", "addressCountry": "CA" } }` (street address stays absent until NAP file is filled — do NOT invent one).
- [ ] **Step 4: verify** — validate JSON-LD at schema.org validator (paste), `npm run build`, read the static (`?static=1`) page top-to-bottom as a proofread.
- [ ] **Step 5: Commit** `git commit -m "feat: final copy, FAQ and structured data"`

---

### Task 20: Performance & mobile pass

- [ ] **Step 1: budget check** — `npm run build`; `gzip -c dist/journey.js | wc -c` — must be < 1,000,000 (expect 300–500 KB with Three.js). If over: enable esbuild tree-shaking check, drop unused Three modules (no GLTFLoader etc. should be imported).
- [ ] **Step 2: fps audit** — Chrome DevTools performance on: hero, cast pour, showroom (the three heaviest). ≥ 55 fps desktop. Then CPU 4× throttle + `?tier=low`: ≥ 30 fps, no interaction breaks.
- [ ] **Step 3: phone widths** — 375 px and 430 px: no horizontal scroll, tap targets ≥ 44 px, panels stack under canvas, text ≥ 16 px.
- [ ] **Step 4: fix what fails, then commit** `git commit -m "perf: quality tier tuning and mobile pass"`

---

### Task 21: Publish — GitHub repo + Pages

- [ ] **Step 1: build + commit dist** — remove `dist/` from ignore if present, `npm run build`, commit `dist/`.
- [ ] **Step 2: create repo + push** — `gh repo create DAJGEM/daniel-a-jewellery-journey --public --source . --push` (gh auth should exist from the skool repo; if not, browser-auth via `gh auth login -w`). Note to Daniel in final report: repo is public (required for free GitHub Pages) — the spec/plan docs in it are visible.
- [ ] **Step 3: enable Pages** — `gh api repos/DAJGEM/daniel-a-jewellery-journey/pages -X POST -f "source[branch]=main" -f "source[path]=/"` (or via browser if API 404s).
- [ ] **Step 4: verify live** — poll `https://dajgem.github.io/daniel-a-jewellery-journey/dist/journey.js` until 200 (Pages first deploy ≈ 1–3 min); then load `.../index.html`? No — index.html references local paths; verify instead by opening the raw dev harness locally with `JOURNEY_ASSET_BASE` pointed at the live URL (build flag) and confirming the engine boots from Pages.
- [ ] **Step 5: Commit any fixes** `git commit -m "chore: publish to GitHub Pages"`

---

### Task 22: Squarespace install (Chrome) + live verification

Uses claude-in-chrome (load core browser tools in ONE ToolSearch call, per MCP instructions). Follow the Gold Market install pattern (`~/Desktop/daniel-a-jewellery-gold-market/SQUARESPACE-INSTALL-STEPS.md`, Option A).

- [ ] **Step 1: recon** — `tabs_context_mcp`; open danielajewellery.ca admin. Confirm: plan supports code blocks (Gold Market block = precedent — find it); real contact/booking page URL from site nav (update `JOURNEY_CONFIG.contactUrl` in the block if not `/contact`; also rebuild + push if service-link URLs in content differ).
- [ ] **Step 2: create page** — Pages → **Not Linked** → new Blank Page, title "The Journey of Gold — From Earth to Forever", slug `/journey-of-gold`.
- [ ] **Step 3: install block** — Edit page → single full-width section → Code block (HTML) → paste entire `dist/code-block.html` → Save.
- [ ] **Step 4: page SEO settings** — Page settings → SEO: title "The Journey of Gold | Daniel A Jewellery — London, Ontario"; description ≈ "Mine it, melt it, alloy it, cast it, set it. An interactive journey through how fine jewellery is made — by London Ontario's on-site jewellery repair and custom design experts." (jewellery spelling; "jewelry" NOT used here — page copy carries CA spelling per brand rules).
- [ ] **Step 5: live verify** — open the live URL logged-out (new tab): engine boots from Pages, complete one full journey desktop; `resize_window` to 390×844 and repeat key interactions; devtools-offline reload → static fallback readable; console free of errors (`read_console_messages`).
- [ ] **Step 6: report to Daniel** — hidden-page URL + what to check + reminder that nav placement happens only on his OK. Update memory files (journey project status; gold-market "installed?" finding from Step 1 recon).

---

## Self-Review (completed)

- **Spec coverage:** 10 acts → Tasks 8–17; live prices/ticker/calculator → 4, 11, 17; certificate/photo/share/CTAs → 17; sound-off-default → 18; fallbacks + a11y → 18; SEO/FAQ/JSON-LD/meta → 19 + 22; performance budget → 5, 20; rollout → 21, 22. Phase-2 items correctly absent.
- **Placeholder scan:** act-copy placeholders exist only until Task 19 by design and Task 19 replaces them; contact URL deliberately runtime-configured and verified in Task 22 Step 1. No TBDs.
- **Type consistency:** act interface (Task 5) consumed by Tasks 8–17 with same signature; `ALLOYS`/`STONES`/`glow`/`alloyValueCAD`/`estimateWeightGrams` names consistent across Tasks 3, 4, 11, 15, 17. `purified` added to DEFAULT_STATE in Task 10 (flagged there).
