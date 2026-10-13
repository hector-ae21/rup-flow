import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { svgToTree } from '../skills/rup-flow/scripts/lib/svgtree.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const flat = (tree) => JSON.stringify(tree);

test('elements and text survive with entities decoded', () => {
  const tree = svgToTree('<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><g class="entity" id="e1"><text x="1">A &amp; B &lt;c&gt; &#65;&nbsp;</text><rect width="2"/></g></svg>');
  assert.equal(tree.t, 'svg');
  assert.equal(tree.a.viewBox, '0 0 10 10');
  const g = tree.c[0];
  assert.equal(g.a.class, 'entity');
  assert.equal(g.c[0].c[0], 'A & B <c> A ');
  assert.equal(g.c[1].t, 'rect');
});

test('scripts, handlers and active links are dropped', () => {
  const tree = svgToTree('<svg xmlns="http://www.w3.org/2000/svg" onload="bad()"><script>alert(1)</script><a href="javascript:alert(1)"><text onclick="x()">hi</text></a><use xlink:href="https://evil.example/x.svg#a"/><image href="data:text/html;base64,AAAA"/><iframe src="x"></iframe><animate attributeName="href" to="javascript:1"/><text>ok</text></svg>');
  const text = flat(tree);
  assert.doesNotMatch(text, /script|alert|javascript|onload|onclick|evil|iframe|animate|data:text/);
  assert.match(text, /"hi"/);
  assert.match(text, /"ok"/);
});

test('local references and embedded images are allowed, other resources are not', () => {
  const tree = svgToTree('<svg xmlns="http://www.w3.org/2000/svg"><use href="#a"/><image href="data:image/png;base64,iVBORw0KGgo="/><image href="http://x.example/a.png"/></svg>');
  assert.equal(tree.c[0].a.href, '#a');
  assert.match(tree.c[1].a.href, /^data:image\/png/);
  assert.equal(tree.c[2].a.href, undefined);
});

test('XHTML inside foreignObject is kept with its namespace', () => {
  const tree = svgToTree('<svg xmlns="http://www.w3.org/2000/svg"><foreignObject><div xmlns="http://www.w3.org/1999/xhtml"><span>Label<br/>two</span></div></foreignObject></svg>');
  const div = tree.c[0].c[0];
  assert.equal(div.t, 'div');
  assert.equal(div.a.xmlns, 'http://www.w3.org/1999/xhtml');
  assert.equal(div.c[0].c[1].t, 'br');
});

test('malformed input does not throw and returns null without an svg root', () => {
  assert.equal(svgToTree('<div>no svg</div>'), null);
  assert.doesNotThrow(() => svgToTree('<svg><g><text>unclosed'));
});

test('every diagram the example project renders converts to a tree', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'rup-flow-tree-'));
  fs.cpSync(path.join(ROOT, 'examples', 'shop'), root, { recursive: true });
  const files = [];
  const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).forEach((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : e.name.endsWith('.svg') && files.push(path.join(dir, e.name))));
  walk(root);
  assert.ok(files.length > 20);
  for (const file of files) {
    const tree = svgToTree(fs.readFileSync(file, 'utf8'));
    assert.ok(tree && tree.t === 'svg', file);
    assert.ok(tree.c.length > 0, file);
  }
  assert.equal(spawnSync(process.execPath, [path.join(ROOT, 'skills/rup-flow/scripts/rup.mjs'), 'explore', '--root', root], { encoding: 'utf8' }).status, 0);
});
