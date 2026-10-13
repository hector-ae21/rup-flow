#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { PRESETS, applyPlantumlTheme, resolveTheme, themeHash } from './lib/themes.mjs';
import { DEFAULT_MERMAID_IMAGE, renderMermaidBatch } from './lib/mermaid.mjs';
import { buildExplorer, collectDiagrams } from './lib/explorer.mjs';
import { INSTRUCTION_TARGETS, writeInstructions } from './lib/instructions.mjs';
import { fetchDiagram } from './lib/plantuml.mjs';

const DIAGRAM_SOURCE = /\.(puml|plantuml|mmd)$/;
const RENDER_STATE = '.rup-render-state.json';
const SKILL_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TEMPLATES = path.join(SKILL_DIR, 'templates');
const COMPOSE_FILE = path.join(SKILL_DIR, 'runtime', 'compose.yaml');
const CONFIG_NAME = 'rup.config.json';
const IGNORED_DIRS = new Set([
  '.git', 'node_modules', 'dist', 'build', 'out', 'target', 'vendor', '.venv', 'venv',
  '__pycache__', '.next', '.nuxt', 'coverage', '.idea', '.vscode', 'bin', 'obj',
]);

const DEFAULTS = {
  project: '',
  outDir: 'docs/rup',
  docLanguage: 'en',
  codeRoot: '.',
  paths: {
    domain: '00-domain-model',
    requirements: '01-requirements',
    analysis: '02-analysis',
    design: '03-design',
    implementation: '04-implementation',
    quality: '05-quality',
  },
  useCaseDir: 'use-cases',
  plantuml: { url: 'http://127.0.0.1:8085', timeoutMs: 30000 },
  diagrams: { language: 'plantuml', outputs: ['svg'] },
  theme: { preset: 'default', colors: {}, font: '', fontSize: 14, roundCorner: 6 },
  mermaid: { image: DEFAULT_MERMAID_IMAGE, timeoutMs: 180000 },
  ids: { requirement: 'RF', nonFunctional: 'RNF', useCase: 'UC', rule: 'RN', decision: 'DEC', test: 'TC' },
  targetStack: { language: '', framework: '', persistence: '', testing: '' },
  traceTag: '@rup',
};

function parseArgs(argv) {
  const positional = [];
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) flags[key] = true;
      else { flags[key] = next; i++; }
    } else positional.push(arg);
  }
  return { positional, flags };
}

function deepMerge(base, extra) {
  const result = { ...base };
  for (const [key, value] of Object.entries(extra ?? {})) {
    result[key] = value && typeof value === 'object' && !Array.isArray(value)
      ? deepMerge(base[key] ?? {}, value)
      : value;
  }
  return result;
}

function loadConfig(root, flags) {
  const file = path.join(root, CONFIG_NAME);
  const config = deepMerge(DEFAULTS, fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {});
  if (flags.out) config.outDir = flags.out;
  if (flags.lang) config.docLanguage = flags.lang;
  if (flags['plantuml-url']) config.plantuml.url = flags['plantuml-url'];
  if (flags.project) config.project = flags.project;
  if (flags['code-root']) config.codeRoot = flags['code-root'];
  if (flags['diagram-language']) config.diagrams.language = String(flags['diagram-language']);
  if (flags.outputs) config.diagrams.outputs = String(flags.outputs).split(',').map((s) => s.trim()).filter(Boolean);
  if (flags['preview-png'] && !config.diagrams.outputs.includes('png')) config.diagrams.outputs = [...config.diagrams.outputs, 'png'];
  if (flags.theme) config.theme.preset = String(flags.theme);
  if (flags.font) config.theme.font = String(flags.font);
  if (flags['font-size']) config.theme.fontSize = Number(flags['font-size']);
  for (const [key, value] of Object.entries(flags)) {
    if (key.startsWith('color-') && typeof value === 'string') config.theme.colors[key.slice(6)] = value;
  }
  if (!['plantuml', 'mermaid'].includes(config.diagrams.language)) fail(`diagrams.language must be plantuml or mermaid, got "${config.diagrams.language}"`);
  const badOutput = config.diagrams.outputs.find((o) => !['svg', 'png', 'html'].includes(o));
  if (badOutput) fail(`diagrams.outputs accepts svg, png and html, got "${badOutput}"`);
  if (!config.project) config.project = path.basename(root);
  return config;
}

