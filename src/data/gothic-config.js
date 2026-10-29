/**
 * XcardO III: Obsidian Sanctum
 * Master Configuration: 3D Sculpted Pieces, PBR Stone Materials, Cathedral Halls,
 * 4 Camera Presets, Blood Oaths, Penitence Bells, 20 Dark-Tarot Arcana Cards,
 * 6 Inquisitor Bosses, 36 Single-Player Campaign Consecrations & 5 Crypt Trials
 */

export const GAME_CONFIG = Object.freeze({
  VERSION: '3.0.0-GOTHIC-3D',
  CODENAME: 'OBSIDIAN SANCTUM',
  INITIAL_BLOOD_TITHE: 3,
  MAX_BLOOD_TITHE: 10,
  TITHE_PER_TURN: 2,
  INITIAL_HAND_SIZE: 3,
  MAX_HAND_SIZE: 5,
});

export const SOUNDTRACKS = Object.freeze([
  { id: 1, title: 'I. Obsidian Nave Vespers', src: 'music/track1.mp3' },
  { id: 2, title: 'II. Chisel & Alabaster', src: 'music/track2.mp3' },
  { id: 3, title: 'III. Blood Reliquary Procession', src: 'music/track3.mp3' },
  { id: 4, title: 'IV. The Ossuary Weaver', src: 'music/track4.mp3' },
  { id: 5, title: 'V. Gargoyle Belfry Vigil', src: 'music/track5.mp3' },
  { id: 6, title: 'VI. Warhammer of Penance', src: 'music/track6.mp3' },
  { id: 7, title: 'VII. Rose-Window Requiem', src: 'music/track7.mp3' },
  { id: 8, title: 'VIII. Inquisitor Automaton', src: 'music/track8.mp3' },
  { id: 9, title: 'IX. Brimstone Cataclysm', src: 'music/track9.mp3' },
  { id: 10, title: 'X. Cursed Censer Choir', src: 'music/track10.mp3' },
  { id: 11, title: 'XI. Sanctuary of Iron', src: 'music/track11.mp3' },
  { id: 12, title: 'XII. Dies Irae Chime', src: 'music/track12.mp3' },
  { id: 13, title: 'XIII. The Hollow Seraph', src: 'music/track13.mp3' },
]);

export const CATHEDRAL_HALLS = Object.freeze([
  {
    id: 'obsidian_nave',
    name: 'The Obsidian Nave',
    desc: 'Candlelit gothic cathedral altar with warm amber braziers and dark basalt masonry.',
    fogColor: 0x09070d,
    ambientColor: 0x2d2240,
    directionalColor: 0xffe4b5,
    brazierColor: 0xff7b29,
    altarStoneColor: 0x1c1824,
  },
  {
    id: 'ossuary_crypt',
    name: 'The Ossuary Crypts',
    desc: 'Subterranean bone catacombs illuminated by spectral verdigris soul-lanterns.',
    fogColor: 0x050b0d,
    ambientColor: 0x163840,
    directionalColor: 0xa7f3d0,
    brazierColor: 0x2dd4bf,
    altarStoneColor: 0x122024,
  },
  {
    id: 'ashen_belfry',
    name: 'The Gargoyle Belfry',
    desc: 'High spire ruins bathed in molten forge-fire and drifting cathedral ash.',
    fogColor: 0x0c0705,
    ambientColor: 0x3b2116,
    directionalColor: 0xfed7aa,
    brazierColor: 0xf97316,
    altarStoneColor: 0x211712,
  },
  {
    id: 'blood_sanctum',
    name: 'The Sanguine Reliquary',
    desc: 'Scarlet rose-window vaults where every shadow gleams with crimson glass.',
    fogColor: 0x0d0407,
    ambientColor: 0x3f1121,
    directionalColor: 0xfda4af,
    brazierColor: 0xe11d48,
    altarStoneColor: 0x210d15,
  },
  {
    id: 'eclipse_choir',
    name: 'The Eclipse Choir',
    desc: 'Nocturnal amethyst apse under a pale silver moonlit oculus.',
    fogColor: 0x070610,
    ambientColor: 0x271d47,
    directionalColor: 0xe9d5ff,
    brazierColor: 0xc084fc,
    altarStoneColor: 0x18142c,
  },
]);

