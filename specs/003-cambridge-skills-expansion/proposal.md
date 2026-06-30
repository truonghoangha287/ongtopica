# Proposal: Cambridge Skills Expansion

**Status**: Brainstorm / pre-spec
**Date**: 2026-06-29
**Author**: product brainstorm
**Predecessors**: `001-vocab-learning`, `002-vocab-progression-expansion`

> Decisions captured up front (from brainstorming session):
> - **Scope**: design now for the full **Starters → Movers → Flyers** progression.
> - **Skills**: prioritize **Listening**, **Reading & Writing**, and **Vocabulary games**. **Speaking is deferred** (no microphone work yet) but the model leaves room for it.
> - **Content**: build a real **content-authoring pipeline** (sentences, scenes, stories, audio), not just reuse of single-word assets.

---

## 1. The core problem

Today the entire app is **word-level**: one word ⇄ one picture ⇄ one audio clip, drilled through 4 fixed activities (Introduce → Recognize → Unscramble → Fill-in-blank). That maps to only a slice of Cambridge YLE — mainly *single-word recognition and spelling*.

The real Cambridge YLE exam tests **three papers** at **sentence and scene level**:

| Paper | What it tests | Current coverage |
|---|---|---|
| **Listening** | follow spoken instructions in a scene, match, write names/numbers, color | ⚠️ only "hear word → pick picture" |
| **Reading & Writing** | true/false about a picture, spelling, gap-fill in a text, answer story questions | ⚠️ only spelling (Unscramble / Fill-blank) |
| **Speaking** | name objects in a scene, answer personal questions | ❌ none (deferred) |

To grow, the app must shift from a **word ladder** to a **skills curriculum**: many *question types*, organized by *skill* and *level*, drawing on richer content than a single word.

---

## 2. Architectural shift: from "activity" to a question-type registry

### Today
`ActivityType = 'introduce' | 'recognize' | 'unscramble' | 'fill-in-blank'` is a hard-coded union, and the mastery ladder assumes exactly these 4 stages **per word**. Adding a 5th type means touching the union, the composer, the player switch, and the progression math.

### Proposed
Introduce a **Question Type registry** — each question type is a self-describing plugin:

```
interface QuestionType {
  id: string;                 // 'listen-and-answer'
  skill: Skill;               // 'listening' | 'reading-writing' | 'speaking' | 'vocab'
  level: CEFRBand[];          // ['starters'] | ['movers','flyers'] ...
  contentKind: ContentKind;   // what payload it needs (word | sentence | scene | story | pair-set)
  component: React.FC<...>;   // the activity UI
  scoreModel: 'binary' | 'per-step' | 'self-assess';
}
```

The session composer then selects **items** (a content payload + a compatible question type), not just words. This decouples "what to learn" from "how to drill it" and makes every new question type below an additive change.

### Progression model evolution
- Keep the per-item spaced-repetition priority score (it works).
- Replace the rigid 4-stage-per-word ladder with **skill tracks**: a learner can progress in Listening independently of Reading & Writing.
- Mastery becomes **per (content-item × skill)** rather than a single global stage, so Movers/Flyers content can layer on without resetting Starters progress.

---

## 3. Content model evolution

The current `Word` shape (id, text, picture, audio, blankLetterIndex, letterChoices) stays valid but becomes **one** of several content kinds:

| ContentKind | New fields needed | Feeds question types |
|---|---|---|
| **Word** (exists) | — | recognize, unscramble, fill-blank, memory, odd-one-out, phonics |
| **Sentence** | text, audio, targetWordIds, isTrueOfPicture | true/false, listen & answer, sentence-build, gap-fill |
| **Scene** | background image, hotspots[{id,label,x,y,w,h}], audio prompts | listen & match, listen & follow, (future speaking) |
| **Story** | ordered frames[{image, narrationAudio}], comprehension Qs | listen & sequence, answer-the-question |
| **PairSet** | derived from existing words | memory match |
| **PhonemeTag** | onset/rime tags on existing words | phonics / rhyming |

All content stays **bundled & offline** (consistent with the constitution). Multi-level is handled by a `level` field on every content item and word set.

---

## 4. Question-type catalog (the menu)

Ordered by build cost / value. ✓ = reuses existing assets, ✎ = needs authored content.

### Tier A — cheap wins, reuse current assets
1. **Memory Match** ✓ — flip cards, match picture ↔ word. Pure vocab reinforcement, no new content.
2. **Odd-One-Out / Sort** ✓ — tap the word that doesn't belong, or drag words into category buckets. Needs only lightweight category tags.
3. **Phonics — First Sound** ✓ — "Which one starts with /b/?" Tap from 3–4 pictures. Needs phoneme tags on existing words. Pre-reading skill Cambridge values.

