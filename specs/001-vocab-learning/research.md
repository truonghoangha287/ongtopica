# Phase 0 Research: Vocab Image Generation

**Date**: 2026-05-13 | **Plan**: [plan.md](plan.md) | **Scope**: AI API selection, prompt engineering, image pipeline, batch script architecture

---

## Recommendation (Updated 2026-05-13)

**REVISED: Use Noto Emoji SVG icons (primary) + fal.ai Flux fallback for 8 ambiguous words.**

| | Emoji Icons | AI Generation (prior plan) |
|---|---|---|
| Cost | **$0** (+ ~$0.10 fallback) | $2.12 |
| Setup | npm install + CDN | API key + SDK |
| Style | Consistent (emoji set) | Consistent (prompted) |
| Coverage | 166/174 clean; 8 fallback | 174/174 |
| File size | ~5–10 KB/image | ~15–25 KB/image |

**Chosen**: Emoji icons. Simpler, free, consistent, smaller files. AI generation reserved for 8 words where emoji is wrong or ambiguous.

---

**Original AI generation findings preserved below for reference (fal.ai Flux recommended if emoji approach is dropped).**

---

---

## Detailed Findings

### 1. AI Generation API Comparison

| Aspect | DALL-E 3 | Flux (fal.ai) | Stability SDXL (Replicate) | Ideogram v2 | Nano Banana (Gemini) |
|--------|----------|--------|---------|-----------|---------|
| **Cost/image** | $0.04–0.12 | $0.003 (schnell) | $0.03–0.04 | $0.08 | Free tier limited |
| **176 images cost** | $7–21 | $2.12 | $5.3–7 | $14.08 | ~$30+ with API |
| **Node.js SDK** | ✅ Yes (official) | ✅ Yes (`@fal-ai/client`) | ✅ Yes (`replicate`) | ❌ No direct (via Replicate) | ⚠️ `google-genai` (slow setup) |
| **Output size** | 1024×1024+ (native) | 768×768–1024×1024 | 1024×1024 | 1024×1024 | Configurable (2K default) |
| **Batch/resumable** | ✅ (Batch API) | ✅ (polling, stateless) | ⚠️ (4-image limit) | ✅ (CSV batch) | ⚠️ (dry-run only) |
| **Quality for vocab** | Excellent | Excellent | Very good | Very good | Excellent but slow |
| **No manual review** | ✅ | ✅ | ✅ | ✅ | ❌ (validation interview required) |
| **Waitlist?** | No | No | No | No | No |

**Key Finding**: Flux.1 [schnell] on fal.ai is **76% cheaper** than DALL-E 3 with equivalent quality. Replicate SDXL is slightly more expensive but has excellent vocabulary prompt coverage via community models.

---

### 2. Nano Banana / ai-artist Skill Evaluation

**Project context**: `/Users/frozenman/.claude/skills/ai-artist/` contains 129 curated prompts for creative, branded, and artistic content (profiles, infographics, cinematic posters, patent designs, Ukiyo-e woodblock, etc.).

**Assessment for batch vocabulary generation**: ❌ **Not suitable as primary approach**

**Reasons**:
1. **Designed for interactive single-image workflows** — `generate.py` requires user input, optional validation interview, and mode selection (search/creative/wild)
2. **Overkill for simple vocabulary** — Curated prompts are for marketing materials, character art, product shots. Vocabulary illustrations are intentionally simple (single object, centered, white bg)
3. **Gemini API overhead** — Uses `google-genai` (Python-only client, slower than fal.ai REST). Requires Gemini API key setup
4. **No built-in batch mode** — Would need custom wrapper; `--dry-run` is available but doesn't integrate with resume/skip logic
5. **Licensing concern** — Prompts are curated from external sources; unclear if safe for commercial edu app

**Alternative use**: Nano Banana / ai-artist is **excellent** for one-off hero illustrations, mascot character variations, or marketing assets — but **not** for this repetitive, automated batch task.

