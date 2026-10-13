import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { BLOCK_END, BLOCK_START, INSTRUCTION_TARGETS, applyBlock, instructionBlock } from '../skills/rup-flow/scripts/lib/instructions.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const INSTALL = path.join(ROOT, 'install.mjs');
const CLI = path.join(ROOT, 'skills', 'rup-flow', 'scripts', 'rup.mjs');

function install(...args) {
  return spawnSync(process.execPath, [INSTALL, ...args], { encoding: 'utf8' });
}

function workspace() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'rup-flow-agents-'));
}

test('the claude target installs the skill and both subagents', () => {
  const home = workspace();
  const result = install('--home', home);
  assert.equal(result.status, 0, result.stderr);
  assert.ok(fs.existsSync(path.join(home, '.claude/skills/rup-flow/SKILL.md')));
  assert.ok(fs.existsSync(path.join(home, '.claude/agents/rup-architect.md')));
  assert.ok(fs.existsSync(path.join(home, '.claude/agents/rup-reviewer.md')));
  assert.ok(!fs.existsSync(path.join(home, '.agents')));
});

test('the agents and codex targets install only the skill under .agents/skills', () => {
  for (const target of ['agents', 'codex']) {
    const home = workspace();
    const result = install('--target', target, '--home', home);
    assert.equal(result.status, 0, result.stderr);
    assert.ok(fs.existsSync(path.join(home, '.agents/skills/rup-flow/SKILL.md')));
    assert.ok(fs.existsSync(path.join(home, '.agents/skills/rup-flow/scripts/rup.mjs')));
    assert.ok(!fs.existsSync(path.join(home, '.claude')));
  }
});

test('all installs both layouts and --project installs inside the project', () => {
  const project = workspace();
  const result = install('--target', 'all', '--project', project);
  assert.equal(result.status, 0, result.stderr);
  assert.ok(fs.existsSync(path.join(project, '.claude/skills/rup-flow/SKILL.md')));
  assert.ok(fs.existsSync(path.join(project, '.agents/skills/rup-flow/SKILL.md')));
});

test('installing twice needs --force and keeps a backup', () => {
  const home = workspace();
  install('--target', 'agents', '--home', home);
  assert.notEqual(install('--target', 'agents', '--home', home).status, 0);
  assert.equal(install('--target', 'agents', '--home', home, '--force').status, 0);
  const backups = fs.readdirSync(path.join(home, '.agents/skills')).filter((n) => n.includes('.bak-'));
  assert.equal(backups.length, 1);
});

test('an unknown install target is rejected', () => {
  const result = install('--target', 'vim', '--home', workspace());
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Unknown target/);
});

test('the installed CLI runs from the .agents location', () => {
  const home = workspace();
  install('--target', 'agents', '--home', home);
  const project = workspace();
  const cli = path.join(home, '.agents/skills/rup-flow/scripts/rup.mjs');
  const result = spawnSync(process.execPath, [cli, 'init', '--root', project], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.ok(fs.existsSync(path.join(project, 'rup.config.json')));
});

test('the instruction block is replaced between its markers and never duplicated', () => {
  const block = instructionBlock('.agents/skills/rup-flow');
  const once = applyBlock('# Mine\n\nKeep this.\n', block);
  const twice = applyBlock(once, instructionBlock('other/path'));
  assert.equal((twice.match(new RegExp(BLOCK_START, 'g')) ?? []).length, 1);
  assert.equal((twice.match(new RegExp(BLOCK_END, 'g')) ?? []).length, 1);
  assert.match(twice, /Keep this\./);
  assert.match(twice, /other\/path\/SKILL\.md/);
  assert.doesNotMatch(twice, /\.agents\/skills\/rup-flow\/SKILL\.md/);
});

test('instructions writes every target file, keeps existing content and is idempotent', () => {
  const root = workspace();
  fs.writeFileSync(path.join(root, 'AGENTS.md'), '# Project\n\nHand written rules.\n');
  const names = Object.keys(INSTRUCTION_TARGETS);
  const first = spawnSync(process.execPath, [CLI, 'instructions', '--target', names.join(','), '--root', root], { encoding: 'utf8' });
  assert.equal(first.status, 0, first.stderr);
  for (const name of names) assert.ok(fs.existsSync(path.join(root, INSTRUCTION_TARGETS[name].file)), name);
  const agents = fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8');
  assert.match(agents, /Hand written rules\./);
  assert.match(fs.readFileSync(path.join(root, '.cursor/rules/rup-flow.mdc'), 'utf8'), /^---\ndescription:/);
  const second = spawnSync(process.execPath, [CLI, 'instructions', '--target', 'agents', '--root', root], { encoding: 'utf8' });
  assert.match(second.stdout, /unchanged/);
  assert.equal(fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8'), agents);
});

test('instructions rejects an unknown target and lists targets without one', () => {
  const root = workspace();
  const bad = spawnSync(process.execPath, [CLI, 'instructions', '--target', 'emacs', '--root', root], { encoding: 'utf8' });
  assert.notEqual(bad.status, 0);
  const list = spawnSync(process.execPath, [CLI, 'instructions', '--root', root], { encoding: 'utf8' });
  assert.match(list.stdout, /AGENTS\.md/);
});

test('SKILL.md follows the Agent Skills format', () => {
  const text = fs.readFileSync(path.join(ROOT, 'skills/rup-flow/SKILL.md'), 'utf8');
  const front = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text)[1];
  assert.match(front, /^name: rup-flow$/m);
  assert.match(front, /^license: MIT$/m);
  assert.ok(/^description: (.+)$/m.exec(front)[1].length <= 200);
  assert.ok(text.split('\n').length < 500);
});
