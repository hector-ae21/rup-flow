const SVG_TAGS = new Set(['svg', 'g', 'defs', 'path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon', 'text', 'tspan', 'textPath', 'title', 'desc', 'style', 'linearGradient', 'radialGradient', 'stop', 'pattern', 'clipPath', 'mask', 'marker', 'symbol', 'use', 'image', 'filter', 'feGaussianBlur', 'feOffset', 'feBlend', 'feColorMatrix', 'feFlood', 'feComposite', 'feMerge', 'feMergeNode', 'feDropShadow', 'foreignObject', 'switch', 'a']);
const HTML_TAGS = new Set(['div', 'span', 'p', 'br', 'b', 'i', 'em', 'strong', 'pre', 'code', 'ul', 'ol', 'li', 'table', 'thead', 'tbody', 'tr', 'td', 'th', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'sub', 'sup', 'small', 'label']);
const ENTITIES = { nbsp: ' ', lt: '<', gt: '>', quot: '"', apos: "'", amp: '&' };
const DATA_IMAGE = /^data:image\/(png|jpeg|gif|webp);base64,[A-Za-z0-9+/=]*$/;

function decode(text) {
  return text.replace(/&(#x[0-9a-fA-F]+|#\d+|[a-zA-Z]+);/g, (match, name) => {
    if (name[0] === '#') {
      const code = name[1] === 'x' ? parseInt(name.slice(2), 16) : parseInt(name.slice(1), 10);
      return Number.isFinite(code) && code > 0 && code < 0x110000 ? String.fromCodePoint(code) : '';
    }
    return ENTITIES[name] ?? match;
  });
}

function allowedAttribute(name, value) {
  const lower = name.toLowerCase();
  if (lower.startsWith('on')) return false;
  if (lower === 'href' || lower === 'xlink:href' || lower === 'src') {
    const clean = value.replace(/[\s\u0000-\u001f]/g, '');
    return clean.startsWith('#') || DATA_IMAGE.test(clean);
  }
  return /^[A-Za-z_:][-A-Za-z0-9_:.]*$/.test(name);
}

/**
 * Parses well-formed SVG into a plain tree of { t: tag, a: attributes, c: children }
 * and text strings. Only known SVG and XHTML elements survive, and attributes that
 * could run code or load a resource are dropped, so the viewer can rebuild the nodes
 * without ever parsing markup in the browser.
 */
export function svgToTree(source) {
  const root = { t: '#root', a: {}, c: [] };
  const stack = [root];
  const token = /<!--[\s\S]*?-->|<!\[CDATA\[([\s\S]*?)\]\]>|<\?[\s\S]*?\?>|<!DOCTYPE[^>]*>|<\/([A-Za-z][\w:.-]*)\s*>|<([A-Za-z][\w:.-]*)((?:\s+[^\s=>/]+(?:\s*=\s*(?:"[^"]*"|'[^']*'))?)*)\s*(\/?)>|([^<]+)/g;
  const attribute = /([^\s=>/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'))?/g;
  let skip = 0;
  let match;
  while ((match = token.exec(source)) !== null) {
    const [, cdata, closing, opening, attrText, selfClose, text] = match;
    if (closing) {
      const top = stack[stack.length - 1];
      if (skip > 0) { skip--; continue; }
      if (top.t === closing || top.t === closing.toLowerCase()) stack.pop();
      continue;
    }
    if (opening) {
      const known = SVG_TAGS.has(opening) || HTML_TAGS.has(opening.toLowerCase());
      if (!known || skip > 0) { if (!selfClose) skip++; continue; }
      const attrs = {};
      let a;
      attribute.lastIndex = 0;
      while ((a = attribute.exec(attrText)) !== null) {
        const value = decode(a[2] ?? a[3] ?? '');
        if (allowedAttribute(a[1], value)) attrs[a[1]] = value;
      }
      const node = { t: opening, a: attrs, c: [] };
      stack[stack.length - 1].c.push(node);
      if (!selfClose) stack.push(node);
      continue;
    }
    if (skip > 0) continue;
    const content = cdata !== undefined ? cdata : (text !== undefined ? decode(text) : undefined);
    if (content !== undefined && content !== '') stack[stack.length - 1].c.push(content);
  }
  return root.c.find((n) => typeof n === 'object' && n.t === 'svg') ?? null;
}
