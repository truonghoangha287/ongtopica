import { createWriteStream, mkdirSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { convertToWebP } from './image-converter.ts';

const PROMPT_TEMPLATE =
  'A flat vector illustration of a single {WORD} centered on a white background. ' +
  'Bright, friendly, cartoon style with thick outlines and flat colors. ' +
  'No shading, no shadows, no text, no labels. Child-appropriate for ages 4–10. ' +
  'Simple, clear, cheerful design.';

const FAL_MODEL = 'fal-ai/flux/schnell';
const MAX_RETRIES = 3;
const RETRY_BASE_MS = 1000;

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt < MAX_RETRIES - 1) {
        const delay = RETRY_BASE_MS * Math.pow(2, attempt);
        console.warn(`  ⚠ retry in ${delay}ms...`);
        await sleep(delay);
      }
    }
  }
  throw lastErr;
}

/** Generate an image for a vocabulary word via fal.ai Flux and save as 400×400 WebP. */
export async function generateViaFalAi(word: string, outputPath: string): Promise<void> {
  const apiKey = process.env.FAL_KEY;
  if (!apiKey) {
    throw new Error('FAL_KEY not set in environment. Add it to .env.local and re-run.');
  }

  const prompt = PROMPT_TEMPLATE.replace('{WORD}', word);

  const result = await withRetry(async () => {
    const res = await fetch(`https://fal.run/${FAL_MODEL}`, {
      method: 'POST',
      headers: {
        Authorization: `Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        image_size: 'square_hd',
        num_inference_steps: 4,
        num_images: 1,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`fal.ai error ${res.status}: ${body.slice(0, 200)}`);
    }

    return res.json() as Promise<{ images: Array<{ url: string }> }>;
  });

  const imageUrl = result.images[0]?.url;
  if (!imageUrl) throw new Error(`fal.ai returned no image for "${word}"`);

  // Download generated image to a temp file then convert to WebP
  const tmpPath = join(tmpdir(), `fal-${word}-${Date.now()}.png`);
  const imgRes = await fetch(imageUrl);
  if (!imgRes.ok) throw new Error(`Failed to download fal.ai image: ${imgRes.status}`);

  const arrayBuffer = await imgRes.arrayBuffer();
  await convertToWebP(Buffer.from(arrayBuffer), outputPath);
}
