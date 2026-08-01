/**
 * Export app icon assets from the full Zuro logo source.
 * Crops out the "Zuro" wordmark; outputs icon-only PNGs.
 *
 * Usage: node scripts/export-app-icon.mjs
 */
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assets = path.join(__dirname, '..', 'assets');

const SOURCE = path.join(assets, 'zuro-logo-source.png');
const OUTPUT_ICON = path.join(assets, 'zuro-icon.png');
const OUTPUT_MARK = path.join(assets, 'zuro-logo-mark.png');
const SIZE = 1024;
const FILL = 0.88;
const BG = '#EEF1F4';
/** Top portion of trimmed logo — excludes wordmark below the Z mark */
const ICON_CROP_RATIO = 0.68;

const trimmed = await sharp(SOURCE).trim({ threshold: 15 }).toBuffer({
  resolveWithObject: true,
});

const { width: tw, height: th } = trimmed.info;
const cropHeight = Math.max(1, Math.round(th * ICON_CROP_RATIO));

const markOnly = await sharp(trimmed.data)
  .extract({ left: 0, top: 0, width: tw, height: cropHeight })
  .png()
  .toBuffer({ resolveWithObject: true });

const { width: mw, height: mh } = markOnly.info;
const maxDim = Math.round(SIZE * FILL);
const scale = Math.min(maxDim / mw, maxDim / mh);
const rw = Math.round(mw * scale);
const rh = Math.round(mh * scale);

const resizedMark = await sharp(markOnly.data)
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
  .composite([{ input: resizedMark, left, top }])
  .png()
  .toFile(OUTPUT_ICON);

await sharp(resizedMark).png().toFile(OUTPUT_MARK);

const meta = await sharp(OUTPUT_ICON).metadata();
console.log(
  `Wrote ${OUTPUT_ICON} (${meta.width}×${meta.height}), mark ${rw}×${rh} at (${left},${top})`
);
console.log(`Wrote ${OUTPUT_MARK} (${rw}×${rh}, transparent)`);
