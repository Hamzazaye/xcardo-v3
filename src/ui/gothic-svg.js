/**
 * XcardO — 3D Fantasy War-Table Strategy
 * Master Fantasy War Character & Dark-Tarot Vector Art Suite:
 * - 6 Playable Fantasy War Hero Character Portraits (renderFantasyHeroPortraitSVG)
 * - 6 Enemy Fantasy War Commander Character Portraits (renderBossCrestSVG)
 * - 20 Bespoke War-Scroll Illustrations (renderTarotArtSVG)
 * - Rose Window, Wrought-Iron UI Icons & Sacred Geometry Blueprints
 */

const ORDER_PALETTES = {
  inquisition: { primary: '#e11d48', secondary: '#fda4af', dark: '#2a0812', glow: '#f43f5e' },
  sanctum: { primary: '#d97706', secondary: '#fde68a', dark: '#281805', glow: '#fbbf24' },
  blood: { primary: '#9f1239', secondary: '#fb7185', dark: '#22050d', glow: '#e11d48' },
  chronicle: { primary: '#0284c7', secondary: '#bae6fd', dark: '#071e2e', glow: '#38bdf8' },
  apocrypha: { primary: '#9333ea', secondary: '#e9d5ff', dark: '#1e0b36', glow: '#c084fc' },
};

