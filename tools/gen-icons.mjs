// Generates the PWA / app icons for Pauta with no external dependencies.
//
// Composition (evolved from the original triple-wave Marés glyph):
//   • Vertical sky-→-deep-ocean gradient background
//   • Soft radial glow in the upper hemisphere (subtle, like dawn light)
//   • A warm ember sun resting on the horizon (ties to the app's terracotta accent)
//   • Three cream tide waves with layered amplitude / opacity / stroke so they
//     read as foreground → background instead of three identical lines
//   • Ember kiss highlighting the crest of the front wave (the sun touches it)
//
// Pure Node: rendering is software-rasterised with 4×4 supersampling AA and
// PNGs are encoded with Node's built-in zlib. Run: node tools/gen-icons.mjs

import zlib from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "icons");
mkdirSync(OUT, { recursive: true });

// ── Palette ─────────────────────────────────────────────────────────────
const PAPER       = [0xf5, 0xf1, 0xea]; // cream — waves
const SKY_TOP     = [0x4f, 0x71, 0xa6]; // dawn ocean blue
const SKY_BOTTOM  = [0x16, 0x2b, 0x4a]; // deep-water blue
const GLOW_TINT   = [0x9c, 0xc4, 0xff]; // pale glow above the horizon
const EMBER       = [0xff, 0xb3, 0x8a]; // warm sun centre
const EMBER_DEEP  = [0xb8, 0x53, 0x3a]; // brand terracotta — sun rim / wave kiss

// ── PNG encoder (CRC32 + chunks) ────────────────────────────────────────
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

// ── Pixel helpers ───────────────────────────────────────────────────────
const lerp  = (a, b, t) => a + (b - a) * t;
const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
const smoothstep = (e0, e1, x) => {
  const t = clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
};

function blendRGB(dst, o, src, a) {
  dst[o]     = Math.round(dst[o]     * (1 - a) + src[0] * a);
  dst[o + 1] = Math.round(dst[o + 1] * (1 - a) + src[1] * a);
  dst[o + 2] = Math.round(dst[o + 2] * (1 - a) + src[2] * a);
}

