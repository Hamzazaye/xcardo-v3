/**
 * XcardO III: Obsidian Sanctum
 * Custom Dark-Tarot Vector Engravings, Inquisitor Boss Crests & Wrought-Iron Gothic Icons
 */

const ORDER_PALETTES = {
  inquisition: { primary: '#e11d48', secondary: '#fb7185', dark: '#3f0b19' },
  sanctum: { primary: '#f59e0b', secondary: '#fde68a', dark: '#3b2506' },
  blood: { primary: '#9f1239', secondary: '#f43f5e', dark: '#2a0711' },
  chronicle: { primary: '#38bdf8', secondary: '#bae6fd', dark: '#082f49' },
  apocrypha: { primary: '#c084fc', secondary: '#e9d5ff', dark: '#2e1065' },
};

/**
 * Render an engraved Dark-Tarot Card illustration SVG (`viewBox="0 0 120 96"`)
 */
export function renderTarotArtSVG(card) {
  if (!card) return '';
  const pal = ORDER_PALETTES[card.order] || ORDER_PALETTES.sanctum;

  let centerMotif = '';
  switch (card.effect) {
    case 'shatter_single':
      centerMotif = `
        <path d="M60 16 L60 76 M40 24 L80 24 L74 42 L46 42 Z" stroke="${pal.secondary}" stroke-width="2.6" fill="${pal.primary}" fill-opacity="0.35"/>
        <polygon points="36,68 48,54 42,76" fill="${pal.secondary}"/>
        <polygon points="84,68 72,54 78,76" fill="${pal.secondary}"/>
      `;
      break;
    case 'shatter_cross':
      centerMotif = `
        <path d="M60 12 L60 84 M24 48 L96 48" stroke="${pal.secondary}" stroke-width="4" stroke-linecap="round"/>
        <polygon points="60,22 72,48 60,74 48,48" fill="${pal.primary}" fill-opacity="0.45" stroke="${pal.secondary}" stroke-width="1.6"/>
      `;
      break;
    case 'guillotine_row':
    case 'guillotine_col':
      centerMotif = `
        <polygon points="24,26 96,26 96,46 24,64" fill="${pal.primary}" fill-opacity="0.48" stroke="${pal.secondary}" stroke-width="2"/>
        <line x1="20" y1="70" x2="100" y2="70" stroke="${pal.secondary}" stroke-width="2" stroke-dasharray="5 3"/>
      `;
      break;
    case 'brimstone_3x3':
      centerMotif = `
        <circle cx="60" cy="48" r="24" fill="${pal.primary}" fill-opacity="0.38" stroke="${pal.secondary}" stroke-width="2.2"/>
        <polygon points="60,16 68,38 92,38 72,52 80,76 60,60 40,76 48,52 28,38 52,38" fill="${pal.secondary}" fill-opacity="0.35"/>
      `;
      break;
    case 'sanctified_relic':
    case 'aegis_gargoyle':
      centerMotif = `
        <circle cx="60" cy="48" r="26" fill="none" stroke="${pal.secondary}" stroke-width="2"/>
        <polygon points="60,20 78,48 60,76 42,48" fill="${pal.primary}" fill-opacity="0.42" stroke="${pal.secondary}" stroke-width="2"/>
        <circle cx="60" cy="48" r="7" fill="${pal.secondary}"/>
      `;
      break;
    default:
      centerMotif = `
        <polygon points="60,16 86,48 60,80 34,48" fill="${pal.primary}" fill-opacity="0.35" stroke="${pal.secondary}" stroke-width="2"/>
        <circle cx="60" cy="48" r="14" fill="none" stroke="${pal.secondary}" stroke-width="1.8"/>
        <circle cx="60" cy="48" r="5" fill="${pal.secondary}"/>
      `;
      break;
  }

  return `
    <svg class="tarot-svg" viewBox="0 0 120 96" aria-hidden="true">
      <rect x="4" y="4" width="112" height="88" rx="6" fill="${pal.dark}" stroke="${pal.primary}" stroke-width="1.4" stroke-opacity="0.7"/>
      <path d="M12 84 L12 28 Q60 4 108 28 L108 84" fill="none" stroke="${pal.secondary}" stroke-width="1" stroke-opacity="0.45"/>
      <circle cx="60" cy="48" r="32" fill="none" stroke="${pal.primary}" stroke-width="1" stroke-dasharray="3 3" stroke-opacity="0.6"/>
      ${centerMotif}
    </svg>
  `;
}

