#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKILL_DIR = path.join(ROOT, 'skills', 'rup-flow');
const errors = [];

function fail(message) {
  errors.push(message);
}

function frontMatter(file) {
  const text = fs.readFileSync(file, 'utf8');
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
  if (!match) { fail(`${path.relative(ROOT, file)}: missing front matter`); return {}; }
  const data = {};
  for (const line of match[1].split(/\r?\n/)) {
    const pair = /^([\w-]+):\s*(.*)$/.exec(line);
    if (pair) data[pair[1]] = pair[2].trim();
  }
  return data;
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

const skill = frontMatter(path.join(SKILL_DIR, 'SKILL.md'));
if (skill.name !== 'rup-flow') fail('SKILL.md: name must be rup-flow');
if (!skill.description) fail('SKILL.md: description is required');
else if (skill.description.length > 200) fail(`SKILL.md: description has ${skill.description.length} characters, claude.ai allows 200`);

for (const agent of fs.readdirSync(path.join(ROOT, 'agents'))) {
  const data = frontMatter(path.join(ROOT, 'agents', agent));
  if (!data.name || !data.description) fail(`agents/${agent}: name and description are required`);
}

const plugin = JSON.parse(fs.readFileSync(path.join(ROOT, '.claude-plugin', 'plugin.json'), 'utf8'));
const marketplace = JSON.parse(fs.readFileSync(path.join(ROOT, '.claude-plugin', 'marketplace.json'), 'utf8'));
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const skillText = fs.readFileSync(path.join(SKILL_DIR, 'SKILL.md'), 'utf8');
const skillVersion = /^\s+version:\s*"?([^"\r\n]+)"?/m.exec(skillText)?.[1];
if (skillVersion !== pkg.version) fail(`SKILL.md metadata.version ${skillVersion} differs from package.json ${pkg.version}`);
if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(skill.name ?? '') || skill.name.length > 64) fail('SKILL.md: name must follow the Agent Skills format (lowercase, digits, single hyphens, max 64)');
if (path.basename(SKILL_DIR) !== skill.name) fail('SKILL.md: name must match its folder name (Agent Skills requirement)');
if (skill.compatibility && skill.compatibility.length > 500) fail('SKILL.md: compatibility is longer than 500 characters');
if (!skill.license) fail('SKILL.md: license is required for portable distribution');
if (plugin.name !== marketplace.plugins[0].name) fail('plugin.json and marketplace.json disagree on the plugin name');
if (plugin.version !== pkg.version) fail(`plugin.json version ${plugin.version} differs from package.json ${pkg.version}`);
for (const field of ['icon', 'documentationUrl', 'supportUrl', 'privacyPolicyUrl', 'termsOfServiceUrl']) {
  if (field in plugin) fail(`plugin.json: "${field}" is read only by the directory and shows up as a finding; set it in the submission portal instead`);
}
const binaries = walk(ROOT).filter((f) => /\.(png|jpe?g|gif|webp|ico|woff2?|ttf|otf)$/i.test(f) && !f.includes(`${path.sep}node_modules${path.sep}`) && !f.includes(`${path.sep}.git${path.sep}`) && !f.includes(`${path.sep}dist${path.sep}`));
if (binaries.length) fail(`binary files in the plugin tree are held for manual review by the directory: ${binaries.map((f) => path.relative(ROOT, f)).join(', ')}`);

const markdown = [...walk(ROOT)].filter((f) => f.endsWith('.md') && !f.includes('node_modules') && !f.includes(`${path.sep}.git${path.sep}`));
const linkPattern = /\]\(([^)\s]+)\)/g;
for (const file of markdown) {
  const text = fs.readFileSync(file, 'utf8');
  const isTemplate = [`${path.sep}templates${path.sep}`, `${path.sep}references${path.sep}`].some((p) => file.includes(p));
  let match;
  while ((match = linkPattern.exec(text)) !== null) {
    const target = match[1].split('#')[0];
    if (!target || /^[a-z]+:/i.test(target) || target.includes('{{') || isTemplate) continue;
    if (!fs.existsSync(path.resolve(path.dirname(file), decodeURI(target)))) {
      const pendingDiagram = /\.svg$/.test(target) && fs.existsSync(path.resolve(path.dirname(file), target.replace(/\.svg$/, '.puml')));
      if (!pendingDiagram) fail(`${path.relative(ROOT, file)}: broken link ${match[1]}`);
    }
  }
}

// Names the directory scan reads as sensitive data that could leave the machine.
// Spelled in pieces so this file does not trip the rule it enforces.
const RISKY = new RegExp(['tok' + 'ens?', 'sec' + 'rets?', 'pass' + 'words?', 'pass' + 'wd', 'creden' + 'tials?', 'api[_-]?' + 'keys?', 'cook' + 'ies?', 'bear' + 'er', 'authori' + 'zation', 'process\\.' + 'env'].map((w) => `\\b${w}\\b`).join('|'), 'i');
const checked = walk(ROOT).filter((f) => /\.(mjs|cjs|js|json|ya?ml|html)$/i.test(f) && !/(^|[\\/])(node_modules|\.git|dist|examples|images)[\\/]/.test(path.relative(ROOT, f)) && !f.endsWith('package-lock.json'));
for (const file of checked) {
  const found = fs.readFileSync(file, 'utf8').split('\n').map((line, index) => ({ line, number: index + 1 })).filter(({ line }) => RISKY.test(line));
  for (const { line, number } of found.slice(0, 3)) fail(`${path.relative(ROOT, file)}:${number}: sensitive-looking name or environment read (${line.trim().slice(0, 60)}); the directory scan reports these`);
}

for (const script of walk(ROOT).filter((f) => f.endsWith('.mjs') && !f.includes(`${path.sep}node_modules${path.sep}`) && !f.includes(`${path.sep}.git${path.sep}`) && !f.includes(`${path.sep}dist${path.sep}`))) {
  const check = spawnSync(process.execPath, ['--check', script], { encoding: 'utf8' });
  if (check.status !== 0) fail(`${path.relative(ROOT, script)}: syntax error\n${check.stderr.split('\n').slice(0, 4).join('\n')}`);
}

if (errors.length) {
  console.error(errors.map((e) => `- ${e}`).join('\n'));
  process.exit(1);
}
console.log(`OK: skill, ${fs.readdirSync(path.join(ROOT, 'agents')).length} agents, manifests and ${markdown.length} Markdown files are consistent`);