/**
 * Render an engraved War-Scroll Card illustration SVG (`viewBox="0 0 120 96"`)
 * Every single one of the 20 War-Scroll cards has its own unique woodcut + stained-glass illustration.
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
        <circle cx="60" cy="48" r="24" fill="none" stroke="${pal.secondary}" stroke-width="2" stroke-dasharray="5 3"/>
        <polygon points="60,10 74,44 60,36 46,44" fill="${pal.primary}" stroke="#ffffff" stroke-width="2"/>
        <polygon points="60,34 67,84 53,84" fill="${pal.secondary}" fill-opacity="0.75"/>
        <circle cx="60" cy="48" r="7" fill="#ffffff"/>
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
        <polygon points="60,44 66,52 60,60 54,52" fill="#22050d" stroke="#ffffff" stroke-width="1.4"/>
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
        <circle cx="60" cy="48" r="19" fill="none" stroke="${pal.secondary}" stroke-width="1.8" stroke-dasharray="4 3"/>
        <polygon points="60,26 68,42 84,48 68,54 60,70 52,54 36,48 52,42" fill="#38bdf8" fill-opacity="0.7" stroke="#ffffff" stroke-width="1.6"/>
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

    case 'sunspear_volley':
      motif = `
        <line x1="26" y1="78" x2="88" y2="18" stroke="${pal.secondary}" stroke-width="3.5" stroke-linecap="round"/>
        <polygon points="94,12 72,20 84,32" fill="#ffffff" stroke="${pal.secondary}" stroke-width="1.6"/>
        <circle cx="60" cy="48" r="18" fill="${pal.primary}" fill-opacity="0.35" stroke="${pal.secondary}" stroke-width="1.8"/>
      `;
      break;

    case 'phalanx_wall':
      motif = `
        <rect x="20" y="34" width="24" height="30" rx="5" fill="${pal.primary}" fill-opacity="0.6" stroke="${pal.secondary}" stroke-width="2"/>
        <rect x="48" y="30" width="24" height="34" rx="5" fill="${pal.primary}" fill-opacity="0.8" stroke="#ffffff" stroke-width="2.2"/>
        <rect x="76" y="34" width="24" height="30" rx="5" fill="${pal.primary}" fill-opacity="0.6" stroke="${pal.secondary}" stroke-width="2"/>
      `;
      break;

    case 'column_phalanx':
      motif = `
        <rect x="46" y="14" width="28" height="20" rx="4" fill="${pal.primary}" fill-opacity="0.6" stroke="${pal.secondary}" stroke-width="2"/>
        <rect x="44" y="38" width="32" height="22" rx="4" fill="${pal.primary}" fill-opacity="0.85" stroke="#ffffff" stroke-width="2.2"/>
        <rect x="46" y="64" width="28" height="20" rx="4" fill="${pal.primary}" fill-opacity="0.6" stroke="${pal.secondary}" stroke-width="2"/>
      `;
      break;

    case 'diagonal_scythe':
      motif = `
        <path d="M24,74 Q54,20 94,22 Q66,42 52,74 Z" fill="${pal.primary}" fill-opacity="0.65" stroke="#ffffff" stroke-width="2"/>
        <line x1="22" y1="78" x2="96" y2="18" stroke="${pal.secondary}" stroke-width="2.2" stroke-dasharray="5 3"/>
      `;
      break;

    case 'soul_harvest':
      motif = `
        <circle cx="42" cy="42" r="12" fill="${pal.primary}" stroke="${pal.secondary}" stroke-width="2"/>
        <circle cx="78" cy="42" r="12" fill="${pal.primary}" stroke="${pal.secondary}" stroke-width="2"/>
        <circle cx="60" cy="62" r="14" fill="${pal.secondary}" fill-opacity="0.75" stroke="#ffffff" stroke-width="2.2"/>
      `;
      break;

    case 'chrono_reset':
      motif = `
        <polygon points="40,20 80,20 64,48 80,76 40,76 56,48" fill="${pal.primary}" fill-opacity="0.55" stroke="#ffffff" stroke-width="2.2"/>
        <circle cx="60" cy="48" r="5" fill="${pal.secondary}"/>
      `;
      break;

    case 'reliquary_summon':
      motif = `
        <rect x="34" y="38" width="52" height="36" rx="4" fill="${pal.primary}" fill-opacity="0.68" stroke="${pal.secondary}" stroke-width="2.4"/>
        <path d="M32,38 Q60,20 88,38 Z" fill="${pal.secondary}" fill-opacity="0.55" stroke="#ffffff" stroke-width="2"/>
        <rect x="55" y="46" width="10" height="14" rx="2" fill="#ffffff"/>
      `;
      break;

    case 'bomb_disposal':
      motif = `
        <circle cx="56" cy="54" r="22" fill="${pal.dark}" stroke="${pal.secondary}" stroke-width="2.6"/>
        <path d="M70,36 Q82,22 92,26" fill="none" stroke="#ffffff" stroke-width="2.5"/>
        <polygon points="92,16 96,26 104,26 97,32 100,40 92,34 84,40 87,32 80,26 88,26" fill="${pal.secondary}"/>
      `;
      break;

    case 'starlight_march':
      motif = `
        <polygon points="60,14 72,38 98,42 78,60 84,84 60,70 36,84 42,60 22,42 48,38" fill="${pal.primary}" fill-opacity="0.6" stroke="#ffffff" stroke-width="2"/>
        <circle cx="60" cy="50" r="10" fill="${pal.secondary}"/>
      `;
      break;

    case 'arcane_refinery':
      motif = `
        <circle cx="48" cy="48" r="16" fill="none" stroke="${pal.secondary}" stroke-width="3"/>
        <line x1="64" y1="48" x2="94" y2="48" stroke="#ffffff" stroke-width="3.2"/>
        <line x1="82" y1="48" x2="82" y2="62" stroke="${pal.secondary}" stroke-width="3"/>
        <line x1="92" y1="48" x2="92" y2="66" stroke="${pal.secondary}" stroke-width="3"/>
      `;
      break;

    case 'warhorn_anthem':
      motif = `
        <path d="M28,62 Q48,64 78,26 L92,44 Q58,76 28,62 Z" fill="${pal.primary}" fill-opacity="0.7" stroke="#ffffff" stroke-width="2.2"/>
        <circle cx="85" cy="35" r="11" fill="${pal.secondary}" fill-opacity="0.5" stroke="#ffffff" stroke-width="2"/>
      `;
      break;

    case 'obsidian_shatter_2x2':
      motif = `
        <rect x="32" y="22" width="24" height="24" fill="${pal.primary}" fill-opacity="0.65" stroke="#ffffff" stroke-width="1.8"/>
        <rect x="64" y="22" width="24" height="24" fill="${pal.primary}" fill-opacity="0.65" stroke="${pal.secondary}" stroke-width="1.8"/>
        <rect x="32" y="52" width="24" height="24" fill="${pal.primary}" fill-opacity="0.65" stroke="${pal.secondary}" stroke-width="1.8"/>
        <rect x="64" y="52" width="24" height="24" fill="${pal.primary}" fill-opacity="0.65" stroke="#ffffff" stroke-width="1.8"/>
      `;
      break;

    case 'blood_pact_strike':
      motif = `
        <polygon points="60,12 72,56 60,84 48,56" fill="${pal.primary}" stroke="#ffffff" stroke-width="2.2"/>
        <path d="M36,44 Q60,56 84,44" fill="none" stroke="${pal.secondary}" stroke-width="3"/>
        <circle cx="60" cy="34" r="6" fill="#ffffff"/>
      `;
      break;

    case 'mirror_column':
      motif = `
        <line x1="20" y1="48" x2="100" y2="48" stroke="#ffffff" stroke-width="2.5" stroke-dasharray="5 3"/>
        <polygon points="40,20 60,42 80,20" fill="${pal.primary}" fill-opacity="0.6" stroke="${pal.secondary}" stroke-width="2"/>
        <polygon points="40,76 60,54 80,76" fill="${pal.secondary}" fill-opacity="0.5" stroke="#ffffff" stroke-width="2"/>
      `;
      break;

    case 'corner_citadel':
      motif = `
        <rect x="24" y="20" width="16" height="16" fill="${pal.secondary}" stroke="#ffffff" stroke-width="1.5"/>
        <rect x="80" y="20" width="16" height="16" fill="${pal.secondary}" stroke="#ffffff" stroke-width="1.5"/>
        <rect x="24" y="60" width="16" height="16" fill="${pal.secondary}" stroke="#ffffff" stroke-width="1.5"/>
        <rect x="80" y="60" width="16" height="16" fill="${pal.secondary}" stroke="#ffffff" stroke-width="1.5"/>
        <rect x="40" y="36" width="40" height="24" fill="none" stroke="${pal.primary}" stroke-width="2"/>
      `;
      break;

    case 'void_banish_obstacle':
      motif = `
        <polygon points="38,76 48,28 72,28 82,76" fill="${pal.primary}" fill-opacity="0.45" stroke="${pal.secondary}" stroke-width="2"/>
        <polyline points="26,38 58,48 48,58 92,66" fill="none" stroke="#ffffff" stroke-width="3"/>
      `;
      break;

    case 'golden_consecration':
      motif = `
        <circle cx="60" cy="48" r="26" fill="${pal.primary}" fill-opacity="0.5" stroke="#ffffff" stroke-width="2.4"/>
        <polygon points="60,18 68,40 90,48 68,56 60,78 52,56 30,48 52,40" fill="${pal.secondary}" stroke="#ffffff" stroke-width="1.6"/>
        <circle cx="60" cy="48" r="6" fill="#281805"/>
      `;
      break;

    case 'temporal_echo':
      motif = `
        <circle cx="48" cy="48" r="20" fill="none" stroke="${pal.secondary}" stroke-width="2" stroke-dasharray="3 3"/>
        <circle cx="70" cy="48" r="20" fill="${pal.primary}" fill-opacity="0.55" stroke="#ffffff" stroke-width="2.4"/>
        <polyline points="70,36 70,48 80,54" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round"/>
      `;
      break;

    case 'inquisitor_edict':
      motif = `
        <line x1="18" y1="36" x2="102" y2="36" stroke="${pal.secondary}" stroke-width="3"/>
        <line x1="18" y1="60" x2="102" y2="60" stroke="${pal.secondary}" stroke-width="3"/>
        <circle cx="36" cy="48" r="7" fill="${pal.primary}" stroke="#ffffff" stroke-width="1.8"/>
        <circle cx="60" cy="48" r="7" fill="${pal.primary}" stroke="#ffffff" stroke-width="1.8"/>
        <circle cx="84" cy="48" r="7" fill="${pal.primary}" stroke="#ffffff" stroke-width="1.8"/>
      `;
      break;

    case 'apocrypha_omni':
      motif = `
        <polygon points="60,12 92,30 92,66 60,84 28,66 28,30" fill="${pal.primary}" fill-opacity="0.52" stroke="#ffffff" stroke-width="2.2"/>
        <polygon points="60,22 82,58 38,58" fill="none" stroke="${pal.secondary}" stroke-width="2"/>
        <polygon points="60,74 82,38 38,38" fill="none" stroke="#ffffff" stroke-width="2"/>
        <circle cx="60" cy="48" r="7" fill="${pal.secondary}"/>
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
        <radialGradient id="${uid}" cx="50%" cy="45%" r="60%">
          <stop offset="0%" stop-color="${pal.glow}" stop-opacity="0.48"/>
          <stop offset="55%" stop-color="${pal.primary}" stop-opacity="0.22"/>
          <stop offset="100%" stop-color="${pal.dark}" stop-opacity="0.98"/>
        </radialGradient>
        <linearGradient id="${uid}_foil" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fef08a"/>
          <stop offset="50%" stop-color="${pal.secondary}"/>
          <stop offset="100%" stop-color="#b45309"/>
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="116" height="92" rx="7" fill="url(#${uid})" stroke="url(#${uid}_foil)" stroke-width="2"/>
      <rect x="6" y="6" width="108" height="84" rx="4" fill="none" stroke="${pal.secondary}" stroke-width="0.8" stroke-opacity="0.45"/>
      <path d="M11 86 L11 26 Q60 3 109 26 L109 86" fill="none" stroke="url(#${uid}_foil)" stroke-width="1.2" stroke-opacity="0.65"/>
      <circle cx="60" cy="48" r="34" fill="none" stroke="${pal.secondary}" stroke-width="1.1" stroke-dasharray="4 2" stroke-opacity="0.72"/>
      <circle cx="11" cy="11" r="2.2" fill="#fef08a"/>
      <circle cx="109" cy="11" r="2.2" fill="#fef08a"/>
      <circle cx="11" cy="85" r="2.2" fill="#fef08a"/>
      <circle cx="109" cy="85" r="2.2" fill="#fef08a"/>
      ${motif}
    </svg>
  `;
}

/**
 * Render 6 Playable Fantasy War Hero Character Bust Portraits (`viewBox="0 0 120 120"`)
 * Embeds the Nano Banana HD painted RPG portraits (`assets/portraits/hero_*.jpg`) inside an ornate royal medallion SVG frame (Zero Crosses).
 */
