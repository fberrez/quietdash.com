/**
 * Atkinson dithering: the look QuietDash ships on (D8/D10, brand pillar 2).
 * Spreads 6/8 of the quantization error to neighbours, giving the crisp,
 * slightly-blown-out highlights that read well on 1-bit e-ink.
 *
 * Input: grayscale luminance 0..255. Output: bilevel, each pixel 0 or 255.
 */
// Pixels whose ORIGINAL luminance is within this of pure black/white are treated
// as flat UI (solid fills, background, crisp text) and snap hard, immune to error
// bleeding in from neighbours. Without this, the error from a glyph's
// anti-aliased edges diffuses into the adjacent solid-black fill and pushes
// interior pixels over the threshold — punching white holes into solid text, so
// "black" reads as ~88% dark grey on a 1-bit panel. True midtones (photos,
// gradients) fall outside the band and still get the Atkinson texture (D8 brand).
const FLAT_BAND = 24;

export function atkinsonDither(gray: Float32Array, width: number, height: number): Uint8Array {
  const buf = Float32Array.from(gray);
  const out = new Uint8Array(width * height);

  const spread = (x: number, y: number, err: number) => {
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    const idx = y * width + x;
    buf[idx] = buf[idx]! + err;
  };

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      // Flat near-black / near-white snaps from its original value and absorbs
      // (does not re-emit) any error bled in from anti-aliased edges, keeping
      // solid fills and text genuinely solid.
      const orig = gray[i]!;
      if (orig <= FLAT_BAND) {
        out[i] = 0;
        continue;
      }
      if (orig >= 255 - FLAT_BAND) {
        out[i] = 255;
        continue;
      }
      const old = buf[i]!;
      const next = old < 128 ? 0 : 255;
      out[i] = next;
      const err = (old - next) / 8;
      spread(x + 1, y, err);
      spread(x + 2, y, err);
      spread(x - 1, y + 1, err);
      spread(x, y + 1, err);
      spread(x + 1, y + 1, err);
      spread(x, y + 2, err);
    }
  }
  return out;
}
