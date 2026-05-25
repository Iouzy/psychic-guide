// Generates the PWA / app icons for Pauta with no external dependencies.
// Draws three cream tide waves on a terracotta field (matches the Marés glyph)
// and encodes PNGs using Node's built-in zlib. Run: node tools/gen-icons.mjs
import zlib from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "icons");
mkdirSync(OUT, { recursive: true });

const PAPER = [0xf5, 0xf1, 0xea];
const TERRACOTTA = [0xb8, 0x53, 0x3a];

// CRC32 + PNG chunk encoding
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}
function encodePNG(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type RGBA
  // raw scanlines, filter byte 0 per row
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// Draw the icon at the given size. `pad` is the fraction of the canvas kept as
// empty terracotta margin around the waves (larger for the maskable variant).
function drawIcon(size, pad = 0.0) {
  const rgba = Buffer.alloc(size * size * 4);
  // fill background
  for (let i = 0; i < size * size; i++) {
    rgba[i * 4] = TERRACOTTA[0];
    rgba[i * 4 + 1] = TERRACOTTA[1];
    rgba[i * 4 + 2] = TERRACOTTA[2];
    rgba[i * 4 + 3] = 255;
  }

  // Drawing region (waves live inside this inset box)
  const inset = pad * size;
  const x0 = inset;
  const x1 = size - inset;
  const w = x1 - x0;
  const region = size - 2 * inset;

  const stroke = region * 0.058;
  const half = stroke / 2;
  const amp = region * 0.072;
  const baselines = [0.30, 0.5, 0.70].map((f) => inset + f * region);

  // Precompute wave polylines (x -> y) at fine resolution
  const STEP = 0.5;
  const waves = baselines.map((by) => {
    const pts = [];
    for (let x = x0; x <= x1; x += STEP) {
      const phase = ((x - x0) / w) * Math.PI * 4;
      pts.push([x, by + amp * Math.sin(phase)]);
    }
    return pts;
  });

  const SS = 4; // supersampling per axis
  const inkA = 1;
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let cover = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const fx = px + (sx + 0.5) / SS;
          const fy = py + (sy + 0.5) / SS;
          if (fx < x0 || fx > x1) continue;
          // distance to nearest wave (search window around fx)
          let best = Infinity;
          for (const pts of waves) {
            const idxCenter = Math.round((fx - x0) / STEP);
            const win = Math.ceil((half + 2) / STEP);
            for (let k = idxCenter - win; k <= idxCenter + win; k++) {
              if (k < 0 || k >= pts.length) continue;
              const dx = fx - pts[k][0];
              const dy = fy - pts[k][1];
              const d = Math.sqrt(dx * dx + dy * dy);
              if (d < best) best = d;
            }
          }
          if (best <= half) cover++;
        }
      }
      if (cover > 0) {
        const a = (cover / (SS * SS)) * inkA;
        const o = (py * size + px) * 4;
        rgba[o] = Math.round(rgba[o] * (1 - a) + PAPER[0] * a);
        rgba[o + 1] = Math.round(rgba[o + 1] * (1 - a) + PAPER[1] * a);
        rgba[o + 2] = Math.round(rgba[o + 2] * (1 - a) + PAPER[2] * a);
      }
    }
  }
  return encodePNG(size, size, rgba);
}

const targets = [
  { name: "icon-192.png", size: 192, pad: 0.12 },
  { name: "icon-512.png", size: 512, pad: 0.12 },
  // maskable: extra margin so the safe zone survives circular/squircle masks
  { name: "icon-512-maskable.png", size: 512, pad: 0.2 },
  // apple-touch-icon: full-bleed background, modest inset (iOS rounds corners)
  { name: "apple-touch-icon.png", size: 180, pad: 0.14 },
];

for (const t of targets) {
  const png = drawIcon(t.size, t.pad);
  writeFileSync(join(OUT, t.name), png);
  console.log("wrote", t.name, png.length, "bytes");
}