// ── Renderer ────────────────────────────────────────────────────────────
function drawIcon(size, pad = 0.0) {
  const rgba = Buffer.alloc(size * size * 4);

  // Drawing region (everything lives inside this inset so maskable variants
  // survive circular/squircle clipping)
  const inset = pad * size;
  const x0 = inset;
  const x1 = size - inset;
  const y0 = inset;
  const y1 = size - inset;
  const w = x1 - x0;
  const h = y1 - y0;
  const region = Math.min(w, h);

  // ── 1. Sky gradient + dawn glow (per-pixel) ──────────────────────────
  const sunCx = x0 + w * 0.50;
  const sunCy = y0 + h * 0.38;   // sun sits a touch above mid-height
  const sunR  = region * 0.085;  // inner solid radius
  const sunGlowR = region * 0.34; // soft falloff radius

  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      const o = (py * size + px) * 4;
      let r, g, b;

      if (px < x0 || px >= x1 || py < y0 || py >= y1) {
        // Outside drawing region (only possible with pad > 0): use deep ocean
        r = SKY_BOTTOM[0]; g = SKY_BOTTOM[1]; b = SKY_BOTTOM[2];
      } else {
        // Vertical sky gradient
        const t = (py - y0) / h;
        const tg = smoothstep(0, 1, t);
        r = lerp(SKY_TOP[0], SKY_BOTTOM[0], tg);
        g = lerp(SKY_TOP[1], SKY_BOTTOM[1], tg);
        b = lerp(SKY_TOP[2], SKY_BOTTOM[2], tg);

        // Subtle dawn glow above the horizon, brightest at the sun's centre
        const dx = px - sunCx;
        const dy = py - sunCy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const glowA = (1 - smoothstep(sunR * 0.5, sunGlowR, dist)) * 0.22;
        if (glowA > 0) {
          r = lerp(r, GLOW_TINT[0], glowA);
          g = lerp(g, GLOW_TINT[1], glowA);
          b = lerp(b, GLOW_TINT[2], glowA);
        }
      }

      rgba[o]     = Math.round(r);
      rgba[o + 1] = Math.round(g);
      rgba[o + 2] = Math.round(b);
      rgba[o + 3] = 255;
    }
  }

  // ── 2. Sun disc (with ember-deep rim) — supersampled AA ──────────────
  {
    const SS = 4;
    for (let py = 0; py < size; py++) {
      for (let px = 0; px < size; px++) {
        let coverInner = 0;
        let coverRim   = 0;
        for (let sy = 0; sy < SS; sy++) {
          for (let sx = 0; sx < SS; sx++) {
            const fx = px + (sx + 0.5) / SS;
            const fy = py + (sy + 0.5) / SS;
            const d = Math.sqrt((fx - sunCx) ** 2 + (fy - sunCy) ** 2);
            if (d <= sunR) coverInner++;
            else if (d <= sunR + region * 0.014) coverRim++;
          }
        }
        const tot = SS * SS;
        if (coverInner > 0) {
          const a = coverInner / tot;
          const o = (py * size + px) * 4;
          blendRGB(rgba, o, EMBER, a);
        }
        if (coverRim > 0) {
          const a = (coverRim / tot) * 0.6;
          const o = (py * size + px) * 4;
          blendRGB(rgba, o, EMBER_DEEP, a);
        }
      }
    }
  }

  // ── 3. Three tide waves — varying amplitude, stroke, opacity, phase ──
  // (foreground big & bold, background small & faded — gives depth)
  const waveLayers = [
    { baseY: 0.58, amp: 0.045, stroke: 0.040, phaseOff: 0.35, alpha: 0.55 },
    { baseY: 0.70, amp: 0.062, stroke: 0.050, phaseOff: 0.10, alpha: 0.80 },
    { baseY: 0.83, amp: 0.084, stroke: 0.060, phaseOff: 0.00, alpha: 1.00 },
  ];

  const STEP = 0.5;
  const polylines = waveLayers.map((L) => {
    const by = y0 + L.baseY * h;
    const amp = L.amp * region;
    const pts = [];
    for (let x = x0; x <= x1; x += STEP) {
      const phase = ((x - x0) / w) * Math.PI * 4 + L.phaseOff * Math.PI * 2;
      pts.push([x, by + amp * Math.sin(phase)]);
    }
    return { pts, half: (L.stroke * region) / 2, alpha: L.alpha };
  });

  // Crest highlight: where the front wave is closest to the sun, brush ember
  // across the top of the crest to give a "sun-kissed" feel.
  const front = polylines[polylines.length - 1];
  const crestKiss = (px, py) => {
    // Distance from this pixel to the nearest front-wave crest top
    const idxCenter = Math.round((px - x0) / STEP);
    const win = 6;
    let best = Infinity;
    for (let k = idxCenter - win; k <= idxCenter + win; k++) {
      if (k < 0 || k >= front.pts.length) continue;
      const [wx, wy] = front.pts[k];
      // Only kiss the top half of the stroke
      const dx = px - wx;
      const dy = py - (wy - front.half * 0.6);
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < best) best = d;
    }
    return best;
  };

  const SS = 4;
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      if (px < x0 || px >= x1 || py < y0 || py >= y1) continue;

      // For each layer, accumulate coverage
      const layerCovers = polylines.map(() => 0);
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const fx = px + (sx + 0.5) / SS;
          const fy = py + (sy + 0.5) / SS;
          for (let li = 0; li < polylines.length; li++) {
            const { pts, half } = polylines[li];
            const idxCenter = Math.round((fx - x0) / STEP);
            const win = Math.ceil((half + 2) / STEP);
            let inside = false;
            for (let k = idxCenter - win; k <= idxCenter + win; k++) {
              if (k < 0 || k >= pts.length) continue;
              const dx = fx - pts[k][0];
              const dy = fy - pts[k][1];
              if (dx * dx + dy * dy <= half * half) { inside = true; break; }
            }
            if (inside) layerCovers[li]++;
          }
        }
      }

      const tot = SS * SS;
      // Back-to-front compositing
      for (let li = 0; li < polylines.length; li++) {
        const c = layerCovers[li];
        if (c === 0) continue;
        const a = (c / tot) * polylines[li].alpha;
        const o = (py * size + px) * 4;
        blendRGB(rgba, o, PAPER, a);
      }

      // Sun-kissed crest on the front wave (only where front wave was drawn)
      if (layerCovers[polylines.length - 1] > 0) {
        const d = crestKiss(px, py);
        const kissR = region * 0.10;
        const kissAlpha = (1 - smoothstep(0, kissR, d)) * 0.35;
        if (kissAlpha > 0) {
          const o = (py * size + px) * 4;
          blendRGB(rgba, o, EMBER, kissAlpha);
        }
      }
    }
  }

  return encodePNG(size, size, rgba);
}

// ── Targets ─────────────────────────────────────────────────────────────
const targets = [
  // PWA + Android non-maskable: edge-to-edge so the gradient fills the tile
  { name: "icon-192.png",          size: 192, pad: 0.00 },
  { name: "icon-512.png",          size: 512, pad: 0.00 },
  // Maskable: extra margin so the design survives circular/squircle masks
  { name: "icon-512-maskable.png", size: 512, pad: 0.20 },
  // apple-touch-icon: full-bleed background, iOS rounds corners automatically
  { name: "apple-touch-icon.png",  size: 180, pad: 0.00 },
];

for (const t of targets) {
  const png = drawIcon(t.size, t.pad);
  writeFileSync(join(OUT, t.name), png);
  console.log("wrote", t.name, png.length, "bytes");
}

// resources/icon.png — 1024×1024 source used by `npx @capacitor/assets generate`
// to produce the Android ic_launcher mipmap-* assets for the APK.
const RES = join(ROOT, "resources");
mkdirSync(RES, { recursive: true });
const resPng = drawIcon(1024, 0.12);
writeFileSync(join(RES, "icon.png"), resPng);
console.log("wrote resources/icon.png", resPng.length, "bytes");
