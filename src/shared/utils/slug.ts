/**
 * Asset filename for a word.
 *
 * Multi-word entries such as `polar bear` and `ice cream` become `polar-bear` /
 * `ice-cream` so the generated paths stay URL-safe; single-word entries are
 * unchanged, which is why every asset predating multi-word vocabulary keeps its
 * existing filename. Accents fold to their base letter, so Movers' `café`
 * becomes `cafe` rather than losing the character.
 *
 * Lives in `src/` rather than beside the generators because both sides need it:
 * the generators to name the files, and the data-integrity tests to check that
 * what shipped matches the convention.
 */
export function slug(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