function dirOf(root, config, discipline) {
  return path.resolve(root, config.outDir, config.paths[discipline]);
}

function walk(dir, visit) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!IGNORED_DIRS.has(entry.name)) walk(full, visit);
    } else if (entry.isFile()) visit(full);
  }
}

function filesUnder(dir, predicate) {
  const found = [];
  walk(dir, (file) => { if (predicate(file)) found.push(file); });
  return found.sort();
}

function fill(text, vars) {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => (vars[key] ?? `{{${key}}}`));
}

function writeFromTemplate(templateRel, destination, vars, created, skipped, language = 'plantuml') {
  const useMermaid = language === 'mermaid' && templateRel.endsWith('.puml') && !templateRel.endsWith('wireframes.puml');
  if (useMermaid) {
    templateRel = `mermaid/${templateRel.replace(/\.puml$/, '.mmd')}`;
    destination = destination.replace(/\.puml$/, '.mmd');
  }
  if (fs.existsSync(destination)) { skipped.push(destination); return; }
  const source = fs.readFileSync(path.join(TEMPLATES, templateRel), 'utf8');
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, fill(source, vars));
  created.push(destination);
}

function rel(root, file) {
  return path.relative(root, file).split(path.sep).join('/');
}

function templateVars(root, config, extra = {}) {
  return {
    project: config.project,
    date: new Date().toISOString().slice(0, 10),
    language: config.docLanguage,
    outDir: config.outDir,
    specFile: config.diagrams.language === 'mermaid' ? 'specification.mmd' : 'specification.puml',
    ...extra,
  };
}

function cmdInit(root, config) {
  const vars = templateVars(root, config);
  const created = [];
  const skipped = [];
  const configFile = path.join(root, CONFIG_NAME);
  if (!fs.existsSync(configFile)) {
    fs.writeFileSync(configFile, JSON.stringify({
      project: config.project, outDir: config.outDir, docLanguage: config.docLanguage,
      codeRoot: config.codeRoot, paths: config.paths, useCaseDir: config.useCaseDir,
      plantuml: config.plantuml, diagrams: config.diagrams, theme: config.theme,
      ids: config.ids, targetStack: config.targetStack,
    }, null, 2) + '\n');
    created.push(configFile);
  } else skipped.push(configFile);

  const plan = [
    ['README.md', null, 'README.md'],
    ['domain/README.md', 'domain', 'README.md'],
    ['domain/domain-model.puml', 'domain', 'domain-model.puml'],
    ['domain/domain-model-simple.puml', 'domain', 'domain-model-simple.puml'],
    ['domain/entity-states.puml', 'domain', 'entity-states/entity-states.puml'],
    ['requirements/README.md', 'requirements', 'README.md'],
    ['requirements/actors.md', 'requirements', 'actors.md'],
    ['requirements/requirements.md', 'requirements', 'requirements.md'],
    ['analysis/README.md', 'analysis', 'README.md'],
    ['analysis/class-diagram.puml', 'analysis', 'class-diagram.puml'],
    ['design/README.md', 'design', 'README.md'],
    ['design/class-diagram.puml', 'design', 'class-diagram.puml'],
    ['design/data-model.puml', 'design', 'data-model/data-model.puml'],
    ['design/deployment.puml', 'design', 'deployment/deployment.puml'],
    ['design/project-configuration.md', 'design', 'project-configuration.md'],
    ['implementation/README.md', 'implementation', 'README.md'],
    ['implementation/code-map.md', 'implementation', 'code-map.md'],
    ['quality/README.md', 'quality', 'README.md'],
    ['quality/project-profile.md', 'quality', 'project-profile.md'],
    ['quality/traceability.csv', 'quality', 'traceability.csv'],
    ['quality/open-questions.md', 'quality', 'open-questions.md'],
    ['quality/audit.md', 'quality', 'audit.md'],
  ];
  for (const [tpl, discipline, dest] of plan) {
    const base = discipline ? dirOf(root, config, discipline) : path.resolve(root, config.outDir);
    writeFromTemplate(tpl, path.join(base, dest), vars, created, skipped, config.diagrams.language);
  }
  fs.mkdirSync(path.join(dirOf(root, config, 'quality'), 'decisions'), { recursive: true });
  report('init', { created: created.map((f) => rel(root, f)), skipped: skipped.map((f) => rel(root, f)) });
}

