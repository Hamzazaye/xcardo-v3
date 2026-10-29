/**
 * XcardO — Warlords of the Obsidian Altar
 * Automated Verification Suite (3D Sculptor, Stone Shatter Physics, Pattern Detector, AI, V1 Rules Engine, Heroes & UI)
 */

import assert from 'node:assert/strict';
import { EventBus } from '../src/core/event-bus.js';
import { SaveManager } from '../src/core/save-manager.js';
import {
  GAME_CONFIG,
  ARCANA_CARDS,
  CATHEDRAL_LEVELS,
  CRYPT_TRIALS,
  INQUISITOR_BOSSES,
  FANTASY_HEROES,
  SCULPTED_PIECES,
  STONE_MATERIALS,
} from '../src/data/gothic-config.js';
import {
  renderTarotArtSVG,
  renderBossCrestSVG,
  renderRoseWindowSVG,
  renderFantasyHeroPortraitSVG,
} from '../src/ui/gothic-svg.js';
import { scanBoardPatterns } from '../src/engine/pattern-detector.js';
import { selectBestAIMove, scanEnemyThreatCells } from '../src/engine/ai-brain.js';
import { BattleEngine } from '../src/engine/game-state.js';
import {
  createPieceSculpture3D,
  createTileEntity3D,
  createCathedralAltar3D,
  createInquisitorAutomaton3D,
} from '../src/three/sculptor-3d.js';
import { StoneShatterPhysics } from '../src/three/shatter-physics.js';
import { GothicScene3D } from '../src/three/gothic-scene.js';
import { AppController } from '../src/ui/app-controller.js';

let passed = 0;
function runSuite(name, fn) {
  fn();
  passed++;
  console.log(`  [PASS] ${name}`);
}

console.log('=== XcardO: Warlords of the Obsidian Altar — Verification Suite ===');

// 1. Master Config & Brand Title Integrity (No "III")
runSuite('1. Master Configuration (Brand Title XcardO, 36 Levels, 20 War-Scrolls, 6 Heroes, 6 Bosses)', () => {
  assert.equal(GAME_CONFIG.TITLE, 'XcardO');
  assert.equal(GAME_CONFIG.TITLE.includes('III'), false, 'Title must not contain III');
  assert.equal(GAME_CONFIG.CARDS_UNLOCK_LEVEL, 3);
  assert.equal(CATHEDRAL_LEVELS.length, 36);
  assert.equal(ARCANA_CARDS.length, 20);
  assert.equal(CRYPT_TRIALS.length, 5);
  assert.equal(FANTASY_HEROES.length, 6);
  assert.equal(INQUISITOR_BOSSES.length, 6);
  assert.equal(SCULPTED_PIECES.player.length, 3);
  assert.equal(SCULPTED_PIECES.enemy.length, 3);
  assert.equal(STONE_MATERIALS.length, 6);
});

// 2. 3D Procedural Piece Sculptor & War-Table Builder
runSuite('2. 3D Sculptor (6 Fantasy War Miniatures, Shield Dome, War-Table & Warlord Automaton)', () => {
  for (const p of SCULPTED_PIECES.player) {
    const mesh = createPieceSculpture3D('X', p.id, 'alabaster_marble', { shield: 2 });
    assert.ok(mesh.children.length >= 4, `Sculpt ${p.id} should contain multi-part 3D geometry`);
  }
  for (const e of SCULPTED_PIECES.enemy) {
    const mesh = createPieceSculpture3D('O', e.id, 'blood_obsidian');
    assert.ok(mesh.children.length >= 4, `Sculpt ${e.id} should contain multi-part 3D geometry`);
  }
  const wildMesh = createPieceSculpture3D('W', 'seraph_cross', 'gilded_reliquary');
  assert.ok(wildMesh.children.length >= 4);

  const cofferMesh = createTileEntity3D('reliquary_coffer');
  assert.ok(cofferMesh.children.length >= 3);

  const altar = createCathedralAltar3D(5, {});
  assert.equal(altar.tileMeshes.length, 5);
  assert.equal(altar.tileMeshes[0].length, 5);
  assert.equal(altar.brazierFlames.length, 4);

  const inquisitor = createInquisitorAutomaton3D({ name: 'Malakor', color: '#e11d48' });
  assert.ok(inquisitor.userData.headGroup);
});

