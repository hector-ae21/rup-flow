#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SKILL = 'rup-flow';
const AGENTS = ['rup-architect.md', 'rup-reviewer.md'];

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const value = (name) => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] : undefined;
};

const target = value('project')
  ? path.join(path.resolve(value('project')), '.claude')
  : path.join(os.homedir(), '.claude');

function backup(destination) {
  if (!fs.existsSync(destination)) return;
  if (!flag('force')) {
    console.error(`Already exists: ${destination}. Use --force to replace it (a backup is kept).`);
    process.exit(1);
  }
  fs.renameSync(destination, `${destination}.bak-${Date.now()}`);
}

const skillDestination = path.join(target, 'skills', SKILL);
backup(skillDestination);
fs.mkdirSync(path.dirname(skillDestination), { recursive: true });
fs.cpSync(path.join(HERE, 'skills', SKILL), skillDestination, { recursive: true });

for (const agent of AGENTS) {
  const destination = path.join(target, 'agents', agent);
  backup(destination);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(path.join(HERE, 'agents', agent), destination);
}

console.log(`Installed skill and agents into ${target}`);
console.log(`CLI: node ${path.join(skillDestination, 'scripts', 'rup.mjs')}`);