export function renderFantasyHeroPortraitSVG(heroId = 'hero_paladin', color = '#f59e0b') {
  const validHeroes = new Set([
    'hero_paladin',
    'hero_valkyrie',
    'hero_archmage',
    'hero_dragonknight',
    'hero_ranger',
    'hero_deathknight',
  ]);
  const safeId = validHeroes.has(heroId) ? heroId : 'hero_paladin';
  const uid = `hero_${safeId}`;
  const imgHref = `assets/portraits/${safeId}.jpg`;

  let crestBadge = '';
  switch (safeId) {
    case 'hero_valkyrie':
      crestBadge = `<polygon points="60,104 67,112 60,118 53,112" fill="#38bdf8" stroke="#ffffff" stroke-width="1.2"/>`;
      break;
    case 'hero_archmage':
      crestBadge = `<polygon points="60,103 66,111 60,119 54,111" fill="#c084fc" stroke="#fef08a" stroke-width="1.2"/>`;
      break;
    case 'hero_dragonknight':
      crestBadge = `<circle cx="60" cy="111" r="6" fill="#f97316" stroke="#fef08a" stroke-width="1.4"/>`;
      break;
    case 'hero_ranger':
      crestBadge = `<polygon points="60,103 65,111 60,119 55,111" fill="#2dd4bf" stroke="#ffffff" stroke-width="1.2"/>`;
      break;
    case 'hero_deathknight':
      crestBadge = `<polygon points="60,102 67,111 60,119 53,111" fill="#60a5fa" stroke="#e0f2fe" stroke-width="1.2"/>`;
      break;
    case 'hero_paladin':
    default:
      crestBadge = `<polygon points="60,102 68,111 60,119 52,111" fill="#fbbf24" stroke="#ffffff" stroke-width="1.2"/>`;
      break;
  }

  return `
    <svg class="hero-portrait-svg" viewBox="0 0 120 120" aria-hidden="true">
      <defs>
        <clipPath id="${uid}_clip">
          <polygon points="60,5 111,26 111,94 60,115 9,94 9,26"/>
        </clipPath>
        <radialGradient id="${uid}_vignette" cx="50%" cy="45%" r="55%">
          <stop offset="62%" stop-color="#000000" stop-opacity="0"/>
          <stop offset="100%" stop-color="#07040d" stop-opacity="0.65"/>
        </radialGradient>
        <linearGradient id="${uid}_gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fef9c3"/>
          <stop offset="45%" stop-color="#f59e0b"/>
          <stop offset="100%" stop-color="#78350f"/>
        </linearGradient>
      </defs>
      <!-- Backdrop & Nano Banana Painted Character Portrait -->
      <polygon points="60,5 111,26 111,94 60,115 9,94 9,26" fill="#090610"/>
      <image href="${imgHref}" x="5" y="5" width="110" height="110" preserveAspectRatio="xMidYMid slice" clip-path="url(#${uid}_clip)"/>
      <polygon points="60,5 111,26 111,94 60,115 9,94 9,26" fill="url(#${uid}_vignette)"/>
      <!-- Ornate Octagonal Royal Medallion Frame -->
      <polygon points="60,3 113,25 113,95 60,117 7,95 7,25" fill="none" stroke="url(#${uid}_gold)" stroke-width="3.2"/>
      <polygon points="60,7 109,27 109,93 60,113 11,93 11,27" fill="none" stroke="${color}" stroke-width="1.3" stroke-opacity="0.82"/>
      <!-- Corner Star Rivets & Bottom Faction Jewel -->
      <circle cx="60" cy="5" r="2.3" fill="#fef08a"/>
      <circle cx="10" cy="26" r="2.1" fill="#fef08a"/>
      <circle cx="110" cy="26" r="2.1" fill="#fef08a"/>
      <circle cx="10" cy="94" r="2.1" fill="#fef08a"/>
      <circle cx="110" cy="94" r="2.1" fill="#fef08a"/>
      ${crestBadge}
    </svg>
  `;
}

