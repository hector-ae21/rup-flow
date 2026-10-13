import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CLI = path.resolve(HERE, '..', 'skills', 'rup-flow', 'scripts', 'rup.mjs');

function run(root, ...args) {
  return spawnSync(process.execPath, [CLI, ...args, '--root', root], { encoding: 'utf8' });
}

function workspace() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'rup-flow-'));
}

test('init creates the skeleton in the requested output directory and is idempotent', () => {
  const root = workspace();
  const first = run(root, 'init', '--out', 'documentation/rup', '--lang', 'es', '--project', 'shop');
  assert.equal(first.status, 0, first.stderr);
  assert.ok(fs.existsSync(path.join(root, 'rup.config.json')));
  assert.ok(fs.existsSync(path.join(root, 'documentation/rup/00-domain-model/domain-model.puml')));
  assert.ok(fs.existsSync(path.join(root, 'documentation/rup/05-quality/traceability.csv')));
  const config = JSON.parse(fs.readFileSync(path.join(root, 'rup.config.json'), 'utf8'));
  assert.equal(config.docLanguage, 'es');
  assert.equal(config.outDir, 'documentation/rup');

  const second = run(root, 'init');
  assert.match(second.stdout, /created: 0/);
});

test('custom folder names from the config are honoured', () => {
  const root = workspace();
  fs.writeFileSync(path.join(root, 'rup.config.json'), JSON.stringify({
    outDir: 'out', paths: { requirements: 'req', analysis: 'ana', design: 'des' }, useCaseDir: 'cases',
  }));
  assert.equal(run(root, 'init').status, 0);
  const created = run(root, 'new', 'use-case', 'createOrder', '--title', 'Create order');
  assert.equal(created.status, 0, created.stderr);
  assert.ok(fs.existsSync(path.join(root, 'out/req/cases/createOrder/specification.puml')));
  assert.ok(fs.existsSync(path.join(root, 'out/ana/cases/createOrder/collaboration.puml')));
  assert.ok(fs.existsSync(path.join(root, 'out/des/cases/createOrder/sequence.puml')));
  const design = fs.readFileSync(path.join(root, 'out/des/cases/createOrder/README.md'), 'utf8');
  assert.match(design, /\.\.\/\.\.\/\.\.\/ana\/cases\/createOrder/);
});

test('new use-case assigns sequential ids and registers traceability', () => {
  const root = workspace();
  run(root, 'init');
  run(root, 'new', 'use-case', 'createOrder');
  run(root, 'new', 'use-case', 'cancelOrder');
  const card = fs.readFileSync(path.join(root, 'docs/rup/01-requirements/use-cases/cancelOrder/README.md'), 'utf8');
  assert.match(card, /^id: UC-002/m);
  const trace = fs.readFileSync(path.join(root, 'docs/rup/05-quality/traceability.csv'), 'utf8');
  assert.match(trace, /UC-001,createOrder/);
  assert.match(trace, /UC-002,cancelOrder/);
});

test('new use-case rejects invalid names', () => {
  const root = workspace();
  run(root, 'init');
  assert.notEqual(run(root, 'new', 'use-case', 'create order').status, 0);
});

test('check reports gaps and fails on broken links and unbalanced diagrams', () => {
  const root = workspace();
  run(root, 'init');
  run(root, 'new', 'use-case', 'createOrder');
  const clean = run(root, 'check');
  assert.equal(clean.status, 0, clean.stdout);
  assert.match(clean.stdout, /empty "code"/);
  assert.equal(run(root, 'check', '--strict').status, 1);

  const card = path.join(root, 'docs/rup/01-requirements/use-cases/createOrder/README.md');
  fs.appendFileSync(card, '\n[missing](./nope.md)\n');
  fs.writeFileSync(path.join(root, 'docs/rup/00-domain-model/domain-model.puml'), '@startuml\nclass A\n');
  const broken = run(root, 'check');
  assert.equal(broken.status, 1);
  assert.match(broken.stdout, /broken link/);
  assert.match(broken.stdout, /unbalanced/);
});

test('scan inventories manifests, entities and tests', () => {
  const root = workspace();
  fs.mkdirSync(path.join(root, 'src/domain'), { recursive: true });
  fs.writeFileSync(path.join(root, 'package.json'), '{}');
  fs.writeFileSync(path.join(root, 'src/domain/order.ts'), 'export class Order {}');
  fs.writeFileSync(path.join(root, 'src/order.spec.ts'), '');
  const result = run(root, 'scan');
  const summary = JSON.parse(result.stdout);
  assert.deepEqual(summary.manifests, ['package.json']);
  assert.equal(summary.entities.total, 1);
  assert.equal(summary.tests.total, 1);
});

test('render fails clearly when the PlantUML server is unreachable', () => {
  const root = workspace();
  run(root, 'init');
  const result = run(root, 'render', '--plantuml-url', 'http://127.0.0.1:1');
  assert.equal(result.status, 1);
  assert.match(result.stdout, /failed:/);
});
