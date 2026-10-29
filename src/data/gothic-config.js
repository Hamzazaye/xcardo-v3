/**
 * XcardO — 3D Fantasy War-Table Strategy
 * Master Configuration: 6 Playable Fantasy War Heroes, 6 Enemy Warlord Commanders,
 * v1 Rules Engine (No Cards Until Level 3, 3-Slot In-Battle Card Shop, Mystery Chests & Siege Bombs),
 * 3D Sculpted War Miniatures, PBR Stone Materials, Cathedral War-Halls & 20 War-Scroll Cards
 */

export const GAME_CONFIG = Object.freeze({
  TITLE: 'XcardO',
  SUBTITLE: 'Warlords of the Obsidian Altar',
  VERSION: '3.2.0-WARLORDS',
  CODENAME: 'OBSIDIAN SANCTUM',
  CARDS_UNLOCK_LEVEL: 3, // v1 Rule: Levels 1 & 2 have NO cards and NO shop! Cards unlock at Level 3.
  INITIAL_BLOOD_TITHE: 3, // v1 COIN_START: 3
  MAX_BLOOD_TITHE: 15,
  TITHE_PER_TURN: 1,
  COIN_EVERY_OWN_TURNS: 2, // v1 Rule: +1 Gold Coin every 2 own turns
  COIN_PER_SCORE: 1,       // v1 Rule: +1 Gold Coin per scoring event
  INITIAL_HAND_SIZE: 2,
  MAX_HAND_SIZE: 5,        // v1 HAND_MAX: 5
  SHOP_SLOTS: 3,           // v1 3-Slot In-Battle Card Shop
  SHOP_REROLL_BASE_COST: 2,// v1 Reroll base cost: 2 Gold
  SHOP_REROLL_ESCALATION: 1,
  BOMB_COUNTDOWN: 4,       // v1 4-turn ticking bomb fuse
  DEAD_REVIVE_TURNS: 2,    // v1 2-turn shattered crater revive
});

export const V1_BOX_ODDS = Object.freeze([
  { id: 'coins', label: 'Gold Cache (+2🪙)', pct: 42 },
  { id: 'joker', label: 'Wild Joker Idol (★)', pct: 24 },
  { id: 'bomb', label: 'Siege Bomb (💣 4T)', pct: 15 },
  { id: 'jackpot', label: 'War Chest Jackpot (+5🪙)', pct: 7 },
  { id: 'bonus_card', label: 'Free War-Scroll / +1 VP', pct: 12 },
]);

export const FANTASY_HEROES = Object.freeze([
  {
    id: 'hero_paladin',
    name: 'High Paladin Aurelius',
    shortName: 'Paladin Aurelius',
    title: 'The Sunforged Vanguard',
    heroClass: 'Sunforged Paladin',
    weapon: 'Dawnbreaker Greatsword',
    color: '#f59e0b',
    accent: '#fde68a',
    sculptId: 'seraph_cross',
    materialId: 'alabaster_marble',
    passiveDesc: 'Radiant Command: Starts Level 3+ battles with +1 bonus Gold Coin.',
    battleCry: '"By the Sunforged Oath, their battle-lines shall shatter!"',
  },
  {
    id: 'hero_valkyrie',
    name: 'Shieldmaiden Freya',
    shortName: 'Valkyrie Freya',
    title: 'Valkyrie of the Storm-Spire',
    heroClass: 'Storm Valkyrie',
    weapon: 'Gungnir Sky-Lance',
    color: '#38bdf8',
    accent: '#bae6fd',
    sculptId: 'templar_knight',
    materialId: 'gilded_reliquary',
    passiveDesc: 'Sky-born Valor: Begins every battle with +20% War-Horn Ultimate charge.',
    battleCry: '"Ride the tempest! Strike their shields to splinters!"',
  },
  {
    id: 'hero_archmage',
    name: 'Arch-Warlock Kaelen',
    shortName: 'Arch-Mage Kaelen',
    title: 'Grand Magus of the Astral Sanctum',
    heroClass: 'Astral Battle-Mage',
    weapon: 'Staff of the Void-Star',
    color: '#c084fc',
    accent: '#e9d5ff',
    sculptId: 'seraph_cross',
    materialId: 'cursed_amethyst',
    passiveDesc: 'Arcane Mastery: First Shop Reroll each battle costs 1 less Gold.',
    battleCry: '"Every rune carved into this war-table bends to my will."',
  },
  {
    id: 'hero_dragonknight',
    name: 'Dragon-Lord Draven',
    shortName: 'Dragon-Lord Draven',
    title: 'Wyrm-Blood Dragoon',
    heroClass: 'Dragon-Knight Warlord',
    weapon: 'Hellfire Wyrm-Halberd',
    color: '#f97316',
    accent: '#fed7aa',
    sculptId: 'gargoyle_warden',
    materialId: 'blood_obsidian',
    passiveDesc: 'Wyrm-Fury: Shattering enemy Champions grants +10% bonus War-Horn charge.',
    battleCry: '"Let dragon-fire reduce their stone bastions to molten ash!"',
  },
  {
    id: 'hero_ranger',
    name: 'Sylvan Warden Lyra',
    shortName: 'Warden Lyra',
    title: 'Emerald Shadow-Archer',
    heroClass: 'Elven War-Ranger',
    weapon: 'Starlight Whisper-Bow',
    color: '#2dd4bf',
    accent: '#99f6e4',
    sculptId: 'templar_knight',
    materialId: 'verdigris_bronze',
    passiveDesc: 'Pathfinder Eye: Mystery War-Chests grant +1 extra Gold when cracked.',
    battleCry: '"One arrow between the iron plates is all it takes."',
  },
  {
    id: 'hero_deathknight',
    name: 'Runeblade Arthos',
    shortName: 'Runeblade Arthos',
    title: 'Frost-Mourne Vanguard',
    heroClass: 'Dread Runeblade',
    weapon: 'Glacial Soul-Cleaver',
    color: '#60a5fa',
    accent: '#bfdbfe',
    sculptId: 'gargoyle_warden',
    materialId: 'weathered_basalt',
    passiveDesc: 'Glacial Presence: Starts Level 3+ battles with 1 free War-Scroll in hand.',
    battleCry: '"Winter claims the war-table. Kneel in eternal frost."',
  },
]);

