/**
 * Design tokens for inline-style consumers. These mirror the CSS custom
 * properties in `src/index.css` (the "Ongtopica Adventures" Lovable design).
 * Prefer the CSS `var(--token)` form in JSX; this object is for places that
 * need a raw string (e.g. passing a colour to a non-CSS API).
 */
export const theme = {
  bg: 'var(--bg)',
  ink: 'var(--ink)',
  paper: 'var(--paper)',
  primary: 'var(--primary)',
  primaryFg: 'var(--primary-fg)',
  secondary: 'var(--secondary)',
  muted: 'var(--muted)',
  mutedFg: 'var(--muted-fg)',
  accent: 'var(--accent)',
  accentFg: 'var(--accent-fg)',
  success: 'var(--success)',
  destructive: 'var(--destructive)',
  border: 'var(--border)',
  star: 'var(--star)',
  radius: 'var(--radius)',
  shadowCard: 'var(--shadow-card)',
  shadowPop: 'var(--shadow-pop)',
} as const;
