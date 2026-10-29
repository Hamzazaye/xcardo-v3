/**
 * XcardO III: Obsidian Sanctum
 * Master Gothic Vector Art Suite:
 * - 20 Bespoke Dark-Tarot Woodcut & Stained-Glass Illustrations (renderTarotArtSVG)
 * - 6 Distinct Arch-Inquisitor Boss Heraldic Portraits (renderBossCrestSVG)
 * - Stained-Glass Rose Window & Wrought-Iron Corner Filigrees (renderRoseWindowSVG, renderGothicFiligreeSVG)
 * - Wrought-Iron UI Icons & Sacred Geometry Blueprints
 */

const ORDER_PALETTES = {
  inquisition: { primary: '#e11d48', secondary: '#fda4af', dark: '#2a0812', glow: '#f43f5e' },
  sanctum: { primary: '#d97706', secondary: '#fde68a', dark: '#281805', glow: '#fbbf24' },
  blood: { primary: '#9f1239', secondary: '#fb7185', dark: '#22050d', glow: '#e11d48' },
  chronicle: { primary: '#0284c7', secondary: '#bae6fd', dark: '#071e2e', glow: '#38bdf8' },
  apocrypha: { primary: '#9333ea', secondary: '#e9d5ff', dark: '#1e0b36', glow: '#c084fc' },
};

/**
 * Render an engraved Dark-Tarot Card illustration SVG (`viewBox="0 0 120 96"`)
 * Every single one of the 20 Dark-Tarot cards has its own unique Gothic woodcut + stained-glass illustration.
 */
