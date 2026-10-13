import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PAYLOAD, buildPlugin } from '../tools/build-plugin.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const json = (...parts) => JSON.parse(fs.readFileSync(path.join(...parts), 'utf8'));

function built() {
  return buildPlugin(fs.mkdtempSync(path.join(os.tmpdir(), 'rup-flow-plugin-')));
}

function list(dir, base = dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? list(path.join(dir, e.name), base) : [path.relative(base, path.join(dir, e.name)).split(path.sep).join('/')]));
}

test('the plugin payload holds the skill, the agents and the manifests, and nothing else', () => {
  const out = built();
  const top = [...new Set(list(out).map((f) => f.split('/')[0]))].sort();
  assert.deepEqual(top, ['.claude-plugin', 'LICENSE', 'PRIVACY.md', 'README.md', 'agents', 'skills']);
  assert.deepEqual([...PAYLOAD].sort(), ['LICENSE', 'PRIVACY.md', 'agents', 'skills']);
  for (const excluded of ['install.mjs', 'tools', 'test', '.github', 'docs', 'examples', 'AGENTS.md', 'package.json']) {
    assert.ok(!fs.existsSync(path.join(out, excluded)), `${excluded} must not ship in the plugin`);
  }
});

test('the payload is a valid plugin and a valid marketplace on its own', () => {
  const out = built();
  const plugin = json(out, '.claude-plugin', 'plugin.json');
  const marketplace = json(out, '.claude-plugin', 'marketplace.json');
  assert.equal(plugin.version, json(ROOT, 'package.json').version);
  assert.equal(marketplace.plugins[0].name, plugin.name);
  assert.equal(marketplace.plugins[0].source, './');
  assert.ok(fs.existsSync(path.join(out, 'skills', 'rup-flow', 'SKILL.md')));
});

test('the only binary in the payload is the square icon the directory asks for', () => {
  const out = built();
  assert.deepEqual(list(out).filter((f) => /\.(png|jpe?g|gif|webp|ico|woff2?|ttf|otf)$/i.test(f)), ['.claude-plugin/icon.png']);
  const png = fs.readFileSync(path.join(out, '.claude-plugin', 'icon.png'));
  assert.equal(png.subarray(1, 4).toString(), 'PNG');
  const width = png.readUInt32BE(16);
  assert.equal(width, png.readUInt32BE(20));
  assert.ok(width >= 512 && width <= 2048);
  assert.ok(png.length < 2 * 1024 * 1024);
});

test('nothing in the payload names the icon file', () => {
  const out = built();
  const named = list(out).filter((f) => !f.endsWith('.png')).filter((f) => /icon\.(png|svg)/.test(fs.readFileSync(path.join(out, f), 'utf8')));
  assert.deepEqual(named, []);
});

test('the payload CLI runs on its own', async () => {
  const out = built();
  const { spawnSync } = await import('node:child_process');
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'rup-flow-standalone-'));
  const cli = path.join(out, 'skills', 'rup-flow', 'scripts', 'rup.mjs');
  assert.equal(spawnSync(process.execPath, [cli, 'init', '--root', project], { encoding: 'utf8' }).status, 0);
  assert.equal(spawnSync(process.execPath, [cli, 'new', 'use-case', 'createOrder', '--root', project], { encoding: 'utf8' }).status, 0);
  assert.equal(spawnSync(process.execPath, [cli, 'check', '--root', project], { encoding: 'utf8' }).status, 0);
});

test('the repository marketplace installs the plugin from the claude-plugin branch, not from the whole repository', () => {
  const entry = json(ROOT, '.claude-plugin', 'marketplace.json').plugins[0];
  assert.deepEqual(entry.source, { source: 'github', repo: 'hector-ae21/rup-flow', ref: 'claude-plugin' });
});

test('the publish workflow regenerates the branch from a release tag without force-pushing', () => {
  const workflow = fs.readFileSync(path.join(ROOT, '.github/workflows/publish-plugin.yml'), 'utf8');
  assert.match(workflow, /tags: \['v\*'\]/);
  assert.match(workflow, /tools\/build-plugin\.mjs/);
  assert.doesNotMatch(workflow, /--force|-f origin|push -f/);
});
