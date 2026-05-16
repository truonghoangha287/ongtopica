# Drag-and-Drop & Animation Libraries Research
## Vocabulary Learning PWA for 6-Year-Olds on Tablets

**Date:** 2026-05-10  
**Target:** Letter tile unscramble + celebration animations with CLS=0 & 60fps

---

## 1. Drag-and-Drop Library Recommendation

### **@dnd-kit [PRIMARY CHOICE]**
- **Why:** Headless architecture (no opinionated UI), extensive touch/pointer event support without polyfills, TypeScript-first, actively maintained with v9+, excellent sensor adapters (touch, keyboard, mouse)
- **Key fit:** Built for complex touch interactions; handles imprecise children's gestures via configurable snap-to-grid and hit detection
- **Bundle size:** ~45kb gzipped (minimal when tree-shaken)

### Why not react-beautiful-dnd
- Sunset status as of 2024; maintainers moved to Atlassian Pragmatic DnD (experimental)
- Touch support requires extra config; not optimized for low-precision input

### Why not react-dnd  
- Older codebase; heavier bundle (~50kb+); stronger for desktop than touch tablets

---

## 2. Animation Library Recommendation

### **CSS Animations + Framer Motion (hybrid approach) [RECOMMENDED]**
- **Framer Motion:** Use for mascot reactions (bounce, wiggle, shrug) and screen transitions
  - Bundle: ~35kb gzipped
  - GPU-accelerated, zero CLS when animating transforms/opacity
  - Excellent developer experience; useAnimationControls for conditional triggers
  
- **CSS Animations:** Use for tile snap (translateX/Y transitions) — fastest path for simple point-A-to-B movement
  - Zero bundle impact
  - Native browser optimization
  - Predictable 60fps on mobile

### Why not React Spring alone
- ~30kb but callback-driven API slower than Framer for celebration timing
- Overkill for simple tile movements

### Why not CSS-only
- Mascot reaction timing hard to synchronize with JS events

---

## 3. Confetti/Celebration Effects

### **canvas-confetti (wrap in React component) [PRIMARY]**
- ~8kb, uses canvas (no DOM = zero layout shifts), runs at 60fps on all devices
- Example: wrap in useEffect hook to trigger on correct answer; clean up on unmount

### Why not react-confetti
- Adds DOM nodes (particle divs), creates CLS risk despite best efforts
- 2x bundle size

### Why not custom CSS
- Single device animations (CSS @keyframes) can't match randomization/physics of confetti

---

## 4. Children's Touch UX Pattern

**Critical configs for @dnd-kit + 6-year-olds:**
- **Large hit targets:** Minimum 48px × 48px tiles (iOS standard); applies visual feedback on touch
- **Tap-fallback mode:** In addition to drag, allow single-tap-tile → tap-drop-zone pattern (UX escape hatch)
- **Long press activation:** 500ms press-hold before dragging starts (reduces accidental drags)
- **Snap-to-grid:** Enforce tile alignment after drop; visual confirmation (bounce animation)
- **Vibration feedback:** navigator.vibrate([10]) on correct drop (haptic reinforcement)

**Implementation note:** @dnd-kit's useDraggable + useDroppable sensors handle these via activationConstraint config.

---

## Stack Summary

| Function | Library | Size | Notes |
|----------|---------|------|-------|
| Drag-drop | @dnd-kit v9+ | 45kb | Touch-first, headless, TypeScript |
| Animations | Framer Motion | 35kb | Mascot + transitions; use CSS for tiles |
| Confetti | canvas-confetti | 8kb | Wrapped React component |
| **Total bundle** | — | **~88kb** | Tree-shakeable; good for PWA |

---

## Implementation Starting Points

1. **@dnd-kit:** Install `@dnd-kit/core @dnd-kit/utilities @dnd-kit/sortable` + TouchSensor preset
2. **Framer Motion:** `npm install framer-motion`; use Variants for mascot state (idle → bounce → wiggle)
3. **canvas-confetti:** `npm install canvas-confetti`; TypeScript types available
4. **Tap fallback:** Implement parallel handler in tile component (onTouchEnd → check if dragged, else set drop-mode flag)

---

## Unresolved Questions

- What tablet devices are target (iPad + Android tablets)? — Affects vibration API fallback planning
- Do celebration animations need audio (sound effects)? — Complicates accessibility sync
- Should mascot live-react to incorrect answers mid-gesture (preventive feedback)? — Impacts animation timing strategy
