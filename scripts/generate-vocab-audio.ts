/**
 * Generate all vocabulary audio files using macOS `say` -> `ffmpeg`.
 *
 * Pipeline (per word):
 *   say -v Samantha -o tmp.aiff "{word}"
 *   ffmpeg -i tmp.aiff -ar 22050 -ac 1 -b:a 64k tmp.mp3
 *   silenceremove (trim leading/trailing silence to match the existing tight ~0.5s pronunciations)
 *
 * Output format matches existing files: 22.05 kHz mono 64 kbps mp3.
 * Sequential to avoid `say`/ffmpeg races; 174 words finish in ~3 min on M-series.
 *
 * Flags:
 *   --force   overwrite existing mp3 files (default: skip existing)
 *   --only=<word,word>  generate just these words
 *   --level=starters|movers  which corpus to voice (default: starters)
 *
 * Movers audio lands in `public/assets/audio/movers/`. Words the app already
 * teaches at Starters keep pointing at the flat file, so this only ever
 * generates clips that do not exist yet.
 */
import { execFileSync } from 'child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { slug } from './lib/word-loader.ts';

const LEVELS = {
  starters: { dataDir: 'src/data/yle-starters', outDir: 'public/assets/audio' },
  movers: { dataDir: 'src/data/yle-movers', outDir: 'public/assets/audio/movers' },
} as const;
const VOICE = 'Samantha';

const args = process.argv.slice(2);
const force = args.includes('--force');
const onlyArg = args.find((a) => a.startsWith('--only='))?.slice('--only='.length);
const onlyWords = onlyArg ? new Set(onlyArg.split(',').map((w) => w.trim())) : null;

const levelArg = args.find((a) => a.startsWith('--level='))?.slice('--level='.length) ?? 'starters';
if (!(levelArg in LEVELS)) {
  console.error(`Unknown --level=${levelArg}. Expected: ${Object.keys(LEVELS).join(' | ')}`);
  process.exit(1);
}
const { dataDir: DATA_DIR, outDir: OUT_DIR } = LEVELS[levelArg as keyof typeof LEVELS];

function collectWords(): string[] {
  const words = new Set<string>();
  const outPrefix = `/${OUT_DIR.replace(/^public\//, '')}/`;
  for (const file of readdirSync(DATA_DIR).filter((f) => f.endsWith('.json'))) {
    const entries: Array<{ text: string; audioAsset?: string }> = JSON.parse(
      readFileSync(join(DATA_DIR, file), 'utf-8'),
    );
    for (const e of entries) {
      // A Movers word that reuses a Starters clip points outside this level's
      // directory; re-recording it would overwrite the Starters asset.
      if (e.audioAsset && !e.audioAsset.startsWith(outPrefix)) continue;
      words.add(e.text);
    }
  }
  return [...words].sort();
}

function generate(word: string, tmp: string): void {
  // Filenames are slugged (`polar bear` -> polar-bear.mp3) but `say` is given
  // the real word, so multi-word entries are still pronounced as a phrase.
  const aiff = join(tmp, `${slug(word)}.aiff`);
  const mp3 = join(OUT_DIR, `${slug(word)}.mp3`);

  // macOS say -> AIFF
  execFileSync('say', ['-v', VOICE, '-o', aiff, word], { stdio: ['ignore', 'ignore', 'pipe'] });

  // ffmpeg: resample to 22050/mono/64k, trim leading+trailing silence to match the tight existing recordings
  execFileSync(
    'ffmpeg',
    [
      '-y',
      '-i', aiff,
      '-af', 'silenceremove=start_periods=1:start_silence=0.05:start_threshold=-40dB,areverse,silenceremove=start_periods=1:start_silence=0.05:start_threshold=-40dB,areverse',
      '-ar', '22050',
      '-ac', '1',
      '-b:a', '64k',
      mp3,
    ],
    { stdio: ['ignore', 'ignore', 'pipe'] },
  );

  unlinkSync(aiff);
}

function main(): void {
  const words = collectWords().filter((w) => !onlyWords || onlyWords.has(w));
  const tmp = mkdtempSync(join(tmpdir(), 'vocab-audio-'));
  mkdirSync(OUT_DIR, { recursive: true });

  let generated = 0;
  let skipped = 0;
  const failed: string[] = [];

  console.log(`Generating ${words.length} ${levelArg} audio files (voice: ${VOICE})...`);

  for (const word of words) {
    const target = join(OUT_DIR, `${slug(word)}.mp3`);
    if (!force && existsSync(target)) {
      skipped++;
      continue;
    }
    try {
      generate(word, tmp);
      generated++;
      if (generated % 10 === 0) console.log(`  ${generated} generated...`);
    } catch (err) {
      failed.push(word);
      console.error(`  FAILED: ${word} — ${(err as Error).message.split('\n')[0]}`);
    }
  }

  rmSync(tmp, { recursive: true, force: true });

  console.log('---');
  console.log(`Generated: ${generated}`);
  console.log(`Skipped (existing): ${skipped}`);
  if (failed.length) console.log(`Failed: ${failed.join(', ')}`);
}

main();