/**
 * Render 6 Distinct Enemy Fantasy War Commander Portraits (`viewBox="0 0 120 120"`)
 * Embeds the Nano Banana HD painted RPG boss portraits (`assets/portraits/boss_*.jpg`) inside a dark-iron warlord medallion frame (Zero Crosses).
 */
export function renderBossCrestSVG(bossId = 'boss_malakor', color = '#e11d48') {
  const validBosses = new Set([
    'boss_malakor',
    'boss_vespera',
    'boss_vorn',
    'boss_thurible',
    'boss_carmilla',
    'boss_hollow_seraph',
  ]);
  const safeId = validBosses.has(bossId) ? bossId : 'boss_malakor';
  const uid = `boss_${safeId}`;
  const imgHref = `assets/portraits/${safeId}.jpg`;

  let bossGem = '';
  switch (safeId) {
    case 'boss_vespera':
      bossGem = `<polygon points="60,103 66,111 60,119 54,111" fill="#14b8a6" stroke="#ccfbf1" stroke-width="1.2"/>`;
      break;
    case 'boss_vorn':
      bossGem = `<rect x="55" y="106" width="10" height="10" rx="2" fill="#f97316" stroke="#fef08a" stroke-width="1.2"/>`;
      break;
    case 'boss_thurible':
      bossGem = `<circle cx="60" cy="111" r="5.5" fill="#a855f7" stroke="#f3e8ff" stroke-width="1.2"/>`;
      break;
    case 'boss_carmilla':
      bossGem = `<polygon points="60,102 67,111 60,119 53,111" fill="#e11d48" stroke="#fecdd3" stroke-width="1.2"/>`;
      break;
    case 'boss_hollow_seraph':
      bossGem = `<circle cx="60" cy="111" r="6" fill="#090610" stroke="#fde047" stroke-width="1.8"/>`;
      break;
    case 'boss_malakor':
    default:
      bossGem = `<polygon points="60,102 68,111 60,119 52,111" fill="#ef4444" stroke="#fef08a" stroke-width="1.2"/>`;
      break;
  }

  return `
    <svg class="boss-crest-svg" viewBox="0 0 120 120" aria-hidden="true">
      <defs>
        <clipPath id="${uid}_clip">
          <polygon points="60,5 111,26 111,94 60,115 9,94 9,26"/>
        </clipPath>
        <radialGradient id="${uid}_vignette" cx="50%" cy="45%" r="55%">
          <stop offset="60%" stop-color="#000000" stop-opacity="0"/>
          <stop offset="100%" stop-color="#09040c" stop-opacity="0.72"/>
        </radialGradient>
        <linearGradient id="${uid}_gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fef08a"/>
          <stop offset="50%" stop-color="#d97706"/>
          <stop offset="100%" stop-color="#7f1d1d"/>
        </linearGradient>
      </defs>
      <polygon points="60,5 111,26 111,94 60,115 9,94 9,26" fill="#08040b"/>
      <image href="${imgHref}" x="5" y="5" width="110" height="110" preserveAspectRatio="xMidYMid slice" clip-path="url(#${uid}_clip)"/>
      <polygon points="60,5 111,26 111,94 60,115 9,94 9,26" fill="url(#${uid}_vignette)"/>
      <polygon points="60,3 113,25 113,95 60,117 7,95 7,25" fill="none" stroke="url(#${uid}_gold)" stroke-width="3.2"/>
      <polygon points="60,7 109,27 109,93 60,113 11,93 11,27" fill="none" stroke="${color}" stroke-width="1.4" stroke-opacity="0.85"/>
      <circle cx="60" cy="5" r="2.3" fill="#fef08a"/>
      <circle cx="10" cy="26" r="2" fill="${color}"/>
      <circle cx="110" cy="26" r="2" fill="${color}"/>
      <circle cx="10" cy="94" r="2" fill="${color}"/>
      <circle cx="110" cy="94" r="2" fill="${color}"/>
      ${bossGem}
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
 * Render Wrought-Iron & War-Table UI Icons (`viewBox="0 0 24 24"`)
 * Unified 1.8px stroke vector icon family (`ui-ux-pro-max` compliant — zero structural emojis).
 */
export function renderGothicIconSVG(name) {
  switch (name) {
    case 'sword':
      return `<svg class="gothic-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 4.5L19.5 9.5L9 20H4V15L14.5 4.5Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M12 7L17 12M4 20L8 16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`;
    case 'castle':
    case 'home':
      return `<svg class="gothic-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 21H21V9L18 9V5H15V8H9V5H6V9L3 9V21Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M10 21V15A2 2 0 0 1 14 15V21" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>`;
    case 'map':
      return `<svg class="gothic-icon" viewBox="0 0 24 24" aria-hidden="true"><polygon points="3,6 9,3 15,6 21,3 21,18 15,21 9,18 3,21" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><line x1="9" y1="3" x2="9" y2="18" stroke="currentColor" stroke-width="1.8"/><line x1="15" y1="6" x2="15" y2="21" stroke="currentColor" stroke-width="1.8"/></svg>`;
    case 'scroll':
    case 'cards':
      return `<svg class="gothic-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4H17A2 2 0 0 1 19 6V18A2 2 0 0 1 17 20H6A2 2 0 0 1 4 18V6A2 2 0 0 1 6 4Z" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8 9H15M8 13H15M8 17H12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`;
    case 'dice':
    case 'modes':
      return `<svg class="gothic-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="3" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="8.5" cy="8.5" r="1.4" fill="currentColor"/><circle cx="15.5" cy="8.5" r="1.4" fill="currentColor"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/><circle cx="8.5" cy="15.5" r="1.4" fill="currentColor"/><circle cx="15.5" cy="15.5" r="1.4" fill="currentColor"/></svg>`;
    case 'book':
    case 'story':
      return `<svg class="gothic-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 5C5 4 9 4 12 6C15 4 19 4 22 5V19C19 18 15 18 12 20C9 18 5 18 2 19V5Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><line x1="12" y1="6" x2="12" y2="20" stroke="currentColor" stroke-width="1.8"/></svg>`;
    case 'shop':
      return `<svg class="gothic-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9L5 4H19L21 9" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M3 9C3 10.7 4.3 12 6 12C7.7 12 9 10.7 9 9C9 10.7 10.3 12 12 12C13.7 12 15 10.7 15 9C15 10.7 16.3 12 18 12C19.7 12 21 10.7 21 9" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M5 12V20H19V12" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>`;
    case 'leaf':
      return `<svg class="gothic-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.4 19 2C19 7 18.5 13.5 11 20Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M5 21C7 17 10 14 14 11" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`;
    case 'coin':
      return `<svg class="gothic-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.8"/><polygon points="12,6 15,12 12,18 9,12" fill="currentColor"/></svg>`;
    case 'star':
      return `<svg class="gothic-icon" viewBox="0 0 24 24" aria-hidden="true"><polygon points="12,2 15,9 22,9.5 16.8,14.2 18.5,21.5 12,17.5 5.5,21.5 7.2,14.2 2,9.5 9,9" fill="currentColor" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/></svg>`;
    case 'refresh':
      return `<svg class="gothic-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 4V10H15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M20.49 15A9 9 0 1 1 18.36 5.64L21 10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`;
    case 'chest':
      return `<svg class="gothic-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="6" width="18" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><line x1="3" y1="11" x2="21" y2="11" stroke="currentColor" stroke-width="1.8"/><rect x="10" y="9" width="4" height="4" rx="1" fill="currentColor"/></svg>`;
    case 'target':
    case 'threat':
      return `<svg class="gothic-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="2.5" fill="currentColor"/><path d="M12 2V5M12 19V22M2 12H5M19 12H22" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`;
    case 'grid':
      return `<svg class="gothic-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1" fill="none" stroke="currentColor" stroke-width="1.8"/><rect x="14" y="3" width="7" height="7" rx="1" fill="none" stroke="currentColor" stroke-width="1.8"/><rect x="3" y="14" width="7" height="7" rx="1" fill="none" stroke="currentColor" stroke-width="1.8"/><rect x="14" y="14" width="7" height="7" rx="1" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>`;
    case 'chalice':
      return `<svg class="gothic-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4H18L16 12C15.5 14.5 13.5 16 12 16C10.5 16 8.5 14.5 8 12L6 4Z" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 16V20M8 20H16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`;
    case 'bell':
      return `<svg class="gothic-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8A6 6 0 0 0 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M13.73 21A2 2 0 0 1 10.27 21" stroke="currentColor" stroke-width="1.8"/></svg>`;
    case 'camera':
      return `<svg class="gothic-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M23 19A2 2 0 0 1 21 21H3A2 2 0 0 1 1 19V8A2 2 0 0 1 3 6H7L9 3H15L17 6H21A2 2 0 0 1 23 8V19Z" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="13" r="4" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>`;
    case 'shatter':
    case 'spark':
      return `<svg class="gothic-icon" viewBox="0 0 24 24" aria-hidden="true"><polygon points="12,2 15,9 22,12 15,15 12,22 9,15 2,12 9,9" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>`;
    case 'eye':
      return `<svg class="gothic-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M1 12S5 4 12 4S23 12 23 12S19 20 12 20S1 12 1 12Z" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="3" fill="currentColor"/></svg>`;
    case 'undo':
      return `<svg class="gothic-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7V13H9" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M21 17A9 9 0 0 0 6 8.3L3 13" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`;
    case 'crown':
      return `<svg class="gothic-icon" viewBox="0 0 24 24" aria-hidden="true"><polygon points="2,19 22,19 20,7 15,12 12,5 9,12 4,7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>`;
    case 'lock':
      return `<svg class="gothic-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8 11V7A4 4 0 0 1 16 7V11" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>`;
    case 'unlock':
      return `<svg class="gothic-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8 11V7A4 4 0 0 1 15.5 5.2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`;
    case 'close':
      return `<svg class="gothic-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
    case 'shield':
      return `<svg class="gothic-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2L20 6V12C20 17 16.5 20.5 12 22C7.5 20.5 4 17 4 12V6L12 2Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><polygon points="12,7 15,12 12,17 9,12" fill="currentColor"/></svg>`;
    case 'skull':
      return `<svg class="gothic-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3C7.5 3 4 6.5 4 11C4 13.8 5.5 16.2 7.5 17.5V21H16.5V17.5C18.5 16.2 20 13.8 20 11C20 6.5 16.5 3 12 3Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="9" cy="11.5" r="1.8" fill="currentColor"/><circle cx="15" cy="11.5" r="1.8" fill="currentColor"/><line x1="10" y1="18" x2="10" y2="21" stroke="currentColor" stroke-width="1.6"/><line x1="14" y1="18" x2="14" y2="21" stroke="currentColor" stroke-width="1.6"/></svg>`;
    case 'bomb':
      return `<svg class="gothic-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="14" r="7" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M16 9L19 6M18 4L20 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><polygon points="20,2 21,5 23,5 21,7 22,9 20,7 18,9 19,7 17,5 19,5" fill="currentColor"/></svg>`;
    case 'bolt':
      return `<svg class="gothic-icon" viewBox="0 0 24 24" aria-hidden="true"><polygon points="13,2 4,14 11,14 10,22 20,10 13,10" fill="currentColor" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>`;
    case 'trophy':
      return `<svg class="gothic-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4H17V10C17 13 14.8 15 12 15C9.2 15 7 13 7 10V4Z" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M7 6H4V9C4 11 5.5 12 7 12M17 6H20V9C20 11 18.5 12 17 12M12 15V20M8 20H16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`;
    case 'check':
      return `<svg class="gothic-icon" viewBox="0 0 24 24" aria-hidden="true"><polyline points="4,12 9.5,17.5 20,6.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    case 'compass':
      return `<svg class="gothic-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.8"/><polygon points="15.5,8.5 13.5,13.5 8.5,15.5 10.5,10.5" fill="currentColor"/></svg>`;
    case 'sigil':
    default:
      return `<svg class="gothic-icon" viewBox="0 0 24 24" aria-hidden="true"><polygon points="12,2 21,12 12,22 3,12" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="3" fill="currentColor"/></svg>`;
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

/**
 * Render a 3×3 Mini Tactical Board Preview SVG (`viewBox="0 0 42 42"`) for War-Scrolls and Sacred Relics
 */
export function renderMiniBoardPreviewSVG(cells = [[1, 1]], mode = 'strike') {
  const activeSet = new Set((cells || [[1, 1]]).map(([r, c]) => `${r},${c}`));
  const fillCol =
    mode === 'ally' ? '#38bdf8' : mode === 'deploy' ? '#f59e0b' : '#e11d48';
  const strokeCol =
    mode === 'ally' ? '#bae6fd' : mode === 'deploy' ? '#fde68a' : '#fda4af';

  let tiles = '';
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const active = activeSet.has(`${r},${c}`);
      const isCenter = r === 1 && c === 1;
      tiles += `<rect x="${3 + c * 12.5}" y="${3 + r * 12.5}" width="10.5" height="10.5" rx="2" fill="${
        active ? fillCol : '#130e1c'
      }" fill-opacity="${active ? '0.88' : '0.95'}" stroke="${
        active ? strokeCol : '#382c4c'
      }" stroke-width="${isCenter && active ? '1.6' : '1'}"/>`;
      if (isCenter && active) {
        tiles += `<circle cx="${8.25 + c * 12.5}" cy="${8.25 + r * 12.5}" r="2.1" fill="#ffffff"/>`;
      }
    }
  }
  return `<svg class="mini-board-preview-svg" viewBox="0 0 42 42" aria-hidden="true">${tiles}</svg>`;
}
