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
 * Render 6 Playable Fantasy War Hero Character Bust Portraits (`viewBox="0 0 100 100"`)
 * AAA Multi-Layered Shaded Vector Art with metallic gradients, specular rim-lighting, shields, weapons, and glowing halos (Zero Crosses).
 */
export function renderFantasyHeroPortraitSVG(heroId = 'hero_paladin', color = '#f59e0b') {
  const uid = `hero_${heroId}`;
  let bust = '';
  switch (heroId) {
    case 'hero_valkyrie':
      // Shieldmaiden Freya: Silver Valkyrie Winged Diadem, Dragon-Scale Pauldrons, Valhallan Buckler & Gungnir Sky-Lance
      bust = `
        <!-- Storm Halo & Lightning Arcs -->
        <circle cx="50" cy="40" r="35" fill="none" stroke="#38bdf8" stroke-width="1.6" stroke-dasharray="6 3" opacity="0.85"/>
        <circle cx="50" cy="40" r="30" fill="none" stroke="#bae6fd" stroke-width="0.9" stroke-dasharray="2 4" opacity="0.6"/>
        <path d="M16,22 L24,30 L20,36 L27,42 M84,22 L76,30 L80,36 L73,42" fill="none" stroke="#e0f2fe" stroke-width="1.5" stroke-linecap="round"/>
        <!-- Royal Azure Cloak & Fur Mantle -->
        <path d="M12,93 C16,58 84,58 88,93 Z" fill="url(#${uid}_cloak)" stroke="#38bdf8" stroke-width="2.2"/>
        <!-- Layered Winged Pauldrons -->
        <path d="M6,82 Q13,54 39,62 L33,91 Z M94,82 Q87,54 61,62 L67,91 Z" fill="url(#${uid}_armor)" stroke="url(#${uid}_gold)" stroke-width="2.3"/>
        <path d="M11,72 Q20,60 35,66 M89,72 Q80,60 65,66" fill="none" stroke="#e0f2fe" stroke-width="1.5"/>
        <path d="M14,80 Q22,70 33,74 M86,80 Q78,70 67,74" fill="none" stroke="#38bdf8" stroke-width="1.2"/>
        <!-- Valkyrie Cuirass & Star-Crest -->
        <polygon points="32,62 68,62 61,93 39,93" fill="url(#${uid}_steel)" stroke="url(#${uid}_gold)" stroke-width="2.3"/>
        <polygon points="37,65 63,65 58,89 42,89" fill="none" stroke="#bae6fd" stroke-width="0.9" opacity="0.65"/>
        <polygon points="50,67 57,78 50,89 43,78" fill="#38bdf8" stroke="#ffffff" stroke-width="1.3"/>
        <circle cx="50" cy="78" r="2.6" fill="#ffffff"/>
        <!-- Left-Hand Round Valhallan Buckler Shield Rim -->
        <circle cx="20" cy="82" r="13" fill="url(#${uid}_steel)" stroke="url(#${uid}_gold)" stroke-width="2.2"/>
        <circle cx="20" cy="82" r="5" fill="#38bdf8" stroke="#ffffff" stroke-width="1.2"/>
        <!-- Double-Tiered Swept Feather-Wings on Helm -->
        <path d="M7,24 Q19,12 34,34 L30,48 Q15,36 7,24 Z M93,24 Q81,12 66,34 L70,48 Q85,36 93,24 Z" fill="url(#${uid}_gold)" stroke="#ffffff" stroke-width="1.5"/>
        <path d="M12,17 Q23,19 33,31 M88,17 Q77,19 67,31" fill="none" stroke="#fef08a" stroke-width="1.6"/>
        <path d="M13,31 L29,40 M87,31 L71,40" stroke="#38bdf8" stroke-width="1.5"/>
        <!-- Silver Great-Helm, Nasal Guard & Crowned Visor -->
        <path d="M31,31 C31,14 69,14 69,31 L64,59 L50,67 L36,59 Z" fill="url(#${uid}_steel)" stroke="url(#${uid}_gold)" stroke-width="2.5"/>
        <polygon points="35,23 42,11 50,20 58,11 65,23" fill="url(#${uid}_gold)" stroke="#ffffff" stroke-width="1.3"/>
        <line x1="50" y1="34" x2="50" y2="62" stroke="url(#${uid}_gold)" stroke-width="2"/>
        <!-- Glowing Cyan Eyes & Forehead Star Sapphire -->
        <polygon points="50,17 55,27 50,36 45,27" fill="#38bdf8" stroke="#ffffff" stroke-width="1.3"/>
        <polygon points="36,40 47,43 37,47" fill="#7dd3fc" filter="url(#${uid}_glow)"/>
        <polygon points="64,40 53,43 63,47" fill="#7dd3fc" filter="url(#${uid}_glow)"/>
        <circle cx="42" cy="43.5" r="1.7" fill="#ffffff"/>
        <circle cx="58" cy="43.5" r="1.7" fill="#ffffff"/>
        <!-- Gungnir Sky-Lance with Storm Ring -->
        <circle cx="83" cy="21" r="7.5" fill="none" stroke="#7dd3fc" stroke-width="1.3" stroke-dasharray="3 2"/>
        <line x1="83" y1="14" x2="75" y2="92" stroke="url(#${uid}_gold)" stroke-width="3.5"/>
        <polygon points="85,3 94,23 83,18 74,23" fill="#38bdf8" stroke="#ffffff" stroke-width="1.5"/>
      `;
      break;

    case 'hero_archmage':
      // Arch-Magus Kaelen: Deep Astral Hooded Cowl, High Gold Collar, Floating Runestones, Open Grimoire & Dawn-Star Staff
      bust = `
        <!-- Astral Constellation Halo & Orbiting Stars -->
        <circle cx="50" cy="39" r="35" fill="none" stroke="#c084fc" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.85"/>
        <circle cx="50" cy="39" r="29" fill="none" stroke="#fde68a" stroke-width="0.9" stroke-dasharray="2 3" opacity="0.6"/>
        <circle cx="23" cy="20" r="2.2" fill="#e9d5ff"/>
        <circle cx="77" cy="17" r="2.2" fill="#fde68a"/>
        <!-- High Arcane Gold Collar -->
        <path d="M22,46 Q50,28 78,46 L72,64 L28,64 Z" fill="url(#${uid}_armor)" stroke="url(#${uid}_gold)" stroke-width="2.2"/>
        <!-- Velvet Arcane Mantle & Gold-Runed Pauldrons -->
        <path d="M10,93 C14,57 86,57 90,93 Z" fill="url(#${uid}_cloak)" stroke="#c084fc" stroke-width="2.2"/>
        <polygon points="8,74 36,60 31,90 7,90" fill="url(#${uid}_armor)" stroke="url(#${uid}_gold)" stroke-width="2.2"/>
        <polygon points="92,74 64,60 69,90 93,90" fill="url(#${uid}_armor)" stroke="url(#${uid}_gold)" stroke-width="2.2"/>
        <polygon points="50,66 58,78 50,90 42,78" fill="#c084fc" stroke="#fef08a" stroke-width="1.5"/>
        <circle cx="50" cy="78" r="3" fill="#ffffff"/>
        <!-- Levitating Open Spell Grimoire (Left Foreground) -->
        <polygon points="10,77 25,72 28,86 13,90" fill="#fef3c7" stroke="url(#${uid}_gold)" stroke-width="1.6"/>
        <polygon points="25,72 38,76 36,89 28,86" fill="#fde68a" stroke="url(#${uid}_gold)" stroke-width="1.6"/>
        <circle cx="24" cy="79" r="2.5" fill="#c084fc"/>
        <!-- Sculpted Arch-Mage Hood & Deep Void Inner Shadow -->
        <path d="M50,9 L77,32 L69,64 L31,64 L23,32 Z" fill="url(#${uid}_armor)" stroke="url(#${uid}_gold)" stroke-width="2.5"/>
        <path d="M34,33 L50,18 L66,33 L61,59 L39,59 Z" fill="#070210" stroke="#a855f7" stroke-width="1.7"/>
        <!-- Glowing Arcane Eyes & Astral Crown -->
        <polygon points="36,21 44,12 50,19 56,12 64,21" fill="url(#${uid}_gold)" stroke="#ffffff" stroke-width="1.2"/>
        <polygon points="50,14 54,23 50,31 46,23" fill="#fde68a" stroke="#ffffff" stroke-width="1.1"/>
        <polygon points="38,42 47,39 45,46" fill="#f3e8ff" filter="url(#${uid}_glow)"/>
        <polygon points="62,42 53,39 55,46" fill="#f3e8ff" filter="url(#${uid}_glow)"/>
        <circle cx="43" cy="42.5" r="1.8" fill="#ffffff"/>
        <circle cx="57" cy="42.5" r="1.8" fill="#ffffff"/>
        <!-- Floating Crystal Runestone & Dawn-Star Astrolabe Staff -->
        <polygon points="16,27 22,16 28,27 22,38" fill="#c084fc" stroke="#ffffff" stroke-width="1.5"/>
        <circle cx="84" cy="22" r="9" fill="none" stroke="url(#${uid}_gold)" stroke-width="1.5" stroke-dasharray="4 2"/>
        <polygon points="84,9 93,22 84,35 75,22" fill="#38bdf8" stroke="#fef08a" stroke-width="1.6"/>
        <circle cx="84" cy="22" r="3.8" fill="#ffffff"/>
        <line x1="84" y1="35" x2="77" y2="92" stroke="url(#${uid}_gold)" stroke-width="3.4"/>
      `;
      break;

    case 'hero_dragonknight':
      // Dragon-Lord Draven: Horned Crimson Wyrm-Helm, Swept Dragon Wings, Molten Heart Core & Ember-Wyrm Halberd
      bust = `
        <!-- Molten Dragonfire Halo -->
        <circle cx="50" cy="41" r="35" fill="none" stroke="#f97316" stroke-width="1.6" stroke-dasharray="5 3" opacity="0.85"/>
        <!-- Articulated Swept Dragon Wings Behind Back -->
        <path d="M4,42 L18,16 L32,38 L22,56 Z M96,42 L82,16 L68,38 L78,56 Z" fill="url(#${uid}_cloak)" stroke="url(#${uid}_gold)" stroke-width="1.8"/>
        <circle cx="18" cy="16" r="2.2" fill="#fef08a"/>
        <circle cx="82" cy="16" r="2.2" fill="#fef08a"/>
        <!-- Swept Dragon-Scale Pauldrons & Torso -->
        <path d="M7,93 L13,56 L39,65 L34,93 Z M93,93 L87,56 L61,65 L66,93 Z" fill="url(#${uid}_cloak)" stroke="url(#${uid}_gold)" stroke-width="2.3"/>
        <polygon points="30,64 70,64 63,93 37,93" fill="url(#${uid}_armor)" stroke="url(#${uid}_gold)" stroke-width="2.3"/>
        <!-- Blazing Dragon-Heart Furnace Core -->
        <circle cx="50" cy="78" r="8" fill="#f97316" stroke="#fef08a" stroke-width="2"/>
        <polygon points="50,71 55,78 50,85 45,78" fill="#ffffff"/>
        <!-- Swept Golden Wyrm Horns -->
        <path d="M32,32 Q8,14 15,5 Q26,15 39,25 Z" fill="url(#${uid}_gold)" stroke="#ffffff" stroke-width="1.6"/>
        <path d="M68,32 Q92,14 85,5 Q74,15 61,25 Z" fill="url(#${uid}_gold)" stroke="#ffffff" stroke-width="1.6"/>
        <!-- Armored Dragon Helm & Dorsal Crest -->
        <polygon points="50,12 71,28 65,59 50,68 35,59 29,28" fill="url(#${uid}_armor)" stroke="url(#${uid}_gold)" stroke-width="2.5"/>
        <polygon points="50,8 56,24 50,35 44,24" fill="#fbbf24" stroke="#ffffff" stroke-width="1.3"/>
        <!-- Blazing Slit Dragon Eyes & Fang Visor -->
        <polygon points="35,38 48,43 36,47" fill="#fef08a" filter="url(#${uid}_glow)"/>
        <polygon points="65,38 52,43 64,47" fill="#fef08a" filter="url(#${uid}_glow)"/>
        <line x1="50" y1="32" x2="50" y2="63" stroke="url(#${uid}_gold)" stroke-width="2.4"/>
        <path d="M39,53 L44,58 L50,54 L56,58 L61,53" fill="none" stroke="#f97316" stroke-width="1.6"/>
        <!-- Ember-Wyrm Halberd -->
        <line x1="84" y1="14" x2="78" y2="92" stroke="url(#${uid}_gold)" stroke-width="3.4"/>
        <path d="M84,5 L96,21 L82,29 L76,18 Z" fill="#f97316" stroke="#fef08a" stroke-width="1.5"/>
        <circle cx="84" cy="19" r="2.4" fill="#ffffff"/>
      `;
      break;

    case 'hero_ranger':
      // Sylvan Warden Lyra: Multi-Pronged Royal Antler Diadem, Emerald Leaf-Plate & Starlight Whisper-Bow with Drawn Star-Arrow
      bust = `
        <!-- Starlight Forest Halo & Floating Spores -->
        <circle cx="50" cy="41" r="34" fill="none" stroke="#2dd4bf" stroke-width="1.5" stroke-dasharray="5 3" opacity="0.82"/>
        <circle cx="22" cy="28" r="1.8" fill="#99f6e4"/>
        <circle cx="75" cy="24" r="1.8" fill="#fef08a"/>
        <!-- Back Quiver Feathers -->
        <polygon points="18,36 12,18 22,22 25,38" fill="#2dd4bf" stroke="url(#${uid}_gold)" stroke-width="1.2"/>
        <!-- Emerald Ranger Cloak & Leaf Pauldrons -->
        <path d="M11,93 C15,59 85,59 89,93 Z" fill="url(#${uid}_cloak)" stroke="#2dd4bf" stroke-width="2.2"/>
        <path d="M9,76 Q21,55 39,65 L31,91 Z M91,76 Q79,55 61,65 L69,91 Z" fill="url(#${uid}_armor)" stroke="url(#${uid}_gold)" stroke-width="2.2"/>
        <path d="M14,74 Q24,63 35,68 M86,74 Q76,63 65,68" fill="none" stroke="#5eead4" stroke-width="1.4"/>
        <!-- Emerald Star Brooch -->
        <polygon points="50,67 56,78 50,89 44,78" fill="#2dd4bf" stroke="#ffffff" stroke-width="1.4"/>
        <circle cx="50" cy="78" r="2.6" fill="#ffffff"/>
        <!-- Multi-Pronged Royal Golden Antler Diadem -->
        <path d="M35,26 L16,7 M25,16 L12,16 M29,21 L21,9 M65,26 L84,7 M75,16 L88,16 M71,21 L79,9" stroke="url(#${uid}_gold)" stroke-width="2.8" stroke-linecap="round"/>
        <!-- Sylvan Hood, Masked Lower Face & Star Gem -->
        <path d="M50,11 L73,32 L65,63 L35,63 L27,32 Z" fill="url(#${uid}_armor)" stroke="#2dd4bf" stroke-width="2.4"/>
        <polygon points="36,46 50,52 64,46 60,61 50,65 40,61" fill="url(#${uid}_steel)" stroke="url(#${uid}_gold)" stroke-width="1.5"/>
        <polygon points="50,19 55,28 50,36 45,28" fill="#99f6e4" stroke="#ffffff" stroke-width="1.2"/>
        <polygon points="37,41 46,39 44,45" fill="#ccfbf1" filter="url(#${uid}_glow)"/>
        <polygon points="63,41 54,39 56,45" fill="#ccfbf1" filter="url(#${uid}_glow)"/>
        <!-- Starlight Whisper-Bow & Drawn Glowing Star-Arrow -->
        <path d="M80,10 Q97,50 76,91" fill="none" stroke="url(#${uid}_gold)" stroke-width="3.2"/>
        <line x1="80" y1="10" x2="76" y2="91" stroke="#99f6e4" stroke-width="1.5"/>
        <line x1="72" y1="49" x2="94" y2="47" stroke="#ffffff" stroke-width="2"/>
        <polygon points="97,47 89,43 91,47 89,51" fill="#5eead4" stroke="#ffffff" stroke-width="1"/>
      `;
      break;

    case 'hero_deathknight':
      // Runeblade Arthos: 5-Spire Glacial Ice-Crown, Spiked Dread-Plate & Winter-Star Greatsword
      bust = `
        <!-- Glacial Frost Halo & Ice Shards -->
        <circle cx="50" cy="40" r="35" fill="none" stroke="#60a5fa" stroke-width="1.6" stroke-dasharray="4 3" opacity="0.85"/>
        <polygon points="18,22 22,15 25,23" fill="#93c5fd"/>
        <polygon points="82,22 78,15 75,23" fill="#93c5fd"/>
        <!-- Spiked Glacial Pauldrons & Cuirass -->
        <polygon points="6,84 16,54 39,64 33,93" fill="url(#${uid}_armor)" stroke="#93c5fd" stroke-width="2.3"/>
        <polygon points="94,84 84,54 61,64 67,93" fill="url(#${uid}_armor)" stroke="#93c5fd" stroke-width="2.3"/>
        <polygon points="12,58 18,45 24,59" fill="url(#${uid}_steel)" stroke="#bfdbfe" stroke-width="1.5"/>
        <polygon points="88,58 82,45 76,59" fill="url(#${uid}_steel)" stroke="#bfdbfe" stroke-width="1.5"/>
        <polygon points="31,64 69,64 63,93 37,93" fill="url(#${uid}_steel)" stroke="url(#${uid}_gold)" stroke-width="2.3"/>
        <!-- Glowing Frost-Skull / Diamond Core on Chest -->
        <polygon points="50,68 57,79 50,90 43,79" fill="#60a5fa" stroke="#ffffff" stroke-width="1.4"/>
        <circle cx="50" cy="79" r="2.8" fill="#ffffff"/>
        <!-- 5-Spire Jagged Ice-Star Crown & Helm -->
        <polygon points="25,28 33,9 42,23 50,5 58,23 67,9 75,28" fill="url(#${uid}_steel)" stroke="#bfdbfe" stroke-width="2.1"/>
        <path d="M30,28 H70 L65,59 L50,68 L35,59 Z" fill="url(#${uid}_armor)" stroke="#60a5fa" stroke-width="2.5"/>
        <!-- Glowing Frost-Star Eyes & Skeletal Vent Grill -->
        <circle cx="41" cy="41" r="4.8" fill="#3b82f6" filter="url(#${uid}_glow)"/>
        <circle cx="59" cy="41" r="4.8" fill="#3b82f6" filter="url(#${uid}_glow)"/>
        <circle cx="41" cy="41" r="2.3" fill="#ffffff"/>
        <circle cx="59" cy="41" r="2.3" fill="#ffffff"/>
        <line x1="43" y1="52" x2="43" y2="61" stroke="#bfdbfe" stroke-width="2.2"/>
        <line x1="50" y1="51" x2="50" y2="63" stroke="#bfdbfe" stroke-width="2.4"/>
        <line x1="57" y1="52" x2="57" y2="61" stroke="#bfdbfe" stroke-width="2.2"/>
        <!-- Winter-Star Runeblade Greatsword -->
        <polygon points="84,5 90,18 86,91 78,91 78,18" fill="url(#${uid}_steel)" stroke="#bfdbfe" stroke-width="1.8"/>
        <line x1="84" y1="14" x2="82" y2="86" stroke="#60a5fa" stroke-width="1.6" stroke-dasharray="4 2"/>
      `;
      break;

    case 'hero_paladin':
    default:
      // High Paladin Aurelius: Sunforged Winged Crown-Helm, Lion Pauldrons, Heater Shield & Dawnbreaker Sun-Spear (Zero Crosses)
      bust = `
        <!-- Radiant Solar Starburst Halo -->
        <circle cx="50" cy="39" r="35" fill="none" stroke="url(#${uid}_gold)" stroke-width="2" stroke-dasharray="6 3" opacity="0.92"/>
        <circle cx="50" cy="39" r="29" fill="none" stroke="#fef08a" stroke-width="1.1" opacity="0.6"/>
        <!-- Sunforged Lion Pauldrons & Royal Cuirass -->
        <path d="M6,88 Q12,55 39,62 L34,93 Z M94,88 Q88,55 61,62 L66,93 Z" fill="url(#${uid}_cloak)" stroke="url(#${uid}_gold)" stroke-width="2.5"/>
        <path d="M11,74 Q21,60 36,67 M89,74 Q79,60 64,67" fill="none" stroke="#fef08a" stroke-width="1.8"/>
        <polygon points="32,62 68,62 61,93 39,93" fill="url(#${uid}_armor)" stroke="url(#${uid}_gold)" stroke-width="2.5"/>
        <!-- Solar Star Emblem on Chest -->
        <polygon points="50,66 58,78 50,90 42,78" fill="url(#${uid}_gold)" stroke="#ffffff" stroke-width="1.4"/>
        <circle cx="50" cy="78" r="3" fill="#ffffff"/>
        <!-- Left-Hand Sunforged Heater Shield Corner -->
        <polygon points="8,70 28,66 26,91 14,94 6,85" fill="url(#${uid}_steel)" stroke="url(#${uid}_gold)" stroke-width="2.2"/>
        <polygon points="17,73 22,80 17,87 12,80" fill="url(#${uid}_gold)" stroke="#ffffff" stroke-width="1"/>
        <!-- Golden Dragon-Feather Helm Wings & 5-Point Solar Crown -->
        <path d="M10,19 L32,35 L28,50 L7,31 Z M90,19 L68,35 L72,50 L93,31 Z" fill="url(#${uid}_gold)" stroke="#ffffff" stroke-width="1.6"/>
        <polygon points="32,25 39,8 46,19 50,6 54,19 61,8 68,25" fill="url(#${uid}_gold)" stroke="#ffffff" stroke-width="1.6"/>
        <!-- Royal Alabaster & Gold Great-Helm with Angled V-Visor -->
        <path d="M31,25 L50,16 L69,25 L64,58 L50,67 L36,58 Z" fill="url(#${uid}_steel)" stroke="url(#${uid}_gold)" stroke-width="2.6"/>
        <line x1="50" y1="35" x2="50" y2="63" stroke="url(#${uid}_gold)" stroke-width="2.2"/>
        <polygon points="36,38 48,42 36,46" fill="#fef08a" filter="url(#${uid}_glow)"/>
        <polygon points="64,38 52,42 64,46" fill="#fef08a" filter="url(#${uid}_glow)"/>
        <polygon points="50,23 55,31 50,39 45,31" fill="url(#${uid}_gold)" stroke="#ffffff" stroke-width="1.2"/>
        <!-- Dawnbreaker Upright Sun-Spear -->
        <line x1="84" y1="18" x2="79" y2="92" stroke="url(#${uid}_gold)" stroke-width="3.6"/>
        <polygon points="77,22 91,22 84,18" fill="url(#${uid}_gold)" stroke="#ffffff" stroke-width="1.2"/>
        <polygon points="85,3 94,21 84,15 75,21" fill="url(#${uid}_gold)" stroke="#ffffff" stroke-width="1.5"/>
      `;
      break;
  }

  return `
    <svg class="hero-portrait-svg" viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <filter id="${uid}_glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="1.4" result="blur"/>
          <feMerge>
            <feMergeNode in="blur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <radialGradient id="${uid}_bg" cx="50%" cy="38%" r="62%">
          <stop offset="0%" stop-color="${color}" stop-opacity="0.54"/>
          <stop offset="55%" stop-color="#1e1530" stop-opacity="0.94"/>
          <stop offset="100%" stop-color="#090610" stop-opacity="1"/>
        </radialGradient>
        <linearGradient id="${uid}_gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fef9c3"/>
          <stop offset="45%" stop-color="#f59e0b"/>
          <stop offset="100%" stop-color="#92400e"/>
        </linearGradient>
        <linearGradient id="${uid}_steel" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#64748b"/>
          <stop offset="45%" stop-color="#1e293b"/>
          <stop offset="100%" stop-color="#0f172a"/>
        </linearGradient>
        <linearGradient id="${uid}_armor" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#3730a3"/>
          <stop offset="50%" stop-color="#1e1b4b"/>
          <stop offset="100%" stop-color="#090714"/>
        </linearGradient>
        <linearGradient id="${uid}_cloak" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="${color}"/>
          <stop offset="100%" stop-color="#11091c"/>
        </linearGradient>
      </defs>
      <!-- Ornate Octagonal Royal Medallion Frame -->
      <polygon points="50,2 94,21 94,79 50,98 6,79 6,21" fill="url(#${uid}_bg)" stroke="url(#${uid}_gold)" stroke-width="2.8"/>
      <polygon points="50,6 90,23 90,77 50,94 10,77 10,23" fill="none" stroke="${color}" stroke-width="1.2" stroke-opacity="0.72"/>
      <!-- Corner Star Rivets -->
      <circle cx="50" cy="5" r="2.1" fill="#fef08a"/>
      <circle cx="50" cy="95" r="2.1" fill="#fef08a"/>
      <circle cx="9" cy="23" r="1.9" fill="#fef08a"/>
      <circle cx="91" cy="23" r="1.9" fill="#fef08a"/>
      <circle cx="9" cy="77" r="1.9" fill="#fef08a"/>
      <circle cx="91" cy="77" r="1.9" fill="#fef08a"/>
      ${bust}
    </svg>
  `;
}