export function getFantasyHeroById(heroId) {
  return FANTASY_HEROES.find((h) => h.id === heroId) || FANTASY_HEROES[0];
}

export const SOUNDTRACKS = Object.freeze([
  { id: 1, title: 'I. War-Council of the Obsidian Nave', src: 'music/menu_theme.mp3' },
  { id: 2, title: 'II. Steel & Alabaster March', src: 'music/battle/level_1.mp3' },
  { id: 3, title: 'III. Crimson Warlord Procession', src: 'music/battle/level_2.mp3' },
  { id: 4, title: 'IV. The Necromancer Ossuary', src: 'music/battle/level_3.mp3' },
  { id: 5, title: 'V. Dragon-Spire Vigil', src: 'music/battle/level_4.mp3' },
  { id: 6, title: 'VI. Warhammer of Penance', src: 'music/battle/level_5.mp3' },
  { id: 7, title: 'VII. Valkyrie Rose-Window Requiem', src: 'music/battle/level_6.mp3' },
  { id: 8, title: 'VIII. Iron Marshal Juggernaut', src: 'music/battle/level_7.mp3' },
  { id: 9, title: 'IX. Brimstone Siege Cataclysm', src: 'music/battle/level_8.mp3' },
  { id: 10, title: 'X. Pyromancer Choir', src: 'music/battle/level_9.mp3' },
  { id: 11, title: 'XI. Bastion of Black Iron', src: 'music/boss/boss_1.mp3' },
  { id: 12, title: 'XII. Dies Irae War-Horn', src: 'music/boss/boss_5.mp3' },
  { id: 13, title: 'XIII. The Abyssal War-God', src: 'music/credits.mp3' },
]);

export const CATHEDRAL_HALLS = Object.freeze([
  {
    id: 'obsidian_nave',
    name: 'The Obsidian War-Sanctum',
    desc: 'Candlelit war-council hall with warm amber braziers and dark basalt masonry.',
    fogColor: 0x09070d,
    ambientColor: 0x2d2240,
    directionalColor: 0xffe4b5,
    brazierColor: 0xff7b29,
    altarStoneColor: 0x1c1824,
  },
  {
    id: 'ossuary_crypt',
    name: 'The Necromancer Ossuary',
    desc: 'Subterranean bone citadel illuminated by spectral emerald soul-lanterns.',
    fogColor: 0x050b0d,
    ambientColor: 0x163840,
    directionalColor: 0xa7f3d0,
    brazierColor: 0x2dd4bf,
    altarStoneColor: 0x122024,
  },
  {
    id: 'ashen_belfry',
    name: 'The Dragon-Breaker Spire',
    desc: 'High fortress battlements bathed in molten forge-fire and drifting battle ash.',
    fogColor: 0x0c0705,
    ambientColor: 0x3b2116,
    directionalColor: 0xfed7aa,
    brazierColor: 0xf97316,
    altarStoneColor: 0x211712,
  },
  {
    id: 'blood_sanctum',
    name: 'The Crimson Citadel',
    desc: 'Scarlet warlord vaults where every shadow gleams with blood-ruby glass.',
    fogColor: 0x0d0407,
    ambientColor: 0x3f1121,
    directionalColor: 0xfda4af,
    brazierColor: 0xe11d48,
    altarStoneColor: 0x210d15,
  },
  {
    id: 'eclipse_choir',
    name: 'The Astral War-Spire',
    desc: 'Nocturnal amethyst war-chamber under a pale silver moonlit oculus.',
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
      name: 'Paladin Runeblade Champion',
      desc: 'Armored Paladin War-Champion with winged halo crest and twin crossed Runeblades.',
      cost: 0,
    },
    {
      id: 'templar_knight',
      name: 'Valkyrie Crusader Bust',
      desc: 'Fluted Great-Helm warlord bust with heavy pauldrons and glowing cruciform visor.',
      cost: 180,
    },
    {
      id: 'gargoyle_warden',
      name: 'Dragon-Lord Sentinel',
      desc: 'Horned Dragon-Knight war miniature with swept pinions and burning amber eyes.',
      cost: 240,
    },
  ],
  enemy: [
    {
      id: 'iron_torus',
      name: 'Dread-Iron Warlord Crown',
      desc: 'Eight-spiked black-iron warlord crown suspended over a burning siege eye.',
      cost: 0,
    },
    {
      id: 'ossuary_skull',
      name: 'Necromancer Lich Skull',
      desc: 'Crowned undead warlord skull with ruby ocular soul-fire and iron halo.',
      cost: 180,
    },
    {
      id: 'abyssal_obelisk',
      name: 'Abyssal Demon Monolith',
      desc: 'Twisted obsidian war-spire bound in orbiting hell-iron chains.',
      cost: 240,
    },
  ],
});