function nextUseCaseId(root, config) {
  const prefix = config.ids.useCase;
  const pattern = new RegExp(`^id:\\s*${prefix}-(\\d+)`, 'm');
  let max = 0;
  const reqDir = path.join(dirOf(root, config, 'requirements'), config.useCaseDir);
  for (const file of filesUnder(reqDir, (f) => f.endsWith('README.md'))) {
    const match = pattern.exec(fs.readFileSync(file, 'utf8'));
    if (match) max = Math.max(max, Number(match[1]));
  }
  return `${prefix}-${String(max + 1).padStart(3, '0')}`;
}

function cmdNewUseCase(root, config, name, flags) {
  if (!name || !/^[A-Za-z][A-Za-z0-9]*$/.test(name)) fail('Use a camelCase name made of letters and digits, e.g. createOrder.');
  const wanted = String(flags.discipline ?? 'requirements,analysis,design').split(',');
  const ucId = flags.id ?? nextUseCaseId(root, config);
  const vars = templateVars(root, config, {
    ucName: name, ucId, ucTitle: flags.title ?? name, actor: flags.actor ?? 'Actor',
    requirement: flags.requirement ?? `${config.ids.requirement}-001`,
    requirementsLink: `../../../${config.paths.requirements}/${config.useCaseDir}/${name}`,
    analysisLink: `../../../${config.paths.analysis}/${config.useCaseDir}/${name}`,
  });
  const plan = {
    requirements: [['use-case/requirements.md', 'README.md'], ['use-case/specification.puml', 'specification.puml'], ['use-case/wireframes.puml', 'wireframes.puml']],
    analysis: [['use-case/analysis.md', 'README.md'], ['use-case/collaboration.puml', 'collaboration.puml']],
    design: [['use-case/design.md', 'README.md'], ['use-case/sequence.puml', 'sequence.puml']],
  };
  const created = [];
  const skipped = [];
  for (const discipline of wanted) {
    for (const [tpl, dest] of plan[discipline] ?? []) {
      const target = path.join(dirOf(root, config, discipline), config.useCaseDir, name, dest);
      writeFromTemplate(tpl, target, vars, created, skipped, config.diagrams.language);
    }
  }
  const traceFile = path.join(dirOf(root, config, 'quality'), 'traceability.csv');
  if (fs.existsSync(traceFile) && !fs.readFileSync(traceFile, 'utf8').includes(`,${ucId},`)) {
    const row =`${vars.requirement},${ucId},${name},${rel(root, path.join(dirOf(root, config, 'analysis'), config.useCaseDir, name))},${rel(root, path.join(dirOf(root, config, 'design'), config.useCaseDir, name))},,\n`;
    fs.appendFileSync(traceFile, row);
  }
  report('new use-case', { id: ucId, created: created.map((f) => rel(root, f)), skipped: skipped.map((f) => rel(root, f)) });
}

function planNames(source) {
  const blocks = [];
  const re = /@start(\w+)[^\n]*\n[\s\S]*?@end\1/g;
  let match;
  while ((match = re.exec(source)) !== null) blocks.push(match[0]);
  return blocks;
}

function atomicWrite(file, content) {
  const tmp = `${file}.tmp-${process.pid}`;
  fs.writeFileSync(tmp, content);
  fs.renameSync(tmp, file);
}