export const SCULPTED_PIECES = Object.freeze({
  player: [
    {
      id: 'seraph_cross',
      name: 'Seraphic Cross Relic',
      desc: 'Crossed cathedral blades with a levitating gold halo and radiant diamond heart.',
      cost: 0,
    },
    {
      id: 'templar_knight',
      name: 'Templar Great-Helm',
      desc: 'Fluted Crusader visor bust with armored pauldrons and glowing cruciform slit.',
      cost: 180,
    },
    {
      id: 'gargoyle_warden',
      name: 'Gargoyle Spire Sentinel',
      desc: 'Horned Gothic stone guardian with swept pinions and burning amber eyes.',
      cost: 240,
    },
  ],
  enemy: [
    {
      id: 'iron_torus',
      name: 'Spiked Iron Crown',
      desc: 'Eight-spiked wrought-iron torment ring suspended over an abyssal eye.',
      cost: 0,
    },
    {
      id: 'ossuary_skull',
      name: 'Memento Mori Skull',
      desc: 'Carved cathedral skull reliquary with ruby ocular embers and iron halo.',
      cost: 180,
    },
    {
      id: 'abyssal_obelisk',
      name: 'Abyssal Monolith Spire',
      desc: 'Twisted four-sided obsidian obelisk bound in orbiting iron shackles.',
      cost: 240,
    },
  ],
});

export const STONE_MATERIALS = Object.freeze([
  {
    id: 'alabaster_marble',
    name: 'Ivory Alabaster & Gold',
    desc: 'Polished cathedral marble veined with sanctified 24k reliquary gold.',
    color: 0xe7e0d2,
    accentColor: 0xd4a853,
    emissive: 0x3b2a10,
    roughness: 0.3,
    metalness: 0.16,
    cost: 0,
  },
  {
    id: 'blood_obsidian',
    name: 'Sanguine Obsidian',
    desc: 'Volcanic black glass fractured with glowing crimson blood-veins.',
    color: 0x1b141a,
    accentColor: 0xe11d48,
    emissive: 0x4c0519,
    roughness: 0.22,
    metalness: 0.42,
    cost: 0,
  },
  {
    id: 'gilded_reliquary',
    name: 'Gilded Reliquary Brass',
    desc: 'Hand-hammered cathedral gold and burnished bronze.',
    color: 0xd4a853,
    accentColor: 0xfde68a,
    emissive: 0x452706,
    roughness: 0.24,
    metalness: 0.84,
    cost: 150,
  },
  {
    id: 'weathered_basalt',
    name: 'Weathered Crypt Basalt',
    desc: 'Ancient fortress slate reinforced with dark wrought-iron bands.',
    color: 0x475569,
    accentColor: 0x94a3b8,
    emissive: 0x0f172a,
    roughness: 0.55,
    metalness: 0.32,
    cost: 150,
  },
  {
    id: 'cursed_amethyst',
    name: 'Nocturnal Amethyst',
    desc: 'Crystalline imperial porphyry infused with purple choir resonance.',
    color: 0x3b1764,
    accentColor: 0xc084fc,
    emissive: 0x2e1065,
    roughness: 0.25,
    metalness: 0.45,
    cost: 200,
  },
  {
    id: 'verdigris_bronze',
    name: 'Verdigris Cathedral Bronze',
    desc: 'Aged oxidized copper patina from subterranean ossuary vaults.',
    color: 0x134e4a,
    accentColor: 0x2dd4bf,
    emissive: 0x042f2e,
    roughness: 0.35,
    metalness: 0.62,
    cost: 200,
  },
]);

