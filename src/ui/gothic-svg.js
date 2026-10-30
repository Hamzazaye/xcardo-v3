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
 * AAA Multi-Layered Shaded Vector Art with metallic gradients, glowing halos, and detailed armor/weapons (Zero Crosses).
 */
export function renderFantasyHeroPortraitSVG(heroId = 'hero_paladin', color = '#f59e0b') {
  const uid = `hero_${heroId}`;
  let bust = '';
  switch (heroId) {
    case 'hero_valkyrie':
      // Shieldmaiden Freya: Silver Valkyrie Winged Diadem, Dragon-Scale Pauldrons & Sky-Lance
      bust = `
        <!-- Storm Halo & Lightning Arcs -->
        <circle cx="50" cy="42" r="33" fill="none" stroke="#38bdf8" stroke-width="1.4" stroke-dasharray="6 3" opacity="0.75"/>
        <path d="M18,24 L26,32 L22,38 M82,24 L74,32 L78,38" fill="none" stroke="#bae6fd" stroke-width="1.5" stroke-linecap="round"/>
        <!-- Royal Azure Cloak -->
        <path d="M14,93 C17,60 83,60 86,93 Z" fill="url(#${uid}_cloak)" stroke="#38bdf8" stroke-width="2"/>
        <!-- Layered Winged Pauldrons -->
        <path d="M7,82 Q14,56 38,64 L33,90 Z M93,82 Q86,56 62,64 L67,90 Z" fill="url(#${uid}_armor)" stroke="url(#${uid}_gold)" stroke-width="2.2"/>
        <path d="M12,74 Q20,62 34,68 M88,74 Q80,62 66,68" fill="none" stroke="#e0f2fe" stroke-width="1.4"/>
        <!-- Valkyrie Cuirass & Star-Crest -->
        <polygon points="33,64 67,64 61,93 39,93" fill="url(#${uid}_steel)" stroke="url(#${uid}_gold)" stroke-width="2.2"/>
        <polygon points="50,69 56,79 50,89 44,79" fill="#38bdf8" stroke="#ffffff" stroke-width="1.2"/>
        <!-- Swept Feather-Wings on Helm -->
        <path d="M9,26 Q20,16 34,36 L30,48 Q16,38 9,26 Z M91,26 Q80,16 66,36 L70,48 Q84,38 91,26 Z" fill="url(#${uid}_gold)" stroke="#ffffff" stroke-width="1.4"/>
        <path d="M14,32 L28,40 M86,32 L72,40" stroke="#38bdf8" stroke-width="1.4"/>
        <!-- Silver Great-Helm & Crowned Visor -->
        <path d="M32,32 C32,15 68,15 68,32 L64,59 L50,66 L36,59 Z" fill="url(#${uid}_steel)" stroke="url(#${uid}_gold)" stroke-width="2.4"/>
        <polygon points="36,24 43,13 50,21 57,13 64,24" fill="url(#${uid}_gold)" stroke="#ffffff" stroke-width="1.2"/>
        <!-- Glowing Cyan Eyes & Forehead Star Sapphire -->
        <polygon points="50,18 55,28 50,37 45,28" fill="#38bdf8" stroke="#ffffff" stroke-width="1.3"/>
        <polygon points="37,41 47,44 38,47" fill="#7dd3fc"/>
        <polygon points="63,41 53,44 62,47" fill="#7dd3fc"/>
        <circle cx="42" cy="44" r="1.6" fill="#ffffff"/>
        <circle cx="58" cy="44" r="1.6" fill="#ffffff"/>
        <!-- Gungnir Sky-Lance -->
        <line x1="83" y1="14" x2="75" y2="92" stroke="url(#${uid}_gold)" stroke-width="3.4"/>
        <polygon points="85,4 93,23 83,18 75,23" fill="#38bdf8" stroke="#ffffff" stroke-width="1.5"/>
      `;
      break;

    case 'hero_archmage':
      // Arch-Magus Kaelen: Deep Astral Hooded Cowl, Floating Runestones & Dawn-Star Staff
      bust = `
        <!-- Astral Constellation Halo -->
        <circle cx="50" cy="40" r="34" fill="none" stroke="#c084fc" stroke-width="1.4" stroke-dasharray="4 3" opacity="0.8"/>
        <circle cx="24" cy="22" r="2" fill="#e9d5ff"/>
        <circle cx="76" cy="18" r="2" fill="#fde68a"/>
        <!-- Velvet Arcane Mantle & Gold-Runed Pauldrons -->
        <path d="M11,93 C15,58 85,58 89,93 Z" fill="url(#${uid}_cloak)" stroke="#c084fc" stroke-width="2.2"/>
        <polygon points="10,74 36,61 31,89 8,89" fill="url(#${uid}_armor)" stroke="url(#${uid}_gold)" stroke-width="2"/>
        <polygon points="90,74 64,61 69,89 92,89" fill="url(#${uid}_armor)" stroke="url(#${uid}_gold)" stroke-width="2"/>
        <polygon points="50,67 57,78 50,89 43,78" fill="#c084fc" stroke="#fef08a" stroke-width="1.4"/>
        <!-- Sculpted Arch-Mage Hood & Inner Shadow -->
        <path d="M50,10 L76,33 L69,64 L31,64 L24,33 Z" fill="url(#${uid}_armor)" stroke="url(#${uid}_gold)" stroke-width="2.4"/>
        <path d="M35,33 L50,19 L65,33 L61,59 L39,59 Z" fill="#080312" stroke="#a855f7" stroke-width="1.6"/>
        <!-- Glowing Arcane Eyes & Astral Crown -->
        <polygon points="50,14 54,23 50,31 46,23" fill="#fde68a" stroke="#ffffff" stroke-width="1"/>
        <polygon points="39,42 47,40 45,46" fill="#f3e8ff"/>
        <polygon points="61,42 53,40 55,46" fill="#f3e8ff"/>
        <circle cx="43" cy="43" r="1.6" fill="#ffffff"/>
        <circle cx="57" cy="43" r="1.6" fill="#ffffff"/>
        <!-- Floating Crystal Runestone & Dawn-Star Staff -->
        <polygon points="18,28 24,18 30,28 24,38" fill="#c084fc" stroke="#ffffff" stroke-width="1.4"/>
        <polygon points="84,10 92,22 84,34 76,22" fill="#38bdf8" stroke="#fef08a" stroke-width="1.6"/>
        <circle cx="84" cy="22" r="3.5" fill="#ffffff"/>
        <line x1="84" y1="34" x2="77" y2="92" stroke="url(#${uid}_gold)" stroke-width="3.2"/>
      `;
      break;

    case 'hero_dragonknight':
      // Dragon-Lord Draven: Horned Crimson Wyrm-Helm, Molten Scale Armor & Ember-Wyrm Halberd
      bust = `
        <!-- Molten Dragonfire Halo -->
        <circle cx="50" cy="42" r="34" fill="none" stroke="#f97316" stroke-width="1.5" stroke-dasharray="5 3" opacity="0.8"/>
        <!-- Swept Dragon-Wing Pauldrons & Torso -->
        <path d="M8,93 L14,58 L39,66 L34,93 Z M92,93 L86,58 L61,66 L66,93 Z" fill="url(#${uid}_cloak)" stroke="url(#${uid}_gold)" stroke-width="2.2"/>
        <polygon points="31,65 69,65 63,93 37,93" fill="url(#${uid}_armor)" stroke="url(#${uid}_gold)" stroke-width="2.2"/>
        <circle cx="50" cy="79" r="7" fill="#f97316" stroke="#fef08a" stroke-width="1.8"/>
        <polygon points="50,73 54,79 50,85 46,79" fill="#ffffff"/>
        <!-- Swept Golden Wyrm Horns -->
        <path d="M32,32 Q9,15 16,6 Q26,16 39,25 Z" fill="url(#${uid}_gold)" stroke="#ffffff" stroke-width="1.5"/>
        <path d="M68,32 Q91,15 84,6 Q74,16 61,25 Z" fill="url(#${uid}_gold)" stroke="#ffffff" stroke-width="1.5"/>
        <!-- Armored Dragon Helm & Crest -->
        <polygon points="50,13 70,29 65,59 50,67 35,59 30,29" fill="url(#${uid}_armor)" stroke="url(#${uid}_gold)" stroke-width="2.5"/>
        <polygon points="50,10 55,24 50,34 45,24" fill="#fbbf24" stroke="#ffffff" stroke-width="1.2"/>
        <!-- Blazing Dragon Eyes & Visor -->
        <polygon points="36,39 48,43 37,47" fill="#fef08a"/>
        <polygon points="64,39 52,43 63,47" fill="#fef08a"/>
        <line x1="50" y1="32" x2="50" y2="62" stroke="url(#${uid}_gold)" stroke-width="2.2"/>
        <!-- Ember-Wyrm Halberd -->
        <line x1="84" y1="16" x2="78" y2="92" stroke="url(#${uid}_gold)" stroke-width="3.2"/>
        <path d="M84,8 L95,22 L82,28 Z" fill="#f97316" stroke="#fef08a" stroke-width="1.4"/>
      `;
      break;

    case 'hero_ranger':
      // Sylvan Warden Lyra: Antlered Elven Crown, Emerald Leaf-Plate & Starlight Whisper-Bow
      bust = `
        <!-- Starlight Forest Halo -->
        <circle cx="50" cy="42" r="33" fill="none" stroke="#2dd4bf" stroke-width="1.4" stroke-dasharray="5 3" opacity="0.78"/>
        <!-- Emerald Ranger Cloak & Leaf Pauldrons -->
        <path d="M12,93 C16,60 84,60 88,93 Z" fill="url(#${uid}_cloak)" stroke="#2dd4bf" stroke-width="2.2"/>
        <path d="M10,76 Q22,56 39,66 L31,90 Z M90,76 Q78,56 61,66 L69,90 Z" fill="url(#${uid}_armor)" stroke="url(#${uid}_gold)" stroke-width="2"/>
        <polygon points="50,69 55,78 50,87 45,78" fill="#2dd4bf" stroke="#ffffff" stroke-width="1.2"/>
        <!-- Royal Golden Antler Diadem -->
        <path d="M34,26 L18,8 M25,16 L14,17 M66,26 L82,8 M75,16 L86,17" stroke="url(#${uid}_gold)" stroke-width="2.8" stroke-linecap="round"/>
        <!-- Sylvan Hood & Star Gem -->
        <path d="M50,12 L72,33 L65,62 L35,62 L28,33 Z" fill="url(#${uid}_armor)" stroke="#2dd4bf" stroke-width="2.4"/>
        <polygon points="50,20 54,28 50,35 46,28" fill="#99f6e4" stroke="#ffffff" stroke-width="1.2"/>
        <polygon points="38,42 46,40 44,45" fill="#ccfbf1"/>
        <polygon points="62,42 54,40 56,45" fill="#ccfbf1"/>
        <!-- Starlight Whisper-Bow & Glowing Arrow -->
        <path d="M81,12 Q96,50 77,90" fill="none" stroke="url(#${uid}_gold)" stroke-width="3"/>
        <line x1="81" y1="12" x2="77" y2="90" stroke="#99f6e4" stroke-width="1.4"/>
        <circle cx="86" cy="48" r="3" fill="#ffffff"/>
      `;
      break;

    case 'hero_deathknight':
      // Runeblade Arthos: Glacial Crown Visor, Runed Dread-Plate & Winter-Star Greatsword
      bust = `
        <!-- Glacial Frost Halo -->
        <circle cx="50" cy="41" r="34" fill="none" stroke="#60a5fa" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.8"/>
        <!-- Spiked Glacial Pauldrons & Cuirass -->
        <polygon points="7,84 17,56 39,65 33,93" fill="url(#${uid}_armor)" stroke="#93c5fd" stroke-width="2.2"/>
        <polygon points="93,84 83,56 61,65 67,93" fill="url(#${uid}_armor)" stroke="#93c5fd" stroke-width="2.2"/>
        <polygon points="31,65 69,65 63,93 37,93" fill="url(#${uid}_steel)" stroke="url(#${uid}_gold)" stroke-width="2.2"/>
        <polygon points="50,69 56,79 50,89 44,79" fill="#60a5fa" stroke="#ffffff" stroke-width="1.3"/>
        <!-- Jagged Ice-Star Crown & Helm -->
        <polygon points="26,28 35,8 44,23 50,6 56,23 65,8 74,28" fill="url(#${uid}_steel)" stroke="#bfdbfe" stroke-width="2"/>
        <path d="M31,28 H69 L65,59 L50,67 L35,59 Z" fill="url(#${uid}_armor)" stroke="#60a5fa" stroke-width="2.4"/>
        <!-- Glowing Frost-Star Eyes & Grill -->
        <circle cx="41" cy="42" r="4.5" fill="#3b82f6"/>
        <circle cx="59" cy="42" r="4.5" fill="#3b82f6"/>
        <circle cx="41" cy="42" r="2.2" fill="#ffffff"/>
        <circle cx="59" cy="42" r="2.2" fill="#ffffff"/>
        <line x1="44" y1="53" x2="44" y2="61" stroke="#bfdbfe" stroke-width="2.2"/>
        <line x1="50" y1="52" x2="50" y2="63" stroke="#bfdbfe" stroke-width="2.2"/>
        <line x1="56" y1="53" x2="56" y2="61" stroke="#bfdbfe" stroke-width="2.2"/>
        <!-- Winter-Star Runeblade -->
        <polygon points="83,8 89,20 85,90 79,90" fill="url(#${uid}_steel)" stroke="#bfdbfe" stroke-width="1.6"/>
      `;
      break;

    case 'hero_paladin':
    default:
      // High Paladin Aurelius: Sunforged Winged Crown-Helm, Lion Pauldrons & Dawnbreaker Sun-Spear (Zero Crosses)
      bust = `
        <!-- Radiant Solar Starburst Halo -->
        <circle cx="50" cy="40" r="35" fill="none" stroke="url(#${uid}_gold)" stroke-width="1.8" stroke-dasharray="6 3" opacity="0.9"/>
        <circle cx="50" cy="40" r="29" fill="none" stroke="#fef08a" stroke-width="0.9" opacity="0.5"/>
        <!-- Sunforged Lion Pauldrons & Royal Cuirass -->
        <path d="M7,87 Q13,56 39,63 L34,93 Z M93,87 Q87,56 61,63 L66,93 Z" fill="url(#${uid}_cloak)" stroke="url(#${uid}_gold)" stroke-width="2.4"/>
        <path d="M12,75 Q22,62 36,68 M88,75 Q78,62 64,68" fill="none" stroke="#fef08a" stroke-width="1.6"/>
        <polygon points="33,63 67,63 61,93 39,93" fill="url(#${uid}_armor)" stroke="url(#${uid}_gold)" stroke-width="2.4"/>
        <!-- Solar Star Emblem on Chest -->
        <polygon points="50,67 57,78 50,89 43,78" fill="url(#${uid}_gold)" stroke="#ffffff" stroke-width="1.3"/>
        <circle cx="50" cy="78" r="2.8" fill="#ffffff"/>
        <!-- Golden Dragon-Feather Helm Wings & Solar Crown -->
        <path d="M12,20 L32,36 L28,50 L8,32 Z M88,20 L68,36 L72,50 L92,32 Z" fill="url(#${uid}_gold)" stroke="#ffffff" stroke-width="1.6"/>
        <polygon points="33,26 40,9 50,19 60,9 67,26" fill="url(#${uid}_gold)" stroke="#ffffff" stroke-width="1.6"/>
        <!-- Royal Alabaster & Gold Great-Helm with Angled V-Visor -->
        <path d="M32,25 L50,17 L68,25 L64,58 L50,66 L36,58 Z" fill="url(#${uid}_steel)" stroke="url(#${uid}_gold)" stroke-width="2.5"/>
        <polygon points="37,38 48,42 37,46" fill="#fef08a"/>
        <polygon points="63,38 52,42 63,46" fill="#fef08a"/>
        <polygon points="50,24 55,32 50,40 45,32" fill="url(#${uid}_gold)" stroke="#ffffff" stroke-width="1.1"/>
        <!-- Dawnbreaker Upright Sun-Spear -->
        <line x1="84" y1="18" x2="79" y2="92" stroke="url(#${uid}_gold)" stroke-width="3.4"/>
        <polygon points="85,4 93,21 84,16 76,21" fill="url(#${uid}_gold)" stroke="#ffffff" stroke-width="1.5"/>
      `;
      break;
  }

  return `
    <svg class="hero-portrait-svg" viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <radialGradient id="${uid}_bg" cx="50%" cy="38%" r="62%">
          <stop offset="0%" stop-color="${color}" stop-opacity="0.48"/>
          <stop offset="55%" stop-color="#1e1530" stop-opacity="0.92"/>
          <stop offset="100%" stop-color="#090610" stop-opacity="1"/>
        </radialGradient>
        <linearGradient id="${uid}_gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fef9c3"/>
          <stop offset="45%" stop-color="#f59e0b"/>
          <stop offset="100%" stop-color="#92400e"/>
        </linearGradient>
        <linearGradient id="${uid}_steel" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#475569"/>
          <stop offset="50%" stop-color="#1e293b"/>
          <stop offset="100%" stop-color="#0f172a"/>
        </linearGradient>
        <linearGradient id="${uid}_armor" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#312e81"/>
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
      <polygon points="50,6 90,23 90,77 50,94 10,77 10,23" fill="none" stroke="${color}" stroke-width="1.1" stroke-opacity="0.65"/>
      <!-- Corner Star Rivets -->
      <circle cx="50" cy="5" r="2" fill="#fef08a"/>
      <circle cx="50" cy="95" r="2" fill="#fef08a"/>
      <circle cx="9" cy="23" r="1.8" fill="#fef08a"/>
      <circle cx="91" cy="23" r="1.8" fill="#fef08a"/>
      <circle cx="9" cy="77" r="1.8" fill="#fef08a"/>
      <circle cx="91" cy="77" r="1.8" fill="#fef08a"/>
      ${bust}
    </svg>
  `;
}

