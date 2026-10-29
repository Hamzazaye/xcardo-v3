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
  { id: 'coins', icon: '🪙', label: 'Gold Cache (+2🪙)', pct: 42 },
  { id: 'joker', icon: '★', label: 'Wild Joker Idol (★)', pct: 24 },
  { id: 'bomb', icon: '💣', label: 'Siege Bomb (💣 4T)', pct: 15 },
  { id: 'jackpot', icon: '💎', label: 'War Chest Jackpot (+5🪙)', pct: 7 },
  { id: 'bonus_card', icon: '📜', label: 'Free War-Scroll / +1 VP', pct: 12 },
]);

export const FANTASY_HEROES = Object.freeze([
  {
    id: 'hero_paladin',
    name: 'High Paladin Aurelius',
    shortName: 'Paladin Aurelius',
    title: 'The Sunforged Vanguard',
    heroClass: 'Sunforged Paladin',
    classTitle: 'Sunforged Paladin',
    weapon: 'Dawnbreaker Sun-Spear',
    color: '#f59e0b',
    accent: '#fde68a',
    sculptId: 'seraph_cross',
    defaultSculpt: 'seraph_cross',
    materialId: 'alabaster_marble',
    defaultMaterial: 'alabaster_marble',
    lore: 'Sworn protector of the Starlight Bastion, Aurelius leads the realm’s quest to reclaim the six shattered Star-Stones and restore peace to the borderlands.',
    storyCounsel: 'Take your time on the war-table, friend. Hold the center tiles and let our golden shield-wall guide the way.',
    passiveDesc: 'Radiant Command: Starts Level 3+ battles with +1 bonus Gold Coin.',
    battleCry: '"By the Sunforged Oath, the Star-Stones shall shine again!"',
  },
  {
    id: 'hero_valkyrie',
    name: 'Shieldmaiden Freya',
    shortName: 'Valkyrie Freya',
    title: 'Valkyrie of the Storm-Spire',
    heroClass: 'Storm Valkyrie',
    classTitle: 'Storm Valkyrie',
    weapon: 'Gungnir Sky-Lance',
    color: '#38bdf8',
    accent: '#bae6fd',
    sculptId: 'templar_knight',
    defaultSculpt: 'templar_knight',
    materialId: 'gilded_reliquary',
    defaultMaterial: 'gilded_reliquary',
    lore: 'Descending from the cloud-citadels of the northern peaks, Freya rides the silver winds to break the siege lines of the Iron Warlords.',
    storyCounsel: 'Swift strikes win the day! Build diagonal lines and sound the War-Horn when their defenses falter.',
    passiveDesc: 'Sky-born Valor: Begins every battle with +20% War-Horn Ultimate charge.',
    battleCry: '"Ride the silver wind! Together we reclaim the sky-spires!"',
  },
  {
    id: 'hero_archmage',
    name: 'Arch-Magus Kaelen',
    shortName: 'Arch-Mage Kaelen',
    title: 'Grand Scholar of the Star-Vault',
    heroClass: 'Astral Battle-Mage',
    classTitle: 'Astral Battle-Mage',
    weapon: 'Staff of the Dawn-Star',
    color: '#c084fc',
    accent: '#e9d5ff',
    sculptId: 'seraph_cross',
    defaultSculpt: 'seraph_cross',
    materialId: 'cursed_amethyst',
    defaultMaterial: 'cursed_amethyst',
    lore: 'Keeper of the Royal Library who deciphered the ancient Star-Stone prophecies. Kaelen weaves geometry and arcane scrolls into effortless harmony.',
    storyCounsel: 'Every stone placed is a verse in our chronicle. Once we reach Level 3, the Scroll Vault will open to our command.',
    passiveDesc: 'Arcane Mastery: First Shop Reroll each battle costs 1 less Gold.',
    battleCry: '"Every star-rune carved into this table answers our call."',
  },
  {
    id: 'hero_dragonknight',
    name: 'Dragon-Lord Draven',
    shortName: 'Dragon-Lord Draven',
    title: 'Ember-Crest Dragoon',
    heroClass: 'Dragon-Knight Warlord',
    classTitle: 'Dragon-Knight Warlord',
    weapon: 'Ember-Wyrm Halberd',
    color: '#f97316',
    accent: '#fed7aa',
    sculptId: 'gargoyle_warden',
    defaultSculpt: 'gargoyle_warden',
    materialId: 'blood_obsidian',
    defaultMaterial: 'blood_obsidian',
    lore: 'Bonded with the ancient ember-drakes of Mount Pyre, Draven stands as an unbreakable bulwark between the innocent realms and the Abyssal Legions.',
    storyCounsel: 'Do not fear their numbers! Shatter their front ranks and turn the tide with bold formations.',
    passiveDesc: 'Wyrm-Fury: Shattering enemy Champions grants +10% bonus War-Horn charge.',
    battleCry: '"Let warm dragon-fire light our path to victory!"',
  },
  {
    id: 'hero_ranger',
    name: 'Sylvan Warden Lyra',
    shortName: 'Warden Lyra',
    title: 'Emerald Star-Archer',
    heroClass: 'Elven War-Ranger',
    classTitle: 'Elven War-Ranger',
    weapon: 'Starlight Whisper-Bow',
    color: '#2dd4bf',
    accent: '#99f6e4',
    sculptId: 'templar_knight',
    defaultSculpt: 'templar_knight',
    materialId: 'verdigris_bronze',
    defaultMaterial: 'verdigris_bronze',
    lore: 'Guardian of the Whispering Groves whose keen eyes spot hidden supply caches and weaknesses in any warlord’s formation.',
    storyCounsel: 'Claim the Mystery Chests on the board whenever you can — their treasures will tip the scales in our favor.',
    passiveDesc: 'Pathfinder Eye: Mystery War-Chests grant +1 extra Gold when cracked.',
    battleCry: '"Guided by starlight, not a single arrow shall miss."',
  },
  {
    id: 'hero_deathknight',
    name: 'Runeblade Arthos',
    shortName: 'Runeblade Arthos',
    title: 'Frost-Guard Sentinel',
    heroClass: 'Glacial Runeblade',
    classTitle: 'Glacial Runeblade',
    weapon: 'Winter-Star Greatsword',
    color: '#60a5fa',
    accent: '#bfdbfe',
    sculptId: 'gargoyle_warden',
    defaultSculpt: 'gargoyle_warden',
    materialId: 'weathered_basalt',
    defaultMaterial: 'weathered_basalt',
    lore: 'A stoic sentinel from the northern glaciers who broke free from the Frost-King’s curse to defend the living realms with ancient rune-craft.',
    storyCounsel: 'Patience is our strongest armor. Freeze their advances and strike when the board is ours.',
    passiveDesc: 'Glacial Presence: Starts Level 3+ battles with 1 free War-Scroll in hand.',
    battleCry: '"Calm as winter snow, steadfast as the mountain peak."',
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
      name: 'Solar Paladin Champion',
      desc: 'Armored Solar War-Champion with a royal crown, star-crested shield, and upright sun-spear.',
      cost: 0,
    },
    {
      id: 'templar_knight',
      name: 'Valkyrie Royal Guard',
      desc: 'Winged Great-Helm champion bust with heavy pauldrons and glowing royal V-visor.',
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
    desc: 'All special tactical formations (Starburst, X, Box, T, L, Sovereign) grant +1 bonus VP.',
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
    exaltedDesc: 'Lock a 5-tile Starburst of tiles for 3 turns.',
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
    v1Name: 'Starburst Strike',
    numeral: 'IX',
    name: 'Solar Starburst Spear',
    order: 'inquisition',
    rarity: 'rare',
    cost: 4,
    unlockLevel: 9,
    targetType: 'any_cell',
    effect: 'shatter_cross',
    desc: 'Shatter all unshielded enemy Champions in a 5-tile Starburst blast.',
    exaltedDesc: 'Shatter enemy Champions in a 5-tile Starburst blast and gain +1 VP.',
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
    name: 'Chapter I: The Iron Borderlands',
    subtitle: 'Awakening the Ancient Star-Stones',
    storySummary:
      'For centuries, the Star-Tables kept peace across the six kingdoms. Now Warlord Malakor has seized the frontier watchtowers. Begin your journey with calm, pure board tactics on Levels 1 & 2 before unlocking the ancient War-Scroll Vault at Level 3.',
    storyGoal: 'Reclaim the 6 borderland watchtowers and awaken the War-Scroll Sanctuary.',
    themeColor: '#d4a853',
    hallId: 'obsidian_nave',
    bossId: INQUISITOR_BOSSES[0].id,
    boss: INQUISITOR_BOSSES[0],
  },
  {
    id: 2,
    actId: 2,
    roman: 'II',
    name: 'Chapter II: The Moonlit Catacombs',
    subtitle: 'Whispers Beneath the Silver Crypt',
    storySummary:
      'With the borderlands secured and the War-Scroll Shop unlocked, your fellowship descends into the Moonlit Catacombs where Lich-Empress Vespera guards the stolen Star-Chests.',
    storyGoal: 'Crack the Mystery War-Chests of the Undercroft and outmaneuver Empress Vespera.',
    themeColor: '#a855f7',
    hallId: 'ossuary_crypt',
    bossId: INQUISITOR_BOSSES[1].id,
    boss: INQUISITOR_BOSSES[1],
  },
  {
    id: 3,
    actId: 3,
    roman: 'III',
    name: 'Chapter III: The Sky-Dragon Peaks',
    subtitle: 'High Battlements of General Vorn',
    storySummary:
      'Above the clouds, General Vorn commands the Wyrm-Breaker legions across sweeping 6×6 mountain War-Tables. Use shields and row-cleaving scrolls to hold the high ground.',
    storyGoal: 'Ascend the Sky-Spire and break General Vorn’s mountain siege.',
    themeColor: '#38bdf8',
    hallId: 'ashen_belfry',
    bossId: INQUISITOR_BOSSES[2].id,
    boss: INQUISITOR_BOSSES[2],
  },
  {
    id: 4,
    actId: 4,
    roman: 'IV',
    name: 'Chapter IV: The Ember Forge',
    subtitle: 'Furnaces of Pyromancer Morvain',
    storySummary:
      'Deep within the volcanic citadel, Pyromancer Morvain plants ticking Siege Bombs across the stones. Time your placements carefully and turn his own blasts against his lines.',
    storyGoal: 'Survive the ticking Siege Bombs and extinguish Morvain’s Hell-Forge.',
    themeColor: '#f97316',
    hallId: 'eclipse_choir',
    bossId: INQUISITOR_BOSSES[3].id,
    boss: INQUISITOR_BOSSES[3],
  },
  {
    id: 5,
    actId: 5,
    roman: 'V',
    name: 'Chapter V: The Crimson Court',
    subtitle: 'Velvet Citadel of Countess Carmilla',
    storySummary:
      'Countess Carmilla drains Gold Coins from careless commanders in her candlelit palace. Spend your Gold wisely in the 3-Slot Shop and protect your key Champions with Aegis domes.',
    storyGoal: 'Guard your war-treasury and dethrone Countess Carmilla.',
    themeColor: '#e11d48',
    hallId: 'blood_sanctum',
    bossId: INQUISITOR_BOSSES[4].id,
    boss: INQUISITOR_BOSSES[4],
  },
  {
    id: 6,
    actId: 6,
    roman: 'VI',
    name: 'Chapter VI: Throne of the War-God',
    subtitle: 'The Final Dawn of the Realm',
    storySummary:
      'At the summit of the Obsidian Citadel, the Abyssal War-God awaits. Unite every War-Scroll, Sacred Formation, and Heroic power you have mastered to restore peace to the realm.',
    storyGoal: 'Triumph over the Abyssal War-God and complete the Chronicle of XcardO.',
    themeColor: '#fbbf24',
    hallId: 'blood_sanctum',
    bossId: INQUISITOR_BOSSES[5].id,
    boss: INQUISITOR_BOSSES[5],
  },
]);

