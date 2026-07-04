/**
 * Renders flat-vector illustrations for the AI_FALLBACK vocabulary words that
 * have no suitable Noto emoji: `sweater`, `back`, `brother`, `sister`.
 *
 * These words are marked AI_FALLBACK in emoji-map.ts. When FAL_KEY is set,
 * `generate-vocab-images.ts` produces fal.ai images for them. When it is NOT
 * set (the usual local case), those words are skipped — so this script provides
 * hand-authored, child-safe, on-brand illustrations instead. The style matches
 * the Noto emoji renders used everywhere else (yellow faces, brown hair, flat
 * colours on the per-set pastel background).
 *
 * Run:  tsx scripts/generate-custom-images.ts
 */
import { join, resolve } from 'path';
import { convertToWebP } from './lib/image-converter.ts';
import { getSetBackground } from './lib/emoji-map.ts';

const OUTPUT_DIR = join(resolve(import.meta.dirname, '..'), 'public/assets/images');

const SKIN = '#F9CA55';
const HAIR = '#6D4C41';
const OUTLINE = '#5C4033';
const EYE = '#3B2B1A';

function bg(set: string): string {
  const c = getSetBackground(set);
  return `rgb(${c.r},${c.g},${c.b})`;
}

/** A boy bust: short hair cap, yellow face, coloured shirt. */
function boy(cx: number, headY: number, shirt: string): string {
  const r = 52;
  return `
  <g stroke="${OUTLINE}" stroke-width="7" stroke-linejoin="round" stroke-linecap="round">
    <path fill="${shirt}" d="M${cx - 74} ${headY + 108} Q${cx - 74} ${headY + 48} ${cx} ${headY + 40} Q${cx + 74} ${headY + 48} ${cx + 74} ${headY + 108} L${cx + 80} ${headY + 175} L${cx - 80} ${headY + 175} Z"/>
    <circle cx="${cx}" cy="${headY}" r="${r}" fill="${SKIN}"/>
    <path fill="${HAIR}" d="M${cx - 50} ${headY - 6} Q${cx - 50} ${headY - 58} ${cx} ${headY - 58} Q${cx + 50} ${headY - 58} ${cx + 50} ${headY - 6} Q${cx + 30} ${headY - 30} ${cx} ${headY - 30} Q${cx - 30} ${headY - 30} ${cx - 50} ${headY - 6} Z"/>
    <circle cx="${cx - 17}" cy="${headY + 4}" r="5.5" fill="${EYE}" stroke="none"/>
    <circle cx="${cx + 17}" cy="${headY + 4}" r="5.5" fill="${EYE}" stroke="none"/>
    <path fill="none" d="M${cx - 15} ${headY + 24} Q${cx} ${headY + 36} ${cx + 15} ${headY + 24}"/>
  </g>`;
}

/** A girl bust: long hair framing the face, yellow face, coloured top. */
function girl(cx: number, headY: number, top: string): string {
  const r = 50;
  return `
  <g stroke="${OUTLINE}" stroke-width="7" stroke-linejoin="round" stroke-linecap="round">
    <path fill="${HAIR}" d="M${cx - 60} ${headY + 6} Q${cx - 64} ${headY - 60} ${cx} ${headY - 62} Q${cx + 64} ${headY - 60} ${cx + 60} ${headY + 6} L${cx + 52} ${headY + 74} Q${cx + 40} ${headY + 40} ${cx + 40} ${headY + 8} Q${cx + 28} ${headY + 34} ${cx} ${headY + 34} Q${cx - 28} ${headY + 34} ${cx - 40} ${headY + 8} Q${cx - 40} ${headY + 40} ${cx - 52} ${headY + 74} Z"/>
    <path fill="${top}" d="M${cx - 74} ${headY + 108} Q${cx - 74} ${headY + 50} ${cx} ${headY + 42} Q${cx + 74} ${headY + 50} ${cx + 74} ${headY + 108} L${cx + 80} ${headY + 175} L${cx - 80} ${headY + 175} Z"/>
    <circle cx="${cx}" cy="${headY}" r="${r}" fill="${SKIN}"/>
    <path fill="${HAIR}" d="M${cx - 50} ${headY - 4} Q${cx - 52} ${headY - 56} ${cx} ${headY - 56} Q${cx + 52} ${headY - 56} ${cx + 50} ${headY - 4} Q${cx + 26} ${headY - 30} ${cx} ${headY - 30} Q${cx - 26} ${headY - 30} ${cx - 50} ${headY - 4} Z"/>
    <circle cx="${cx - 16}" cy="${headY + 4}" r="5.5" fill="${EYE}" stroke="none"/>
    <circle cx="${cx + 16}" cy="${headY + 4}" r="5.5" fill="${EYE}" stroke="none"/>
    <path fill="none" d="M${cx - 14} ${headY + 24} Q${cx} ${headY + 35} ${cx + 14} ${headY + 24}"/>
  </g>`;
}

