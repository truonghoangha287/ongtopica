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
import { slug } from './lib/word-loader.ts';

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

// ── 2026 Starters wordlist audit ─────────────────────────────────────────────
// Words on the official Pre A1 Starters list with no usable Noto emoji. Several
// exist as emoji but are already spoken for by another word (📷 is `camera`,
// 🏫 is `school`, 🛋️ is `sofa`), so they are drawn instead of shared.

const PAPER = '#FFFDF5';
const INK = '#243A66';

/**
 * tail (animals): a cat's hindquarters with the tail curling up and away. The
 * body is deliberately faceless and half out of frame so the tail is the
 * subject rather than "a cat".
 */
function tailSvg(): string {
  const fur = '#E8913C';
  const furDark = '#B9661F';
  const outline = '#5C3A1A';
  const curve = 'M212 252 C300 258 342 214 334 160 C328 120 300 96 270 104';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <rect width="400" height="400" fill="${bg('animals')}"/>
  <g stroke-linecap="round" fill="none">
    <path stroke="${outline}" stroke-width="50" d="${curve}"/>
    <path stroke="${fur}" stroke-width="34" d="${curve}"/>
  </g>
  <g stroke="${outline}" stroke-width="9" stroke-linejoin="round" stroke-linecap="round">
    <ellipse cx="118" cy="264" rx="118" ry="92" fill="${fur}"/>
    <ellipse cx="176" cy="336" rx="52" ry="26" fill="${fur}"/>
  </g>
  <g stroke="${furDark}" stroke-width="11" stroke-linecap="round" fill="none">
    <path d="M250 266 Q256 248 252 232"/>
    <path d="M300 246 Q316 230 318 210"/>
    <path d="M330 178 Q328 152 312 136"/>
  </g>
</svg>`;
}

/** cousin (family): a boy and a girl together — brother/sister are same-sex pairs. */
function cousinSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <rect width="400" height="400" fill="${bg('family')}"/>
  ${girl(258, 202, '#E8A33D')}
  ${boy(142, 214, '#3FA6A0')}
</svg>`;
}

/** meatballs (food): three browned balls on a plate of sauce. */
function meatballsSvg(): string {
  const meat = '#8C4A24';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <rect width="400" height="400" fill="${bg('food')}"/>
  <g stroke="${INK}" stroke-width="9" stroke-linejoin="round" stroke-linecap="round">
    <ellipse cx="200" cy="238" rx="152" ry="98" fill="#FFFFFF"/>
    <ellipse cx="200" cy="238" rx="112" ry="70" fill="#D14A32"/>
  </g>
  <g stroke="#4A2410" stroke-width="9">
    <circle cx="156" cy="222" r="42" fill="${meat}"/>
    <circle cx="244" cy="216" r="40" fill="${meat}"/>
    <circle cx="200" cy="266" r="42" fill="${meat}"/>
  </g>
</svg>`;
}

/** armchair (home): a padded chair with two arms — `chair` is the plain 🪑. */
function armchairSvg(): string {
  const fabric = '#4E7FD4';
  const fabricDark = '#3A62A8';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <rect width="400" height="400" fill="${bg('home')}"/>
  <g stroke="${INK}" stroke-width="9" stroke-linejoin="round" stroke-linecap="round">
    <rect x="104" y="96" width="192" height="150" rx="30" fill="${fabric}"/>
    <rect x="70" y="180" width="60" height="118" rx="26" fill="${fabricDark}"/>
    <rect x="270" y="180" width="60" height="118" rx="26" fill="${fabricDark}"/>
    <rect x="104" y="222" width="192" height="82" rx="22" fill="${fabric}"/>
    <line x1="112" y1="304" x2="112" y2="344"/>
    <line x1="288" y1="304" x2="288" y2="344"/>
  </g>
</svg>`;
}

/**
 * living room (home): a whole room — framed picture, sofa and standing lamp on
 * a floor. `sofa` on its own is already 🛋️, so this has to read as the room.
 */
function livingRoomSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <rect width="400" height="400" fill="${bg('home')}"/>
  <rect x="0" y="286" width="400" height="114" fill="#C98B4B"/>
  <g stroke="${INK}" stroke-width="8" stroke-linejoin="round" stroke-linecap="round">
    <line x1="0" y1="286" x2="400" y2="286"/>
    <rect x="118" y="42" width="128" height="96" rx="8" fill="#BFE3F5"/>
    <path fill="#3FA66A" d="M126 138 L172 92 L218 138 Z"/>
    <circle cx="216" cy="76" r="14" fill="#F2C94C"/>
    <line x1="330" y1="286" x2="330" y2="212"/>
    <path fill="#F2C94C" d="M296 212 L364 212 L348 160 L312 160 Z"/>
    <path fill="#E8544B" d="M64 208 Q64 186 86 186 L250 186 Q272 186 272 208 L272 286 L64 286 Z"/>
    <rect x="44" y="216" width="34" height="70" rx="13" fill="#C43F38"/>
    <rect x="258" y="216" width="34" height="70" rx="13" fill="#C43F38"/>
    <line x1="88" y1="238" x2="248" y2="238"/>
  </g>
</svg>`;
}

/** hall (home): a corridor with doors receding to the back. */
function hallSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <rect width="400" height="400" fill="${bg('home')}"/>
  <g stroke="${INK}" stroke-width="8" stroke-linejoin="round" stroke-linecap="round">
    <path fill="#E8D9BC" d="M0 400 L128 216 L272 216 L400 400 Z"/>
    <path fill="#F5EBD8" d="M0 0 L128 184 L272 184 L400 0 Z"/>
    <path fill="#EADFC8" d="M0 0 L128 184 L128 216 L0 400 Z"/>
    <path fill="#EADFC8" d="M400 0 L272 184 L272 216 L400 400 Z"/>
    <rect x="128" y="184" width="144" height="32" fill="#DCCDAF"/>
    <path fill="${WOOD}" d="M28 132 L96 194 L96 292 L28 348 Z"/>
    <path fill="${WOOD}" d="M372 132 L304 194 L304 292 L372 348 Z"/>
    <path fill="#BFE3F5" d="M170 196 L230 196 L230 268 L170 268 Z"/>
    <circle cx="88" cy="248" r="8" fill="${INK}"/>
    <circle cx="312" cy="248" r="8" fill="${INK}"/>
  </g>
</svg>`;
}

/** mat (home): a small bristly doormat, rectangular and flat on the floor. */
function matSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <rect width="400" height="400" fill="${bg('home')}"/>
  <g stroke="#4A3325" stroke-width="9" stroke-linejoin="round" stroke-linecap="round">
    <path fill="#A9713C" d="M62 264 L134 152 L266 152 L338 264 Z"/>
    <path fill="#C98B4B" d="M92 246 L152 172 L248 172 L308 246 Z"/>
    <line x1="140" y1="200" x2="260" y2="200" stroke="#7A4A22" stroke-width="8"/>
    <line x1="120" y1="224" x2="280" y2="224" stroke="#7A4A22" stroke-width="8"/>
  </g>
  <g stroke="#7A4A22" stroke-width="7" stroke-linecap="round">
    <line x1="62" y1="264" x2="52" y2="280"/><line x1="108" y1="264" x2="102" y2="282"/>
    <line x1="154" y1="264" x2="152" y2="282"/><line x1="200" y1="264" x2="200" y2="284"/>
    <line x1="246" y1="264" x2="248" y2="282"/><line x1="292" y1="264" x2="298" y2="282"/>
    <line x1="338" y1="264" x2="348" y2="280"/>
  </g>
</svg>`;
}

/** rug (home): an oval fringed rug — `carpet` is the big rectangular one. */
function rugSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <rect width="400" height="400" fill="${bg('home')}"/>
  <g stroke="#5C2E3A" stroke-width="9" stroke-linejoin="round" stroke-linecap="round">
    <ellipse cx="200" cy="212" rx="152" ry="104" fill="#C1436B"/>
    <ellipse cx="200" cy="212" rx="108" ry="72" fill="#E8A33D"/>
    <ellipse cx="200" cy="212" rx="62" ry="40" fill="#3FA6A0"/>
  </g>
  <g stroke="#C1436B" stroke-width="7" stroke-linecap="round">
    <line x1="200" y1="316" x2="200" y2="342"/><line x1="140" y1="310" x2="134" y2="336"/>
    <line x1="260" y1="310" x2="266" y2="336"/><line x1="86" y1="286" x2="70" y2="308"/>
    <line x1="314" y1="286" x2="330" y2="308"/>
  </g>
</svg>`;
}