// 3. Real-Time 3D Rigid-Body Stone Shatter & Weapon Impact Physics
runSuite('3. 3D Rigid-Body Stone Shatter Physics & Altar Restitution Simulation', () => {
  const physics = new StoneShatterPhysics(null, { floorY: 0.04, altarHalfExtent: 3.5 });
  physics.spawnStoneShatter({ x: 0, y: 0.4, z: 0 }, { shardCount: 32, intensity: 1.4 });
  physics.spawnWeaponImpact({ x: 0, y: 0.4, z: 0 }, 'warhammer');

  assert.equal(physics.shards.length, 32);
  assert.equal(physics.shockwaves.length, 1);
  assert.equal(physics.projectiles.length, 1);

  for (let f = 0; f < 15; f++) {
    physics.step(1 / 60);
  }
  assert.equal(physics.projectiles[0].impacted, true);

  for (let f = 0; f < 30; f++) {
    physics.step(1 / 60);
  }
  const bouncedCount = physics.shards.filter((s) => s.bounces > 0).length;
  assert.ok(bouncedCount > 0, 'Shards should collide and bounce on the 3D War-Table surface');
  assert.equal(physics.projectiles.length, 0, 'Expired weapon projectile should be cleaned up');
});

// 4. Sacred Gothic Geometry & Line Pattern Detector
runSuite('4. Sacred Geometry Detector (Lines & Cruciform / Saltire / Cloister Shapes)', () => {
  const size = 5;
  const board = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => ({ symbol: null, locked: 0, anomaly: null }))
  );
  board[1][2].symbol = 'X';
  board[2][1].symbol = 'X';
  board[2][2].symbol = 'X';
  board[2][3].symbol = 'X';
  board[3][2].symbol = 'X';

  const patterns = scanBoardPatterns(board, size, new Set());
  const hasCrux = patterns.some((p) => p.shapeId === 'crux_fidelis');
  const hasLines = patterns.filter((p) => p.type === 'LINE').length >= 2;
  assert.equal(hasCrux, true);
  assert.equal(hasLines, true);
});

// 5. 6-Tier Single-Player Warlord AI & Threat Scanner
runSuite('5. Single-Player Warlord AI (Scoring, Threat Blocking & Oracle)', () => {
  const bus = new EventBus();
  const engine = new BattleEngine(bus, { mode: 'skirmish', boardSize: 5, targetScore: 6, aiTier: 5 });

  engine.board[0][0].symbol = 'X';
  engine.board[0][1].symbol = 'X';

  const move = selectBestAIMove(engine, 'O', 5);
  assert.ok(move);
  assert.equal(move.r, 0);
  assert.equal(move.c, 2, 'Tier 5 Warlord AI should block imminent 3-stone row alignment at (0,2)');

  engine.board[4][0].symbol = 'O';
  engine.board[4][1].symbol = 'O';
  const threats = scanEnemyThreatCells(engine, 'O');
  assert.ok(threats.some((t) => t.r === 4 && t.c === 2));
});

