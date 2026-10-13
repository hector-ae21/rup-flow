#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const SIZE = 512;
const SUPERSAMPLE = 4;
const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'assets');

const NAVY = '#1E3A5F';
const WHITE = '#FFFFFF';
const SKY = '#8EC5FF';
const BLUE = '#4F8FD6';
const LINE = '#C9DDF2';

const shapes = [
  { x: 0, y: 0, w: SIZE, h: SIZE, r: 112, fill: NAVY },
  ...[
    [256, 148, 10, 30], [158, 173, 196, 10], [158, 173, 10, 40], [344, 173, 10, 40],
    [158, 263, 10, 36], [107, 294, 154, 10], [107, 294, 10, 41], [251, 294, 10, 41],
    [344, 263, 10, 36], [344, 294, 61, 10], [395, 294, 10, 41],
  ].map(([x, y, w, h]) => ({ x: x - 0, y, w, h, r: 5, fill: LINE })),
  { x: 176, y: 84, w: 160, h: 64, r: 16, fill: WHITE },
  { x: 88, y: 208, w: 150, h: 60, r: 14, fill: SKY },
  { x: 274, y: 208, w: 150, h: 60, r: 14, fill: SKY },
  { x: 52, y: 330, w: 120, h: 56, r: 12, fill: BLUE },
  { x: 196, y: 330, w: 120, h: 56, r: 12, fill: BLUE },
  { x: 340, y: 330, w: 120, h: 56, r: 12, fill: BLUE },
  { x: 150, y: 422, w: 212, h: 14, r: 7, fill: LINE },
];

function hexToRgb(hex) {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
}

function inside(shape, px, py) {
  const { x, y, w, h, r } = shape;
  if (px < x || px > x + w || py < y || py > y + h) return false;
  const cx = px < x + r ? x + r : px > x + w - r ? x + w - r : px;
  const cy = py < y + r ? y + r : py > y + h - r ? y + h - r : py;
  return (px - cx) ** 2 + (py - cy) ** 2 <= r * r;
}

function rasterize() {
  const rgba = Buffer.alloc(SIZE * SIZE * 4);
  const samples = SUPERSAMPLE * SUPERSAMPLE;
  for (let py = 0; py < SIZE; py++) {
    for (let px = 0; px < SIZE; px++) {
      const sum = [0, 0, 0];
      let covered = 0;
      for (let sy = 0; sy < SUPERSAMPLE; sy++) {
        for (let sx = 0; sx < SUPERSAMPLE; sx++) {
          const fx = px + (sx + 0.5) / SUPERSAMPLE;
          const fy = py + (sy + 0.5) / SUPERSAMPLE;
          let hit = null;
          for (const shape of shapes) if (inside(shape, fx, fy)) hit = shape;
          if (hit) {
            const [r, g, b] = hexToRgb(hit.fill);
            sum[0] += r; sum[1] += g; sum[2] += b;
            covered++;
          }
        }
      }
      const offset = (py * SIZE + px) * 4;
      if (covered) {
        rgba[offset] = Math.round(sum[0] / covered);
        rgba[offset + 1] = Math.round(sum[1] / covered);
        rgba[offset + 2] = Math.round(sum[2] / covered);
      }
      rgba[offset + 3] = Math.round((covered / samples) * 255);
    }
  }
  return rgba;
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buffer) {
  let c = 0xffffffff;
  for (const byte of buffer) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

function encodePng(rgba) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(SIZE, 0);
  header.writeUInt32BE(SIZE, 4);
  header.set([8, 6, 0, 0, 0], 8);
  const stride = SIZE * 4;
  const raw = Buffer.alloc((stride + 1) * SIZE);
  for (let row = 0; row < SIZE; row++) {
    raw[row * (stride + 1)] = 0;
    rgba.copy(raw, row * (stride + 1) + 1, row * stride, (row + 1) * stride);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function toSvg() {
  const body = shapes
    .map((s) => `  <rect x="${s.x}" y="${s.y}" width="${s.w}" height="${s.h}" rx="${s.r}" fill="${s.fill}"/>`)
    .join('\n');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}" width="${SIZE}" height="${SIZE}" role="img" aria-label="rup-flow">\n${body}\n</svg>\n`;
}

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'icon.svg'), toSvg());
fs.writeFileSync(path.join(OUT, 'icon.png'), encodePng(rasterize()));
console.log(`Wrote ${path.join(OUT, 'icon.svg')} and icon.png`);
