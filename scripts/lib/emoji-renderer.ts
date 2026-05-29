import { buildEmojiSvg, convertToWebP } from './image-converter.ts';
import { getSetBackground } from './emoji-map.ts';

const NOTO_BASE = 'https://raw.githubusercontent.com/googlefonts/noto-emoji/main/svg';

/** Convert an emoji character to the Noto Emoji SVG filename codepoint string.
 *  Noto filenames INCLUDE ZWJ (U+200D) but DROP variation selectors (U+FE0F). */
function emojiToNotoFilename(emoji: string): string {
  const codepoints: string[] = [];

  for (const char of [...emoji]) {
    const cp = char.codePointAt(0);
    if (cp === undefined) continue;
    if (cp === 0xfe0f) continue; // drop variation selector-16
    codepoints.push(cp.toString(16).toLowerCase());
  }

  return `emoji_u${codepoints.join('_')}.svg`;
}

/** Fetch Noto Emoji SVG content for the given emoji character. */
async function fetchEmojiSvg(emoji: string): Promise<string> {
  const filename = emojiToNotoFilename(emoji);
  const url = `${NOTO_BASE}/${filename}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Noto Emoji SVG not found for "${emoji}" (${filename}) — HTTP ${res.status}`);
  }
  return res.text();
}

/** Render a Noto Emoji SVG onto a coloured background and save as 400×400 WebP. */
export async function renderEmojiToWebP(
  emoji: string,
  setName: string,
  outputPath: string,
): Promise<void> {
  const svgContent = await fetchEmojiSvg(emoji);
  const bg = getSetBackground(setName);
  const svgBuffer = buildEmojiSvg(svgContent, bg);
  await convertToWebP(svgBuffer, outputPath);
}