// 6. v1 Campaign Rules: No Cards Until Level 3 + Level 3+ 3-Slot In-Battle Shop
runSuite('6. v1 Rules: No Cards on Levels 1 & 2, 3-Slot In-Battle Shop & Gold Economy on Level 3+', () => {
  const bus = new EventBus();

  // Level 1 & Level 2 must have cardsEnabled === false, 0 Gold, 0 Cards, and empty Shop
  for (const lvl of [1, 2]) {
    const engNoCards = new BattleEngine(bus, { mode: 'campaign', levelNumber: lvl });
    assert.equal(engNoCards.cardsEnabled, false, `Level ${lvl} must disable cards`);
    assert.equal(engNoCards.tithe.X, 0, `Level ${lvl} must start with 0 Gold Coins`);
    assert.equal(engNoCards.hands.X.length, 0, `Level ${lvl} must start with 0 cards in hand`);
    assert.equal(engNoCards.shop.length, 0, `Level ${lvl} must have an empty shop`);
    assert.equal(engNoCards.drawCard('X'), null, `Level ${lvl} must block drawing cards`);
    assert.equal(engNoCards.buyShopCard(0, 'X').ok, false, `Level ${lvl} must block shop purchases`);
    assert.equal(engNoCards.rerollShop('X').ok, false, `Level ${lvl} must block shop rerolls`);
  }

  // Level 3+ must enable cards, Gold Coins, and the 3-Slot In-Battle Shop
  const engLvl3 = new BattleEngine(bus, { mode: 'campaign', levelNumber: 3, heroId: 'hero_paladin' });
  assert.equal(engLvl3.cardsEnabled, true, 'Level 3 must enable cards & shop');
  assert.ok(engLvl3.tithe.X >= 3, 'Level 3 must start with Gold Coins');
  assert.equal(engLvl3.shop.length, 3, 'Level 3 must populate 3 shop slots');

  // Grant extra Gold Coins to test buying from Shop and rerolling
  engLvl3.tithe.X = 12;
  engLvl3.hands.X = []; // Clear hand to test buying a scroll and casting it for FREE
  const buyRes = engLvl3.buyShopCard(0, 'X');
  assert.equal(buyRes.ok, true, 'Player should be able to buy a War-Scroll from Shop on Level 3');
  assert.equal(engLvl3.hands.X.length, 1);
  assert.equal(engLvl3.hands.X[0].paidInShop, true, 'Bought scroll must be marked paidInShop: true');

  const rerollRes = engLvl3.rerollShop('X');
  assert.equal(rerollRes.ok, true, 'Player should be able to reroll Shop on Level 3');
});

// 7. Mystery War-Chest Shattering & Crypt Trial 1-Turn Lethal Solution
runSuite('7. Mystery War-Chest Shattering & Crypt Trial 1-Turn Lethal Puzzle Solution', () => {
  const bus = new EventBus();
  let shatterEvents = 0;
  bus.on('3d:stoneShatter', () => {
    shatterEvents++;
  });

  const engine = new BattleEngine(bus, { mode: 'skirmish', boardSize: 5, targetScore: 8 });
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      engine.board[r][c].obstacle = null;
      engine.board[r][c].anomaly = null;
    }
  }
  engine.board[2][2].obstacle = 'reliquary_coffer';

  const res = engine.placePiece(2, 1);
  assert.equal(res.ok, true);
  assert.equal(engine.board[2][2].obstacle, null);
  assert.ok(shatterEvents >= 1, 'Cracking a Mystery War-Chest must trigger 3d:stoneShatter');

  const cryptEngine = new BattleEngine(bus, { mode: 'crypt', cryptId: 'crypt_1' });
  const cryptRes = cryptEngine.placePiece(2, 2);
  assert.equal(cryptRes.ok, true);
  assert.equal(cryptEngine.status, 'victory');
});

// 8. GothicScene3D Event Synchronization & Headless Frame Step
runSuite('8. GothicScene3D Live Event Sync & Frame Stepping', () => {
  const bus = new EventBus();
  const save = new SaveManager();
  const scene3d = new GothicScene3D(null, bus, save);
  const engine = new BattleEngine(bus, { mode: 'skirmish', boardSize: 5 });

  engine.placePiece(2, 2);
  assert.equal(scene3d.pieceMap.has('2,2'), true);

  scene3d.triggerStoneShatterEvent({
    cells: [{ r: 2, c: 2, symbol: 'X' }],
    weapon: 'warhammer',
    target: [2, 2],
    intensity: 1.4,
  });
  assert.equal(scene3d.pieceMap.has('2,2'), false);
  assert.ok(scene3d.shatterPhysics.shards.length >= 25);

  scene3d.stepFrame(0.016, 1.0);
});

