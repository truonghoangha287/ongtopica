import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { join, basename } from 'path';

export interface VocabWord {
  setName: string;
  word: string;
  hasPictureAsset: boolean;
}

export function loadAllWords(dataDir: string): VocabWord[] {
  const jsonFiles = readdirSync(dataDir)
    .filter((f) => f.endsWith('.json') && f !== 'index.ts')
    .sort();

  const result: VocabWord[] = [];

  for (const file of jsonFiles) {
    const setName = basename(file, '.json');
    const raw = JSON.parse(readFileSync(join(dataDir, file), 'utf-8'));

    for (const entry of raw) {
      result.push({
        setName,
        word: entry.text as string,
        hasPictureAsset: Boolean(entry.pictureAsset),
      });
    }
  }

  return result;
}

export function patchPictureAsset(dataDir: string, setName: string, word: string, assetPath: string): void {
  const filePath = join(dataDir, `${setName}.json`);
  if (!existsSync(filePath)) return; // set not yet in app — skip
  const raw: Array<Record<string, unknown>> = JSON.parse(readFileSync(filePath, 'utf-8'));

  let patched = false;
  for (const entry of raw) {
    if (entry.text === word && !entry.pictureAsset) {
      entry.pictureAsset = assetPath;
      patched = true;
      break;
    }
  }

  if (patched) {
    writeFileSync(filePath, JSON.stringify(raw, null, 2) + '\n');
  }
}