/** sweater (clothes): a knit crewneck jumper — no Noto sweater emoji exists. */
function sweaterSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <rect width="400" height="400" fill="${bg('clothes')}"/>
  <g stroke="#243A66" stroke-width="9" stroke-linejoin="round" stroke-linecap="round">
    <path fill="#E8544B" d="M158 92 C176 84 224 84 242 92 L300 118 L342 206 C344 214 340 222 332 224 L292 236 C285 238 279 234 277 227 L268 198 L272 318 C272 326 266 332 258 332 L142 332 C134 332 128 326 128 318 L132 198 L123 227 C121 234 115 238 108 236 L68 224 C60 222 56 214 58 206 L100 118 Z"/>
    <path fill="none" d="M160 96 C182 116 218 116 240 96"/>
    <line x1="132" y1="312" x2="268" y2="312"/>
    <g stroke="#B8352E" stroke-width="5" fill="none" opacity="0.85">
      <path d="M175 150 v150"/><path d="M200 145 v170"/><path d="M225 150 v150"/>
    </g>
    <line x1="72" y1="212" x2="94" y2="220" stroke="#B8352E" stroke-width="5"/>
    <line x1="328" y1="212" x2="306" y2="220" stroke="#B8352E" stroke-width="5"/>
  </g>
</svg>`;
}

/** back (body): a child seen from behind — no face, so it reads as "the back". */
function backSvg(): string {
  const shirt = '#46B29D';
  const shirtDark = '#2E8C7A';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <rect width="400" height="400" fill="${bg('body')}"/>
  <g stroke="#243A66" stroke-width="8" stroke-linejoin="round" stroke-linecap="round">
    <path fill="${shirt}" d="M120 210 L86 316 Q84 330 98 332 L120 300 Z"/>
    <path fill="${shirt}" d="M280 210 L314 316 Q316 330 302 332 L280 300 Z"/>
    <path fill="${shirt}" d="M118 214 Q118 182 152 172 L248 172 Q282 182 282 214 L292 356 L108 356 Z"/>
    <path fill="none" stroke="${shirtDark}" stroke-width="7" d="M200 210 L200 344"/>
    <path fill="none" stroke="${shirtDark}" stroke-width="6" d="M168 214 Q150 236 156 262"/>
    <path fill="none" stroke="${shirtDark}" stroke-width="6" d="M232 214 Q250 236 244 262"/>
    <path fill="#EDB98A" d="M182 150 L182 176 Q200 186 218 176 L218 150 Z"/>
    <circle cx="200" cy="112" r="60" fill="${HAIR}"/>
    <path fill="none" stroke="#4A3325" stroke-width="6" d="M200 60 Q176 88 176 122"/>
    <path fill="none" stroke="#4A3325" stroke-width="6" d="M200 60 Q224 88 224 122"/>
  </g>
</svg>`;
}

/** brother (family): two boys — distinct from the single-boy `boy` emoji. */
function brotherSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <rect width="400" height="400" fill="${bg('family')}"/>
  ${boy(258, 202, '#3FA66A')}
  ${boy(142, 214, '#4E7FD4')}
</svg>`;
}

/** sister (family): two girls — distinct from the single-girl `girl` emoji. */
function sisterSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <rect width="400" height="400" fill="${bg('family')}"/>
  ${girl(258, 202, '#9B6FD1')}
  ${girl(142, 214, '#E86AA6')}
</svg>`;
}

const IMAGES: Array<{ word: string; set: string; svg: () => string }> = [
  { word: 'sweater', set: 'clothes', svg: sweaterSvg },
  { word: 'back', set: 'body', svg: backSvg },
  { word: 'brother', set: 'family', svg: brotherSvg },
  { word: 'sister', set: 'family', svg: sisterSvg },
];

async function main() {
  for (const { word, set, svg } of IMAGES) {
    await convertToWebP(Buffer.from(svg()), join(OUTPUT_DIR, `${word}.webp`));
    console.log(`  [done] ${set} / ${word}`);
  }
  console.log(`\nDone: ${IMAGES.length} custom illustrations rendered.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
