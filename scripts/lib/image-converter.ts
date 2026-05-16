import sharp from 'sharp';

export const IMAGE_SIZE = 400;
export const WEBP_QUALITY = 80;

/** Convert any image buffer (PNG/JPG/SVG) to a 400×400 WebP file. */
export async function convertToWebP(inputBuffer: Buffer, outputPath: string): Promise<void> {
  await sharp(inputBuffer)
    .resize(IMAGE_SIZE, IMAGE_SIZE, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .webp({ quality: WEBP_QUALITY })
    .toFile(outputPath);
}

/** Build a composite SVG: emoji SVG centered on a colored background square. */
export function buildEmojiSvg(
  emojiSvgContent: string,
  bg: { r: number; g: number; b: number },
  size = IMAGE_SIZE,
): Buffer {
  const pad = Math.round(size * 0.1); // 10% padding each side
  const innerSize = size - pad * 2;
  const bgHex = `rgb(${bg.r},${bg.g},${bg.b})`;
  const encoded = Buffer.from(emojiSvgContent).toString('base64');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
  <rect width="${size}" height="${size}" fill="${bgHex}"/>
  <image href="data:image/svg+xml;base64,${encoded}" x="${pad}" y="${pad}" width="${innerSize}" height="${innerSize}"/>
</svg>`;

  return Buffer.from(svg);
}