export const CAMERA_PRESETS = Object.freeze([
  {
    id: 'commander_angle',
    name: "Commander's Vigil",
    theta: 0,
    phi: 0.88,
    radius: 10.6,
    targetY: 0.15,
  },
  {
    id: 'high_cathedral',
    name: 'High Cathedral Isometric',
    theta: 0.46,
    phi: 0.76,
    radius: 11.4,
    targetY: 0.12,
  },
  {
    id: 'inquisitor_duel',
    name: 'Dramatic Low Altar',
    theta: -0.26,
    phi: 1.06,
    radius: 9.4,
    targetY: 0.28,
  },
  {
    id: 'belfry_topdown',
    name: 'Belfry Zenith (Top-Down)',
    theta: 0,
    phi: 0.28,
    radius: 12.2,
    targetY: 0.0,
  },
]);

export const BLOOD_OATHS = Object.freeze([
  {
    id: 'oath_blood_chalice',
    name: 'Chalice of First Tithe',
    desc: 'Begin every duel with +2 bonus Blood Tithe.',
    cost: 0,
  },
  {
    id: 'oath_rose_window',
    name: 'Rose-Window Compass',
    desc: 'All Sacred Gothic Geometry formations grant +1 bonus VP.',
    cost: 160,
  },
  {
    id: 'oath_executioner_hood',
    name: "Executioner's Seal",
    desc: 'Inquisition-order Dark-Tarot destruction cards cost 1 less Blood Tithe.',
    cost: 180,
  },
  {
    id: 'oath_shattered_crown',
    name: 'Crown of Shattered Stone',
    desc: 'Gain +1 Blood Tithe whenever you shatter an enemy stone piece.',
    cost: 200,
  },
  {
    id: 'oath_forbidden_tome',
    name: 'Apocrypha Scriptorium',
    desc: 'Draw +1 additional Dark-Tarot card at the start of every battle.',
    cost: 220,
  },
  {
    id: 'oath_cathedral_chime',
    name: 'Resonant Clapper',
    desc: 'Begin every battle with 35% Penitence Bell Ultimate charge.',
    cost: 240,
  },
]);

export const PENITENCE_BELLS = Object.freeze([
  {
    id: 'bell_dies_irae',
    name: 'Chime of Dies Irae',
    desc: 'Shatter up to 3 unshielded enemy stones with 3D Warhammers and summon 1 Sanctified Wild Relic.',
  },
  {
    id: 'bell_sanctus_aegis',
    name: 'Sanctus Gargoyle Aegis',
    desc: 'Grant Gargoyle Aegis shields to all friendly stones, +1 extra placement, and +4 Blood Tithe.',
  },
  {
    id: 'bell_memento_mori',
    name: 'Toll of Memento Mori',
    desc: 'Transmute 2 random enemy stones into your Order and draw 2 Dark-Tarot cards.',
  },
]);

export const ARCANA_ORDERS = Object.freeze([
  { id: 'inquisition', name: 'Order of the Iron Hammer', color: '#e11d48' },
  { id: 'sanctum', name: 'Order of the Rose Window', color: '#f59e0b' },
  { id: 'blood', name: 'Order of the Crimson Chalice', color: '#9f1239' },
  { id: 'chronicle', name: 'Order of the Belfry Bell', color: '#38bdf8' },
  { id: 'apocrypha', name: 'Order of the Forbidden Tome', color: '#c084fc' },
]);