async function cmdRender(root, config, flags) {
  const base = path.resolve(root, flags.path ?? config.outDir);
  const outRoot = path.resolve(root, config.outDir);
  const theme = resolveTheme(config.theme);
  const stateFile = path.join(outRoot, RENDER_STATE);
  const previous = fs.existsSync(stateFile) ? JSON.parse(fs.readFileSync(stateFile, 'utf8')) : {};
  const hash = themeHash(theme);
  const force = Boolean(flags.force) || previous.theme !== hash;
  const wantPng = config.diagrams.outputs.includes('png');
  const sources = filesUnder(base, (f) => DIAGRAM_SOURCE.test(f));
  const results = { rendered: [], skipped: [], failed: [] };
  const mermaidJobs = [];

  for (const file of sources) {
    const text = fs.readFileSync(file, 'utf8');
    const isMermaid = file.endsWith('.mmd');
    const blocks = isMermaid ? (text.trim() ? [text] : []) : planNames(text);
    if (blocks.length === 0) { results.failed.push({ file: rel(root, file), error: isMermaid ? 'empty Mermaid source' : 'no @start/@end block found' }); continue; }
    const stem = file.replace(DIAGRAM_SOURCE, '');
    for (let i = 0; i < blocks.length; i++) {
      const target = blocks.length === 1 ? `${stem}.svg` : `${stem}-${String(i + 1).padStart(2, '0')}.svg`;
      const upToDate = fs.existsSync(target) && fs.statSync(target).mtimeMs >= fs.statSync(file).mtimeMs;
      if (upToDate && !force) { results.skipped.push(rel(root, target)); continue; }
      if (isMermaid) { mermaidJobs.push({ id: target, source: blocks[i], file }); continue; }
      try {
        const themed = applyPlantumlTheme(blocks[i], theme);
        atomicWrite(target, await fetchDiagram(config, themed, 'svg'));
        results.rendered.push(rel(root, target));
        if (wantPng) atomicWrite(target.replace(/\.svg$/, '.preview.png'), await fetchDiagram(config, themed, 'png'));
      } catch (error) {
        results.failed.push({ file: rel(root, file), error: String(error.message ?? error) });
      }
    }
  }

  const mermaidResults = renderMermaidBatch(mermaidJobs, theme, config.mermaid);
  for (const job of mermaidJobs) {
    const outcome = mermaidResults.get(job.id);
    if (outcome?.svg) { atomicWrite(job.id, outcome.svg); results.rendered.push(rel(root, job.id)); }
    else results.failed.push({ file: rel(root, job.file), error: outcome?.error ?? 'Mermaid produced no output' });
  }

  if (!results.failed.length && fs.existsSync(outRoot)) fs.writeFileSync(stateFile, JSON.stringify({ theme: hash }) + '\n');
  if (config.diagrams.outputs.includes('html')) results.explorer = [cmdExplore(root, config, true)];
  report('render', results);
  if (results.failed.length) process.exitCode = 1;
}

function cmdExplore(root, config, quiet = false) {
  const outRoot = path.resolve(root, config.outDir);
  const sources = filesUnder(outRoot, (f) => DIAGRAM_SOURCE.test(f));
  const items = collectDiagrams(outRoot, sources);
  const target = path.join(outRoot, 'explorer.html');
  fs.writeFileSync(target, buildExplorer({ project: config.project, theme: resolveTheme(config.theme), items }));
  const where = `${rel(root, target)} (${items.length} diagrams)`;
  if (!quiet) report('explore', { written: where });
  return where;
}

function cmdInstructions(root, flags) {
  if (flags.list || !flags.target) {
    console.log('== instruction targets ==');
    for (const [name, t] of Object.entries(INSTRUCTION_TARGETS)) console.log(`${name.padEnd(9)} ${t.file}  (${t.label})`);
    if (!flags.target) return;
  }
  const names = String(flags.target).split(',').map((s) => s.trim()).filter(Boolean);
  const written = [];
  for (const name of names) {
    try {
      const result = writeInstructions(root, name, typeof flags['skill-path'] === 'string' ? flags['skill-path'] : undefined);
      written.push(`${rel(root, result.file)} (${result.created ? 'created' : result.changed ? 'updated' : 'unchanged'})`);
    } catch (error) {
      fail(String(error.message ?? error));
    }
  }
  report('instructions', { written });
}