const LEVEL_NAMES = [
  'First Steps (Pure Tactics)', 'Watchtower Warmup (No Cards)', 'The Scroll Vault Opens', 'Wrought-Iron Vigil', 'Siege of the Outpost', 'Gate of Warlord Malakor',
  'Catacomb March', 'Vault of Echoes', 'Soul-Lantern Bridge', 'Reliquary Tomb', 'Crypt Ambush', 'Throne of Lich Vespera',
  'Wyrm-Spire Ascent', 'Griffin Ledge', 'Thunder Battlement', 'Wind-Carved Buttress', 'Dragon-Bone Ridge', 'Citadel of General Vorn',
  'Ember-Forge Gate', 'Brimstone Hall', 'Amethyst War-Room', 'Smoking Siege-Works', 'Arcane Scriptorium', 'Sanctum of Pyromancer Morvain',
  'Crimson Vanguard', 'Vein of Obsidian', 'Ruby Court', 'Valkyrie Gallery', 'Sanguine Font', 'Court of Countess Carmilla',
  'Fractured Monolith', 'Starlight Vanguard', 'Pillar of Conquest', 'Grand Starlight Siege', 'Apex War-Tower', 'The Abyssal War-God',
];

const LEVEL_TIPS = {
  1: 'CHAPTER I • PROLOGUE (No Cards): Welcome, Commander! Place your Champions on the board to align 3 in a row and score 4 VP. Relax and focus on pure positioning—Cards & Gold unlock at Level 3!',
  2: 'CHAPTER I • WATCHTOWER (No Cards): Watch the enemy Warlord’s stones—when he lines up 2 in a row, place your Champion on the 3rd tile to block him! Clear this battle to unlock the War-Scroll Shop!',
  3: 'CHAPTER I • THE VAULT OPENS: You unlocked the 3-Slot War-Scroll Shop! Earn +1🪙 every 2 turns & +1🪙 per score. Buy scrolls in the bottom Shop and cast 1 free scroll per turn!',
  4: 'MYSTERY WAR-CHESTS: Place a Champion next to a 📦 War-Chest on the board to crack it open for bonus Gold, Wild Jokers, or Scrolls!',
  5: 'TICKING SIEGE BOMBS: Watch the countdown on 💣 Bombs—when they hit 0, they shatter a 3×3 area!',
  6: 'CHAPTER I FINALE — WARLORD MALAKOR: Every 3rd AI turn he locks a tile. Use Warhammer Smash & Shield Aegis to claim the borderlands!',
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
        ? `${act.name}: Spend Gold Coins in the 3-slot Shop to buy War-Scrolls, then cast 1 Scroll per turn!`
        : 'Pure Tactical Mode — Cards & War-Scroll Shop unlock at Level 3!');

    return {
      level,
      actId,
      chapterName: act.name,
      chapterStory: act.storySummary,
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
      boss: isBossLevel ? act.boss : act.boss,
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
    name: 'Trial I: The Solar Starburst',
    subtitle: 'Complete the 5-Champion Solar Starburst and dual 3-stone lines in a single placement.',
    boardSize: 5,
    targetScore: 5,
    tithe: 0,
    placementsRemaining: 1,
    rewardSigils: 140,
    hint: 'Deploy your Champion to the center tile [3, 3] to unite all four cardinal arms into a Solar Starburst.',
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
    subtitle: 'Convert the enemy Champion to your banner, then seal the War-Table T-Vanguard.',
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