export const ARCANA_CARDS = Object.freeze([
  {
    id: 'warhammer_penance',
    numeral: 'I',
    name: 'Warhammer of Penance',
    order: 'inquisition',
    rarity: 'common',
    cost: 2,
    targetType: 'enemy_cell',
    effect: 'shatter_single',
    desc: 'Slam a 3D Iron Warhammer onto an enemy stone, shattering it into polyhedral rubble.',
    exaltedDesc: 'Shatter an enemy stone into rubble and refund +2 Blood Tithe.',
  },
  {
    id: 'cruciform_lance',
    numeral: 'II',
    name: 'Cruciform Lance',
    order: 'inquisition',
    rarity: 'rare',
    cost: 4,
    targetType: 'any_cell',
    effect: 'shatter_cross',
    desc: 'Shatter all unshielded enemy stones in a 5-tile Cruciform (+) blast.',
    exaltedDesc: 'Shatter enemy stones in a (+) blast and gain +1 VP.',
  },
  {
    id: 'inquisitor_guillotine',
    numeral: 'III',
    name: "Inquisitor's Guillotine",
    order: 'inquisition',
    rarity: 'epic',
    cost: 5,
    targetType: 'row',
    effect: 'guillotine_row',
    desc: 'Drop a 3D Guillotine blade across an entire Row, shattering all enemy stones.',
    exaltedDesc: 'Shatter all enemy stones in the Row and draw 1 Dark-Tarot card.',
  },
  {
    id: 'transept_cleaver',
    numeral: 'IV',
    name: 'Transept Cleaver',
    order: 'inquisition',
    rarity: 'epic',
    cost: 5,
    targetType: 'col',
    effect: 'guillotine_col',
    desc: 'Drop a 3D Guillotine blade down an entire Column, shattering all enemy stones.',
    exaltedDesc: 'Shatter all enemy stones in the Column and gain +2 Blood Tithe.',
  },
  {
    id: 'brimstone_cataclysm',
    numeral: 'V',
    name: 'Brimstone Cataclysm',
    order: 'inquisition',
    rarity: 'legendary',
    cost: 6,
    targetType: 'any_cell',
    effect: 'brimstone_3x3',
    desc: 'Call down a 3D Brimstone Meteor on a 3×3 zone, shattering all unshielded stones.',
    exaltedDesc: 'Shatter only enemy stones in a 3×3 zone while sparing your own!',
  },
  {
    id: 'iron_maiden_cage',
    numeral: 'VI',
    name: 'Iron Maiden Portcullis',
    order: 'sanctum',
    rarity: 'common',
    cost: 2,
    targetType: 'empty_cell',
    effect: 'iron_cage',
    desc: 'Raise 3D wrought-iron portcullis bars on an empty tile, locking it for 2 turns.',
    exaltedDesc: 'Lock a 5-tile (+) cross of empty tiles for 3 turns.',
  },
  {
    id: 'gargoyle_aegis',
    numeral: 'VII',
    name: 'Gargoyle Aegis',
    order: 'sanctum',
    rarity: 'common',
    cost: 2,
    targetType: 'friendly_cell',
    effect: 'aegis_gargoyle',
    desc: 'Encase a friendly stone in a 3D golden geodesic dome for 3 turns (immune to shatter).',
    exaltedDesc: 'Grant Gargoyle Aegis domes to a friendly stone and orthogonal allies.',
  },
  {
    id: 'sanctified_relic',
    numeral: 'VIII',
    name: 'Sanctified Sunburst Relic',
    order: 'sanctum',
    rarity: 'rare',
    cost: 4,
    targetType: 'empty_cell',
    effect: 'sanctified_relic',
    desc: 'Consecrate a 3D Golden Wild Relic (W) that counts for all alignments.',
    exaltedDesc: 'Consecrate a shielded 3D Golden Wild Relic (W).',
  },
  {
    id: 'double_consecration',
    numeral: 'IX',
    name: 'Twin Vespers Decree',
    order: 'chronicle',
    rarity: 'rare',
    cost: 3,
    targetType: 'none',
    effect: 'double_consecration',
    desc: 'Gain +1 additional stone placement on the Altar this turn.',
    exaltedDesc: 'Gain +1 additional stone placement and +2 Blood Tithe.',
  },
  {
    id: 'transpose_relics',
    numeral: 'X',
    name: 'Cryptic Transposition',
    order: 'chronicle',
    rarity: 'rare',
    cost: 3,
    targetType: 'two_occupied',
    effect: 'transpose_stones',
    desc: 'Swap the positions of any two unshielded stones on the 3D Altar.',
    exaltedDesc: 'Swap any two unshielded stones and draw 1 Dark-Tarot card.',
  },
  {
    id: 'sanguine_conversion',
    numeral: 'XI',
    name: 'Blood Transmutation',
    order: 'blood',
    rarity: 'epic',
    cost: 5,
    targetType: 'enemy_cell',
    effect: 'transmute_piece',
    desc: 'Transmute an unshielded enemy stone directly into your Order sculpture!',
    exaltedDesc: 'Transmute an enemy stone into a shielded Order sculpture!',
  },
  {
    id: 'mirror_nave',
    numeral: 'XII',
    name: 'Nave Reflection',
    order: 'apocrypha',
    rarity: 'rare',
    cost: 3,
    targetType: 'row',
    effect: 'mirror_nave',
    desc: 'Horizontally mirror all unshielded stones across the chosen Row.',
    exaltedDesc: 'Mirror the Row and gain +2 Blood Tithe.',
  },
  {
    id: 'blood_communion',
    numeral: 'XIII',
    name: 'Chalice Communion',
    order: 'blood',
    rarity: 'common',
    cost: 1,
    targetType: 'none',
    effect: 'blood_communion',
    desc: 'Gain +4 Blood Tithe and draw 2 Dark-Tarot cards.',
    exaltedDesc: 'Gain +5 Blood Tithe and draw 3 Dark-Tarot cards.',
  },
  {
    id: 'tithe_inquisition',
    numeral: 'XIV',
    name: 'Tithe Confiscation',
    order: 'blood',
    rarity: 'common',
    cost: 2,
    targetType: 'none',
    effect: 'tithe_drain',
    desc: "Siphon up to 2 Blood Tithe from the Inquisitor's reserves and draw 1 card.",
    exaltedDesc: 'Siphon up to 3 Blood Tithe and draw 1 card.',
  },
  {
    id: 'gargoyle_bastion_card',
    numeral: 'XV',
    name: 'Buttress Pillar',
    order: 'sanctum',
    rarity: 'common',
    cost: 2,
    targetType: 'empty_cell',
    effect: 'raise_bastion',
    desc: 'Erect an indestructible 3D Gothic Gargoyle Pillar on an empty tile.',
    exaltedDesc: 'Erect a 3D Gargoyle Pillar and gain +1 VP.',
  },
  {
    id: 'stained_glass_blessing',
    numeral: 'XVI',
    name: 'Rose-Window Inlay',
    order: 'sanctum',
    rarity: 'rare',
    cost: 3,
    targetType: 'any_cell',
    effect: 'consecrate_mosaic',
    desc: 'Inlay a glowing Stained-Glass Mosaic on a tile (+2 bonus VP when aligned).',
    exaltedDesc: 'Inlay a Stained-Glass Mosaic and immediately place your stone on it!',
  },
  {
    id: 'martyr_sacrifice',
    numeral: 'XVII',
    name: "Martyr's Shattering",
    order: 'blood',
    rarity: 'rare',
    cost: 1,
    targetType: 'friendly_cell',
    effect: 'sanguine_feast',
    desc: 'Shatter 1 of your own stones to gain +5 Blood Tithe and draw 2 cards.',
    exaltedDesc: 'Shatter 1 of your own stones to gain +7 Blood Tithe and draw 3 cards.',
  },
  {
    id: 'eclipse_shroud',
    numeral: 'XVIII',
    name: 'Nocturnal Interdict',
    order: 'apocrypha',
    rarity: 'rare',
    cost: 3,
    targetType: 'none',
    effect: 'eclipse_shroud',
    desc: 'Lock 3 random empty tiles in Wrought-Iron Cages for 2 turns and draw 1 card.',
    exaltedDesc: 'Lock 5 random empty tiles for 2 turns and draw 1 card.',
  },
  {
    id: 'excommunication',
    numeral: 'XIX',
    name: 'Papal Excommunication',
    order: 'apocrypha',
    rarity: 'epic',
    cost: 4,
    targetType: 'none',
    effect: 'excommunication',
    desc: "Shatter the Inquisitor's most recently placed stone and cage its tile.",
    exaltedDesc: "Shatter the Inquisitor's latest stone, cage its tile for 3 turns, and draw 1 card.",
  },
  {
    id: 'cathedral_judgment',
    numeral: 'XX',
    name: 'Cathedral Judgment',
    order: 'inquisition',
    rarity: 'legendary',
    cost: 6,
    targetType: 'none',
    effect: 'cathedral_judgment',
    desc: 'Shatter 2 random enemy stones into rubble and shield all your stones for 2 turns.',
    exaltedDesc: 'Shatter 3 random enemy stones and shield all your stones for 2 turns.',
  },
]);

