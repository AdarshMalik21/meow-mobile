/**
 * Export a square 1024×1024 app icon from the full Zuro logo.
 * Trims whitespace, scales to ~88% of the canvas, centers on light gray.
 *
 * Usage: node scripts/export-app-icon.mjs
 */
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assets = path.join(__dirname, '..', 'assets');

const SOURCE = path.join(assets, 'zuro-logo-source.png');
const OUTPUT = path.join(assets, 'zuro-icon.png');
const SIZE = 1024;
const FILL = 0.88; // logo fills ~88% of canvas (fixes "too zoomed out")
const BG = '#EEF1F4';

const trimmed = await sharp(SOURCE).trim({ threshold: 15 }).toBuffer({
  resolveWithObject: true,
});

const { width: tw, height: th } = trimmed.info;
const maxDim = Math.round(SIZE * FILL);
const scale = Math.min(maxDim / tw, maxDim / th);
const rw = Math.round(tw * scale);
const rh = Math.round(th * scale);

const resized = await sharp(trimmed.data)
  .resize(rw, rh, { fit: 'fill' })
  .png()
  .toBuffer();

const left = Math.round((SIZE - rw) / 2);
const top = Math.round((SIZE - rh) / 2);

await sharp({
  create: {
    width: SIZE,
    height: SIZE,
    channels: 3,
    background: BG,
  },
})
  .composite([{ input: resized, left, top }])
  .png()
  .toFile(OUTPUT);

const meta = await sharp(OUTPUT).metadata();
console.log(
  `Wrote ${OUTPUT} (${meta.width}×${meta.height}), logo ${rw}×${rh} at (${left},${top})`
);
