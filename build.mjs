// Build pipeline for The Journey of Gold.
// Outputs: dist/journey.js, dist/journey.css, dist/code-block.html (paste into
// Squarespace), and regenerates index.html (local dev harness).
// `node build.mjs --watch` also serves the repo root on :8123.

import * as esbuild from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const watch = process.argv.includes('--watch');

// Published base for assets referenced from the Squarespace code block.
const ASSET_BASE = 'https://dajgem.github.io/daniel-a-jewellery-journey/dist';

const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Montserrat:wght@400;500;600&display=swap" rel="stylesheet">`;

const buildOptions = {
  entryPoints: ['src/main.js'],
  bundle: true,
  minify: true,
  format: 'iife',
  target: 'es2019',
  outfile: 'dist/journey.js',
  logLevel: 'info',
};

const cssOptions = {
  entryPoints: ['src/styles/journey.css'],
  bundle: true,
  minify: true,
  outfile: 'dist/journey.css',
  logLevel: 'info',
};

function emitHtml() {
  const content = readFileSync('src/content/page-content.html', 'utf8');

  // Local dev harness — same markup the Squarespace block carries.
  writeFileSync(
    'index.html',
    `<!doctype html>
<html lang="en-CA">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>The Journey of Gold — dev harness</title>
${FONTS}
<link rel="stylesheet" href="dist/journey.css">
</head>
<body style="margin:0">
${content}
<script>window.JOURNEY_CONFIG = { contactUrl: '/contact' };</script>
<script src="dist/journey.js" defer></script>
</body>
</html>
`,
  );

  // Paste-ready Squarespace code block.
  writeFileSync(
    'dist/code-block.html',
    `<!-- The Journey of Gold — Daniel A Jewellery. Paste this whole file into one
     Squarespace Code block (HTML). Content edits happen in the GitHub repo,
     not here — this block only needs re-pasting if this comment says so. -->
${FONTS}
<link rel="stylesheet" href="${ASSET_BASE}/journey.css">
${content}
<script>window.JOURNEY_CONFIG = { contactUrl: '/contact' };</script>
<script src="${ASSET_BASE}/journey.js" defer></script>
`,
  );
}

mkdirSync('dist', { recursive: true });

if (watch) {
  const ctxJs = await esbuild.context(buildOptions);
  const ctxCss = await esbuild.context(cssOptions);
  await ctxJs.watch();
  await ctxCss.watch();
  emitHtml();
  const { hosts, port } = await ctxJs.serve({ servedir: '.', port: 8123 });
  console.log(`dev server: http://${hosts[0]}:${port}`);
} else {
  await esbuild.build(buildOptions);
  await esbuild.build(cssOptions);
  emitHtml();
  console.log('build complete');
}