export const STONE_MATERIALS = Object.freeze([
  {
    id: 'alabaster_marble',
    name: 'Sunforged Alabaster & Gold',
    desc: 'Polished royal marble veined with sanctified 24k Paladin gold.',
    color: 0xe7e0d2,
    accentColor: 0xd4a853,
    emissive: 0x3b2a10,
    roughness: 0.3,
    metalness: 0.16,
    cost: 0,
  },
  {
    id: 'blood_obsidian',
    name: 'Warlord Blood-Obsidian',
    desc: 'Volcanic black glass fractured with glowing crimson magma veins.',
    color: 0x1b141a,
    accentColor: 0xe11d48,
    emissive: 0x4c0519,
    roughness: 0.22,
    metalness: 0.42,
    cost: 0,
  },
  {
    id: 'gilded_reliquary',
    name: 'Valkyrie Gilded Brass',
    desc: 'Hand-hammered royal war-gold and burnished bronze.',
    color: 0xd4a853,
    accentColor: 0xfde68a,
    emissive: 0x452706,
    roughness: 0.24,
    metalness: 0.84,
    cost: 150,
  },
  {
    id: 'weathered_basalt',
    name: 'Runeblade Fortress Basalt',
    desc: 'Ancient frost-rimed fortress slate reinforced with dark wrought-iron bands.',
    color: 0x475569,
    accentColor: 0x94a3b8,
    emissive: 0x0f172a,
    roughness: 0.55,
    metalness: 0.32,
    cost: 150,
  },
  {
    id: 'cursed_amethyst',
    name: 'Arch-Mage Astral Amethyst',
    desc: 'Crystalline arcane porphyry infused with violet spell resonance.',
    color: 0x3b1764,
    accentColor: 0xc084fc,
    emissive: 0x2e1065,
    roughness: 0.25,
    metalness: 0.45,
    cost: 200,
  },
  {
    id: 'verdigris_bronze',
    name: 'Sylvan Emerald Bronze',
    desc: 'Ancient elven copper-jade patina from the Emerald War-Groves.',
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
    name: "Warlord's Command",
    theta: 0,
    phi: 0.88,
    radius: 10.6,
    targetY: 0.15,
  },
  {
    id: 'high_cathedral',
    name: 'Tactical Isometric',
    theta: 0.46,
    phi: 0.76,
    radius: 11.4,
    targetY: 0.12,
  },
  {
    id: 'inquisitor_duel',
    name: 'Heroic Low Angle',
    theta: -0.26,
    phi: 1.06,
    radius: 9.4,
    targetY: 0.28,
  },
  {
    id: 'belfry_topdown',
    name: 'War-Map Zenith (Top-Down)',
    theta: 0,
    phi: 0.28,
    radius: 12.2,
    targetY: 0.0,
  },
]);

export const BLOOD_OATHS = Object.freeze([
  {
    id: 'oath_blood_chalice',
    name: 'Lucky War-Coin',
    desc: 'Begin Level 3+ battles with +2 bonus Gold Coins (v1 Lucky Coin Relic).',
    cost: 0,
  },
  {
    id: 'oath_rose_window',
    name: 'Tactician Crown',
    desc: 'All special tactical formations (Cross, X, Box, T, L, Star) grant +1 bonus VP.',
    cost: 160,
  },
  {
    id: 'oath_executioner_hood',
    name: 'Bargain Hunter Seal',
    desc: 'Offensive War-Scroll cards cost 1 less Gold Coin to purchase & invoke.',
    cost: 180,
  },
  {
    id: 'oath_shattered_crown',
    name: 'Plunderer Banner',
    desc: 'Gain +1 Gold Coin whenever you shatter an enemy War-Champion.',
    cost: 200,
  },
  {
    id: 'oath_forbidden_tome',
    name: 'Scroll Pouch',
    desc: 'Start Level 3+ battles with +1 random War-Scroll card in your hand.',
    cost: 220,
  },
  {
    id: 'oath_cathedral_chime',
    name: 'War-Horn of Valor',
    desc: 'Begin every battle with 35% War-Horn Ultimate charge.',
    cost: 240,
  },
]);