export function getArcanaCardById(cardId) {
  return ARCANA_CARDS.find((c) => c.id === cardId) || null;
}

export function getArcanaPreviewCells(card, r, c, boardSize) {
  if (!card) return [];
  const cells = [];
  const inBounds = (rr, cc) => rr >= 0 && rr < boardSize && cc >= 0 && cc < boardSize;

  if (card.effect === 'shatter_cross') {
    const coords = [
      [r, c],
      [r - 1, c],
      [r + 1, c],
      [r, c - 1],
      [r, c + 1],
    ];
    for (const [rr, cc] of coords) {
      if (inBounds(rr, cc)) cells.push([rr, cc]);
    }
  } else if (card.effect === 'guillotine_row' || card.effect === 'mirror_nave') {
    for (let cc = 0; cc < boardSize; cc++) cells.push([r, cc]);
  } else if (card.effect === 'guillotine_col') {
    for (let rr = 0; rr < boardSize; rr++) cells.push([rr, c]);
  } else if (card.effect === 'brimstone_3x3') {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (inBounds(r + dr, c + dc)) cells.push([r + dr, c + dc]);
      }
    }
  } else if (inBounds(r, c)) {
    cells.push([r, c]);
  }
  return cells;
}

export const INQUISITOR_BOSSES = Object.freeze([
  {
    id: 'boss_malakor',
    name: 'Inquisitor Malakor',
    title: 'Warden of the Iron Gate',
    passiveId: 'iron_maiden_lock',
    passiveDesc: 'Every 3rd AI turn, cages an empty altar tile in Wrought-Iron bars.',
    quote: '"None shall pass the Narthex unchained."',
    color: '#f59e0b',
  },
  {
    id: 'boss_vespera',
    name: 'Abbess Vespera',
    title: 'Keeper of the Bone Reliquary',
    passiveId: 'ossuary_pillar',
    passiveDesc: 'Every 3rd AI turn, raises a Reliquary Coffer on the altar.',
    quote: '"Every bone in this crypt remembers its vow."',
    color: '#2dd4bf',
  },
  {
    id: 'boss_vorn',
    name: 'Arch-Bellringer Vorn',
    title: 'Master of the Gargoyle Belfry',
    passiveId: 'bell_shockwave',
    passiveDesc: 'Every 3rd AI turn, tolls the Belfry Bell to shatter 1 unshielded player stone.',
    quote: '"Hear the bronze toll—and crumble to dust!"',
    color: '#f97316',
  },
  {
    id: 'boss_thurible',
    name: 'Censer-Prelate Morvain',
    title: 'High Alchemist of Brimstone',
    passiveId: 'plague_censer',
    passiveDesc: 'Every 3rd AI turn, places a volatile Cursed Censer on the altar.',
    quote: '"Breathe deep the fumes of penance."',
    color: '#c084fc',
  },
  {
    id: 'boss_carmilla',
    name: 'Cardinal Sanguine',
    title: 'Sovereign of the Blood Tithe',
    passiveId: 'blood_tithe_tax',
    passiveDesc: 'Every 3rd AI turn, siphons 1 Blood Tithe from your chalice.',
    quote: '"Your devotion is measured in crimson."',
    color: '#e11d48',
  },
  {
    id: 'boss_hollow_seraph',
    name: 'The Hollow Seraph',
    title: 'Supreme Automaton of the Sanctum',
    passiveId: 'seraph_aegis',
    passiveDesc: 'Every 3rd AI turn, consecrates a Gargoyle Aegis shield and +1 Tithe.',
    quote: '"I am the stone that outlives all cathedrals."',
    color: '#fb7185',
  },
]);

