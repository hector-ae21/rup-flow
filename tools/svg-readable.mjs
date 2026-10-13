#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const LONG_PATH = /(\sd=")([^"]{160,})(")/g;

/**
 * Breaks very long SVG path data into short lines. Whitespace inside `d` is
 * valid SVG, and scanners that read documents word by word stop choking on
 * minified paths.
 */
export function makeReadable(svg) {
  return svg.replace(/<\?plantuml-src[^?]*\?>/g, '').replace(LONG_PATH, (_, open, data, close) => {
    const spaced = data.replace(/(\d)(?=-)/g, '$1 ').replace(/(\.\d+)(?=\.)/g, '$1 ');
    return `${open}${spaced.replace(/([A-Za-z])/g, '\n$1').replace(/^\n/, '')}${close}`;
  });
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const target = path.resolve(process.argv[2] ?? 'docs/images');
  let changed = 0;
  for (const file of walk(target).filter((f) => f.endsWith('.svg'))) {
    const before = fs.readFileSync(file, 'utf8');
    const after = makeReadable(before);
    if (after !== before) { fs.writeFileSync(file, after); changed++; }
  }
  console.log(`${changed} SVG file(s) rewritten under ${target}`);
}