/**
 * Render an Inquisitor Boss Crest SVG (`viewBox="0 0 80 80"`)
 */
export function renderBossCrestSVG(bossId, color = '#e11d48') {
  return `
    <svg class="boss-crest-svg" viewBox="0 0 80 80" aria-hidden="true">
      <polygon points="40,4 72,20 72,56 40,76 8,56 8,20" fill="#140f1d" stroke="${color}" stroke-width="2.4"/>
      <circle cx="40" cy="40" r="22" fill="none" stroke="#d4a853" stroke-width="1.2" stroke-dasharray="4 2"/>
      <path d="M40 14 L48 34 L66 40 L48 46 L40 66 L32 46 L14 40 L32 34 Z" fill="${color}" fill-opacity="0.42" stroke="#fde68a" stroke-width="1.6"/>
      <circle cx="40" cy="40" r="6" fill="#fde68a"/>
    </svg>
  `;
}

/**
 * Render Wrought-Iron & Cathedral UI Icons (`viewBox="0 0 24 24"`)
 */
export function renderGothicIconSVG(name) {
  switch (name) {
    case 'sword':
      return `<svg class="gothic-icon" viewBox="0 0 24 24"><path d="M14.5 4.5L19.5 9.5L9 20H4V15L14.5 4.5Z" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 7L17 12" stroke="currentColor" stroke-width="1.8"/></svg>`;
    case 'chalice':
      return `<svg class="gothic-icon" viewBox="0 0 24 24"><path d="M6 4H18L16 12C15.5 14.5 13.5 16 12 16C10.5 16 8.5 14.5 8 12L6 4Z" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 16V20M8 20H16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`;
    case 'bell':
      return `<svg class="gothic-icon" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M13.73 21A2 2 0 0 1 10.27 21" stroke="currentColor" stroke-width="1.8"/></svg>`;
    case 'camera':
      return `<svg class="gothic-icon" viewBox="0 0 24 24"><path d="M23 19A2 2 0 0 1 21 21H3A2 2 0 0 1 1 19V8A2 2 0 0 1 3 6H7L9 3H15L17 6H21A2 2 0 0 1 23 8V19Z" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="13" r="4" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>`;
    case 'shatter':
      return `<svg class="gothic-icon" viewBox="0 0 24 24"><polygon points="12,2 19,8 16,15 21,21 11,18 6,22 8,13 3,7" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>`;
    case 'eye':
      return `<svg class="gothic-icon" viewBox="0 0 24 24"><path d="M1 12S5 4 12 4S23 12 23 12S19 20 12 20S1 12 1 12Z" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="3" fill="currentColor"/></svg>`;
    case 'undo':
      return `<svg class="gothic-icon" viewBox="0 0 24 24"><path d="M3 7V13H9" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M21 17A9 9 0 0 0 6 8.3L3 13" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`;
    case 'crown':
      return `<svg class="gothic-icon" viewBox="0 0 24 24"><polygon points="2,19 22,19 20,7 15,12 12,5 9,12 4,7" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>`;
    default:
      return `<svg class="gothic-icon" viewBox="0 0 24 24"><polygon points="12,2 22,12 12,22 2,12" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>`;
  }
}

/**
 * Render a 4x4 mini Sacred Geometry Blueprint SVG for the Codex / HUD
 */
export function renderGeometryBlueprintSVG(cells = [], color = '#f59e0b') {
  const activeSet = new Set(cells.map(([r, c]) => `${r},${c}`));
  let rects = '';
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const active = activeSet.has(`${r},${c}`);
      rects += `<rect x="${4 + c * 14}" y="${4 + r * 14}" width="11" height="11" rx="2" fill="${
        active ? color : '#1c1626'
      }" stroke="${active ? '#fde68a' : '#3a2e4c'}" stroke-width="1"/>`;
    }
  }
  return `<svg class="geometry-blueprint-svg" viewBox="0 0 64 64" aria-hidden="true">${rects}</svg>`;
}