/**
 * Render 6 Distinct Enemy Fantasy War Commander Portraits (`viewBox="0 0 80 80"`)
 * AAA Shaded Vector Art with metallic obsidian/crimson gradients, weapons, crowns, and glowing eyes (Zero Crosses).
 */
export function renderBossCrestSVG(bossId, color = '#e11d48') {
  const uid = `boss_${bossId}`;
  let inner = '';
  switch (bossId) {
    case 'boss_malakor':
      // Warlord Malakor the Ironclad: Spiked Black-Iron Juggernaut Bust, Horned Great-Helm & Dread Cleaver-Halberd
      inner = `
        <!-- Spiked Black-Iron Pauldrons & Cuirass -->
        <path d="M7,73 Q14,46 34,52 L29,75 Z M73,73 Q66,46 46,52 L51,75 Z" fill="url(#${uid}_steel)" stroke="url(#${uid}_gold)" stroke-width="2.2"/>
        <polygon points="27,53 53,53 49,75 31,75" fill="#11131a" stroke="${color}" stroke-width="1.8"/>
        <polygon points="40,57 45,65 40,73 35,65" fill="${color}" stroke="#ffffff" stroke-width="1"/>
        <!-- Swept Iron Horns -->
        <polygon points="10,12 26,27 19,35" fill="url(#${uid}_gold)" stroke="#ffffff" stroke-width="1.1"/>
        <polygon points="70,12 54,27 61,35" fill="url(#${uid}_gold)" stroke="#ffffff" stroke-width="1.1"/>
        <!-- Juggernaut Great-Helm & Glowing Slit Visor -->
        <path d="M21,22 L40,9 L59,22 L56,58 L40,67 L24,58 Z" fill="url(#${uid}_steel)" stroke="${color}" stroke-width="2.4"/>
        <polygon points="25,34 38,39 26,43" fill="${color}"/>
        <polygon points="55,34 42,39 54,43" fill="${color}"/>
        <circle cx="32" cy="38.5" r="2.2" fill="#ffffff"/>
        <circle cx="48" cy="38.5" r="2.2" fill="#ffffff"/>
        <polygon points="40,17 45,27 40,34 35,27" fill="url(#${uid}_gold)" stroke="#ffffff" stroke-width="1.1"/>
        <!-- Dread Cleaver-Halberd -->
        <line x1="67" y1="14" x2="63" y2="74" stroke="url(#${uid}_gold)" stroke-width="2.8"/>
        <polygon points="67,8 76,22 65,28" fill="${color}" stroke="#ffffff" stroke-width="1.2"/>
      `;
      break;

    case 'boss_vespera':
      // Lich-Empress Vespera: Undead Necromancer Queen with 5-Spire Bone Crown, Soul-Fire Eyes & Necrotic Staff
      inner = `
        <!-- Necrotic Mantle & Pauldrons -->
        <path d="M9,74 C14,48 66,48 71,74 Z" fill="url(#${uid}_steel)" stroke="${color}" stroke-width="2.2"/>
        <!-- Sculpted Skull Visage & Jaw -->
        <circle cx="40" cy="38" r="19" fill="url(#${uid}_steel)" stroke="url(#${uid}_gold)" stroke-width="2.4"/>
        <rect x="30" y="50" width="20" height="14" rx="2.5" fill="#101c22" stroke="url(#${uid}_gold)" stroke-width="2"/>
        <line x1="36" y1="51" x2="36" y2="63" stroke="#99f6e4" stroke-width="1.4"/>
        <line x1="40" y1="51" x2="40" y2="63" stroke="#99f6e4" stroke-width="1.4"/>
        <line x1="44" y1="51" x2="44" y2="63" stroke="#99f6e4" stroke-width="1.4"/>
        <!-- 5-Spire Bone & Gold Crown -->
        <polygon points="18,24 27,6 35,19 40,4 45,19 53,6 62,24" fill="url(#${uid}_gold)" stroke="#ffffff" stroke-width="1.4"/>
        <!-- Blazing Soul-Fire Eye Sockets -->
        <circle cx="33" cy="38" r="5" fill="${color}"/>
        <circle cx="47" cy="38" r="5" fill="${color}"/>
        <circle cx="33" cy="38" r="2.3" fill="#ffffff"/>
        <circle cx="47" cy="38" r="2.3" fill="#ffffff"/>
        <polygon points="40,42 43,48 37,48" fill="#fef08a"/>
        <!-- Twin-Skull Necrotic Staff -->
        <line x1="68" y1="18" x2="64" y2="74" stroke="url(#${uid}_gold)" stroke-width="2.6"/>
        <polygon points="68,8 74,17 68,26 62,17" fill="${color}" stroke="#ffffff" stroke-width="1.2"/>
      `;
      break;

    case 'boss_vorn':
      // General Vorn the Wyrm-Breaker: Horned Gargoyle Warlord with Swept Wings & Colossal Siege Maul
      inner = `
        <!-- Swept Gargoyle Pinions -->
        <path d="M5,24 L28,19 L23,56 Z M75,24 L52,19 L57,56 Z" fill="${color}" fill-opacity="0.62" stroke="url(#${uid}_gold)" stroke-width="1.9"/>
        <!-- Curved Ram/Wyrm Horns -->
        <path d="M20,6 L34,25 L24,28 Z M60,6 L46,25 L56,28 Z" fill="url(#${uid}_gold)" stroke="#ffffff" stroke-width="1.3"/>
        <!-- Armored Gargoyle Helm & Chest -->
        <path d="M24,25 C24,14 56,14 56,25 L62,60 L40,70 L18,60 Z" fill="url(#${uid}_steel)" stroke="url(#${uid}_gold)" stroke-width="2.5"/>
        <circle cx="40" cy="63" r="5.8" fill="url(#${uid}_gold)" stroke="#ffffff" stroke-width="1.3"/>
        <polygon points="29,35 38,39 30,42" fill="#ffffff"/>
        <polygon points="51,35 42,39 50,42" fill="#ffffff"/>
        <!-- Siege Great-Maul Head -->
        <rect x="61" y="12" width="13" height="9" rx="1.5" fill="url(#${uid}_steel)" stroke="url(#${uid}_gold)" stroke-width="1.6"/>
        <line x1="67" y1="21" x2="64" y2="74" stroke="url(#${uid}_gold)" stroke-width="2.8"/>
      `;
      break;

    case 'boss_thurible':
      // Pyromancer Morvain: Hell-Forge Warlock Mitre, Suspended Chains & Brimstone Furnace Core
      inner = `
        <!-- Hell-Forge Mantle & Furnace Core -->
        <path d="M10,74 C15,49 65,49 70,74 Z" fill="url(#${uid}_steel)" stroke="${color}" stroke-width="2.2"/>
        <circle cx="40" cy="64" r="6" fill="${color}" stroke="#fef08a" stroke-width="1.5"/>
        <!-- Suspended Golden Censer Chains -->
        <line x1="40" y1="6" x2="24" y2="35" stroke="url(#${uid}_gold)" stroke-width="2.2" stroke-dasharray="3 2"/>
        <line x1="40" y1="6" x2="56" y2="35" stroke="url(#${uid}_gold)" stroke-width="2.2" stroke-dasharray="3 2"/>
        <!-- Armored Censer Faceplate & Flaming Mitre Crown -->
        <polygon points="20,35 60,35 52,62 28,62" fill="url(#${uid}_steel)" stroke="url(#${uid}_gold)" stroke-width="2.4"/>
        <polygon points="40,10 54,35 26,35" fill="${color}" fill-opacity="0.78" stroke="#ffffff" stroke-width="1.6"/>
        <circle cx="33" cy="45" r="3.4" fill="#fef08a"/>
        <circle cx="47" cy="45" r="3.4" fill="#fef08a"/>
        <!-- Brimstone Flail Staff -->
        <line x1="67" y1="20" x2="64" y2="74" stroke="url(#${uid}_gold)" stroke-width="2.6"/>
        <polygon points="67,10 74,18 67,26 60,18" fill="#fef08a" stroke="${color}" stroke-width="1.4"/>
      `;
      break;

    case 'boss_carmilla':
      // Blood-Countess Carmilla: Vampiric Crimson Winged Collar, Ruby Tiara & Blood-Star Lance
      inner = `
        <!-- High Vampiric Bat-Wing Collar -->
        <path d="M6,23 L29,43 L14,72 Z M74,23 L51,43 L66,72 Z" fill="#4c0519" stroke="url(#${uid}_gold)" stroke-width="2.1"/>
        <!-- Aristocratic Silver Mask & Armor -->
        <path d="M22,22 H58 L52,50 C49,58 44,61 40,61 C36,61 31,58 28,50 Z" fill="url(#${uid}_steel)" stroke="url(#${uid}_gold)" stroke-width="2.5"/>
        <!-- Blood-Ruby Tiara Jewel -->
        <polygon points="40,6 50,23 40,35 30,23" fill="${color}" stroke="#ffffff" stroke-width="1.6"/>
        <circle cx="33.5" cy="40" r="3" fill="#fda4af"/>
        <circle cx="46.5" cy="40" r="3" fill="#fda4af"/>
        <circle cx="33.5" cy="40" r="1.4" fill="#ffffff"/>
        <circle cx="46.5" cy="40" r="1.4" fill="#ffffff"/>
        <!-- Crimson Blood-Lance -->
        <line x1="67" y1="18" x2="64" y2="74" stroke="url(#${uid}_gold)" stroke-width="2.6"/>
        <polygon points="68,6 74,22 67,18 61,22" fill="${color}" stroke="#ffffff" stroke-width="1.2"/>
      `;
      break;

    case 'boss_hollow_seraph':
    default:
      // The Abyssal War-God: Six-Winged Fallen Seraph Mask, Solar-Eclipse Crown & Twin-Pronged Spear
      inner = `
        <!-- 6 Fanned Golden & Violet Seraph Wings -->
        <polygon points="40,4 51,28 76,40 51,52 40,76 29,52 4,40 29,28" fill="${color}" fill-opacity="0.68" stroke="url(#${uid}_gold)" stroke-width="2.1"/>
        <polygon points="12,14 33,31 25,42 Z M68,14 47,31 55,42 Z M12,66 33,49 25,38 Z M68,66 47,49 55,38 Z" fill="url(#${uid}_gold)" opacity="0.85"/>
        <!-- Sacred Hexagram Frame & Eclipse Mask -->
        <polygon points="40,12 64,26 64,54 40,68 16,54 16,26" fill="none" stroke="#ffffff" stroke-width="1.6"/>
        <circle cx="40" cy="40" r="13" fill="url(#${uid}_steel)" stroke="url(#${uid}_gold)" stroke-width="2.5"/>
        <circle cx="40" cy="40" r="5.5" fill="#ffffff"/>
        <circle cx="35" cy="38" r="1.8" fill="${color}"/>
        <circle cx="45" cy="38" r="1.8" fill="${color}"/>
      `;
      break;
  }

  return `
    <svg class="boss-crest-svg" viewBox="0 0 80 80" aria-hidden="true">
      <defs>
        <radialGradient id="${uid}_bg" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stop-color="${color}" stop-opacity="0.5"/>
          <stop offset="100%" stop-color="#0b0712" stop-opacity="1"/>
        </radialGradient>
        <linearGradient id="${uid}_gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fef08a"/>
          <stop offset="50%" stop-color="#f59e0b"/>
          <stop offset="100%" stop-color="#92400e"/>
        </linearGradient>
        <linearGradient id="${uid}_steel" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#475569"/>
          <stop offset="50%" stop-color="#1e293b"/>
          <stop offset="100%" stop-color="#0f172a"/>
        </linearGradient>
      </defs>
      <polygon points="40,2 75,18 75,62 40,78 5,62 5,18" fill="url(#${uid}_bg)" stroke="url(#${uid}_gold)" stroke-width="2.5"/>
      <circle cx="40" cy="40" r="31" fill="none" stroke="${color}" stroke-width="1.3" stroke-dasharray="4 2" opacity="0.82"/>
      <circle cx="40" cy="5" r="1.9" fill="#fef08a"/>
      <circle cx="40" cy="75" r="1.9" fill="#fef08a"/>
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