export const CATHEDRAL_ACTS = Object.freeze([
  {
    actId: 1,
    name: 'The Weeping Narthex',
    hallId: 'obsidian_nave',
    boss: INQUISITOR_BOSSES[0],
  },
  {
    actId: 2,
    name: 'The Ossuary Catacombs',
    hallId: 'ossuary_crypt',
    boss: INQUISITOR_BOSSES[1],
  },
  {
    actId: 3,
    name: 'The Gargoyle Belfry',
    hallId: 'ashen_belfry',
    boss: INQUISITOR_BOSSES[2],
  },
  {
    actId: 4,
    name: 'The Censer Transept',
    hallId: 'eclipse_choir',
    boss: INQUISITOR_BOSSES[3],
  },
  {
    actId: 5,
    name: 'The Sanguine Sacristy',
    hallId: 'blood_sanctum',
    boss: INQUISITOR_BOSSES[4],
  },
  {
    actId: 6,
    name: 'The High Obsidian Altar',
    hallId: 'blood_sanctum',
    boss: INQUISITOR_BOSSES[5],
  },
]);

const LEVEL_NAMES = [
  'Narthex Threshold', 'Candlelit Aisle', 'First Consecration', 'Wrought-Iron Vigil', 'Cloister Walk', 'Gate of Malakor',
  'Catacomb Steps', 'Vault of Skulls', 'Verdigris Lantern', 'Reliquary Tomb', 'Crypt Crossing', 'Sanctum of Vespera',
  'Belfry Ascent', 'Gargoyle Ledge', 'Bronze Clapper', 'Wind-Carved Buttress', 'Spire Battlement', 'Belfry of Vorn',
  'Incense Choir', 'Brimstone Nave', 'Amethyst Oculus', 'Smoking Thurible', 'Apocrypha Gallery', 'Pulpit of Morvain',
  'Crimson Chalice', 'Vein of Obsidian', 'Rose-Window Court', 'Martyr Transept', 'Sanguine Font', 'Throne of Sanguine',
  'Fractured Monolith', 'Dies Irae Choir', 'Pillar of Penance', 'Grand Cruciform', 'Sanctum Belltower', 'The Hollow Seraph',
];