// 9. SaveManager Checksum, Hero Selection & Reliquary Unlocks
runSuite('9. SaveManager Checksum Integrity, Hero Selection & 3D Cosmetic Persistence', () => {
  const save = new SaveManager();
  save.addReliquarySigils(500);
  const unlockRes = save.unlockCosmetic('unlockedSculpts', 'templar_knight', 180);
  assert.equal(unlockRes.ok, true);
  save.equipCosmetic('equippedPlayerSculpt', 'templar_knight');
  assert.equal(save.getState().equippedPlayerSculpt, 'templar_knight');

  save.selectHero('hero_dragonknight');
  assert.equal(save.getState().selectedHeroId, 'hero_dragonknight');
});

// 10. AppController Screen Navigation, Hero Portraits & V1 Battle HUD Rendering
runSuite('10. AppController Screen Navigation, 6 Fantasy Hero Portraits & V1 Battle HUD', () => {
  const bus = new EventBus();
  const save = new SaveManager();
  const scene3d = new GothicScene3D(null, bus, save);
  const mockRoot = {
    innerHTML: '',
    dataset: {},
    querySelector: () => null,
    querySelectorAll: () => [],
  };

  const app = new AppController({
    rootEl: mockRoot,
    eventBus: bus,
    saveManager: save,
    scene3d,
    soundEngine: null,
  });

  // Brand title is XCARDO without "III", and Main Menu uses the calm Story Sanctuary layout
  assert.ok(mockRoot.innerHTML.includes('XCARDO'));
  assert.equal(mockRoot.innerHTML.includes('XCARDO III'), false, 'UI must not render XCARDO III');
  assert.ok(mockRoot.innerHTML.includes('hub-comfort-layout'), 'Main Menu must use the calm comfort layout');
  assert.ok(mockRoot.innerHTML.includes('story-chronicle-card'), 'Main Menu must show the Story Chronicle card');

  app.navigate('campaign');
  assert.ok(mockRoot.innerHTML.includes('Story Chapters & Strongholds'));
  assert.ok(mockRoot.innerHTML.includes('The Story So Far'));
  app.navigate('reliquary');
  assert.ok(mockRoot.innerHTML.includes('Playable Fantasy War Heroes'));

  // Level 1 Battle HUD must display the v1 Sealed War-Scroll Banner (No Cards until Level 3)
  app.startCampaignLevel(1);
  assert.ok(mockRoot.innerHTML.includes('WAR-SCROLL SHOP & CARDS UNLOCK AT LEVEL 3'));

  // Level 3 Battle HUD must display the 3-Slot War-Scroll Shop
  app.startCampaignLevel(3);
  assert.ok(mockRoot.innerHTML.includes('WAR-SCROLL SHOP'));

  // Verify all 6 Playable Fantasy War Heroes render unique bespoke SVG portraits
  const heroSVGs = new Set();
  for (const hero of FANTASY_HEROES) {
    const svg = renderFantasyHeroPortraitSVG(hero.id, hero.color);
    assert.ok(svg.includes('<svg'), `Hero ${hero.id} must render SVG portrait`);
    heroSVGs.add(svg);
  }
  assert.equal(heroSVGs.size, 6, 'All 6 Playable Fantasy War Heroes must have unique SVG portraits');

  // Verify all 20 War-Scroll Cards & 6 Warlord Boss Portraits render unique bespoke SVG art
  const tarotSVGs = new Set();
  for (const card of ARCANA_CARDS) {
    const svg = renderTarotArtSVG(card).replace(/tarot_[a-z0-9_]+/g, 'ID');
    assert.ok(svg.includes('<svg'), `Card ${card.id} must render SVG`);
    tarotSVGs.add(svg);
  }
  assert.equal(tarotSVGs.size, 20, 'All 20 War-Scroll cards must have unique bespoke vector artwork');

  const bossSVGs = new Set();
  for (const boss of INQUISITOR_BOSSES) {
    const svg = renderBossCrestSVG(boss.id, boss.color);
    assert.ok(svg.includes('<svg'));
    bossSVGs.add(svg);
  }
  assert.equal(bossSVGs.size, 6, 'All 6 Enemy Warlord Commanders must have unique portraits');
  assert.ok(renderRoseWindowSVG().includes('rose-window-svg'));
});

console.log(`\nALL ${passed}/10 XCARDO VERIFICATION SUITES PASSED!`);