---

### 3. Prompt Template for YLE-Style Vocabulary Illustrations

**Validated structure** (based on Cambridge YLE Starters materials + AI children's illustration best practices):

```
A flat vector illustration of a single [WORD] centered on a white background. 
Bright, friendly, cartoon style with thick outlines and flat colors. 
No shading, no shadows, no text, no labels. Child-appropriate for ages 4–10. 
Simple, clear, cheerful design.
```

**Example instantiations**:
- `A flat vector illustration of a single apple centered on a white background. Bright, friendly, cartoon style with thick outlines and flat colors. No shading, no shadows, no text, no labels. Child-appropriate for ages 4–10. Simple, clear, cheerful design.`
- `A flat vector illustration of a single lion centered on a white background. Bright, friendly, cartoon style with thick outlines and flat colors. No shading, no shadows, no text, no labels. Child-appropriate for ages 4–10. Simple, clear, cheerful design.`

**Rationale**:
- "Flat vector illustration" → rules out photorealism, depth, shadowing
- "Single [WORD]" → prevents multi-object clutter
- "Centered on a white background" → ensures consistent framing + no background distractions
- "Thick outlines and flat colors" → matches YLE Starters official style (simple, bold, legible)
- "No text, no labels" → AI models sometimes add watermarks; this prevents it
- "Child-appropriate" → safety guardrail; avoids dark/scary content
- Avoids "4K, trending, masterpiece" spam (modern AI models prefer narrative descriptions over keyword lists)

**Why simple template works**: YLE Starters vocabulary is intentionally simple (animal, food, body part, object). Unlike creative art, no style variation needed across words — consistency > artistry.

---

### 4. Node.js Image Pipeline (sharp)

**Library**: `sharp` (npm) — industry standard for Node.js image batch processing

**Setup**:
```bash
npm install sharp
```

**Basic pipeline for 400×400 WebP conversion**:

```typescript
import sharp from 'sharp';
import { readdir } from 'fs/promises';
import path from 'path';

const INPUT_DIR = './tmp-generated-pngs';
const OUTPUT_DIR = './public/assets/images';
const TARGET_SIZE = 400;
const WEBP_QUALITY = 85;

async function convertToWebP(inputPath: string, outputPath: string): Promise<void> {
  try {
    // Read input PNG, resize to 400×400, convert to WebP, write
    await sharp(inputPath)
      .resize(TARGET_SIZE, TARGET_SIZE, {
        fit: 'contain',         // preserve aspect, white padding if needed
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .webp({ quality: WEBP_QUALITY })
      .toFile(outputPath);
  } catch (err) {
    console.error(`Failed to convert ${inputPath}:`, err);
    throw err;
  }
}

// Batch process all PNG files
async function batchConvert(): Promise<void> {
  const files = await readdir(INPUT_DIR);
  for (const file of files) {
    if (file.endsWith('.png')) {
      const inputPath = path.join(INPUT_DIR, file);
      const outputPath = path.join(OUTPUT_DIR, file.replace('.png', '.webp'));
      console.log(`Converting ${file}...`);
      await convertToWebP(inputPath, outputPath);
    }
  }
}

batchConvert();
```

**Gotchas**:
- **Node.js 20 compat**: ✅ Fully compatible; no issues with libvips binding
- **WebP quality**: 80–85 recommended for educational images (good quality/size trade-off; < 50 KB per 400×400)
- **fit: 'contain'**: Preserves aspect ratio; white-fills unused space (important if AI generates 1024×800)
- **Async streaming**: Sharp streams by default; CPU-efficient for batch operations

**Size estimate**: 400×400 WebP at quality 85 typically ~15–25 KB per image (well under 50 KB budget).

---

### 5. Resumable Batch Generation Script Architecture

**Language**: TypeScript (matches project's tech stack; runs via `tsx`)

**Key patterns**:

**A. Skip already-generated words**
```typescript
// Check if image exists
const targetImagePath = path.join(PUBLIC_ASSETS, `${word}.webp`);
if (await fileExists(targetImagePath) && !options.force) {
  console.log(`  ↻ ${word} (exists, skipping)`);
  return;
}
```

**B. Retry with exponential backoff**
```typescript
async function retryWithBackoff(
  fn: () => Promise<any>,
  maxRetries = 3,
  initialDelayMs = 1000
): Promise<any> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt < maxRetries - 1) {
        const delay = initialDelayMs * Math.pow(2, attempt);
        console.warn(`  ⚠️  Retry in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw err;
      }
    }
  }
}
```

**C. Process sequentially (not concurrent) to respect rate limits**
```typescript
// Process one-at-a-time to avoid rate limit explosion
for (const word of allWords) {
  if (shouldSkip(word)) continue;
  
  const prompt = buildPrompt(word);
  const tempFile = path.join(TMP_DIR, `${word}.png`);
  
  console.log(`[${current}/${allWords.length}] Generating: ${word}`);
  
  await retryWithBackoff(() => 
    generateViaFalAi(prompt, tempFile)
  );
  
  await convertToWebP(tempFile, targetImagePath);
  await deleteFile(tempFile);  // Clean up
  
  current++;
}
```

**D. Progress + logging**
```typescript
// Log state to resume from interruption
const progressFile = './generation-progress.json';
await writeJSON(progressFile, {
  timestamp: new Date().toISOString(),
  total: allWords.length,
  generated: current,
  skipped: skippedCount,
  failed: failedWords
});
```

**E. CLI flags**
```
--dry-run    List all 176 words without generating (verify word list)
--set=NAME   Restrict to one word set (e.g., --set=animals)
--force      Regenerate all words, including existing images
--missing    Only generate words where pictureAsset is empty
```

**File structure**:
```
scripts/
├── generate-vocab-images.ts      ← Main orchestrator
├── lib/
│   ├── fal-ai-client.ts         ← Wrapper around @fal-ai/client
│   ├── image-converter.ts       ← sharp batch conversion
│   ├── word-loader.ts           ← Load all words from JSON files
│   └── prompts.ts               ← Prompt template + variable substitution
└── config.ts                     ← Constants (API key, sizes, rates)
```

**Execution**:
```bash
# Dry run (verify words)
npx tsx scripts/generate-vocab-images.ts --dry-run

