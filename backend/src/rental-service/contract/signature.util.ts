// signature.util.ts
// Accepted signature images:
//  • PNG/JPEG data URLs (drawn on the web signing page)
//  • SVG data URLs drawn in the mobile app. SVG can carry scripts, so only the
//    exact shape the app produces is accepted: <svg> with plain <path> strokes.

export const MAX_SIGNATURE = 400_000;

const RASTER_RE = /^data:image\/(png|jpeg);base64,[A-Za-z0-9+/=]+$/;
const SVG_PREFIX = 'data:image/svg+xml;base64,';
const NUM = '\\d{1,5}(?:\\.\\d{1,3})?';
const SVG_RE = new RegExp(
  `^<svg xmlns="http://www\\.w3\\.org/2000/svg" viewBox="0 0 ${NUM} ${NUM}" width="${NUM}" height="${NUM}">` +
    `(?:<path d="[MLQ0-9. -]{1,20000}" fill="none" stroke="#[0-9a-fA-F]{6}" stroke-width="${NUM}" stroke-linecap="round" stroke-linejoin="round"/>){1,300}` +
    `</svg>$`,
);

export function isValidSignature(value: unknown): value is string {
  if (typeof value !== 'string' || !value || value.length > MAX_SIGNATURE) {
    return false;
  }
  if (RASTER_RE.test(value)) return true;
  if (!value.startsWith(SVG_PREFIX)) return false;
  const b64 = value.slice(SVG_PREFIX.length);
  if (!/^[A-Za-z0-9+/=]+$/.test(b64)) return false;
  const xml = Buffer.from(b64, 'base64').toString('utf8');
  return SVG_RE.test(xml);
}