### Tier B — core Cambridge skill coverage (authored content)
4. **Listen & Answer** ✎ — hear a short spoken question ("Where is the cat?") → tap the picture/word answer. *(Your headline idea.)* Listening paper.
5. **True / False about a picture** ✎ — show a picture + play/read a sentence → tap ✓ or ✗. Reading & Writing Parts 1–2.
6. **Listen & Match (scene)** ✎ — hear "the ball is under the chair" → tap the right object/spot in a scene. Listening Part 1.
7. **Build a Sentence** ✎ — drag word tiles into order to caption a picture. Reading & Writing / early grammar. (Reuses the tap-tile interaction already built for Unscramble.)

### Tier C — higher complexity, richer content
8. **Listen & Sequence a story** ✎ — put 3–4 narrated story frames in the right order. Listening comprehension.
9. **Answer the Question (story)** ✎ — short picture-story, then "What did the boy eat?" tap the answer. R&W Part 5.
10. **Gap-fill in a text** ✎ — choose the right word for a blank in a 2–3 sentence text. Movers/Flyers R&W.

### Tier D — deferred
11. **Say It! (pronunciation/speaking)** — record & compare, or on-device speech check. **Deferred per decision**, but `skill: 'speaking'` + `scoreModel: 'self-assess'` slots are reserved in the registry so it can be added without rework.

---

## 5. Multi-level progression (Starters → Movers → Flyers)

- Tag every word set and content item with a `level`.
- The Home screen gains a **level selector** (or auto-advances when a level's sets are mastered).
- Vocabulary grows: Starters ~170 words → Movers/Flyers add hundreds more + grammar-bearing sentences.
- Question types unlock by level (e.g. gap-fill text appears at Movers).
- Keep all three levels installable & offline; lazy-load level bundles to control PWA size.

---

## 6. Content pipeline (since you want the full pipeline)

A repeatable authoring flow so non-engineers can add content:

1. **Schema-first**: JSON schemas per ContentKind (word / sentence / scene / story), validated in CI.
2. **Authoring source**: spreadsheet or simple CMS → export to the JSON schemas. (Mirrors current `src/data/yle-starters/*.json`.)
3. **Audio**: pipeline for sentence/narration audio — recorded or TTS-generated, normalized, compressed to the existing `.mp3` convention; generated at build time, bundled for offline.
4. **Images**: scene/story art spec (consistent style, child-safe), `.webp` like today.
5. **Validation gates**: every item references existing assets; distractors exist; reading level matches the YLE band.
6. **Versioned bundles** per level so content ships independently of code.

---

## 7. Suggested roadmap (phased specs)

| Phase | Spec | Contents | Why this order |
|---|---|---|---|
| **P1** | Question-type registry refactor | Decouple ActivityType → registry; per-skill progress; no new types yet | Foundation everything else needs |
| **P2** | Tier A games | Memory Match, Odd-One-Out, Phonics | Ship value fast with zero new content |
| **P3** | Content pipeline + schemas | Sentence/Scene/Story kinds, validation, audio build step | Unblocks Tier B/C |
| **P4** | Listening suite | Listen & Answer, Listen & Match, Listen & Sequence | Your top priority skill |
| **P5** | Reading & Writing suite | True/False, Build-a-Sentence, Gap-fill, Answer-the-Question | Completes R&W paper |
| **P6** | Movers level | Level tagging, level selector, Movers content | First multi-level proof |
| **P7** | Flyers + Speaking | Flyers content; revisit speaking decision | Last, highest cost |

---

## 8. Constitution & risk notes

- **Offline / no external calls** (Principle IV/V): every new content kind ships bundled. The only feature that strains this is speaking (cloud ASR) — which is why it's deferred; an on-device-only path keeps it compliant later.
- **Child-First UX / no keyboard** (I): all new types use tap/drag, matching existing paradigms.
- **Accessibility** (II): scene hotspots and story frames need `aria-label`s and an audio-only fallback path; axe tests per new screen.
- **Performance** (V): lazy-load level bundles; scenes/stories are the heaviest assets — budget image sizes.
- **Biggest risk**: content volume. The pipeline (Phase 3) is the real long pole, not the UI. Build Tier A first to keep momentum while the pipeline comes online.

---

## 9. Open questions for the next pass

1. Level advancement — manual selector, or auto-unlock when a level is mastered?
2. Per-skill mastery display — extend the current 4-star row, or a per-skill progress dashboard?
3. Content authoring tool — spreadsheet export vs. a small in-repo CMS?
4. Audio for sentences — recorded human voice vs. TTS (quality vs. cost/scale)?
5. Speaking (when revisited) — record-and-self-listen vs. on-device Web Speech scoring?
