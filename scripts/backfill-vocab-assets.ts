/**
 * One-shot maintenance: fill empty pictureAsset/audioAsset fields in
 * src/data/yle-starters/*.json with conventional asset paths.
 *
 * Idempotent — re-running is a no-op once fields are non-empty.
 *
 * Missing webp/mp3 files are tolerated: AudioPlayer renders a 🔇 fallback
 * and <img> shows browser default; no runtime crash.
 */
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

const DIR = 'src/data/yle-starters';
let totalPatched = 0;

for (const file of readdirSync(DIR).filter((f) => f.endsWith('.json'))) {
  const path = join(DIR, file);
  const entries: Array<Record<string, unknown>> = JSON.parse(readFileSync(path, 'utf-8'));
  let patched = 0;

  for (const e of entries) {
    const text = e.text as string;
    if (!e.pictureAsset) {
      e.pictureAsset = `/assets/images/${text}.webp`;
      patched++;
    }
    if (!e.audioAsset) {
      e.audioAsset = `/assets/audio/${text}.mp3`;
      patched++;
    }
  }

  if (patched) {
    writeFileSync(path, JSON.stringify(entries, null, 2) + '\n');
    console.log(`${file}: patched ${patched} fields`);
    totalPatched += patched;
  }
}

console.log(`Total: ${totalPatched} fields patched.`);