export function renderTarotArtSVG(card) {
  if (!card) return '';
  const pal = ORDER_PALETTES[card.order] || ORDER_PALETTES.sanctum;
  const uid = `tarot_${card.id}_${Math.random().toString(36).slice(2, 6)}`;

  let motif = '';
  switch (card.id) {
    case 'warhammer_penance':
      motif = `
        <line x1="60" y1="22" x2="60" y2="82" stroke="${pal.secondary}" stroke-width="4" stroke-linecap="round"/>
        <polygon points="34,20 86,20 80,38 40,38" fill="${pal.primary}" fill-opacity="0.65" stroke="${pal.secondary}" stroke-width="2.2"/>
        <polygon points="60,12 66,20 54,20" fill="${pal.secondary}"/>
        <path d="M28,68 L44,56 M92,68 L76,56 M36,78 L50,66 M84,78 L70,66" stroke="${pal.secondary}" stroke-width="2" stroke-linecap="round"/>
      `;
      break;

    case 'cruciform_lance':
      motif = `
        <path d="M60,10 L60,86 M22,48 L98,48" stroke="${pal.secondary}" stroke-width="3.6" stroke-linecap="round"/>
        <polygon points="60,18 72,48 60,78 48,48" fill="${pal.primary}" fill-opacity="0.55" stroke="${pal.secondary}" stroke-width="1.8"/>
        <polygon points="30,48 60,36 90,48 60,60" fill="${pal.primary}" fill-opacity="0.4" stroke="${pal.secondary}" stroke-width="1.5"/>
        <circle cx="60" cy="48" r="6" fill="#ffffff"/>
      `;
      break;

    case 'inquisitor_guillotine':
      motif = `
        <line x1="34" y1="14" x2="34" y2="82" stroke="${pal.secondary}" stroke-width="3"/>
        <line x1="86" y1="14" x2="86" y2="82" stroke="${pal.secondary}" stroke-width="3"/>
        <polygon points="36,22 84,22 84,42 36,56" fill="${pal.primary}" fill-opacity="0.68" stroke="#ffffff" stroke-width="2"/>
        <line x1="20" y1="70" x2="100" y2="70" stroke="${pal.secondary}" stroke-width="2.5" stroke-dasharray="6 3"/>
      `;
      break;

    case 'transept_cleaver':
      motif = `
        <polygon points="50,12 72,22 70,76 50,86 50,12" fill="${pal.primary}" fill-opacity="0.65" stroke="#ffffff" stroke-width="2"/>
        <line x1="60" y1="8" x2="60" y2="88" stroke="${pal.secondary}" stroke-width="2.5" stroke-dasharray="5 3"/>
        <circle cx="60" cy="48" r="18" fill="none" stroke="${pal.secondary}" stroke-width="1.6"/>
      `;
      break;

    case 'brimstone_cataclysm':
      motif = `
        <circle cx="60" cy="52" r="24" fill="${pal.primary}" fill-opacity="0.5" stroke="${pal.secondary}" stroke-width="2.2"/>
        <polygon points="60,12 69,36 94,36 74,51 82,76 60,61 38,76 46,51 26,36 51,36" fill="${pal.secondary}" fill-opacity="0.45" stroke="#ffffff" stroke-width="1.5"/>
        <circle cx="60" cy="52" r="9" fill="#ffffff"/>
      `;
      break;

    case 'iron_maiden_cage':
      motif = `
        <path d="M36,78 L36,28 Q60,12 84,28 L84,78 Z" fill="${pal.primary}" fill-opacity="0.32" stroke="${pal.secondary}" stroke-width="2.4"/>
        <line x1="48" y1="22" x2="48" y2="78" stroke="${pal.secondary}" stroke-width="2.2"/>
        <line x1="60" y1="19" x2="60" y2="78" stroke="${pal.secondary}" stroke-width="2.2"/>
        <line x1="72" y1="22" x2="72" y2="78" stroke="${pal.secondary}" stroke-width="2.2"/>
        <line x1="34" y1="42" x2="86" y2="42" stroke="#ffffff" stroke-width="2"/>
        <line x1="34" y1="60" x2="86" y2="60" stroke="#ffffff" stroke-width="2"/>
      `;
      break;

    case 'gargoyle_aegis':
      motif = `
        <path d="M60,14 L88,26 L88,52 C88,70 60,84 60,84 C60,84 32,70 32,52 L32,26 Z" fill="${pal.primary}" fill-opacity="0.48" stroke="${pal.secondary}" stroke-width="2.5"/>
        <path d="M22,34 Q36,20 48,38 M98,34 Q84,20 72,38" fill="none" stroke="#ffffff" stroke-width="2.2"/>
        <polygon points="60,30 72,48 60,66 48,48" fill="${pal.secondary}"/>
      `;
      break;

    case 'sanctified_relic':
      motif = `
        <circle cx="60" cy="48" r="28" fill="none" stroke="${pal.secondary}" stroke-width="2" stroke-dasharray="4 3"/>
        <polygon points="60,14 68,38 94,48 68,58 60,82 52,58 26,48 52,38" fill="${pal.primary}" fill-opacity="0.55" stroke="#ffffff" stroke-width="1.8"/>
        <circle cx="60" cy="48" r="9" fill="#ffffff" stroke="${pal.primary}" stroke-width="2"/>
      `;
      break;

    case 'double_consecration':
      motif = `
        <circle cx="44" cy="48" r="18" fill="${pal.primary}" fill-opacity="0.4" stroke="${pal.secondary}" stroke-width="2.2"/>
        <circle cx="76" cy="48" r="18" fill="${pal.primary}" fill-opacity="0.4" stroke="#ffffff" stroke-width="2.2"/>
        <polygon points="44,36 50,48 44,60 38,48" fill="${pal.secondary}"/>
        <polygon points="76,36 82,48 76,60 70,48" fill="#ffffff"/>
      `;
      break;

    case 'transpose_relics':
      motif = `
        <path d="M32,36 C48,16 72,16 88,36" fill="none" stroke="${pal.secondary}" stroke-width="2.6"/>
        <polygon points="88,36 78,30 82,42" fill="${pal.secondary}"/>
        <path d="M88,60 C72,80 48,80 32,60" fill="none" stroke="#ffffff" stroke-width="2.6"/>
        <polygon points="32,60 42,66 38,54" fill="#ffffff"/>
        <polygon points="34,40 44,48 34,56 24,48" fill="${pal.primary}" stroke="${pal.secondary}" stroke-width="1.8"/>
        <polygon points="86,40 96,48 86,56 76,48" fill="${pal.primary}" stroke="#ffffff" stroke-width="1.8"/>
      `;
      break;

    case 'sanguine_conversion':
      motif = `
        <circle cx="60" cy="48" r="24" fill="${pal.primary}" fill-opacity="0.42" stroke="${pal.secondary}" stroke-width="2.2"/>
        <path d="M60,22 C72,38 76,48 76,56 A16,16 0 0,1 44,56 C44,48 48,38 60,22 Z" fill="${pal.secondary}" fill-opacity="0.65" stroke="#ffffff" stroke-width="1.8"/>
        <path d="M52,52 L68,52 M60,44 L60,60" stroke="#22050d" stroke-width="2.6" stroke-linecap="round"/>
      `;
      break;

    case 'mirror_nave':
      motif = `
        <line x1="60" y1="12" x2="60" y2="84" stroke="#ffffff" stroke-width="2.5" stroke-dasharray="5 3"/>
        <polygon points="28,28 52,48 28,68" fill="${pal.primary}" fill-opacity="0.55" stroke="${pal.secondary}" stroke-width="2"/>
        <polygon points="92,28 68,48 92,68" fill="${pal.secondary}" fill-opacity="0.45" stroke="#ffffff" stroke-width="2"/>
      `;
      break;

    case 'blood_communion':
      motif = `
        <path d="M42,24 H78 L72,48 C70,58 65,62 60,62 C55,62 50,58 48,48 Z" fill="${pal.primary}" fill-opacity="0.65" stroke="${pal.secondary}" stroke-width="2.2"/>
        <line x1="60" y1="62" x2="60" y2="78" stroke="${pal.secondary}" stroke-width="3"/>
        <line x1="46" y1="78" x2="74" y2="78" stroke="${pal.secondary}" stroke-width="3" stroke-linecap="round"/>
        <circle cx="60" cy="18" r="5" fill="#ffffff"/>
      `;
      break;

    case 'tithe_inquisition':
      motif = `
        <circle cx="46" cy="52" r="16" fill="${pal.primary}" fill-opacity="0.55" stroke="${pal.secondary}" stroke-width="2.2"/>
        <circle cx="74" cy="44" r="16" fill="${pal.primary}" fill-opacity="0.7" stroke="#ffffff" stroke-width="2.2"/>
        <polygon points="74,35 80,44 74,53 68,44" fill="${pal.secondary}"/>
      `;
      break;

    case 'gargoyle_bastion_card':
      motif = `
        <rect x="44" y="26" width="32" height="52" fill="${pal.primary}" fill-opacity="0.55" stroke="${pal.secondary}" stroke-width="2.2"/>
        <polygon points="38,26 60,12 82,26" fill="${pal.secondary}" stroke="#ffffff" stroke-width="1.6"/>
        <rect x="38" y="74" width="44" height="8" fill="${pal.secondary}"/>
      `;
      break;

    case 'stained_glass_blessing':
      motif = `
        <circle cx="60" cy="48" r="28" fill="${pal.primary}" fill-opacity="0.45" stroke="${pal.secondary}" stroke-width="2.4"/>
        <path d="M60,20 L60,76 M32,48 L88,48 M40,28 L80,68 M80,28 L40,68" stroke="${pal.secondary}" stroke-width="1.8"/>
        <circle cx="60" cy="48" r="10" fill="#38bdf8" stroke="#ffffff" stroke-width="2"/>
      `;
      break;

    case 'martyr_sacrifice':
      motif = `
        <polygon points="60,16 84,48 60,80 36,48" fill="${pal.primary}" fill-opacity="0.48" stroke="${pal.secondary}" stroke-width="2"/>
        <polyline points="42,32 62,48 52,56 76,72" fill="none" stroke="#ffffff" stroke-width="2.8" stroke-linecap="round"/>
        <circle cx="60" cy="24" r="4" fill="#ffffff"/>
      `;
      break;

    case 'eclipse_shroud':
      motif = `
        <circle cx="64" cy="48" r="24" fill="${pal.secondary}" fill-opacity="0.85"/>
        <circle cx="54" cy="44" r="22" fill="${pal.dark}" stroke="${pal.primary}" stroke-width="2"/>
        <circle cx="60" cy="48" r="30" fill="none" stroke="${pal.secondary}" stroke-width="1.4" stroke-dasharray="4 3"/>
      `;
      break;

    case 'excommunication':
      motif = `
        <polygon points="60,14 88,30 88,66 60,82 32,66 32,30" fill="${pal.primary}" fill-opacity="0.42" stroke="${pal.secondary}" stroke-width="2.2"/>
        <path d="M40,28 L80,68 M80,28 L40,68" stroke="#ffffff" stroke-width="3.6" stroke-linecap="round"/>
        <circle cx="60" cy="48" r="8" fill="${pal.secondary}"/>
      `;
      break;

    case 'cathedral_judgment':
    default:
      motif = `
        <polygon points="60,10 70,38 98,48 70,58 60,86 50,58 22,48 50,38" fill="${pal.primary}" fill-opacity="0.6" stroke="#ffffff" stroke-width="2"/>
        <circle cx="60" cy="48" r="24" fill="none" stroke="${pal.secondary}" stroke-width="2"/>
        <circle cx="60" cy="48" r="7" fill="#ffffff"/>
      `;
      break;
  }

  return `
    <svg class="tarot-svg" viewBox="0 0 120 96" aria-hidden="true">
      <defs>
        <radialGradient id="${uid}" cx="50%" cy="50%" r="55%">
          <stop offset="0%" stop-color="${pal.glow}" stop-opacity="0.38"/>
          <stop offset="100%" stop-color="${pal.dark}" stop-opacity="0.95"/>
        </radialGradient>
      </defs>
      <rect x="3" y="3" width="114" height="90" rx="6" fill="url(#${uid})" stroke="${pal.primary}" stroke-width="1.5"/>
      <path d="M11 86 L11 28 Q60 4 109 28 L109 86" fill="none" stroke="${pal.secondary}" stroke-width="1.1" stroke-opacity="0.5"/>
      <circle cx="60" cy="48" r="33" fill="none" stroke="${pal.primary}" stroke-width="1" stroke-dasharray="3 3" stroke-opacity="0.65"/>
      ${motif}
    </svg>
  `;
}