export const CATHEDRAL_LEVELS = Object.freeze(
  Array.from({ length: 36 }, (_, idx) => {
    const level = idx + 1;
    const actId = Math.ceil(level / 6);
    const act = CATHEDRAL_ACTS[actId - 1];
    const isBossLevel = level % 6 === 0;
    const boardSize = level <= 6 ? 5 : level <= 18 ? 5 : level <= 30 ? 6 : 6;
    const targetScore = 5 + Math.floor(level / 4) + (isBossLevel ? 2 : 0);
    const aiTier = Math.min(6, Math.ceil(level / 6));

    return {
      level,
      actId,
      name: LEVEL_NAMES[idx],
      hallId: act.hallId,
      boardSize,
      targetScore,
      aiTier,
      isBossLevel,
      boss: isBossLevel ? act.boss : null,
      bastions: level >= 4 ? (level % 3 === 0 ? 2 : 1) : 0,
      reliquaryCoffers: level >= 2 ? (level % 2 === 0 ? 2 : 1) : 1,
      mosaics: level >= 3 ? 1 : 0,
      censers: level >= 13 && level % 3 === 1 ? 1 : 0,
    };
  })
);

export function getLevelByNumber(levelNumber) {
  return CATHEDRAL_LEVELS.find((l) => l.level === Number(levelNumber)) || CATHEDRAL_LEVELS[0];
}