/**
 * Render 6 Distinct Enemy Fantasy War Commander Portraits (`viewBox="0 0 80 80"`)
 * AAA Shaded Vector Art with metallic obsidian/crimson gradients and glowing eyes (Zero Crosses).
 */
export function renderBossCrestSVG(bossId, color = '#e11d48') {
  const uid = `boss_${bossId}`;
  let inner = '';
  switch (bossId) {
    case 'boss_malakor':
      // Warlord Malakor the Ironclad: Spiked Black-Iron Juggernaut Bust & Angled Visor
      inner = `
        <path d="M8,73 Q15,48 33,53 L28,75 Z M72,73 Q65,48 47,53 L52,75 Z" fill="url(#${uid}_steel)" stroke="url(#${uid}_gold)" stroke-width="2"/>
        <polygon points="12,14 25,28 19,35" fill="url(#${uid}_gold)"/>
        <polygon points="68,14 55,28 61,35" fill="url(#${uid}_gold)"/>
        <path d="M21,23 L40,10 L59,23 L56,59 L40,68 L24,59 Z" fill="url(#${uid}_steel)" stroke="${color}" stroke-width="2.4"/>
        <polygon points="26,35 38,39 27,43" fill="${color}"/>
        <polygon points="54,35 42,39 53,43" fill="${color}"/>
        <circle cx="32" cy="39" r="2.2" fill="#ffffff"/>
        <circle cx="48" cy="39" r="2.2" fill="#ffffff"/>
        <polygon points="40,19 45,28 40,34 35,28" fill="url(#${uid}_gold)" stroke="#ffffff" stroke-width="1"/>
      `;
      break;

    case 'boss_vespera':
      // Lich-Empress Vespera: Undead Necromancer Queen with Bone Crown & Soul-Fire Eyes
      inner = `
        <path d="M10,73 C15,50 65,50 70,73 Z" fill="url(#${uid}_steel)" stroke="${color}" stroke-width="2.2"/>
        <circle cx="40" cy="38" r="19" fill="url(#${uid}_steel)" stroke="url(#${uid}_gold)" stroke-width="2.4"/>
        <rect x="31" y="50" width="18" height="13" rx="2.5" fill="#122024" stroke="url(#${uid}_gold)" stroke-width="2"/>
        <polygon points="20,24 29,6 40,19 51,6 60,24" fill="url(#${uid}_gold)" stroke="#ffffff" stroke-width="1.4"/>
        <circle cx="33" cy="38" r="4.8" fill="${color}"/>
        <circle cx="47" cy="38" r="4.8" fill="${color}"/>
        <circle cx="33" cy="38" r="2.2" fill="#ffffff"/>
        <circle cx="47" cy="38" r="2.2" fill="#ffffff"/>
        <polygon points="40,42 43,48 37,48" fill="#fef08a"/>
      `;
      break;

    case 'boss_vorn':
      // General Vorn the Wyrm-Breaker: Horned Gargoyle Warlord with Swept Wings
      inner = `
        <path d="M6,26 L28,20 L24,54 Z M74,26 L52,20 L56,54 Z" fill="${color}" fill-opacity="0.55" stroke="url(#${uid}_gold)" stroke-width="1.8"/>
        <path d="M22,8 L33,26 L25,28 Z M58,8 L47,26 L55,28 Z" fill="url(#${uid}_gold)" stroke="#ffffff" stroke-width="1.2"/>
        <path d="M25,25 C25,15 55,15 55,25 L61,59 L19,59 Z" fill="url(#${uid}_steel)" stroke="url(#${uid}_gold)" stroke-width="2.5"/>
        <circle cx="40" cy="64" r="5.5" fill="url(#${uid}_gold)" stroke="#ffffff" stroke-width="1.2"/>
        <polygon points="30,35 38,38 31,41" fill="#ffffff"/>
        <polygon points="50,35 42,38 49,41" fill="#ffffff"/>
      `;
      break;

    case 'boss_thurible':
      // Pyromancer Morvain: Hell-Forge Warlock Mitre, Chains & Brimstone Core
      inner = `
        <path d="M12,73 C17,50 63,50 68,73 Z" fill="url(#${uid}_steel)" stroke="${color}" stroke-width="2.2"/>
        <line x1="40" y1="7" x2="25" y2="36" stroke="url(#${uid}_gold)" stroke-width="2" stroke-dasharray="3 2"/>
        <line x1="40" y1="7" x2="55" y2="36" stroke="url(#${uid}_gold)" stroke-width="2" stroke-dasharray="3 2"/>
        <polygon points="21,36 59,36 51,63 29,63" fill="url(#${uid}_steel)" stroke="url(#${uid}_gold)" stroke-width="2.4"/>
        <polygon points="40,12 52,36 28,36" fill="${color}" fill-opacity="0.7" stroke="#ffffff" stroke-width="1.6"/>
        <circle cx="34" cy="46" r="3.2" fill="#fef08a"/>
        <circle cx="46" cy="46" r="3.2" fill="#fef08a"/>
      `;
      break;

    case 'boss_carmilla':
      // Blood-Countess Carmilla: Vampiric Crimson Valkyrie Collar & Ruby Tiara
      inner = `
        <path d="M8,26 L29,44 L15,70 Z M72,26 L51,44 L65,70 Z" fill="#4c0519" stroke="url(#${uid}_gold)" stroke-width="2"/>
        <path d="M23,22 H57 L51,49 C49,57 44,59 40,59 C36,59 31,57 29,49 Z" fill="url(#${uid}_steel)" stroke="url(#${uid}_gold)" stroke-width="2.5"/>
        <polygon points="40,7 49,24 40,36 31,24" fill="${color}" stroke="#ffffff" stroke-width="1.6"/>
        <circle cx="34" cy="40" r="2.8" fill="#fda4af"/>
        <circle cx="46" cy="40" r="2.8" fill="#fda4af"/>
        <circle cx="34" cy="40" r="1.3" fill="#ffffff"/>
        <circle cx="46" cy="40" r="1.3" fill="#ffffff"/>
      `;
      break;

    case 'boss_hollow_seraph':
    default:
      // The Abyssal War-God: Six-Winged Fallen Seraph Mask
      inner = `
        <polygon points="40,5 50,29 75,40 50,51 40,75 30,51 5,40 30,29" fill="${color}" fill-opacity="0.6" stroke="url(#${uid}_gold)" stroke-width="2"/>
        <polygon points="40,13 63,26 63,54 40,67 17,54 17,26" fill="none" stroke="#ffffff" stroke-width="1.6"/>
        <circle cx="40" cy="40" r="12" fill="url(#${uid}_steel)" stroke="url(#${uid}_gold)" stroke-width="2.4"/>
        <circle cx="40" cy="40" r="5" fill="#ffffff"/>
      `;
      break;
  }

  return `
    <svg class="boss-crest-svg" viewBox="0 0 80 80" aria-hidden="true">
      <defs>
        <radialGradient id="${uid}_bg" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stop-color="${color}" stop-opacity="0.45"/>
          <stop offset="100%" stop-color="#0b0712" stop-opacity="1"/>
        </radialGradient>
        <linearGradient id="${uid}_gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fef08a"/>
          <stop offset="50%" stop-color="#f59e0b"/>
          <stop offset="100%" stop-color="#92400e"/>
        </linearGradient>
        <linearGradient id="${uid}_steel" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#334155"/>
          <stop offset="100%" stop-color="#0f172a"/>
        </linearGradient>
      </defs>
      <polygon points="40,2 75,18 75,62 40,78 5,62 5,18" fill="url(#${uid}_bg)" stroke="url(#${uid}_gold)" stroke-width="2.4"/>
      <circle cx="40" cy="40" r="31" fill="none" stroke="${color}" stroke-width="1.2" stroke-dasharray="4 2" opacity="0.78"/>
      <circle cx="40" cy="5" r="1.8" fill="#fef08a"/>
      <circle cx="40" cy="75" r="1.8" fill="#fef08a"/>
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
    case 'lock':
      return `<svg class="gothic-icon" viewBox="0 0 24 24"><rect x="4" y="11" width="16" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8 11V7A4 4 0 0 1 16 7V11" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>`;
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