export const PENITENCE_BELLS = Object.freeze([
  {
    id: 'bell_dies_irae',
    name: 'War-Horn of Dies Irae',
    desc: 'Shatter up to 3 unshielded enemy Champions with 3D Warhammers and summon 1 Wild Joker Idol.',
  },
  {
    id: 'bell_sanctus_aegis',
    name: 'Paladin Phalanx Aegis',
    desc: 'Grant Aegis Shields to all friendly Champions, +1 extra move, and +4 Gold Coins.',
  },
  {
    id: 'bell_memento_mori',
    name: 'Necrotic War-Cry',
    desc: 'Convert 2 random enemy Champions to your side and draw 2 War-Scroll cards.',
  },
]);

export const ARCANA_ORDERS = Object.freeze([
  { id: 'inquisition', name: 'Order of the War-Hammer', color: '#e11d48' },
  { id: 'sanctum', name: 'Order of the Golden Aegis', color: '#f59e0b' },
  { id: 'blood', name: 'Order of the Crimson Legion', color: '#9f1239' },
  { id: 'chronicle', name: 'Order of the Chrono-Magi', color: '#38bdf8' },
  { id: 'apocrypha', name: 'Order of the Arcane Tome', color: '#c084fc' },
]);

export const ARCANA_CARDS = Object.freeze([
  {
    id: 'warhammer_penance',
    v1Id: 'smash',
    v1Name: 'Smash',
    numeral: 'I',
    name: 'Warhammer Smash',
    order: 'inquisition',
    rarity: 'common',
    cost: 2,
    unlockLevel: 3,
    targetType: 'enemy_cell',
    effect: 'shatter_single',
    desc: 'Slam a 3D Iron Warhammer onto an enemy Champion, shattering it into rubble and leaving a 2-turn crater.',
    exaltedDesc: 'Shatter an enemy Champion into rubble and refund +2 Gold Coins.',
  },
  {
    id: 'gargoyle_aegis',
    v1Id: 'shield',
    v1Name: 'Shield',
    numeral: 'II',
    name: 'Paladin Shield Aegis',
    order: 'sanctum',
    rarity: 'common',
    cost: 2,
    unlockLevel: 3,
    targetType: 'friendly_cell',
    effect: 'aegis_gargoyle',
    desc: 'Encase a friendly Champion in a 3D golden Aegis dome for 3 turns (immune to shatter & conversion).',
    exaltedDesc: 'Grant Aegis Shield domes to a friendly Champion and orthogonal allies.',
  },
  {
    id: 'sanguine_conversion',
    v1Id: 'convert',
    v1Name: 'Convert',
    numeral: 'III',
    name: 'Warlord Allegiance (Convert)',
    order: 'blood',
    rarity: 'epic',
    cost: 4,
    unlockLevel: 3,
    targetType: 'enemy_cell',
    effect: 'transmute_piece',
    desc: 'Convert an unshielded enemy Champion directly into your own sculpted War-Champion!',
    exaltedDesc: 'Convert an enemy Champion into a shielded friendly War-Champion!',
  },
  {
    id: 'inquisitor_guillotine',
    v1Id: 'rowkill',
    v1Name: 'Airstrike Row',
    numeral: 'IV',
    name: 'Siege Cleaver (Row Strike)',
    order: 'inquisition',
    rarity: 'epic',
    cost: 4,
    unlockLevel: 4,
    targetType: 'row',
    effect: 'guillotine_row',
    desc: 'Drop a 3D Siege Blade across an entire Row, shattering all enemy Champions in that row.',
    exaltedDesc: 'Shatter all enemy Champions in the Row and draw 1 War-Scroll.',
  },
  {
    id: 'iron_maiden_cage',
    v1Id: 'freeze',
    v1Name: 'Freeze Cage',
    numeral: 'V',
    name: 'Frost-Iron Cage (Freeze)',
    order: 'sanctum',
    rarity: 'common',
    cost: 2,
    unlockLevel: 5,
    targetType: 'empty_cell',
    effect: 'iron_cage',
    desc: 'Raise 3D wrought-iron portcullis bars on a tile, freezing/locking it for 2 turns.',
    exaltedDesc: 'Lock a 5-tile (+) cross of tiles for 3 turns.',
  },
  {
    id: 'transpose_relics',
    v1Id: 'swap',
    v1Name: 'Chaos Swap',
    numeral: 'VI',
    name: 'Tactical Teleport (Swap)',
    order: 'chronicle',
    rarity: 'rare',
    cost: 3,
    unlockLevel: 6,
    targetType: 'two_occupied',
    effect: 'transpose_stones',
    desc: 'Swap the positions of any two unshielded Champions on the 3D War-Table.',
    exaltedDesc: 'Swap any two unshielded Champions and draw 1 War-Scroll.',
  },
  {
    id: 'brimstone_cataclysm',
    v1Id: 'meteor',
    v1Name: 'Meteor 3×3',
    numeral: 'VII',
    name: 'Brimstone Meteor (3×3)',
    order: 'inquisition',
    rarity: 'legendary',
    cost: 5,
    unlockLevel: 7,
    targetType: 'any_cell',
    effect: 'brimstone_3x3',
    desc: 'Call down a 3D Brimstone Meteor on a 3×3 zone, shattering all unshielded Champions into craters.',
    exaltedDesc: 'Shatter only enemy Champions in a 3×3 zone while sparing your own!',
  },
  {
    id: 'double_consecration',
    v1Id: 'time',
    v1Name: 'Time Warp',
    numeral: 'VIII',
    name: 'Time Warp Decree',
    order: 'chronicle',
    rarity: 'rare',
    cost: 3,
    unlockLevel: 8,
    targetType: 'none',
    effect: 'double_consecration',
    desc: 'Gain +1 additional Champion placement on the War-Table this turn!',
    exaltedDesc: 'Gain +1 additional Champion placement and +2 Gold Coins.',
  },
  {
    id: 'cruciform_lance',
    v1Id: 'cross_strike',
    v1Name: 'Cross Strike',
    numeral: 'IX',
    name: 'Cruciform Sky-Lance (+)',
    order: 'inquisition',
    rarity: 'rare',
    cost: 4,
    unlockLevel: 9,
    targetType: 'any_cell',
    effect: 'shatter_cross',
    desc: 'Shatter all unshielded enemy Champions in a 5-tile Cruciform (+) blast.',
    exaltedDesc: 'Shatter enemy Champions in a (+) blast and gain +1 VP.',
  },
  {
    id: 'sanctified_relic',
    v1Id: 'core',
    v1Name: 'Core Joker',
    numeral: 'X',
    name: 'Valkyrie Joker Idol (★)',
    order: 'sanctum',
    rarity: 'rare',
    cost: 4,
    unlockLevel: 10,
    targetType: 'empty_cell',
    effect: 'sanctified_relic',
    desc: 'Summon a 3D Golden Wild Joker Idol (W) that counts for all lines & patterns.',
    exaltedDesc: 'Summon a shielded 3D Golden Wild Joker Idol (W).',
  },
  {
    id: 'transept_cleaver',
    v1Id: 'colkill',
    v1Name: 'Column Strike',
    numeral: 'XI',
    name: 'Vanguard Column Cleaver',
    order: 'inquisition',
    rarity: 'epic',
    cost: 4,
    unlockLevel: 11,
    targetType: 'col',
    effect: 'guillotine_col',
    desc: 'Drop a 3D Cleaver blade down an entire Column, shattering all enemy Champions.',
    exaltedDesc: 'Shatter all enemy Champions in the Column and gain +2 Gold Coins.',
  },
  {
    id: 'eclipse_shroud',
    v1Id: 'lockdown',
    v1Name: 'Lockdown',
    numeral: 'XII',
    name: 'Iron Lockdown Interdict',
    order: 'apocrypha',
    rarity: 'rare',
    cost: 3,
    unlockLevel: 12,
    targetType: 'none',
    effect: 'eclipse_shroud',
    desc: 'Lock 3 random empty tiles in Wrought-Iron Cages for 2 turns and draw 1 War-Scroll.',
    exaltedDesc: 'Lock 5 random empty tiles for 2 turns and draw 1 War-Scroll.',
  },
  {
    id: 'gargoyle_bastion_card',
    v1Id: 'barricade',
    v1Name: 'Iron Barricade',
    numeral: 'XIII',
    name: 'Fortress Barricade Pillar',
    order: 'sanctum',
    rarity: 'common',
    cost: 2,
    unlockLevel: 13,
    targetType: 'empty_cell',
    effect: 'raise_bastion',
    desc: 'Erect an indestructible 3D Stone Fortress Pillar on an empty tile to block enemy lines.',
    exaltedDesc: 'Erect a 3D Stone Fortress Pillar and gain +1 VP.',
  },
  {
    id: 'tithe_inquisition',
    v1Id: 'vampire',
    v1Name: 'Vampire Drain',
    numeral: 'XIV',
    name: 'Vampiric Gold Siphon',
    order: 'blood',
    rarity: 'common',
    cost: 2,
    unlockLevel: 14,
    targetType: 'none',
    effect: 'tithe_drain',
    desc: "Siphon up to 2 Gold Coins from the enemy Warlord's treasury and draw 1 War-Scroll.",
    exaltedDesc: 'Siphon up to 3 Gold Coins and draw 1 War-Scroll.',
  },
  {
    id: 'mirror_nave',
    v1Id: 'mirror',
    v1Name: 'Mirror Row',
    numeral: 'XV',
    name: 'Arcane Row Mirror',
    order: 'apocrypha',
    rarity: 'rare',
    cost: 3,
    unlockLevel: 15,
    targetType: 'row',
    effect: 'mirror_nave',
    desc: 'Horizontally mirror all unshielded Champions across the chosen Row.',
    exaltedDesc: 'Mirror the Row and gain +2 Gold Coins.',
  },
  {
    id: 'blood_communion',
    v1Id: 'overclock',
    v1Name: 'War Treasury',
    numeral: 'XVI',
    name: 'War-Chest Munitions',
    order: 'blood',
    rarity: 'common',
    cost: 1,
    unlockLevel: 16,
    targetType: 'none',
    effect: 'blood_communion',
    desc: 'Gain +4 Gold Coins and draw 2 War-Scroll cards into your hand.',
    exaltedDesc: 'Gain +5 Gold Coins and draw 3 War-Scroll cards.',
  },
  {
    id: 'stained_glass_blessing',
    v1Id: 'terra',
    v1Name: 'Sacred Rune',
    numeral: 'XVII',
    name: 'Runic War-Seal (+2 VP)',
    order: 'sanctum',
    rarity: 'rare',
    cost: 3,
    unlockLevel: 17,
    targetType: 'any_cell',
    effect: 'consecrate_mosaic',
    desc: 'Inlay a glowing Runic Mosaic on a tile (revives craters & grants +2 bonus VP when aligned).',
    exaltedDesc: 'Inlay a Runic Mosaic and immediately place your Champion on it!',
  },
  {
    id: 'martyr_sacrifice',
    v1Id: 'siphon',
    v1Name: 'Soul Sacrifice',
    numeral: 'XVIII',
    name: "Berserker's Sacrifice",
    order: 'blood',
    rarity: 'rare',
    cost: 1,
    unlockLevel: 18,
    targetType: 'friendly_cell',
    effect: 'sanguine_feast',
    desc: 'Shatter 1 of your own Champions to gain +5 Gold Coins and draw 2 War-Scrolls.',
    exaltedDesc: 'Shatter 1 of your own Champions to gain +7 Gold Coins and draw 3 War-Scrolls.',
  },
  {
    id: 'excommunication',
    v1Id: 'rewind',
    v1Name: 'Banish Latest',
    numeral: 'XIX',
    name: 'Warlord Banishment',
    order: 'apocrypha',
    rarity: 'epic',
    cost: 4,
    unlockLevel: 19,
    targetType: 'none',
    effect: 'excommunication',
    desc: "Shatter the enemy Warlord's most recently placed Champion and cage its tile.",
    exaltedDesc: "Shatter the enemy's latest Champion, cage its tile for 3 turns, and draw 1 War-Scroll.",
  },
  {
    id: 'cathedral_judgment',
    v1Id: 'blackhole',
    v1Name: 'Cataclysm',
    numeral: 'XX',
    name: 'Divine War-Table Judgment',
    order: 'inquisition',
    rarity: 'legendary',
    cost: 5,
    unlockLevel: 20,
    targetType: 'none',
    effect: 'cathedral_judgment',
    desc: 'Shatter 2 random enemy Champions into rubble and shield all your Champions for 2 turns.',
    exaltedDesc: 'Shatter 3 random enemy Champions and shield all your Champions for 2 turns.',
  },
]);

