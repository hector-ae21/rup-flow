import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { PRESETS, applyMermaidTheme, applyPlantumlTheme, mermaidConfig, resolveTheme, themeHash } from '../skills/rup-flow/scripts/lib/themes.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CLI = path.resolve(HERE, '..', 'skills', 'rup-flow', 'scripts', 'rup.mjs');

function run(root, ...args) {
  return spawnSync(process.execPath, [CLI, ...args, '--root', root], { encoding: 'utf8' });
}

function workspace() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'rup-flow-fmt-'));
}

test('every preset resolves and has valid colors', () => {
  for (const name of Object.keys(PRESETS)) {
    const theme = resolveTheme({ preset: name });
    assert.equal(theme.colors.levels.length, 4);
  }
  assert.equal(Object.keys(PRESETS).length, 8);
});

test('theme overrides merge over a preset and are validated', () => {
  const theme = resolveTheme({ preset: 'ocean', colors: { accent: '#112233' } });
  assert.equal(theme.colors.accent, '#112233');
  assert.equal(theme.colors.primary, PRESETS.ocean.colors.primary);
  assert.throws(() => resolveTheme({ preset: 'nope' }), /Unknown theme preset/);
  assert.throws(() => resolveTheme({ colors: { primary: 'red' } }), /#RRGGBB/);
  assert.throws(() => resolveTheme({ colors: { levels: ['#000000'] } }), /exactly 4/);
  assert.notEqual(themeHash(resolveTheme({ preset: 'ocean' })), themeHash(resolveTheme({ preset: 'forest' })));
});

test('PlantUML theme is injected after !theme, skips salt and keeps source intact', () => {
  const theme = resolveTheme({ preset: 'forest' });
  const source = '@startuml\n!theme plain\nclass A\n@enduml';
  const themed = applyPlantumlTheme(source, theme);
  assert.ok(themed.indexOf('!theme plain') < themed.indexOf('skinparam backgroundColor'));
  assert.match(themed, /skinparam package<<level1>>/);
  assert.match(themed, /hide <<level1>> stereotype/);
  assert.doesNotMatch(themed, /hide stereotype\n/);
  assert.ok(themed.endsWith('class A\n@enduml'));
  const salt = '@startsalt\n{ [ ok ] }\n@endsalt';
  assert.equal(applyPlantumlTheme(salt, theme), salt);
});

test('Mermaid theme variables follow the palette and level classes are appended on demand', () => {
  const theme = resolveTheme({ preset: 'sunset' });
  assert.equal(mermaidConfig(theme).themeVariables.primaryColor, PRESETS.sunset.colors.primary);
  const withLevels = applyMermaidTheme('classDiagram\n  class A:::level1\n', theme);
  assert.match(withLevels, /classDef level1 fill:#FFC48C/);
  const without = 'classDiagram\n  class A\n';
  assert.equal(applyMermaidTheme(without, theme), without);
});

test('init with the Mermaid language creates .mmd sources and keeps wireframes in PlantUML', () => {
  const root = workspace();
  assert.equal(run(root, 'init', '--diagram-language', 'mermaid').status, 0);
  run(root, 'new', 'use-case', 'createOrder');
  const base = path.join(root, 'docs/rup');
  assert.ok(fs.existsSync(path.join(base, '00-domain-model/domain-model.mmd')));
  assert.ok(fs.existsSync(path.join(base, '01-requirements/use-cases/createOrder/specification.mmd')));
  assert.ok(fs.existsSync(path.join(base, '01-requirements/use-cases/createOrder/wireframes.puml')));
  assert.ok(fs.existsSync(path.join(base, '03-design/use-cases/createOrder/sequence.mmd')));
  const card = fs.readFileSync(path.join(base, '01-requirements/use-cases/createOrder/README.md'), 'utf8');
  assert.match(card, /\[specification\.mmd\]\(\.\/specification\.mmd\)/);
  assert.equal(JSON.parse(fs.readFileSync(path.join(root, 'rup.config.json'), 'utf8')).diagrams.language, 'mermaid');
  const check = run(root, 'check');
  assert.equal(check.status, 0, check.stdout);
});

test('check rejects an unrecognised Mermaid source', () => {
  const root = workspace();
  run(root, 'init', '--diagram-language', 'mermaid');
  fs.writeFileSync(path.join(root, 'docs/rup/00-domain-model/domain-model.mmd'), 'this is not mermaid');
  const result = run(root, 'check');
  assert.equal(result.status, 1);
  assert.match(result.stdout, /not a recognised Mermaid/);
});

test('invalid language, output and theme settings are rejected with a clear message', () => {
  const root = workspace();
  assert.match(run(root, 'init', '--diagram-language', 'd2').stderr, /plantuml or mermaid/);
  assert.match(run(root, 'init', '--outputs', 'gif').stderr, /svg, png and html/);
  run(root, 'init');
  const render = run(root, 'render', '--theme', 'nope', '--plantuml-url', 'http://127.0.0.1:1');
  assert.notEqual(render.status, 0);
});

test('themes lists all presets and exposes JSON', () => {
  const root = workspace();
  const json = JSON.parse(run(root, 'themes', '--json').stdout);
  assert.deepEqual(json.map((t) => t.name).sort(), Object.keys(PRESETS).sort());
});

test('explore builds a self-contained page from rendered diagrams', () => {
  const root = workspace();
  run(root, 'init', '--theme', 'grape');
  const dir = path.join(root, 'docs/rup/00-domain-model');
  fs.writeFileSync(path.join(dir, 'domain-model.svg'), '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><g class="entity" id="e1"><text>Order</text></g><script>x</script></svg>');
  const result = run(root, 'explore');
  assert.equal(result.status, 0, result.stderr);
  const html = fs.readFileSync(path.join(root, 'docs/rup/explorer.html'), 'utf8');
  assert.match(html, /theme: grape/);
  assert.match(html, /"id":"00-domain-model\/domain-model\.svg"/);
  assert.equal((html.match(/<script/g) ?? []).length, 2);
  assert.doesNotMatch(html, /\{\{[A-Z]+\}\}/);
});