function cmdThemes(flags) {
  const rows = Object.entries(PRESETS).map(([name, preset]) => ({ name, description: preset.description, ...preset.colors }));
  if (flags.json) { console.log(JSON.stringify(rows, null, 2)); return; }
  console.log('== themes ==');
  for (const row of rows) console.log(`${row.name.padEnd(14)} ${row.description}  [primary ${row.primary}, accent ${row.accent}]`);
  console.log('\nSet "theme.preset" in rup.config.json or pass --theme <name>. Override single colors with theme.colors or --color-<key> "#RRGGBB" (background, text, line, border, primary, secondary, accent, note).');
}

function frontMatter(text) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
  const data = {};
  if (!match) return data;
  for (const line of match[1].split(/\r?\n/)) {
    const pair = /^(\w+):\s*(.*)$/.exec(line);
    if (pair) data[pair[1]] = pair[2].trim();
  }
  return data;
}

function parseCsv(text) {
  return text.split(/\r?\n/).filter((line) => line.trim() && !line.startsWith('#')).map((line) => line.split(','));
}

function cmdCheck(root, config, flags) {
  const base = path.resolve(root, config.outDir);
  const errors = [];
  const warnings = [];
  if (!fs.existsSync(base)) fail(`Output directory not found: ${config.outDir}. Run init first.`);

  const mermaidStart = /^\s*(?:%%\{[\s\S]*?\}%%\s*)?(classDiagram|stateDiagram(-v2)?|sequenceDiagram|erDiagram|flowchart|graph|journey|gantt|pie|mindmap|timeline|requirementDiagram|C4Context|block-beta|architecture-beta)\b/;
  for (const file of filesUnder(base, (f) => DIAGRAM_SOURCE.test(f))) {
    const text = fs.readFileSync(file, 'utf8');
    if (file.endsWith('.mmd')) {
      if (!mermaidStart.test(text)) errors.push(`${rel(root, file)}: not a recognised Mermaid diagram type`);
    } else {
      const starts = (text.match(/@start\w+/g) ?? []).length;
      const ends = (text.match(/@end\w+/g) ?? []).length;
      if (starts === 0 || starts !== ends) errors.push(`${rel(root, file)}: unbalanced @start/@end`);
    }
    const stem = file.replace(DIAGRAM_SOURCE, '');
    if (!fs.existsSync(`${stem}.svg`) && !fs.existsSync(`${stem}-01.svg`)) warnings.push(`${rel(root, file)}: no rendered SVG`);
  }

  const imageOrLink = /!?\[[^\]]*\]\(([^)\s]+)\)/g;
  for (const file of filesUnder(base, (f) => f.endsWith('.md'))) {
    const text = fs.readFileSync(file, 'utf8');
    let match;
    while ((match = imageOrLink.exec(text)) !== null) {
      const target = match[1].split('#')[0];
      if (!target || /^[a-z]+:/i.test(target) || target.startsWith('{{')) continue;
      const resolved = path.resolve(path.dirname(file), decodeURI(target));
      if (fs.existsSync(resolved)) continue;
      const pendingRender = /\.(svg|png)$/.test(resolved) && ['.puml', '.mmd'].some((ext) => fs.existsSync(resolved.replace(/(\.preview)?\.(svg|png)$/, ext)));
      (pendingRender ? warnings : errors).push(`${rel(root, file)}: ${pendingRender ? 'diagram not rendered yet' : 'broken link'} ${match[1]}`);
    }
    if (text.includes('{{')) warnings.push(`${rel(root, file)}: unresolved template placeholder`);
  }

  const useCases = {};
  for (const discipline of ['requirements', 'analysis', 'design']) {
    const dir = path.join(dirOf(root, config, discipline), config.useCaseDir);
    if (!fs.existsSync(dir)) continue;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true }).filter((e) => e.isDirectory())) {
      useCases[entry.name] ??= {};
      const readme = path.join(dir, entry.name, 'README.md');
      useCases[entry.name][discipline] = fs.existsSync(readme) ? frontMatter(fs.readFileSync(readme, 'utf8')) : {};
      if (!fs.existsSync(readme)) errors.push(`${discipline}/${entry.name}: missing README.md`);
    }
  }
  for (const [name, parts] of Object.entries(useCases)) {
    for (const discipline of ['analysis', 'design']) {
      if (!parts[discipline]) warnings.push(`use case ${name}: no ${discipline} realization`);
    }
    if (parts.requirements && !parts.requirements.id) errors.push(`use case ${name}: requirements README has no id in front matter`);
  }

  const traceFile = path.join(dirOf(root, config, 'quality'), 'traceability.csv');
  if (fs.existsSync(traceFile)) {
    const rows = parseCsv(fs.readFileSync(traceFile, 'utf8'));
    const header = rows.shift() ?? [];
    const traced = new Set(rows.map((r) => r[1]));
    for (const [name, parts] of Object.entries(useCases)) {
      const id = parts.requirements?.id;
      if (id && !traced.has(id)) warnings.push(`use case ${name} (${id}): not in traceability.csv`);
    }
    for (const row of rows) {
      header.forEach((column, index) => {
        if (['code', 'test'].includes(column) && !row[index]) warnings.push(`traceability ${row[1] || row[0]}: empty "${column}"`);
      });
    }
  } else warnings.push('traceability.csv not found');

  report('check', { errors, warnings });
  if (errors.length || (flags.strict && warnings.length)) process.exitCode = 1;
}