export function getArcanaCardById(cardId) {
  return ARCANA_CARDS.find((c) => c.id === cardId || c.v1Id === cardId) || null;
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
    name: 'Warlord Malakor',
    title: 'Ironclad General of the Black Gate',
    warlordClass: 'Black-Iron Juggernaut',
    passiveId: 'iron_maiden_lock',
    passiveDesc: 'Every 3rd AI turn, drops an Iron Portcullis Cage on an empty war-table tile.',
    quote: '"My Black-Iron Vanguard yields not an inch of stone!"',
    color: '#f59e0b',
  },
  {
    id: 'boss_vespera',
    name: 'Lich-Empress Vespera',
    title: 'Necromancer Queen of the Ossuary',
    warlordClass: 'Undead Arch-Necromancer',
    passiveId: 'ossuary_pillar',
    passiveDesc: 'Every 3rd AI turn, summons a Mystery Bone-Chest onto the battlefield.',
    quote: '"Every fallen warrior in this crypt rises to serve my throne."',
    color: '#2dd4bf',
  },
  {
    id: 'boss_vorn',
    name: 'General Vorn',
    title: 'Wyrm-Breaker of the Ashen Spire',
    warlordClass: 'Horned Gargoyle Warlord',
    passiveId: 'bell_shockwave',
    passiveDesc: 'Every 3rd AI turn, slams his Wyrm-Hammer to shatter 1 unshielded player Champion.',
    quote: '"Hear the war-drums thunder—and watch your shields crumble!"',
    color: '#f97316',
  },
  {
    id: 'boss_thurible',
    name: 'Pyromancer Morvain',
    title: 'Grand Warlock of the Hell-Forge',
    warlordClass: 'Brimstone Battle-Mage',
    passiveId: 'plague_censer',
    passiveDesc: 'Every 3rd AI turn, plants a volatile Siege Bomb Censer on the war-table.',
    quote: '"Breathe deep the sulfur and ash of the Hell-Forge!"',
    color: '#c084fc',
  },
  {
    id: 'boss_carmilla',
    name: 'Countess Carmilla',
    title: 'Vampiric Sovereign of the Crimson Host',
    warlordClass: 'Blood-Knight Valkyrie',
    passiveId: 'blood_tithe_tax',
    passiveDesc: 'Every 3rd AI turn, siphons 1 Gold Coin from your war treasury.',
    quote: '"Your tribute is paid in gold and crimson, mortal."',
    color: '#e11d48',
  },
  {
    id: 'boss_hollow_seraph',
    name: 'The Abyssal War-God',
    title: 'Six-Winged Fallen Seraph of the Void',
    warlordClass: 'Immortal Void Overlord',
    passiveId: 'seraph_aegis',
    passiveDesc: 'Every 3rd AI turn, grants Aegis Shielding to an enemy Champion and +1 Gold.',
    quote: '"I am the eternal war-god carved into the heart of the world."',
    color: '#fb7185',
  },
]);

