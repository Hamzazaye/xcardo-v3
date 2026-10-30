# XcardO — Master Design System (`ui-ux-pro-max`)

> **Project**: XcardO — Warlords of the Obsidian Altar (Interactive 3D Edition)
> **Domain**: Dark-Fantasy Tactical 3D Board & War-Scroll Strategy Game
> **Tech Stack**: Three.js (WebGL PBR + Custom Shaders/Lighting) + Vanilla ES Modules + Spatial Glassmorphic CSS

---

## 1. Visual Direction & Style Architecture

Combines four complementary styles from the `ui-ux-pro-max` catalog:

1. **Spatial Glassmorphism (`Style #3 & #55`)**:
   - Translucent obsidian panels (`rgba(14, 10, 23, 0.84)`) with `backdrop-filter: blur(18px) saturate(165%)`.
   - Top-edge specular rim highlight (`inset 0 1px 0 rgba(255, 248, 220, 0.16)`) and wrought-gold border hairlines (`rgba(212, 168, 83, 0.38)`).
2. **3D & Hyperrealism (`Style #5 & #64`)**:
   - Full-viewport interactive Three.js War-Table starting in **Isometric View (`high_cathedral`)** with Quintic S-Curve camera transitions, inertial orbit damping, cursor parallax, and real-time stone shatter physics.
3. **Dark Mode / Cinema Atmospheric (`Style #7 & #71`)**:
   - Deep obsidian-violet base (`#07050a` to `#120d1d`) avoiding flat `#000000` smearing, paired with warm torchlight amber (`#f59e0b`) and solar parchment (`#f8f2e6`) for WCAG AA/AAA contrast (`>= 7:1` primary text, `>= 4.5:1` secondary text).
4. **Tactile Digital Micro-Interactions (`Style #16 & #60`)**:
   - Snappy `180ms cubic-bezier(0.16, 1, 0.3, 1)` hover/press transitions.
   - Tactile press deformation (`transform: scale(0.97)`) that never shifts layout bounds.

---

## 2. Semantic Design Tokens (CSS Variables)

```css
:root {
  /* Surfaces & Glassmorphism */
  --bg-abyss: #07050a;
  --bg-elevated: #120d1e;
  --panel-obsidian: rgba(15, 11, 24, 0.84);
  --panel-obsidian-strong: rgba(10, 7, 17, 0.92);
  --panel-glass-highlight: inset 0 1px 0 rgba(255, 245, 214, 0.16);
  --glass-blur: blur(18px) saturate(165%);

  /* Brand & Faction Accents */
  --gold-reliquary: #d4a853;
  --gold-bright: #fde68a;
  --gold-cta: #f59e0b;
  --crimson-blood: #e11d48;
  --crimson-deep: #881337;
  --azure-sanctum: #38bdf8;
  --emerald-warden: #34d399;

  /* Typography & Contrast (WCAG AA/AAA) */
  --text-parchment: #f8f2e6;      /* 14.8:1 on --bg-abyss */
  --text-secondary: #d5cae6;      /* 9.2:1 on --bg-abyss */
  --text-muted: #b8abd0;          /* 6.1:1 on --bg-abyss */

  /* Borders & Focus Rings */
  --iron-border: rgba(212, 168, 83, 0.38);
  --iron-border-subtle: rgba(212, 168, 83, 0.22);
  --focus-ring: 0 0 0 2px #07050a, 0 0 0 4px #fde68a, 0 0 16px rgba(245, 158, 11, 0.55);

  /* 4/8dp Mathematical Spacing Scale */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;

  /* Radii & Z-Index Scale */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-pill: 9999px;
  --z-canvas: 1;
  --z-hud: 10;
  --z-intel: 25;
  --z-modal: 85;
  --z-toast: 95;

  /* Motion & Easing */
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-spring: cubic-bezier(0.22, 1, 0.36, 1);
  --duration-fast: 160ms;
  --duration-normal: 240ms;
}
```

---

## 3. Iconography & Asset Discipline

- **Zero Structural Emojis**: All navigation tabs, currency counters, action buttons, shop controls, and HUD tools use bespoke 2px-stroke SVG vector icons via `renderGothicIconSVG()` with consistent sizing (`16px` inline, `20px` button, `24px` feature tile).
- **Tabular Numerals**: All scores, turn numbers, Gold Coin counters, and percentages enforce `font-variant-numeric: tabular-nums` to eliminate horizontal jitter during live updates.

---

## 4. Accessibility & Three.js Ergonomics Checklist

- [x] `role="img"` and descriptive `aria-label` on `#gothic-3d-canvas`.
- [x] `role="status" aria-live="polite"` on `#gothic-toast-banner`.
- [x] `role="dialog" aria-modal="true"` on Storyboard & Endgame modals with `Escape` key dismissal.
- [x] Visible `:focus-visible` golden focus ring on all interactive controls.
- [x] Touch targets `>= 40-44px` with `touch-action: manipulation` and safe-area padding (`env(safe-area-inset-*)`).
- [x] Dynamic 3D canvas cursor feedback (`pointer` on interactive board tiles, `grab`/`grabbing` on orbit).
- [x] Live `prefers-reduced-motion` support in CSS and `GothicScene3D`.
