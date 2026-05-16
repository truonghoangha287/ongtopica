import { existsSync, mkdirSync } from 'fs';
import { join, resolve } from 'path';
import { renderEmojiToWebP } from './lib/emoji-renderer.ts';
import { generateViaFalAi } from './lib/fal-ai-client.ts';
import { EMOJI_MAP, AI_FALLBACK, WORD_SET } from './lib/emoji-map.ts';
import { patchPictureAsset } from './lib/word-loader.ts';

const ROOT = resolve(import.meta.dirname, '..');
const DATA_DIR = join(ROOT, 'src/data/yle-starters');
const OUTPUT_DIR = join(ROOT, 'public/assets/images');

function parseArgs(): { dryRun: boolean; force: boolean; missing: boolean; set: string | null } {
  const args = process.argv.slice(2);
  return {
    dryRun: args.includes('--dry-run'),
    force: args.includes('--force'),
    missing: args.includes('--missing'),
    set: args.find((a) => a.startsWith('--set='))?.split('=')[1] ?? null,
  };
}

async function main() {
  const { dryRun, force, missing, set } = parseArgs();

  mkdirSync(OUTPUT_DIR, { recursive: true });

  let entries = Object.entries(EMOJI_MAP);
  if (set) {
    entries = entries.filter(([word]) => WORD_SET[word] === set);
    if (entries.length === 0) {
      const sets = [...new Set(Object.values(WORD_SET))].sort();
      console.error(`No words found for set "${set}". Available: ${sets.join(', ')}`);
      process.exit(1);
    }
  }

  let generated = 0;
  let skipped = 0;
  let errors = 0;

  for (const [word, entry] of entries) {
    const setName = WORD_SET[word] ?? 'unknown';
    const isAi = entry === AI_FALLBACK;
    const label = isAi ? '[AI]' : '[emoji]';
    const outputPath = join(OUTPUT_DIR, `${word}.webp`);
    const assetRelPath = `/assets/images/${word}.webp`;
    const exists = existsSync(outputPath);

    if (!force && exists) {
      skipped++;
      continue;
    }
    if (missing && exists) {
      skipped++;
      continue;
    }

    if (dryRun) {
      console.log(`  ${label} ${setName} / ${word}`);
      generated++;
      continue;
    }

    try {
      if (isAi) {
        await generateViaFalAi(word, outputPath);
      } else {
        await renderEmojiToWebP(entry as string, setName, outputPath);
      }
      patchPictureAsset(DATA_DIR, setName, word, assetRelPath);
      console.log(`  [done] ${setName} / ${word}`);
      generated++;
    } catch (err) {
      console.error(`  [error] ${setName} / ${word}: ${(err as Error).message}`);
      errors++;
    }
  }

  console.log(`\nDone: ${generated} generated, ${skipped} skipped, ${errors} errors.`);
  if (errors > 0) process.exit(1);
}

main();
