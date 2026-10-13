#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
const SVG_NS = ["http:/", "www.w3.org", "2000", "svg"].join("/");
import { PRESETS } from '../skills/rup-flow/scripts/lib/themes.mjs';
import { makeReadable } from './svg-readable.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CLI = path.join(ROOT, 'skills', 'rup-flow', 'scripts', 'rup.mjs');
const IMAGES = path.join(ROOT, 'docs', 'images');
const work = fs.mkdtempSync(path.join(os.tmpdir(), 'rup-gallery-'));

function rup(root, ...args) {
  const result = spawnSync(process.execPath, [CLI, ...args, '--root', root], { encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`rup ${args.join(' ')} failed:\n${result.stdout}\n${result.stderr}`);
}

function put(from, ...to) {
  const target = path.join(IMAGES, ...to);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  if (target.endsWith('.svg')) fs.writeFileSync(target, makeReadable(fs.readFileSync(from, 'utf8')));
  else fs.copyFileSync(from, target);
}

const SHOTS = path.join(ROOT, 'dist', 'gallery', 'explorer');

function findChrome() {
  const candidates = [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ].filter(Boolean);
  return candidates.find((c) => fs.existsSync(c));
}

function palettesOverview() {
  const names = Object.keys(PRESETS);
  const cellW = 300;
  const cellH = 150;
  const cols = 2;
  const rows = Math.ceil(names.length / cols);
  const cells = names.map((name, index) => {
    const c = PRESETS[name].colors;
    const x = (index % cols) * cellW + 16;
    const y = Math.floor(index / cols) * cellH + 16;
    const chip = (color, i, w = 34) => `<rect x="${x + 14 + i * (w + 6)}" y="${y + 70}" width="${w}" height="34" rx="6" fill="${color}" stroke="${c.border}"/>`;
    return `<g>
  <rect x="${x}" y="${y}" width="${cellW - 32}" height="${cellH - 32}" rx="12" fill="${c.background}" stroke="${c.border}"/>
  <text x="${x + 14}" y="${y + 28}" font-family="Verdana, sans-serif" font-size="15" font-weight="700" fill="${c.text}">${name}</text>
  <text x="${x + 14}" y="${y + 50}" font-family="Verdana, sans-serif" font-size="10.5" fill="${c.text}">${PRESETS[name].description}</text>
  ${[c.primary, c.secondary, c.accent, ...c.levels].map((color, i) => chip(color, i, 24)).join('\n  ')}
  <text x="${x + 14}" y="${y + 116}" font-family="Verdana, sans-serif" font-size="9.5" fill="${c.text}">primary · secondary · accent · levels 1-4</text>
</g>`;
  }).join('\n');
  return `<svg xmlns="${SVG_NS}" viewBox="0 0 ${cols * cellW + 32} ${rows * cellH + 32}" width="${cols * cellW + 32}" height="${rows * cellH + 32}">\n<rect width="100%" height="100%" fill="#ffffff"/>\n${cells}\n</svg>\n`;
}

try {
  const shop = path.join(work, 'shop');
  fs.cpSync(path.join(ROOT, 'examples', 'shop'), shop, { recursive: true });

  for (const preset of Object.keys(PRESETS)) {
    rup(shop, 'render', '--theme', preset, '--force', '--path', 'docs/00-domain-model');
    put(path.join(shop, 'docs/00-domain-model/domain-model.svg'), 'themes', `${preset}.svg`);
  }
  rup(shop, 'render', '--theme', 'default', '--force', '--path', 'docs/00-domain-model',
    '--color-primary', '#FFE4E6', '--color-secondary', '#FFF1F2', '--color-accent', '#BE123C', '--color-line', '#9F1239', '--color-border', '#9F1239',
    '--color-background', '#FFFBFB', '--color-text', '#4C0519');
  put(path.join(shop, 'docs/00-domain-model/domain-model.svg'), 'themes', 'custom.svg');
  fs.writeFileSync(path.join(IMAGES, 'themes', 'overview.svg'), palettesOverview());

  rup(shop, 'render', '--theme', 'default', '--force', '--outputs', 'svg,html');
  const d = (...p) => path.join(shop, 'docs', ...p);
  const types = {
    'domain-model': d('00-domain-model/domain-model.svg'),
    'domain-model-simple': d('00-domain-model/domain-model-simple.svg'),
    'entity-states': d('00-domain-model/entity-states/entity-states.svg'),
    specification: d('01-requirements/use-cases/createOrder/specification.svg'),
    wireframes: d('01-requirements/use-cases/createOrder/wireframes.svg'),
    'analysis-classes': d('02-analysis/class-diagram.svg'),
    collaboration: d('02-analysis/use-cases/createOrder/collaboration.svg'),
    'design-classes': d('03-design/class-diagram.svg'),
    sequence: d('03-design/use-cases/createOrder/sequence.svg'),
    'data-model': d('03-design/data-model/data-model.svg'),
    deployment: d('03-design/deployment/deployment.svg'),
  };
  for (const [name, file] of Object.entries(types)) put(file, 'diagrams', `${name}.svg`);

  const mermaid = path.join(work, 'mermaid');
  fs.mkdirSync(path.join(mermaid, 'docs'), { recursive: true });
  fs.cpSync(path.join(ROOT, 'tools', 'gallery', 'mermaid'), path.join(mermaid, 'docs'), { recursive: true });
  rup(mermaid, 'render', '--out', 'docs', '--theme', 'default', '--force');
  for (const file of fs.readdirSync(path.join(mermaid, 'docs')).filter((f) => f.endsWith('.svg'))) put(path.join(mermaid, 'docs', file), 'mermaid', file);
  rup(mermaid, 'render', '--out', 'docs', '--theme', 'forest', '--force');
  put(path.join(mermaid, 'docs', 'domain-model.svg'), 'mermaid', 'domain-model-forest.svg');
  rup(mermaid, 'render', '--out', 'docs', '--theme', 'dark', '--force');
  put(path.join(mermaid, 'docs', 'sequence.svg'), 'mermaid', 'sequence-dark.svg');

  const chrome = findChrome();
  if (chrome) {
    const explorer = path.join(shop, 'docs', 'explorer.html');
    const shots = {
      'explorer-overview': '#d=00-domain-model%2Fdomain-model.svg&select=Order',
      'explorer-specification': '#d=01-requirements%2Fuse-cases%2FcreateOrder%2Fspecification.svg',
      'explorer-search': '#d=03-design%2Fclass-diagram.svg&find=Service',
      'explorer-source': '#d=01-requirements%2Fuse-cases%2FcreateOrder%2Fsequence.svg&tab=source',
      'explorer-dark': '#d=03-design%2Fuse-cases%2FcreateOrder%2Fsequence.svg&dark=1',
    };
    for (const [name, hash] of Object.entries(shots)) {
      const out = path.join(SHOTS, `${name}.png`);
      fs.mkdirSync(path.dirname(out), { recursive: true });
      spawnSync(chrome, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--window-size=1400,860', `--screenshot=${out}`, pathToFileURL(explorer).href + hash], { encoding: 'utf8' });
    }
  } else console.warn('No Chrome or Edge found: explorer screenshots skipped (install Chrome or Edge in a standard location).');
  console.log(`SVG gallery written to ${path.relative(ROOT, IMAGES)}; explorer screenshots to ${path.relative(ROOT, SHOTS)} (publish them to the docs-assets branch, see CONTRIBUTING.md)`);
} finally {
  fs.rmSync(work, { recursive: true, force: true });
}
