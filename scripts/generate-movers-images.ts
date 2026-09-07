/**
 * Render every Movers picture into `public/assets/images/movers/`.
 *
 *   npm run gen:movers:images
 *   npm run gen:movers:images -- --dry-run
 *   npm run gen:movers:images -- --set=movers-animals
 *   npm run gen:movers:images -- --force     re-render existing files
 *   npm run gen:movers:images -- --only=bat,dolphin
 *
 * Separate from `generate-vocab-images.ts` rather than a `--level` flag on it,
 * because the two levels describe pictures differently: Starters has
 * `EMOJI_MAP` (an emoji or AI_FALLBACK) while Movers has `MOVERS_PICTURES` (a
 * five-way tagged union). One driver switching on a level flag would have to
 * branch on both shapes everywhere. What actually matters for keeping the
 * levels consistent is the *renderers*, and those are shared: this file draws
 * on the same `emoji-renderer`, `image-converter` and `fal-ai-client` the
 * Starters driver uses.
 *
 * Writes a render manifest recording the tier each word was actually drawn
 * with. That is what lets the test suite catch the dangerous case -- a word
 * marked `pictorial: true` in the data whose picture silently came out as a
 * word card because FAL_KEY was missing.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';
import {
  renderEmojiOnBackground,
  renderSceneToWebP,
  renderWordCardToWebP,
} from './lib/movers-renderers.ts';
import { generateViaFalAi } from './lib/fal-ai-client.ts';
import { MOVERS_PICTURES, type PictureSpec } from './lib/movers-pictures.ts';
import { MOVERS_TOPICS, getTopic } from './lib/movers-topics.ts';
import { effectiveKind } from './lib/movers-build.ts';
import { slug } from './lib/word-loader.ts';

const ROOT = resolve(import.meta.dirname, '..');
const DATA_DIR = join(ROOT, 'src/data/yle-movers');
const OUTPUT_DIR = join(ROOT, 'public/assets/images/movers');
const MANIFEST = join(OUTPUT_DIR, '.render-manifest.json');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const force = args.includes('--force');
const setFilter = args.find((a) => a.startsWith('--set='))?.split('=')[1] ?? null;
const onlyArg = args.find((a) => a.startsWith('--only='))?.slice('--only='.length);
const onlyWords = onlyArg ? new Set(onlyArg.split(',').map((w) => w.trim())) : null;

const aiRenderable = Boolean(process.env.FAL_KEY);

interface Target {
  text: string;
  setId: string;
  /** Only words whose picture actually lives in `movers/` need rendering. */
  fileName: string;
}

/**
 * Every Movers word that needs a file of its own.
 *
 * Words reusing a Starters asset point outside this directory, so they are
 * skipped -- re-rendering one would overwrite the Starters picture.
 */
function collectTargets(): Target[] {
  const targets: Target[] = [];
  for (const topic of MOVERS_TOPICS) {
    if (setFilter && topic.id !== setFilter) continue;
    const path = join(DATA_DIR, `${topic.id}.json`);
    if (!existsSync(path)) continue;
    const words: Array<{ text: string; pictureAsset: string }> = JSON.parse(
      readFileSync(path, 'utf-8'),
    );
    for (const word of words) {
      if (!word.pictureAsset.startsWith('/assets/images/movers/')) continue;
      if (onlyWords && !onlyWords.has(word.text)) continue;
      targets.push({ text: word.text, setId: topic.id, fileName: `${slug(word.text)}.webp` });
    }
  }
  return targets;
}

async function render(spec: PictureSpec, target: Target, outputPath: string): Promise<string> {
  const topic = getTopic(target.setId)!;
  const kind = effectiveKind(spec, aiRenderable);

  switch (kind) {
    case 'emoji':
      await renderEmojiOnBackground(
        (spec as { emoji: string }).emoji,
        topic.background,
        outputPath,
      );
      return 'emoji';
    case 'scene': {
      const scene = spec as { subject: string; anchor: string; placement: never };
      await renderSceneToWebP(
        scene.subject,
        scene.anchor,
        scene.placement,
        topic.background,
        outputPath,
      );
      return 'scene';
    }
    case 'ai':
      await generateViaFalAi(target.text, outputPath);
      return 'ai';
    case 'word-card':
      await renderWordCardToWebP(target.text, topic.background, topic.icon, outputPath);
      return 'word-card';
    case 'shared':
      throw new Error(`"${target.text}" is shared and should not have been collected`);
  }
}

async function main(): Promise<number> {
  const targets = collectTargets();
  if (targets.length === 0) {
    console.error('No Movers words to render. Run `npm run gen:movers` first.');
    return 1;
  }

  if (!aiRenderable) {
    const count = Object.values(MOVERS_PICTURES).filter((s) => s.kind === 'ai').length;
    console.warn(
      `  warning: FAL_KEY is not set, so ${count} words render as word cards. ` +
        `They are marked pictorial:false and stay out of picture rounds.`,
    );
  }

  mkdirSync(OUTPUT_DIR, { recursive: true });
  const manifest: Record<string, string> = existsSync(MANIFEST)
    ? JSON.parse(readFileSync(MANIFEST, 'utf-8'))
    : {};

  let generated = 0;
  let skipped = 0;
  const failed: string[] = [];

  console.log(`Rendering ${targets.length} Movers pictures...`);

  for (const target of targets) {
    const spec = MOVERS_PICTURES[target.text];
    if (!spec) {
      failed.push(`${target.text} (no MOVERS_PICTURES entry)`);
      continue;
    }
    const outputPath = join(OUTPUT_DIR, target.fileName);
    if (!force && existsSync(outputPath)) {
      skipped++;
      continue;
    }
    if (dryRun) {
      console.log(`  [${effectiveKind(spec, aiRenderable)}] ${target.setId} / ${target.text}`);
      generated++;
      continue;
    }
    try {
      manifest[target.text] = await render(spec, target, outputPath);
      generated++;
      if (generated % 25 === 0) console.log(`  ${generated} rendered...`);
    } catch (err) {
      failed.push(`${target.text} — ${(err as Error).message.split('\n')[0]}`);
    }
  }

  if (!dryRun) writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);

  console.log('---');
  console.log(`Rendered: ${generated}`);
  console.log(`Skipped (existing): ${skipped}`);
  if (failed.length) {
    console.error(`Failed: ${failed.length}`);
    for (const failure of failed) console.error(`  - ${failure}`);
    return 1;
  }
  return 0;
}

process.exit(await main());