export const CATHEDRAL_ACTS = Object.freeze([
  {
    id: 1,
    actId: 1,
    roman: 'I',
    name: 'Realm I: The Iron Borderlands',
    subtitle: 'Iron Vanguard & Tactical Awakening',
    themeColor: '#d4a853',
    hallId: 'obsidian_nave',
    bossId: INQUISITOR_BOSSES[0].id,
    boss: INQUISITOR_BOSSES[0],
  },
  {
    id: 2,
    actId: 2,
    roman: 'II',
    name: 'Realm II: The Necromancer Catacombs',
    subtitle: 'Crypt of the Lich-Empress',
    themeColor: '#a855f7',
    hallId: 'ossuary_crypt',
    bossId: INQUISITOR_BOSSES[1].id,
    boss: INQUISITOR_BOSSES[1],
  },
  {
    id: 3,
    actId: 3,
    roman: 'III',
    name: 'Realm III: The Dragon-Breaker Peaks',
    subtitle: 'High Battlements of General Vorn',
    themeColor: '#38bdf8',
    hallId: 'ashen_belfry',
    bossId: INQUISITOR_BOSSES[2].id,
    boss: INQUISITOR_BOSSES[2],
  },
  {
    id: 4,
    actId: 4,
    roman: 'IV',
    name: 'Realm IV: The Hell-Forge Citadel',
    subtitle: 'Brimstone Furnaces of Morvain',
    themeColor: '#f97316',
    hallId: 'eclipse_choir',
    bossId: INQUISITOR_BOSSES[3].id,
    boss: INQUISITOR_BOSSES[3],
  },
  {
    id: 5,
    actId: 5,
    roman: 'V',
    name: 'Realm V: The Crimson Court',
    subtitle: 'Sanguine Sanctum of Countess Carmilla',
    themeColor: '#e11d48',
    hallId: 'blood_sanctum',
    bossId: INQUISITOR_BOSSES[4].id,
    boss: INQUISITOR_BOSSES[4],
  },
  {
    id: 6,
    actId: 6,
    roman: 'VI',
    name: 'Realm VI: Throne of the War-God',
    subtitle: 'Final Siege of the Abyssal War-God',
    themeColor: '#fbbf24',
    hallId: 'blood_sanctum',
    bossId: INQUISITOR_BOSSES[5].id,
    boss: INQUISITOR_BOSSES[5],
  },
]);

