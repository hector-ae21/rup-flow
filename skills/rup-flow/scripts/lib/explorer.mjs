import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cssVariables } from './themes.mjs';

const TEMPLATE = path.join(path.dirname(fileURLToPath(import.meta.url)), 'explorer.html');
const KIND_BY_FILE = {
  'domain-model': 'domain model', 'domain-model-simple': 'domain model (simple)', 'entity-states': 'states',
  specification: 'specification', wireframes: 'wireframes', collaboration: 'collaboration', sequence: 'sequence',
  'class-diagram': 'classes', 'data-model': 'data model', deployment: 'deployment',
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

function prettyGroup(segment) {
  return segment.replace(/^\d+-/, '').replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase());
}

/**
 * Collects the rendered diagrams under a documentation root.
 * @returns {{ id: string, title: string, group: string, kind: string, lang: string, svg: string, source: string, doc: string }[]}
 */
export function collectDiagrams(outDirAbs, files) {
  const items = [];
  for (const source of files) {
    const stem = source.replace(/\.(puml|plantuml|mmd)$/, '');
    const lang = source.endsWith('.mmd') ? 'mermaid' : 'plantuml';
    const base = path.basename(stem);
    const dir = path.dirname(source);
    const siblings = fs.readdirSync(dir)
      .filter((f) => f.startsWith(`${base}.`) || f.startsWith(`${base}-`))
      .filter((f) => /^(.*)\.svg$/.test(f) && (f === `${base}.svg` || /-\d\d\.svg$/.test(f)));
    const sourceText = fs.readFileSync(source, 'utf8');
    for (const svgName of siblings.sort()) {
      const relative = path.relative(outDirAbs, path.join(dir, svgName)).split(path.sep);
      const parts = relative.slice(0, -1);
      const useCase = parts.includes('use-cases') ? parts[parts.indexOf('use-cases') + 1] : '';
      const group = prettyGroup(parts[0] ?? 'Documentation');
      const kind = KIND_BY_FILE[base] ?? base;
      const suffix = svgName.replace(`${base}`, '').replace('.svg', '');
      const title = `${useCase ? `${useCase} · ` : ''}${kind}${suffix}`;
      const readme = path.join(dir, 'README.md');
      const svg = sanitizeSvg(fs.readFileSync(path.join(dir, svgName), 'utf8'));
      items.push({
        id: relative.join('/'),
        title, group, kind, lang, svg, source: sourceText,
        doc: fs.existsSync(readme) ? path.relative(outDirAbs, readme).split(path.sep).join('/') : '',
      });
    }
  }
  return items;
}

export function buildExplorer({ project, theme, items }) {
  const html = fs.readFileSync(TEMPLATE, 'utf8');
  const swatches = [theme.colors.primary, theme.colors.secondary, theme.colors.accent, ...theme.colors.levels]
    .map((color) => `<i style="background:${color}" title="${color}"></i>`).join('');
  const data = JSON.stringify(items).replace(/</g, '\\u003c');
  return html
    .replace(/\{\{TITLE\}\}/g, escapeHtml(project))
    .replace('{{VARS}}', cssVariables(theme))
    .replace('{{PRESET}}', escapeHtml(theme.preset))
    .replace('{{SWATCHES}}', swatches)
    .replace('{{DATA}}', () => data);
}