/** board (school): a classroom board on legs with a chalk ledge. */
function boardSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <rect width="400" height="400" fill="${bg('school')}"/>
  <g stroke="#3B2B1A" stroke-width="9" stroke-linejoin="round" stroke-linecap="round">
    <rect x="52" y="58" width="296" height="216" rx="10" fill="${WOOD}"/>
    <rect x="72" y="78" width="256" height="176" rx="6" fill="#2E6B52"/>
    <rect x="52" y="274" width="296" height="20" rx="8" fill="${WOOD_LIGHT}"/>
    <line x1="104" y1="294" x2="82" y2="356"/>
    <line x1="296" y1="294" x2="318" y2="356"/>
  </g>
  <g stroke="#FFFFFF" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" fill="none">
    <path d="M104 200 L132 128 L160 200"/><path d="M114 178 L150 178"/>
    <path d="M188 128 L188 200"/>
    <path d="M188 128 Q228 128 228 150 Q228 164 188 164"/>
    <path d="M188 164 Q232 164 232 182 Q232 200 188 200"/>
    <path d="M300 146 Q286 126 266 134 Q248 142 248 164 Q248 190 268 196 Q290 202 300 184"/>
  </g>
</svg>`;
}

/** classroom (school): desks and chairs facing a board — `school` is 🏫. */
function classroomSvg(): string {
  /** A desk with its chair tucked in behind, drawn from the side-front. */
  const deskAndChair = (x: number) => `
    <path fill="#C43F38" d="M${x + 96} 252 L${x + 128} 252 L${x + 128} 330 L${x + 96} 330 Z"/>
    <rect x="${x + 74}" y="316" width="54" height="14" rx="5" fill="#E8544B"/>
    <rect x="${x + 4}" y="264" width="112" height="18" rx="7" fill="${WOOD_LIGHT}"/>
    <line x1="${x + 20}" y1="282" x2="${x + 20}" y2="342"/>
    <line x1="${x + 100}" y1="282" x2="${x + 100}" y2="342"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <rect width="400" height="400" fill="${bg('school')}"/>
  <g stroke="#3B2B1A" stroke-width="8" stroke-linejoin="round" stroke-linecap="round">
    <rect x="86" y="38" width="228" height="140" rx="8" fill="${WOOD}"/>
    <rect x="102" y="54" width="196" height="108" rx="5" fill="#2E6B52"/>
    <path fill="none" stroke="#FFFFFF" stroke-width="9" d="M130 90 L200 90 M130 126 L246 126"/>
    ${deskAndChair(26)}
    ${deskAndChair(216)}
  </g>
</svg>`;
}

/** tablet (school): a flat slab of screen — `phone` is 📱, `computer` is 💻. */
function tabletSvg(): string {
  const app = (x: number, y: number, fill: string) =>
    `<rect x="${x}" y="${y}" width="42" height="42" rx="10" fill="${fill}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <rect width="400" height="400" fill="${bg('school')}"/>
  <g stroke="${INK}" stroke-width="9" stroke-linejoin="round" stroke-linecap="round">
    <rect x="66" y="44" width="268" height="312" rx="26" fill="#4A4F5C"/>
    <rect x="92" y="78" width="216" height="228" rx="8" fill="#BFE3F5"/>
    <circle cx="200" cy="332" r="15" fill="#2E323C"/>
  </g>
  <g stroke="${INK}" stroke-width="6">
    ${app(118, 104, '#E8544B')}${app(178, 104, '#F2C94C')}${app(238, 104, '#3FA66A')}
    ${app(118, 168, '#4E7FD4')}${app(178, 168, '#9B6FD1')}${app(238, 168, '#E86AA6')}
  </g>
</svg>`;
}

/** drawing (school): a crayon drawing on paper, crayon still lying on it. */
function drawingSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <rect width="400" height="400" fill="${bg('school')}"/>
  <g stroke="${INK}" stroke-width="9" stroke-linejoin="round" stroke-linecap="round">
    <rect x="72" y="54" width="256" height="268" rx="10" fill="${PAPER}"/>
  </g>
  <g stroke="#C43F38" stroke-width="10" stroke-linejoin="round" stroke-linecap="round" fill="none">
    <path d="M124 236 L124 168 L200 112 L276 168 L276 236 Z"/>
    <path d="M180 236 L180 188 L222 188 L222 236"/>
  </g>
  <g stroke="#E8A33D" stroke-width="9" stroke-linecap="round" fill="none">
    <circle cx="268" cy="96" r="20"/>
  </g>
  <g stroke="${INK}" stroke-width="8" stroke-linejoin="round" stroke-linecap="round">
    <rect x="112" y="286" width="140" height="26" rx="8" fill="#3FA66A" transform="rotate(-8 182 299)"/>
    <path fill="#2E7A4E" d="M246 276 L286 292 L246 308 Z" transform="rotate(-8 266 292)"/>
  </g>
</svg>`;
}

