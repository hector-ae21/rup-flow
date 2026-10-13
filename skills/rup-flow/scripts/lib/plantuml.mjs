import zlib from 'node:zlib';

const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_';

export function encodePlantUml(text) {
  const bytes = zlib.deflateRawSync(Buffer.from(text, 'utf8'));
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b1 = bytes[i];
    const b2 = bytes[i + 1] ?? 0;
    const b3 = bytes[i + 2] ?? 0;
    out += ALPHABET[b1 >> 2] + ALPHABET[((b1 & 3) << 4) | (b2 >> 4)] + ALPHABET[((b2 & 15) << 2) | (b3 >> 6)] + ALPHABET[b3 & 63];
  }
  return out;
}

/**
 * Renders one PlantUML source through the configured server.
 * @param {{ plantuml: { url: string, timeoutMs: number } }} config
 * @param {string} source
 * @param {'svg' | 'png'} format
 * @returns {Promise<Buffer>}
 */
export async function fetchDiagram(config, source, format) {
  const base = config.plantuml.url.replace(/\/$/, '');
  const options = { signal: AbortSignal.timeout(config.plantuml.timeoutMs) };
  let response = await fetch(`${base}/${format}`, {
    ...options, method: 'POST', headers: { 'Content-Type': 'text/plain; charset=utf-8' }, body: source,
  }).catch(() => null);
  if (!response || response.status === 404 || response.status === 405) {
    response = await fetch(`${base}/${format}/${encodePlantUml(source)}`, options);
  }
  const body = Buffer.from(await response.arrayBuffer());
  if (!response.ok) throw new Error(`PlantUML server answered ${response.status}`);
  if (format === 'svg') {
    const text = body.toString('utf8');
    if (!/<svg[\s>]/.test(text)) throw new Error('response is not an SVG');
    if (/Syntax Error\?|>Error<|Cannot find font/.test(text)) throw new Error('PlantUML reported a syntax error in this diagram');
  }
  return body;
}
