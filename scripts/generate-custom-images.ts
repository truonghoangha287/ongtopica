/**
 * Renders flat-vector illustrations for the AI_FALLBACK vocabulary words that
 * have no suitable Noto emoji: the four original words (`sweater`, `back`,
 * `brother`, `sister`) plus the ten furniture words (`wardrobe`, `bookcase`,
 * `shelf`, `drawer`, `stool`, `cushion`, `blanket`, `fridge`, `carpet`,
 * `curtain`), for which Noto has no furniture emoji at all.
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
const WOOD = '#C98B4B';
const WOOD_LIGHT = '#DDA96A';
const WOOD_DARK = '#7A4A22';

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

/** wardrobe: a closed two-door cabinet with panelled doors and legs. */
function wardrobeSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <rect width="400" height="400" fill="${bg('furniture')}"/>
  <g stroke="${WOOD_DARK}" stroke-width="9" stroke-linejoin="round" stroke-linecap="round">
    <rect x="94" y="54" width="212" height="278" rx="12" fill="${WOOD}"/>
    <rect x="114" y="76" width="76" height="234" rx="7" fill="${WOOD_LIGHT}"/>
    <rect x="210" y="76" width="76" height="234" rx="7" fill="${WOOD_LIGHT}"/>
    <line x1="200" y1="60" x2="200" y2="326"/>
    <line x1="130" y1="332" x2="130" y2="366"/>
    <line x1="270" y1="332" x2="270" y2="366"/>
  </g>
  <g stroke="${WOOD_DARK}" stroke-width="7" stroke-linecap="round">
    <line x1="180" y1="182" x2="180" y2="216"/>
    <line x1="220" y1="182" x2="220" y2="216"/>
  </g>
</svg>`;
}

/** bookcase: an open frame of three shelves filled with coloured book spines. */
function bookcaseSvg(): string {
  const spine = (x: number, y: number, h: number, fill: string) =>
    `<rect x="${x}" y="${y}" width="20" height="${h}" fill="${fill}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <rect width="400" height="400" fill="${bg('furniture')}"/>
  <g stroke="${WOOD_DARK}" stroke-width="9" stroke-linejoin="round" stroke-linecap="round">
    <rect x="78" y="58" width="244" height="276" rx="10" fill="${WOOD}"/>
    <rect x="100" y="80" width="200" height="232" fill="#F7E9D2"/>
    <line x1="100" y1="157" x2="300" y2="157"/>
    <line x1="100" y1="234" x2="300" y2="234"/>
    <line x1="122" y1="334" x2="122" y2="366"/>
    <line x1="278" y1="334" x2="278" y2="366"/>
  </g>
  <g stroke="${WOOD_DARK}" stroke-width="5" stroke-linejoin="round">
    ${spine(112, 98, 56, '#E8544B')}${spine(136, 90, 64, '#4E7FD4')}${spine(160, 104, 50, '#3FA66A')}${spine(184, 94, 60, '#F2B441')}
    ${spine(112, 176, 55, '#9B6FD1')}${spine(136, 168, 63, '#E86AA6')}${spine(160, 182, 49, '#46B29D')}
    ${spine(112, 252, 58, '#F2B441')}${spine(136, 246, 64, '#E8544B')}${spine(160, 258, 52, '#4E7FD4')}
  </g>
</svg>`;
}

/** shelf: one wall-mounted plank on brackets, holding books and a pot plant. */
function shelfSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <rect width="400" height="400" fill="${bg('furniture')}"/>
  <g stroke="${WOOD_DARK}" stroke-width="9" stroke-linejoin="round" stroke-linecap="round">
    <rect x="62" y="232" width="276" height="28" rx="9" fill="${WOOD}"/>
    <path fill="${WOOD_LIGHT}" d="M104 260 L104 306 L150 260 Z"/>
    <path fill="${WOOD_LIGHT}" d="M296 260 L296 306 L250 260 Z"/>
  </g>
  <g stroke="${WOOD_DARK}" stroke-width="5" stroke-linejoin="round">
    <rect x="112" y="170" width="22" height="62" fill="#E8544B"/>
    <rect x="138" y="162" width="22" height="70" fill="#4E7FD4"/>
    <rect x="164" y="176" width="22" height="56" fill="#3FA66A"/>
  </g>
  <g stroke="${WOOD_DARK}" stroke-width="6" stroke-linejoin="round" stroke-linecap="round">
    <path fill="#D4643C" d="M236 232 L246 196 L292 196 L302 232 Z"/>
    <path fill="#3FA66A" d="M269 196 Q247 176 253 150 Q275 158 275 196 Z"/>
    <path fill="#3FA66A" d="M269 196 Q291 178 287 154 Q265 164 269 196 Z"/>
  </g>
</svg>`;
}

/** drawer: a chest with its middle drawer pulled open, so the word reads
 *  as the drawer itself rather than as the chest. */
function drawerSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <rect width="400" height="400" fill="${bg('furniture')}"/>
  <g stroke="${WOOD_DARK}" stroke-width="9" stroke-linejoin="round" stroke-linecap="round">
    <rect x="96" y="76" width="208" height="248" rx="10" fill="${WOOD}"/>
    <rect x="114" y="94" width="172" height="62" rx="6" fill="${WOOD_LIGHT}"/>
    <rect x="114" y="244" width="172" height="62" rx="6" fill="${WOOD_LIGHT}"/>
    <path fill="#F2D3A6" d="M74 170 L326 170 L302 150 L98 150 Z"/>
    <path fill="#E0B27C" d="M74 170 L326 170 L326 238 L74 238 Z"/>
    <line x1="128" y1="324" x2="128" y2="356"/>
    <line x1="272" y1="324" x2="272" y2="356"/>
  </g>
  <g stroke="${WOOD_DARK}" stroke-width="7" stroke-linecap="round">
    <line x1="170" y1="125" x2="230" y2="125"/>
    <line x1="170" y1="275" x2="230" y2="275"/>
    <line x1="164" y1="204" x2="236" y2="204"/>
  </g>
</svg>`;
}

/** stool: a round wooden seat on three splayed legs with a crossbar. */
function stoolSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <rect width="400" height="400" fill="${bg('furniture')}"/>
  <g stroke="${WOOD_DARK}" stroke-width="9" stroke-linejoin="round" stroke-linecap="round">
    <line x1="128" y1="190" x2="100" y2="336"/>
    <line x1="272" y1="190" x2="300" y2="336"/>
    <line x1="200" y1="200" x2="200" y2="348"/>
  </g>
  <path fill="none" stroke="${WOOD_DARK}" stroke-width="8" stroke-linecap="round" d="M118 268 L200 282 L282 268"/>
  <g stroke="${WOOD_DARK}" stroke-width="9" stroke-linejoin="round" stroke-linecap="round">
    <path fill="${WOOD}" d="M88 164 L88 186 Q88 212 200 212 Q312 212 312 186 L312 164 Z"/>
    <ellipse cx="200" cy="164" rx="112" ry="34" fill="${WOOD_LIGHT}"/>
  </g>
</svg>`;
}

/** cushion: a plump square cushion with corner tassels, on a sofa seat. */
function cushionSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <rect width="400" height="400" fill="${bg('furniture')}"/>
  <path fill="#C9A227" stroke="#8A6A14" stroke-width="9" stroke-linejoin="round" d="M56 310 L344 310 L344 352 L56 352 Z"/>
  <g stroke="#2F5E8C" stroke-width="7" stroke-linecap="round">
    <line x1="110" y1="118" x2="88" y2="96"/>
    <line x1="290" y1="118" x2="312" y2="96"/>
    <line x1="110" y1="292" x2="88" y2="314"/>
    <line x1="290" y1="292" x2="312" y2="314"/>
  </g>
  <g stroke="#2F5E8C" stroke-width="9" stroke-linejoin="round" stroke-linecap="round">
    <path fill="#4E9BD4" d="M110 118 Q200 96 290 118 Q312 200 290 292 Q200 314 110 292 Q88 200 110 118 Z"/>
    <path fill="none" stroke-width="6" d="M142 152 Q200 140 258 152"/>
    <path fill="none" stroke-width="6" d="M142 258 Q200 270 258 258"/>
  </g>
</svg>`;
}

/** blanket: a striped blanket with a scalloped edge, draped over a bed. */
function blanketSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <rect width="400" height="400" fill="${bg('furniture')}"/>
  <g stroke="#5C4033" stroke-width="9" stroke-linejoin="round" stroke-linecap="round">
    <rect x="44" y="128" width="30" height="152" rx="10" fill="${WOOD}"/>
    <rect x="332" y="196" width="26" height="104" rx="9" fill="${WOOD}"/>
    <rect x="70" y="200" width="266" height="58" rx="14" fill="#F4EAD8"/>
    <line x1="86" y1="280" x2="86" y2="330"/>
    <line x1="330" y1="300" x2="330" y2="330"/>
    <rect x="92" y="168" width="92" height="46" rx="20" fill="#FFFFFF"/>
  </g>
  <g stroke="#2F6B4F" stroke-width="9" stroke-linejoin="round" stroke-linecap="round">
    <path fill="#48A56F" d="M186 192 Q262 178 344 192 L344 258 Q330 278 314 258 Q298 238 282 258 Q266 278 250 258 Q234 238 218 258 Q202 278 186 258 Z"/>
    <path fill="none" stroke-width="6" d="M190 214 Q264 200 340 214"/>
    <path fill="none" stroke-width="6" d="M190 234 Q264 220 340 234"/>
  </g>
</svg>`;
}

