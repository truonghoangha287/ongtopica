/**
 * The two picture tiers Movers needs that Starters never did.
 *
 * Starters is almost entirely concrete nouns, so one emoji per word was enough.
 * Movers adds position words and a long tail of abstractions, which need
 * something else:
 *
 *   scene      two emoji arranged to show a relationship. `above` is a cat over
 *              a box, `into` is a cat entering one. A single glyph cannot say
 *              "above", but two placed glyphs can, and it reuses the Noto
 *              pipeline that already works rather than needing an image model.
 *
 *   word card  the word itself, set in large type on its topic colour. The only
 *              honest option for `because` or `Friday`. Such a card *is* the
 *              spelling, which is why words that get one are marked
 *              `pictorial: false` and kept out of every activity whose answer is
 *              that spelling.
 */
import { buildEmojiSvg, convertToWebP, IMAGE_SIZE } from './image-converter.ts';
import { fetchEmojiSvg } from './emoji-renderer.ts';

/**
 * Only arrangements that a child can actually tell apart.
 *
 * A wider set was tried -- inside, outside, near, opposite, into, out-of, up,
 * down, top, bottom, around, along -- and most of them rendered as the same
 * picture: two emoji side by side. Words that share a picture become
 * indistinguishable answers in a picture round, so those are word cards now and
 * the placements are gone rather than left as traps.
 */
export type ScenePlacement =
  | 'above'
  | 'below'
  /** Two equal glyphs side by side, for compounds: `swimming pool`, `film star`. */
  | 'pair';

type Box = { x: number; y: number; size: number };

const PAD = Math.round(IMAGE_SIZE * 0.08);
/** Drawable width once the card's padding is taken off. */
const FULL = IMAGE_SIZE - PAD * 2;
const BIG = Math.round(FULL * 0.44);
const SMALL = Math.round(FULL * 0.34);
const MID = Math.round(IMAGE_SIZE / 2);

const centred = (size: number, y: number): Box => ({ x: MID - size / 2, y, size });

/**
 * Where each placement puts the subject and the anchor.
 *
 * The anchor is the thing being related to and stays put; the subject moves.
 * Arrows are avoided deliberately -- an arrow is a symbol a child has to be
 * taught, whereas a cat sitting on top of a box needs no explanation.
 */
const PLACEMENTS: Record<ScenePlacement, { subject: Box; anchor: Box }> = {
  above: { subject: centred(SMALL, PAD), anchor: centred(BIG, IMAGE_SIZE - PAD - BIG) },
  below: { subject: centred(SMALL, IMAGE_SIZE - PAD - SMALL), anchor: centred(BIG, PAD) },
  // Neither glyph is subordinate here: a compound is both ideas at once.
  pair: {
    subject: { x: MID + 6, y: MID - BIG / 2, size: BIG },
    anchor: { x: MID - 6 - BIG, y: MID - BIG / 2, size: BIG },
  },
};

const embed = (svg: string, box: Box) =>
  `<image href="data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}" ` +
  `x="${box.x}" y="${box.y}" width="${box.size}" height="${box.size}"/>`;

const bgHex = (bg: { r: number; g: number; b: number }) => `rgb(${bg.r},${bg.g},${bg.b})`;

/**
 * Render a single emoji on a given background.
 *
 * `renderEmojiToWebP` resolves its colour through `getSetBackground(setName)`,
 * which only knows the Starters set names -- every `movers-*` id fell through
 * to the default grey. Movers topics carry their own colour, so it is passed in.
 */
export async function renderEmojiOnBackground(
  emoji: string,
  bg: { r: number; g: number; b: number },
  outputPath: string,
): Promise<void> {
  const svg = await fetchEmojiSvg(emoji);
  await convertToWebP(buildEmojiSvg(svg, bg), outputPath);
}

/** Render two emoji arranged to show a spatial relationship. */
export async function renderSceneToWebP(
  subjectEmoji: string,
  anchorEmoji: string,
  placement: ScenePlacement,
  bg: { r: number; g: number; b: number },
  outputPath: string,
): Promise<void> {
  const [subjectSvg, anchorSvg] = await Promise.all([
    fetchEmojiSvg(subjectEmoji),
    fetchEmojiSvg(anchorEmoji),
  ]);
  const { subject, anchor } = PLACEMENTS[placement];

  // The anchor is drawn first so a contained subject lands on top of it.
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${IMAGE_SIZE}" height="${IMAGE_SIZE}">
  <rect width="${IMAGE_SIZE}" height="${IMAGE_SIZE}" fill="${bgHex(bg)}"/>
  ${embed(anchorSvg, anchor)}
  ${embed(subjectSvg, subject)}
</svg>`;

  await convertToWebP(Buffer.from(svg), outputPath);
}

const BASE_FONT = 96;
const APPROX_GLYPH_RATIO = 0.58;

/**
 * Render the word itself as a card.
 *
 * `font-family` is pinned to faces present on every machine: sharp rasterises
 * SVG text through the system fontconfig, so an unpinned stack would render
 * different bytes on a different machine and break the generator's idempotency
 * check for no visible reason.
 */
export async function renderWordCardToWebP(
  text: string,
  bg: { r: number; g: number; b: number },
  topicIcon: string,
  outputPath: string,
): Promise<void> {
  const iconSvg = await fetchEmojiSvg(topicIcon);
  const iconSize = Math.round(IMAGE_SIZE * 0.16);

  // Shrink long words to fit rather than letting them run off the card.
  const estimated = text.length * BASE_FONT * APPROX_GLYPH_RATIO;
  const fontSize = Math.min(BASE_FONT, Math.floor((BASE_FONT * FULL) / estimated));

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${IMAGE_SIZE}" height="${IMAGE_SIZE}">
  <rect width="${IMAGE_SIZE}" height="${IMAGE_SIZE}" fill="${bgHex(bg)}"/>
  ${embed(iconSvg, { x: MID - iconSize / 2, y: PAD, size: iconSize })}
  <text x="${MID}" y="${Math.round(IMAGE_SIZE * 0.62)}" text-anchor="middle"
        font-family="Helvetica, Arial, sans-serif" font-weight="bold"
        font-size="${fontSize}" fill="#2b2b2b">${escapeXml(text)}</text>
</svg>`;

  await convertToWebP(Buffer.from(svg), outputPath);
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
