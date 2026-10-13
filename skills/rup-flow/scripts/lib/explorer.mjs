import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cssVariables } from './themes.mjs';

const TEMPLATE = path.join(path.dirname(fileURLToPath(import.meta.url)), 'explorer.html');
const KIND_BY_FILE = {
  'domain-model': 'domain model', 'domain-model-simple': 'domain model (simple)', 'entity-states': 'states',
  specification: 'specification', wireframes: 'wireframes', collaboration: 'collaboration', sequence: 'sequence',
  'class-diagram': 'classes', 'data-model': 'data model', deployment: 'deployment', components: 'components',
  'use-case-overview': 'use cases',
};

function escapeHtml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function sanitizeSvg(svg) {
  return svg
    .replace(/<\?xml[^>]*\?>/, '')
    .replace(/<!DOCTYPE[^>]*>/, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*')/gi, '');
}

function plainText(svg) {
  return svg
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function prettyGroup(segment) {
  return segment.replace(/^\d+-/, '').replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase());
}

function kindOf(base) {
  if (KIND_BY_FILE[base]) return KIND_BY_FILE[base];
  if (base.startsWith('use-cases-')) return `use cases of ${base.slice(10)}`;
  return base;
}

/**
 * Collects the rendered diagrams under a documentation root.
 * @returns {{ items: object[], docs: Record<string, string> }}
 */
export function collectDiagrams(outDirAbs, files) {
  const items = [];
  const docs = {};
  const readDoc = (file) => {
    const key = path.relative(outDirAbs, file).split(path.sep).join('/');
    if (!(key in docs) && fs.existsSync(file)) docs[key] = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
    return key in docs ? key : '';
  };
  for (const source of files) {
    const stem = source.replace(/\.(puml|plantuml|mmd)$/, '');
    const lang = source.endsWith('.mmd') ? 'mermaid' : 'plantuml';
    const base = path.basename(stem);
    const dir = path.dirname(source);
    const siblings = fs.readdirSync(dir)
      .filter((f) => f === `${base}.svg` || new RegExp(`^${base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-\\d\\d\\.svg$`).test(f));
    const sourceText = fs.readFileSync(source, 'utf8');
    for (const svgName of siblings.sort()) {
      const relative = path.relative(outDirAbs, path.join(dir, svgName)).split(path.sep);
      const parts = relative.slice(0, -1);
      const useCase = parts.includes('use-cases') ? parts[parts.indexOf('use-cases') + 1] : '';
      const group = prettyGroup(parts[0] ?? 'Documentation');
      const kind = kindOf(base);
      const suffix = svgName.replace(base, '').replace('.svg', '');
      const title = `${useCase ? `${useCase} · ` : ''}${kind}${suffix}`;
      const svg = sanitizeSvg(fs.readFileSync(path.join(dir, svgName), 'utf8'));
      items.push({
        id: relative.join('/'),
        title, group, kind, lang, useCase, svg,
        source: sourceText,
        text: plainText(svg),
        doc: readDoc(path.join(dir, 'README.md')),
      });
    }
  }
  const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    return e.isDirectory() ? walk(full) : (e.name.endsWith('.md') ? [full] : []);
  });
  for (const file of walk(outDirAbs).sort()) readDoc(file);
  return { items, docs };
}

export function buildExplorer({ project, theme, data }) {
  const html = fs.readFileSync(TEMPLATE, 'utf8');
  const swatches = [theme.colors.primary, theme.colors.secondary, theme.colors.accent, ...theme.colors.levels]
    .map((color) => `<i style="background:${color}" title="${color}"></i>`).join('');
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  return html
    .replace(/\{\{TITLE\}\}/g, escapeHtml(project))
    .replace('{{VARS}}', cssVariables(theme))
    .replace('{{PRESET}}', escapeHtml(theme.preset))
    .replace('{{SWATCHES}}', swatches)
    .replace('{{DATA}}', () => json);
}