/** fridge: a two-door fridge-freezer with vertical handles and magnets. */
function fridgeSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <rect width="400" height="400" fill="${bg('furniture')}"/>
  <g stroke="#4A5B6B" stroke-width="9" stroke-linejoin="round" stroke-linecap="round">
    <rect x="112" y="48" width="176" height="292" rx="16" fill="#E4ECF2"/>
    <line x1="112" y1="152" x2="288" y2="152"/>
    <line x1="126" y1="340" x2="126" y2="366"/>
    <line x1="274" y1="340" x2="274" y2="366"/>
  </g>
  <g stroke="#4A5B6B" stroke-width="8" stroke-linecap="round">
    <line x1="256" y1="86" x2="256" y2="126"/>
    <line x1="256" y1="180" x2="256" y2="242"/>
  </g>
  <g stroke="#4A5B6B" stroke-width="5" stroke-linejoin="round">
    <rect x="140" y="196" width="30" height="30" rx="5" fill="#E8544B"/>
    <rect x="140" y="240" width="30" height="30" rx="5" fill="#F2B441"/>
    <rect x="184" y="218" width="30" height="30" rx="5" fill="#4E7FD4"/>
  </g>
</svg>`;
}

/** carpet: a bordered rug in perspective on floorboards, with a fringed edge.
 *  Deliberately unlike `blanket`: on the floor, trapezoid, fringed. */
function carpetSvg(): string {
  const fringe = (x1: number, x2: number) =>
    `<line x1="${x1}" y1="322" x2="${x2}" y2="346"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <rect width="400" height="400" fill="${bg('furniture')}"/>
  <g stroke="#B08040" stroke-width="6" stroke-linecap="round" opacity="0.5">
    <line x1="36" y1="150" x2="364" y2="150"/>
    <line x1="36" y1="205" x2="364" y2="205"/>
    <line x1="36" y1="260" x2="364" y2="260"/>
    <line x1="36" y1="315" x2="364" y2="315"/>
  </g>
  <g stroke="#8C2F3E" stroke-width="9" stroke-linejoin="round" stroke-linecap="round">
    <path fill="#D4485C" d="M52 316 L118 148 L282 148 L348 316 Z"/>
    <path fill="none" stroke="#F2D3A6" stroke-width="8" d="M84 300 L134 170 L266 170 L316 300 Z"/>
    <path fill="#F2D3A6" d="M200 196 L246 246 L200 296 L154 246 Z"/>
  </g>
  <g stroke="#8C2F3E" stroke-width="7" stroke-linecap="round">
    ${fringe(64, 58)}${fringe(106, 102)}${fringe(150, 148)}${fringe(200, 200)}${fringe(250, 252)}${fringe(294, 298)}${fringe(336, 342)}
  </g>
</svg>`;
}

/** curtain: two drapes on a rod, framing a window. */
function curtainSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <rect width="400" height="400" fill="${bg('furniture')}"/>
  <g stroke="#5C4033" stroke-width="9" stroke-linejoin="round" stroke-linecap="round">
    <rect x="122" y="104" width="156" height="196" rx="6" fill="#BFE3F5"/>
    <line x1="200" y1="104" x2="200" y2="300"/>
    <line x1="122" y1="202" x2="278" y2="202"/>
  </g>
  <g stroke="#7A2E3A" stroke-width="9" stroke-linejoin="round" stroke-linecap="round">
    <path fill="#D4485C" d="M96 96 Q132 150 118 214 Q104 278 130 330 L84 330 Q64 262 76 194 Q88 126 96 96 Z"/>
    <path fill="#D4485C" d="M304 96 Q268 150 282 214 Q296 278 270 330 L316 330 Q336 262 324 194 Q312 126 304 96 Z"/>
  </g>
  <g stroke="#5C4033" stroke-width="9" stroke-linejoin="round" stroke-linecap="round">
    <line x1="66" y1="92" x2="334" y2="92"/>
    <circle cx="58" cy="92" r="11" fill="${WOOD}"/>
    <circle cx="342" cy="92" r="11" fill="${WOOD}"/>
  </g>
</svg>`;
}

const IMAGES: Array<{ word: string; set: string; svg: () => string }> = [
  { word: 'sweater', set: 'clothes', svg: sweaterSvg },
  { word: 'back', set: 'body', svg: backSvg },
  { word: 'brother', set: 'family', svg: brotherSvg },
  { word: 'sister', set: 'family', svg: sisterSvg },
  { word: 'wardrobe', set: 'furniture', svg: wardrobeSvg },
  { word: 'bookcase', set: 'furniture', svg: bookcaseSvg },
  { word: 'shelf', set: 'furniture', svg: shelfSvg },
  { word: 'drawer', set: 'furniture', svg: drawerSvg },
  { word: 'stool', set: 'furniture', svg: stoolSvg },
  { word: 'cushion', set: 'furniture', svg: cushionSvg },
  { word: 'blanket', set: 'furniture', svg: blanketSvg },
  { word: 'fridge', set: 'furniture', svg: fridgeSvg },
  { word: 'carpet', set: 'furniture', svg: carpetSvg },
  { word: 'curtain', set: 'furniture', svg: curtainSvg },
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
