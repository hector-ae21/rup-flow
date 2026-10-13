#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SKILL = 'rup-flow';
const SUBAGENTS = ['rup-architect.md', 'rup-reviewer.md'];

/**
 * One entry per client family. To support a new agent that reads the Agent
 * Skills format from its own folder, add an entry here and document it in
 * docs/other-agents.md.
 */
const TARGETS = {
  claude: {
    label: 'Claude Code',
    folder: '.claude',
    subagents: true,
    use: 'Say "Use rup-flow to ..." or run /rup-flow.',
  },
  agents: {
    label: 'Agent Skills clients that read .agents/skills (Codex and others)',
    folder: '.agents',
    subagents: false,
    use: 'Say "Use rup-flow to ..." or mention it with $rup-flow, depending on the client.',
  },
};
TARGETS.codex = TARGETS.agents;

const USAGE = `rup-flow installer

  node install.mjs [--target claude|agents|codex|all] [--project <dir>] [--force]

  --target   Where to install. claude (default): .claude/skills and .claude/agents.
             agents (alias codex): .agents/skills. all: both.
  --project  Install into <dir> instead of your home folder, for that project only.
  --home     Use another folder as home (testing).
  --force    Replace an existing install; the previous one is kept as .bak-<timestamp>.
  --list     Show the targets and exit.`;

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const value = (name) => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] : undefined;
};

if (flag('help') || flag('list')) {
  console.log(USAGE);
  if (flag('list')) for (const [name, t] of Object.entries(TARGETS)) console.log(`\n${name}: ${t.label} -> <base>/${t.folder}/skills`);
  process.exit(0);
}

const requested = value('target') ?? 'claude';
const names = requested === 'all' ? ['claude', 'agents'] : [requested];
for (const name of names) {
  if (!TARGETS[name]) {
    console.error(`Unknown target "${requested}". Use claude, agents, codex or all.`);
    process.exit(1);
  }
}
const base = value('project') ? path.resolve(value('project')) : (value('home') ? path.resolve(value('home')) : os.homedir());

function backup(destination) {
  if (!fs.existsSync(destination)) return;
  if (!flag('force')) {
    console.error(`Already exists: ${destination}. Use --force to replace it (a backup is kept).`);
    process.exit(1);
  }
  fs.renameSync(destination, `${destination}.bak-${Date.now()}`);
}

for (const name of [...new Set(names.map((n) => TARGETS[n]))].map((t) => Object.keys(TARGETS).find((k) => TARGETS[k] === t))) {
  const target = TARGETS[name];
  const root = path.join(base, target.folder);
  const skillDestination = path.join(root, 'skills', SKILL);
  backup(skillDestination);
  fs.mkdirSync(path.dirname(skillDestination), { recursive: true });
  fs.cpSync(path.join(HERE, 'skills', SKILL), skillDestination, { recursive: true });

  if (target.subagents) {
    for (const agent of SUBAGENTS) {
      const destination = path.join(root, 'agents', agent);
      backup(destination);
      fs.mkdirSync(path.dirname(destination), { recursive: true });
      fs.copyFileSync(path.join(HERE, 'agents', agent), destination);
    }
  }
  console.log(`[${name}] ${target.label}: installed into ${root}${target.subagents ? ' (skill and two agents)' : ' (skill)'}`);
  console.log(`[${name}] ${target.use}`);
  console.log(`[${name}] CLI: node ${path.join(skillDestination, 'scripts', 'rup.mjs')}`);
}