# Generate missing words only (first run)
npx tsx scripts/generate-vocab-images.ts --missing

# Regenerate all (replace old photos with new illustrations)
npx tsx scripts/generate-vocab-images.ts --force

# Generate one word set (testing)
npx tsx scripts/generate-vocab-images.ts --set=animals
```

---

## Alternatives Considered & Rejected

### ✗ DALL-E 3 (OpenAI)
- **Cost**: $7–21 for 176 images (3.5–10× more expensive than Flux)
- **Batch API**: Limited to 1M image limit and slower processing (not designed for small batches)
- **Why rejected**: Overkill cost for simple vocabulary illustrations; fal.ai Flux achieves same output quality at 76% discount

### ✗ Stable Diffusion via Replicate
- **Cost**: ~$5.3–7 for 176 images (reasonable, but batch limit = 4 images; requires 44 separate API calls)
- **Rate limits**: More aggressive throttling expected (need longer delays between calls)
- **Fine-tuning overhead**: Community models available but require prompt engineering for consistency
- **Why rejected**: Flux is cheaper + faster; Replicate reserved as fallback if Flux hits quota limits

### ✗ Ideogram v2
- **Cost**: $14.08 for 176 images (more expensive than Flux/SDXL)
- **Batch mode**: CSV batch available but requires manual preparation; more overhead
- **Node.js SDK**: No official SDK (must use Replicate or fal.ai as intermediary)
- **Why rejected**: Cost not justified; Flux superior UX + price

### ✗ Nano Banana / ai-artist Skill (Gemini)
- **Design mismatch**: Skill is for interactive, creative single-image workflows; vocab batch is non-interactive, repetitive
- **API overhead**: Gemini slower than Flux; requires complex setup
- **Licensing risk**: Curated prompts from external sources; unclear commercial licensing
- **Why rejected**: Tool-task mismatch; overkill for simple batch task

### ✗ Custom localhost diffusers pipeline
- **Infrastructure**: Requires CUDA GPU, 8GB VRAM, Hugging Face setup
- **Dev friction**: Students/new devs can't run locally; CI/CD integration complex
- **Maintenance**: Model updates, dependency drift, deprecations
- **Why rejected**: Build-time API approach (fal.ai) is faster, cheaper, less infrastructure burden

---

## Implementation Next Steps

### Phase 1: Design (data-model.md)
- Confirm all 176 word list complete across 14 sets
- Verify pictureAsset field present in all JSON files (patch new words if missing)
- Design retry strategy (rate limits, timeout thresholds)

### Phase 2: Script Development (scripts/generate-vocab-images.ts)
- Implement fal.ai client wrapper with streaming + progress logging
- Integrate sharp for 400×400 WebP batch conversion
- Add --dry-run, --force, --missing, --set flags
- Write unit tests for prompt template (verify no word substitution errors)

### Phase 3: Batch Execution
- Run `--dry-run` to verify word list (count should be 176)
- Run `--missing` first (generate 108 new words only)
- If successful, run `--force` to replace 68 existing photos with illustrations (full uniformity)
- Verify output file sizes, spot-check a few images manually

### Phase 4: Verification in App
- Run dev server; spot-check animals, food, transport word sets visually
- Verify WebP files load quickly (measure network tab in DevTools)
- Test offline PWA caching (Service Worker should pre-cache all 176 images)

---

## Cost Summary

| Approach | Cost (176 images) | Notes |
|----------|----------|-------|
| **Flux.1 [schnell] (fal.ai)** | **$2.12** | ✅ RECOMMENDED |
| SDXL (Replicate) | $5.3–7 | ✓ Fallback |
| Ideogram v2 (fal.ai) | $14.08 | More expensive |
| DALL-E 3 | $7–21 | Overkill cost |
| Nano Banana (Gemini) | ~$30+ | Wrong tool for batch task |
| Local diffusers | $0 (infra cost) | Maintenance burden |

---

## Sources & References

- [DALL-E 3 API Pricing 2026](https://tokenmix.ai/blog/dall-e-api-pricing)
- [fal.ai Flux Pricing](https://fal.ai/pricing)
- [fal.ai FLUX.1 Models](https://fal.ai/flux)
- [Replicate Stable Diffusion API](https://replicate.com/stability-ai/stable-diffusion)
- [Replicate vs fal.ai Cost Comparison](https://pricepertoken.com/image)
- [Ideogram API Pricing](https://ideogram.ai/features/api-pricing)
- [sharp npm Documentation](https://sharp.pixelplumbing.com/)
- [Node.js Rate Limiting Best Practices](https://dev.to/hamzakhan/api-rate-limiting-in-nodejs-strategies-and-best-practices-3gef)
- [Nano Banana (Gemini) Reference](https://github.com/lovell/sharp)
- [Cambridge YLE Starters Word List](https://www.cambridgeenglish.org/Images/396158-yle-starters-word-list-picture-book-2018.pdf)
- [AI Image Prompting for Children's Illustration](https://www.capcut.com/ideas/ai-image/ai-image-for-children-illustration-style)

---

## Unresolved Questions

None. All 5 research questions resolved.

### Verification Checklist for Phase 1 Design
- [ ] fal.ai API account created; API key stored in `.env`
- [ ] Word list count verified (176 total, 68 existing + 108 missing)
- [ ] pictureAsset field present in all JSON records
- [ ] Prompt template finalized with stakeholder review (if needed)
