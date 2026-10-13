import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { collectDiagrams, sanitizeSvg } from '../skills/rup-flow/scripts/lib/explorer.mjs';
import { applyIndex, overviewMermaid, overviewPlantuml } from '../skills/rup-flow/scripts/lib/usecases.mjs';

const CLI = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'skills', 'rup-flow', 'scripts', 'rup.mjs');

function run(root, ...args) {
  return spawnSync(process.execPath, [CLI, ...args, '--root', root], { encoding: 'utf8' });
}

function project(...extra) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'rup-flow-uc-'));
  assert.equal(run(root, 'init', '--project', 'Shop', ...extra).status, 0);
  assert.equal(run(root, 'new', 'use-case', 'createOrder', '--title', 'Create order', '--actor', 'Customer', '--package', 'Ordering', '--includes', 'validateStock').status, 0);
  assert.equal(run(root, 'new', 'use-case', 'validateStock', '--title', 'Validate stock', '--actor', 'Customer', '--package', 'Ordering').status, 0);
  assert.equal(run(root, 'new', 'use-case', 'shipOrder', '--title', 'Ship order', '--actor', 'Warehouse', '--package', 'Fulfilment').status, 0);
  return root;
}

const read = (root, ...parts) => fs.readFileSync(path.join(root, 'docs/rup', ...parts), 'utf8');

test('every card carries the navigation table and the implementation card exists', () => {
  const root = project();
  for (const [dir, current] of [['01-requirements', 'Requirements'], ['02-analysis', 'Analysis'], ['03-design', 'Design'], ['04-implementation', 'Implementation']]) {
    const card = read(root, dir, 'use-cases/createOrder/README.md');
    assert.match(card, /\| Overview \| Requirements \| Analysis \| Design \| Implementation \| Tests \|/);
    assert.match(card, new RegExp(`\\*\\*${current}\\*\\*`));
  }
  assert.match(read(root, '04-implementation/use-cases/createOrder/README.md'), /## Tests/);
  assert.match(read(root, '01-requirements/use-cases/createOrder/README.md'), /^package: Ordering$/m);
});

test('the index lists every use case with links to each discipline and its diagrams', () => {
  const root = project();
  const readme = read(root, '01-requirements/README.md');
  assert.match(readme, /\| UC-001 \| \[Create order\]\(\.\/use-cases\/createOrder\/README\.md\) \| Customer \| Ordering \|/);
  assert.match(readme, /\.\.\/02-analysis\/use-cases\/shipOrder\/README\.md/);
  assert.match(readme, /!\[Use cases\]\(\.\/use-case-overview\.svg\)/);
  assert.match(readme, /use-cases-warehouse\.svg/);
  assert.equal((readme.match(/rup-flow:use-cases:start/g) ?? []).length, 1);
});

test('the overview groups use cases in packages, draws includes and skips actor links to included cases', () => {
  const root = project();
  const puml = read(root, '01-requirements/use-case-overview.puml');
  assert.match(puml, /rectangle "Shop"/);
  assert.match(puml, /package "Ordering"/);
  assert.match(puml, /package "Fulfilment"/);
  assert.match(puml, /UC_createOrder \.\.> UC_validateStock : <<include>>/);
  assert.match(puml, /A_Customer --> UC_createOrder/);
  assert.doesNotMatch(puml, /A_Customer --> UC_validateStock/);
  assert.ok(fs.existsSync(path.join(root, 'docs/rup/01-requirements/use-cases-customer.puml')));
  const customer = read(root, '01-requirements/use-cases-customer.puml');
  assert.doesNotMatch(customer, /shipOrder/);
});

test('with Mermaid the overview and components are .mmd sources', () => {
  const root = project('--diagram-language', 'mermaid');
  const base = path.join(root, 'docs/rup');
  assert.ok(fs.existsSync(path.join(base, '01-requirements/use-case-overview.mmd')));
  assert.ok(fs.existsSync(path.join(base, '03-design/components/components.mmd')));
  assert.match(read(root, '01-requirements/use-case-overview.mmd'), /subgraph P_Ordering/);
  assert.equal(run(root, 'check').status, 0);
});

test('init creates the component diagram and the design README embeds it', () => {
  const root = project();
  assert.ok(fs.existsSync(path.join(root, 'docs/rup/03-design/components/components.puml')));
  assert.match(read(root, '03-design/README.md'), /components\/components\.svg/);
});

test('check reports a stale index and index fixes it', () => {
  const root = project();
  const file = path.join(root, 'docs/rup/01-requirements/use-cases/shipOrder/README.md');
  fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace('package: Fulfilment', 'package: Logistics'));
  assert.match(run(root, 'check').stdout, /use-case index is stale/);
  assert.equal(run(root, 'index').status, 0);
  assert.doesNotMatch(run(root, 'check').stdout, /use-case index is stale/);
  assert.match(read(root, '01-requirements/use-case-overview.puml'), /package "Logistics"/);
});