function cmdScan(root, config, flags) {
  const codeRoot = path.resolve(root, config.codeRoot);
  const extensions = {};
  const manifests = [];
  const hints = { entities: [], entrypoints: [], services: [], persistence: [], tests: [], contracts: [] };
  const manifestNames = /^(package\.json|pom\.xml|build\.gradle(\.kts)?|composer\.json|requirements\.txt|pyproject\.toml|go\.mod|Cargo\.toml|Gemfile|Dockerfile|docker-compose\.ya?ml|compose\.ya?ml|schema\.prisma|.*\.csproj|.*\.sln)$/;
  const outDirAbs = path.resolve(root, config.outDir);
  walk(codeRoot, (file) => {
    if (file.startsWith(outDirAbs)) return;
    const name = path.basename(file);
    const ext = path.extname(name).toLowerCase() || '(none)';
    extensions[ext] = (extensions[ext] ?? 0) + 1;
    const r = rel(root, file);
    if (manifestNames.test(name)) manifests.push(r);
    if (/(openapi|swagger|asyncapi).*\.(ya?ml|json)$/i.test(name) || /\.(proto|graphql)$/.test(name)) hints.contracts.push(r);
    if (/\.(test|spec)\.\w+$|(^|\/)(tests?|__tests__)\//i.test(r)) hints.tests.push(r);
    else if (/(^|\/)(entities|entity|models?|domain)\//i.test(r)) hints.entities.push(r);
    else if (/(controllers?|routes?|handlers?|api|main|index|app)\.\w+$|(^|\/)(controllers?|routes?|api)\//i.test(r)) hints.entrypoints.push(r);
    else if (/(^|\/)(services?|usecases?|use-cases?)\//i.test(r)) hints.services.push(r);
    else if (/(^|\/)(repositor(y|ies)|migrations?|prisma|schema)\b/i.test(r)) hints.persistence.push(r);
  });
  const limit = Number(flags.limit ?? 60);
  const summary = {
    codeRoot: rel(root, codeRoot) || '.',
    extensions: Object.fromEntries(Object.entries(extensions).sort((a, b) => b[1] - a[1])),
    manifests,
    ...Object.fromEntries(Object.entries(hints).map(([key, list]) => [key, { total: list.length, sample: list.slice(0, limit) }])),
  };
  const text = JSON.stringify(summary, null, 2) + '\n';
  if (flags.write) {
    const target = path.join(dirOf(root, config, 'implementation'), 'code-inventory.json');
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, text);
    console.log(`Inventory written to ${rel(root, target)}`);
  } else process.stdout.write(text);
}

function cmdServer(action, config) {
  const port = new URL(config.plantuml.url).port || '8085';
  const args = action === 'up' ? ['up', '-d'] : ['down'];
  const work = fs.mkdtempSync(path.join(os.tmpdir(), 'rup-server-'));
  const envFile = path.join(work, 'compose.env');
  fs.writeFileSync(envFile, `PLANTUML_PORT=${port}\n`);
  const result = spawnSync('docker', ['compose', '--env-file', envFile, '-f', COMPOSE_FILE, ...args], { stdio: 'inherit' });
  fs.rmSync(work, { recursive: true, force: true });
  if (result.status !== 0) fail('docker compose failed. Is Docker running?');
}

async function cmdHealth(config) {
  const sample = '@startuml\nAlice -> Bob : ping\n@enduml';
  try {
    await fetchDiagram(config, sample, 'svg');
    console.log(`OK: ${config.plantuml.url} rendered a test SVG`);
  } catch (error) {
    fail(`PlantUML server not usable at ${config.plantuml.url}: ${error.message}. Run "server up".`);
  }
}

function report(title, data) {
  console.log(`== ${title} ==`);
  for (const [key, value] of Object.entries(data)) {
    const list = Array.isArray(value) ? value : [value];
    console.log(`${key}: ${Array.isArray(value) ? list.length : value}`);
    if (Array.isArray(value)) for (const item of list) console.log(`  - ${typeof item === 'string' ? item : JSON.stringify(item)}`);
  }
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

const USAGE = `rup-flow CLI

  init                         create config and the documentation skeleton
  new use-case <camelName>     scaffold a use case across requirements/analysis/design
  render                       .puml (PlantUML server) and .mmd (Mermaid container) -> .svg, themed
  explore                      build explorer.html: interactive viewer of every rendered diagram
  themes                       list the color presets
  instructions --target <t>    add or refresh the rup-flow block in an agent instruction file
                               (agents, claude, gemini, copilot, cursor; comma separated; --skill-path <dir>)
  check [--strict]             structure, links, diagrams and traceability
  scan [--write]               inventory of the code base (input for code -> RUP)
  server up|down               start or stop the PlantUML container
  health                       verify the PlantUML server renders
  config                       print the resolved configuration

Common flags: --root <dir> --out <docs dir> --lang <code> --project <name>
              --code-root <dir> --plantuml-url <url> --force
Diagrams:     --diagram-language plantuml|mermaid  --outputs svg,png,html  --preview-png
Theme:        --theme <preset> --font <name> --font-size <n> --color-<key> "#RRGGBB"
New use case: --title <text> --actor <name> --requirement <id> --discipline <list>`;

const { positional, flags } = parseArgs(process.argv.slice(2));
const [command, sub] = positional;
const root = path.resolve(String(flags.root ?? process.cwd()));
const config = loadConfig(root, flags);

switch (command) {
  case 'init': cmdInit(root, config); break;
  case 'new':
    if (sub !== 'use-case') fail(USAGE);
    cmdNewUseCase(root, config, positional[2], flags);
    break;
  case 'render': await cmdRender(root, config, flags); break;
  case 'explore': cmdExplore(root, config); break;
  case 'themes': cmdThemes(flags); break;
  case 'instructions': cmdInstructions(root, flags); break;
  case 'check': cmdCheck(root, config, flags); break;
  case 'scan': cmdScan(root, config, flags); break;
  case 'server': cmdServer(sub === 'down' ? 'down' : 'up', config); break;
  case 'health': await cmdHealth(config); break;
  case 'config': console.log(JSON.stringify(config, null, 2)); break;
  default: console.log(USAGE);
}