export const CRYPT_TRIALS = Object.freeze([
  {
    id: 'crypt_1',
    name: 'Trial I: The Crux Fidelis',
    subtitle: 'Complete the 5-stone Sacred Cross (+) and dual 3-stone lines in a single placement.',
    boardSize: 5,
    targetScore: 5,
    tithe: 0,
    placementsRemaining: 1,
    rewardSigils: 140,
    hint: 'Consecrate the center tile [3, 3] to unite all four cardinal arms into a Crux Fidelis (+).',
    hand: [],
    initialBoard: [
      { r: 1, c: 2, symbol: 'X' },
      { r: 3, c: 2, symbol: 'X' },
      { r: 2, c: 1, symbol: 'X' },
      { r: 2, c: 3, symbol: 'X' },
    ],
  },
  {
    id: 'crypt_2',
    name: 'Trial II: Warhammer of Penance',
    subtitle: 'Shatter the obstructing Inquisition stone with your Warhammer, then complete the nave line.',
    boardSize: 5,
    targetScore: 1,
    tithe: 3,
    placementsRemaining: 1,
    rewardSigils: 160,
    hint: 'Invoke Warhammer of Penance on [3, 3] to shatter the enemy stone, then place your stone at [3, 3].',
    hand: ['warhammer_penance'],
    initialBoard: [
      { r: 2, c: 1, symbol: 'X' },
      { r: 2, c: 2, symbol: 'O' },
      { r: 2, c: 3, symbol: 'X' },
    ],
  },
  {
    id: 'crypt_3',
    name: 'Trial III: Blood Transmutation',
    subtitle: 'Corrupt the enemy stone into your Order, then seal the Altar T-Cross.',
    boardSize: 5,
    targetScore: 4,
    tithe: 6,
    placementsRemaining: 1,
    rewardSigils: 180,
    hint: 'Cast Blood Transmutation on the enemy stone at [2, 3], then place your stone at [3, 3].',
    hand: ['sanguine_conversion'],
    initialBoard: [
      { r: 1, c: 1, symbol: 'X' },
      { r: 1, c: 2, symbol: 'O' },
      { r: 1, c: 3, symbol: 'X' },
      { r: 3, c: 2, symbol: 'X' },
    ],
  },
  {
    id: 'crypt_4',
    name: 'Trial IV: St. Andrew Saltire',
    subtitle: 'Forge the diagonal X-Saltire across the Sanctum.',
    boardSize: 5,
    targetScore: 5,
    tithe: 0,
    placementsRemaining: 1,
    rewardSigils: 200,
    hint: 'Place your stone at the central intersection [3, 3] to complete both diagonals and the Saltire (X).',
    hand: [],
    initialBoard: [
      { r: 1, c: 1, symbol: 'X' },
      { r: 1, c: 3, symbol: 'X' },
      { r: 3, c: 1, symbol: 'X' },
      { r: 3, c: 3, symbol: 'X' },
    ],
  },
  {
    id: 'crypt_5',
    name: 'Trial V: The Rose Window',
    subtitle: 'Complete the 8-stone Rose Window Sanctum (3x3 hollow frame).',
    boardSize: 5,
    targetScore: 5,
    tithe: 0,
    placementsRemaining: 1,
    rewardSigils: 250,
    hint: 'Place the final stone at [4, 4] to seal the 3×3 Rose Window frame.',
    hand: [],
    initialBoard: [
      { r: 1, c: 1, symbol: 'X' },
      { r: 1, c: 2, symbol: 'X' },
      { r: 1, c: 3, symbol: 'X' },
      { r: 2, c: 1, symbol: 'X' },
      { r: 2, c: 3, symbol: 'X' },
      { r: 3, c: 1, symbol: 'X' },
      { r: 3, c: 2, symbol: 'X' },
    ],
  },
]);

export function getCryptTrialById(cryptId) {
  return CRYPT_TRIALS.find((t) => t.id === cryptId) || CRYPT_TRIALS[0];
}