test('index drops per-actor diagrams that are no longer needed', () => {
  const root = project();
  for (const name of ['shipOrder']) fs.rmSync(path.join(root, 'docs/rup/01-requirements/use-cases', name), { recursive: true });
  assert.equal(run(root, 'index').status, 0);
  assert.ok(!fs.existsSync(path.join(root, 'docs/rup/01-requirements/use-cases-customer.puml')));
  assert.ok(!fs.existsSync(path.join(root, 'docs/rup/01-requirements/use-cases-warehouse.puml')));
});

test('applyIndex replaces the block in place or appends it', () => {
  const block = '<!-- rup-flow:use-cases:start -->\nX\n<!-- rup-flow:use-cases:end -->';
  const replaced = applyIndex(`# T\n\n## Use cases\n\n<!-- rup-flow:use-cases:start -->\nold\n<!-- rup-flow:use-cases:end -->\n\n## Next\n`, block);
  assert.match(replaced, /\nX\n/);
  assert.doesNotMatch(replaced, /old/);
  assert.match(replaced, /## Next/);
  assert.match(applyIndex('# T\n', block), /## Use cases/);
});

test('overview generators escape quotes and handle a single actor', () => {
  const cases = [{ name: 'a', id: 'UC-001', title: 'Say "hi"', actors: ['Ann'], package: 'P', includes: [], extendsCases: [], present: {} }];
  assert.doesNotMatch(overviewPlantuml(cases, 'S'), /Say "hi"/);
  assert.match(overviewMermaid(cases, 'S'), /flowchart LR/);
});

test('the explorer carries searchable text, documents and use-case grouping', () => {
  const root = project();
  const dir = path.join(root, 'docs/rup/01-requirements/use-cases/createOrder');
  fs.writeFileSync(path.join(dir, 'specification.svg'), '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><text>Reserve stock</text><script>bad()</script></svg>');
  const data = collectDiagrams(path.join(root, 'docs/rup'), [path.join(dir, 'specification.puml')]);
  assert.equal(data.items.length, 1);
  assert.equal(data.items[0].useCase, 'createOrder');
  assert.match(data.items[0].text, /Reserve stock/);
  assert.doesNotMatch(data.items[0].svg, /script/);
  assert.ok(Object.keys(data.docs).some((k) => k.endsWith('04-implementation/use-cases/createOrder/README.md')));
  assert.equal(sanitizeSvg('<svg onload="x()"></svg>'), '<svg></svg>');
});

test('the explorer inserts diagrams and documents as nodes, not as raw HTML, and blocks external loads', () => {
  const html = fs.readFileSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'skills/rup-flow/scripts/lib/explorer.html'), 'utf8');
  assert.match(html, /Content-Security-Policy[^>]*default-src 'none'/);
  assert.doesNotMatch(html, /canvas\.innerHTML = it\.svg/);
  assert.doesNotMatch(html, /docEl\.innerHTML/);
  assert.match(html, /DOMParser/);
  assert.match(html, /adoptNode\(parsed\.body\.firstChild\)/);
  assert.equal([...html].filter((c) => c.charCodeAt(0) === 0).length, 0);
});