const LEVEL_NAMES = [
  'First Steps (Pure Tactics)', 'Corner Trap (No Cards)', 'War-Scrolls Awakened', 'Wrought-Iron Vigil', 'Siege of the Outpost', 'Gate of Warlord Malakor',
  'Catacomb March', 'Vault of Skulls', 'Soul-Lantern Crossing', 'Reliquary Tomb', 'Crypt Ambush', 'Throne of Lich Vespera',
  'Wyrm-Spire Ascent', 'Gargoyle Ledge', 'Thunder Battlement', 'Wind-Carved Buttress', 'Dragon-Bone Ridge', 'Citadel of General Vorn',
  'Hell-Forge Gate', 'Brimstone Nave', 'Amethyst War-Room', 'Smoking Siege-Works', 'Arcane Scriptorium', 'Sanctum of Pyromancer Morvain',
  'Crimson Vanguard', 'Vein of Obsidian', 'Blood-Ruby Court', 'Valkyrie Transept', 'Sanguine Font', 'Court of Countess Carmilla',
  'Fractured Monolith', 'Dies Irae Vanguard', 'Pillar of Conquest', 'Grand Cruciform Siege', 'Apex War-Tower', 'The Abyssal War-God',
];

const LEVEL_TIPS = {
  1: 'PURE TACTICS (No Cards): Click any tile to place your Champion. Align 3 in a row to shatter the line and score!',
  2: 'PURE TACTICS (No Cards): If the enemy Warlord has 2 in a row, block their 3rd tile! Cards & Shop unlock at Level 3!',
  3: 'WAR-SCROLL SHOP UNLOCKED! Earn +1🪙 every 2 turns & +1🪙 per score. Buy War-Scrolls in the Shop & play 1 per turn!',
  4: 'OPEN WAR-CHESTS: Place a Champion adjacent to a Mystery War-Chest to crack it for Gold, Wild Jokers, or Scrolls!',
  5: 'SIEGE BOMBS: Watch the countdown on ticking Censers/Bombs — they detonate in a 3×3 stone-shattering blast!',
  6: 'BOSS DUEL — WARLORD MALAKOR: Every 3rd AI turn he cages a tile. Use Warhammer Smash & Shield Aegis to break his lines!',
};