/** painting (school): a canvas on an easel with a brush. */
function paintingSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <rect width="400" height="400" fill="${bg('school')}"/>
  <g stroke="#5C4033" stroke-width="9" stroke-linejoin="round" stroke-linecap="round">
    <line x1="200" y1="240" x2="200" y2="366"/>
    <line x1="104" y1="366" x2="196" y2="180"/>
    <line x1="296" y1="366" x2="204" y2="180"/>
    <rect x="82" y="72" width="236" height="180" rx="8" fill="${PAPER}"/>
  </g>
  <g stroke="${INK}" stroke-width="7" stroke-linejoin="round">
    <path fill="#4E9BD4" d="M96 86 L304 86 L304 176 L96 176 Z"/>
    <path fill="#3FA66A" d="M96 176 L304 176 L304 238 L96 238 Z"/>
    <circle cx="252" cy="122" r="24" fill="#F2C94C"/>
  </g>
  <g stroke="${INK}" stroke-width="8" stroke-linejoin="round" stroke-linecap="round">
    <line x1="286" y1="316" x2="344" y2="268"/>
    <path fill="#C43F38" d="M270 330 L296 306 L282 292 L256 316 Z"/>
  </g>
</svg>`;
}

/** photo (school): a printed photo with a white border — `camera` is 📷. */
function photoSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <rect width="400" height="400" fill="${bg('school')}"/>
  <g stroke="${INK}" stroke-width="9" stroke-linejoin="round" stroke-linecap="round">
    <rect x="66" y="58" width="268" height="290" rx="10" fill="${PAPER}" transform="rotate(-5 200 200)"/>
  </g>
  <g transform="rotate(-5 200 200)">
    <g stroke="${INK}" stroke-width="8" stroke-linejoin="round">
      <rect x="90" y="82" width="220" height="184" fill="#7FC7EA"/>
      <circle cx="256" cy="126" r="26" fill="#F2C94C"/>
      <path fill="#3FA66A" d="M90 266 L164 178 L228 266 Z"/>
      <path fill="#2E7A4E" d="M168 266 L232 190 L310 266 Z"/>
    </g>
  </g>
</svg>`;
}

/** poster (school): a pinned-up sheet with a big star. */
function posterSvg(): string {
  const tack = (x: number, y: number) =>
    `<circle cx="${x}" cy="${y}" r="12" fill="#E8544B" stroke="${INK}" stroke-width="7"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <rect width="400" height="400" fill="${bg('school')}"/>
  <g stroke="${INK}" stroke-width="9" stroke-linejoin="round" stroke-linecap="round">
    <rect x="78" y="46" width="244" height="308" rx="8" fill="#9B6FD1"/>
    <path fill="#F2C94C" d="M200 108 L226 172 L294 178 L242 222 L258 288 L200 252 L142 288 L158 222 L106 178 L174 172 Z"/>
    <line x1="126" y1="322" x2="274" y2="322" stroke="${PAPER}" stroke-width="10"/>
  </g>
  ${tack(102, 70)}${tack(298, 70)}${tack(102, 330)}${tack(298, 330)}
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
  // 2026 Starters wordlist audit
  { word: 'tail', set: 'animals', svg: tailSvg },
  { word: 'cousin', set: 'family', svg: cousinSvg },
  { word: 'meatballs', set: 'food', svg: meatballsSvg },
  { word: 'armchair', set: 'home', svg: armchairSvg },
  { word: 'living room', set: 'home', svg: livingRoomSvg },
  { word: 'hall', set: 'home', svg: hallSvg },
  { word: 'mat', set: 'home', svg: matSvg },
  { word: 'rug', set: 'home', svg: rugSvg },
  { word: 'board', set: 'school', svg: boardSvg },
  { word: 'classroom', set: 'school', svg: classroomSvg },
  { word: 'tablet', set: 'school', svg: tabletSvg },
  { word: 'drawing', set: 'school', svg: drawingSvg },
  { word: 'painting', set: 'school', svg: paintingSvg },
  { word: 'photo', set: 'school', svg: photoSvg },
  { word: 'poster', set: 'school', svg: posterSvg },
];

async function main() {
  for (const { word, set, svg } of IMAGES) {
    await convertToWebP(Buffer.from(svg()), join(OUTPUT_DIR, `${slug(word)}.webp`));
    console.log(`  [done] ${set} / ${word}`);
  }
  console.log(`\nDone: ${IMAGES.length} custom illustrations rendered.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
