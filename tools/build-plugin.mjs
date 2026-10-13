#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outFlag = process.argv.indexOf('--out');
const OUT = path.resolve(outFlag >= 0 ? process.argv[outFlag + 1] : path.join(ROOT, 'dist', 'plugin'));

/** Everything the plugin needs at run time, and nothing else. */
export const PAYLOAD = ['skills', 'agents', 'LICENSE', 'PRIVACY.md'];

export function buildPlugin(out = OUT) {
  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(path.join(out, '.claude-plugin'), { recursive: true });
  for (const item of PAYLOAD) fs.cpSync(path.join(ROOT, item), path.join(out, item), { recursive: true });

  const plugin = JSON.parse(fs.readFileSync(path.join(ROOT, '.claude-plugin', 'plugin.json'), 'utf8'));
  fs.writeFileSync(path.join(out, '.claude-plugin', 'plugin.json'), `${JSON.stringify(plugin, null, 2)}\n`);

  const marketplace = JSON.parse(fs.readFileSync(path.join(ROOT, '.claude-plugin', 'marketplace.json'), 'utf8'));
  marketplace.plugins = marketplace.plugins.map((entry) => ({ ...entry, source: './' }));
  fs.writeFileSync(path.join(out, '.claude-plugin', 'marketplace.json'), `${JSON.stringify(marketplace, null, 2)}\n`);

  fs.writeFileSync(path.join(out, 'README.md'), [
    `# ${plugin.displayName ?? plugin.name}`,
    '',
    plugin.description,
    '',
    `Version ${plugin.version}. This branch holds only the plugin: the skill, its two agents and the manifests. It is generated from the main branch on every release; do not edit it.`,
    '',
    '```',
    `claude plugin marketplace add ${new URL(plugin.repository).pathname.slice(1)}`,
    `claude plugin install ${plugin.name}@${marketplace.name}`,
    '```',
    '',
    `Documentation, source and issues: ${plugin.repository}`,
    '',
    'MIT licensed. See PRIVACY.md.',
    '',
  ].join('\n'));
  return out;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const out = buildPlugin();
  const count = (dir) => fs.readdirSync(dir, { withFileTypes: true }).reduce((n, e) => n + (e.isDirectory() ? count(path.join(dir, e.name)) : 1), 0);
  console.log(`${out}: ${count(out)} files`);
}