export const CATHEDRAL_LEVELS = Object.freeze(
  Array.from({ length: 36 }, (_, idx) => {
    const level = idx + 1;
    const actId = Math.ceil(level / 6);
    const act = CATHEDRAL_ACTS[actId - 1];
    const isBossLevel = level % 6 === 0;
    const boardSize = level <= 2 ? 5 : level <= 12 ? 5 : level <= 24 ? 6 : 6;
    const targetScore = level === 1 ? 4 : level === 2 ? 5 : 5 + Math.floor(level / 4) + (isBossLevel ? 2 : 0);
    const aiTier = level <= 2 ? 1 : Math.min(6, Math.ceil(level / 6));

    // v1 Rule: NO CARDS UNTIL LEVEL 3!
    const cardsEnabled = level >= GAME_CONFIG.CARDS_UNLOCK_LEVEL;
    const unlockedCardObj = level >= 3 && level - 3 < ARCANA_CARDS.length ? ARCANA_CARDS[level - 3] : null;
    const tipText =
      LEVEL_TIPS[level] ||
      (cardsEnabled
        ? 'Use Gold Coins to buy War-Scrolls from the 3-slot Shop. Play 1 Scroll per turn before placing your Champion!'
        : 'Pure Tactical Mode — Cards & War-Scroll Shop unlock at Level 3!');

    return {
      level,
      actId,
      name: LEVEL_NAMES[idx],
      lore: tipText,
      tip: tipText,
      hallId: act.hallId,
      boardSize,
      targetScore,
      aiTier,
      isBossLevel,
      cardsEnabled,
      cardUnlock: unlockedCardObj ? unlockedCardObj.name : null,
      boss: isBossLevel ? act.boss : act.boss, // Always show the Realm's War Commander as opponent!
      bastions: level >= 4 ? (level % 3 === 0 ? 2 : 1) : 0,
      reliquaryCoffers: level >= 3 ? (level % 2 === 0 ? 2 : 1) : 0,
      mosaics: level >= 3 ? 1 : 0,
      censers: level >= 5 && level % 3 === 1 ? 1 : 0,
    };
  })
);

export function getLevelByNumber(levelNumber) {
  return CATHEDRAL_LEVELS.find((l) => l.level === Number(levelNumber)) || CATHEDRAL_LEVELS[0];
}

export const CRYPT_TRIALS = Object.freeze([
  {
    id: 'crypt_1',
    name: 'Trial I: The Paladin Cross',
    subtitle: 'Complete the 5-Champion Sacred Cross (+) and dual 3-stone lines in a single placement.',
    boardSize: 5,
    targetScore: 5,
    tithe: 0,
    placementsRemaining: 1,
    rewardSigils: 140,
    hint: 'Deploy your Champion to the center tile [3, 3] to unite all four cardinal arms into a Sacred Cross (+).',
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
    name: 'Trial II: Warhammer Smash',
    subtitle: 'Shatter the obstructing enemy Champion with your Warhammer, then complete the battle-line.',
    boardSize: 5,
    targetScore: 1,
    tithe: 3,
    placementsRemaining: 1,
    rewardSigils: 160,
    hint: 'Cast Warhammer Smash on [3, 3] to shatter the enemy stone, then deploy your Champion at [3, 3].',
    hand: ['warhammer_penance'],
    initialBoard: [
      { r: 2, c: 1, symbol: 'X' },
      { r: 2, c: 2, symbol: 'O' },
      { r: 2, c: 3, symbol: 'X' },
    ],
  },
  {
    id: 'crypt_3',
    name: 'Trial III: Warlord Allegiance',
    subtitle: 'Convert the enemy Champion to your banner, then seal the War-Table T-Cross.',
    boardSize: 5,
    targetScore: 4,
    tithe: 6,
    placementsRemaining: 1,
    rewardSigils: 180,
    hint: 'Cast Warlord Allegiance (Convert) on the enemy Champion at [2, 3], then place your Champion at [3, 3].',
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
    name: 'Trial IV: Dragon Saltire (X)',
    subtitle: 'Forge the diagonal X-Saltire across the War-Table.',
    boardSize: 5,
    targetScore: 5,
    tithe: 0,
    placementsRemaining: 1,
    rewardSigils: 200,
    hint: 'Deploy your Champion at the central intersection [3, 3] to complete both diagonals and the Saltire (X).',
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
    name: 'Trial V: The Fortress Ring',
    subtitle: 'Complete the 8-Champion Fortress Ring (3×3 hollow frame).',
    boardSize: 5,
    targetScore: 5,
    tithe: 0,
    placementsRemaining: 1,
    rewardSigils: 250,
    hint: 'Place the final Champion at [4, 4] to seal the 3×3 Fortress Ring.',
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
