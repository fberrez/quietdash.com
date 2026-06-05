/**
 * Atkinson dithering: the look QuietDash ships on (D8/D10, brand pillar 2).
 * Spreads 6/8 of the quantization error to neighbours, giving the crisp,
 * slightly-blown-out highlights that read well on 1-bit e-ink.
 *
 * Input: grayscale luminance 0..255. Output: bilevel, each pixel 0 or 255.
 */
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