/**
 * Render 6 Distinct Arch-Inquisitor Boss Heraldic Portraits (`viewBox="0 0 80 80"`)
 */
export function renderBossCrestSVG(bossId, color = '#e11d48') {
  let inner = '';
  switch (bossId) {
    case 'boss_malakor':
      // Warden of the Iron Gate: Portcullis Great-Helm & Spiked Crown
      inner = `
        <path d="M22,24 L40,12 L58,24 L56,62 L40,70 L24,62 Z" fill="#181224" stroke="${color}" stroke-width="2.4"/>
        <line x1="32" y1="24" x2="32" y2="64" stroke="#fde68a" stroke-width="2"/>
        <line x1="40" y1="18" x2="40" y2="68" stroke="#fde68a" stroke-width="2.2"/>
        <line x1="48" y1="24" x2="48" y2="64" stroke="#fde68a" stroke-width="2"/>
        <rect x="24" y="36" width="32" height="6" fill="${color}"/>
        <circle cx="33" cy="39" r="2.2" fill="#ffffff"/>
        <circle cx="47" cy="39" r="2.2" fill="#ffffff"/>
      `;
      break;

    case 'boss_vespera':
      // Keeper of the Bone Reliquary: Crowned Ossuary Skull & Soul-Lantern Halo
      inner = `
        <circle cx="40" cy="38" r="20" fill="#122024" stroke="${color}" stroke-width="2.4"/>
        <rect x="31" y="50" width="18" height="12" rx="2" fill="#122024" stroke="${color}" stroke-width="2"/>
        <polygon points="24,24 32,12 40,22 48,12 56,24" fill="${color}" stroke="#fde68a" stroke-width="1.5"/>
        <circle cx="33" cy="38" r="4.5" fill="${color}"/>
        <circle cx="47" cy="38" r="4.5" fill="${color}"/>
        <polygon points="40,42 43,48 37,48" fill="#fde68a"/>
      `;
      break;

    case 'boss_vorn':
      // Master of the Gargoyle Belfry: Horned Bronze Bell & Gargoyle Wings
      inner = `
        <path d="M12,30 L28,22 L24,48 Z M68,30 L52,22 L56,48 Z" fill="${color}" fill-opacity="0.45" stroke="#fde68a" stroke-width="1.5"/>
        <path d="M26,26 C26,16 54,16 54,26 L60,56 L20,56 Z" fill="#211510" stroke="${color}" stroke-width="2.5"/>
        <circle cx="40" cy="62" r="5.5" fill="#fde68a"/>
        <circle cx="34" cy="36" r="3" fill="#ffffff"/>
        <circle cx="46" cy="36" r="3" fill="#ffffff"/>
      `;
      break;

    case 'boss_thurible':
      // Censer-Prelate Morvain: Smoking Brimstone Thurible & Chains
      inner = `
        <line x1="40" y1="8" x2="26" y2="36" stroke="#fde68a" stroke-width="1.8" stroke-dasharray="3 2"/>
        <line x1="40" y1="8" x2="54" y2="36" stroke="#fde68a" stroke-width="1.8" stroke-dasharray="3 2"/>
        <polygon points="22,36 58,36 50,62 30,62" fill="#1d102b" stroke="${color}" stroke-width="2.4"/>
        <polygon points="40,20 48,36 32,36" fill="${color}" fill-opacity="0.6" stroke="#ffffff" stroke-width="1.6"/>
        <circle cx="40" cy="48" r="6" fill="#fde68a"/>
      `;
      break;

    case 'boss_carmilla':
      // Cardinal Sanguine: Sovereign Chalice & Crimson Rose Crown
      inner = `
        <path d="M24,20 H56 L50,44 C48,54 44,56 40,56 C36,56 32,54 30,44 Z" fill="#260812" stroke="${color}" stroke-width="2.5"/>
        <line x1="40" y1="56" x2="40" y2="68" stroke="#fde68a" stroke-width="3"/>
        <line x1="28" y1="68" x2="52" y2="68" stroke="#fde68a" stroke-width="3"/>
        <polygon points="40,10 47,26 40,38 33,26" fill="${color}" stroke="#ffffff" stroke-width="1.6"/>
      `;
      break;

    case 'boss_hollow_seraph':
    default:
      // The Hollow Seraph: Six-Winged Cruciform Automaton Mask
      inner = `
        <polygon points="40,8 48,32 72,40 48,48 40,72 32,48 8,40 32,32" fill="${color}" fill-opacity="0.52" stroke="#fde68a" stroke-width="1.8"/>
        <polygon points="40,14 62,26 62,54 40,66 18,54 18,26" fill="none" stroke="#ffffff" stroke-width="1.6"/>
        <circle cx="40" cy="40" r="10" fill="#140c1c" stroke="${color}" stroke-width="2.4"/>
        <circle cx="40" cy="40" r="4" fill="#ffffff"/>
      `;
      break;
  }

  return `
    <svg class="boss-crest-svg" viewBox="0 0 80 80" aria-hidden="true">
      <polygon points="40,3 73,19 73,61 40,77 7,61 7,19" fill="#120d1a" stroke="${color}" stroke-width="2.2"/>
      <circle cx="40" cy="40" r="30" fill="none" stroke="#d4a853" stroke-width="1" stroke-dasharray="4 2" opacity="0.65"/>
      ${inner}
    </svg>
  `;
}

/**
 * Render an ornate Gothic Stained-Glass Rose Window SVG (`viewBox="0 0 120 120"`) for Main Menu Hero
 */
export function renderRoseWindowSVG(accentColor = '#d4a853') {
  let petals = '';
  for (let i = 0; i < 8; i++) {
    const deg = i * 45;
    petals += `<ellipse cx="60" cy="28" rx="8" ry="18" fill="${
      i % 2 === 0 ? '#e11d48' : '#38bdf8'
    }" fill-opacity="0.32" stroke="${accentColor}" stroke-width="1.2" transform="rotate(${deg} 60 60)"/>`;
  }
  return `
    <svg class="rose-window-svg" viewBox="0 0 120 120" aria-hidden="true">
      <circle cx="60" cy="60" r="54" fill="rgba(14,10,22,0.85)" stroke="${accentColor}" stroke-width="2.4"/>
      <circle cx="60" cy="60" r="46" fill="none" stroke="${accentColor}" stroke-width="1" stroke-dasharray="4 3"/>
      ${petals}
      <circle cx="60" cy="60" r="14" fill="#181224" stroke="#fde68a" stroke-width="2"/>
      <polygon points="60,48 66,60 60,72 54,60" fill="#fde68a"/>
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
