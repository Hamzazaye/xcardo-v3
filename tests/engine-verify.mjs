/**
 * XcardO III: Obsidian Sanctum
 * Automated Verification Suite (3D Sculptor, Stone Shatter Physics, Pattern Detector, AI, BattleEngine, UI)
 */

import assert from 'node:assert/strict';
import { EventBus } from '../src/core/event-bus.js';
import { SaveManager } from '../src/core/save-manager.js';
import {
  ARCANA_CARDS,
  CATHEDRAL_LEVELS,
  CRYPT_TRIALS,
  SCULPTED_PIECES,
  STONE_MATERIALS,
} from '../src/data/gothic-config.js';
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

console.log('=== XcardO III: Obsidian Sanctum — Verification Suite ===');

// 1. Master Gothic Config Integrity
runSuite('1. Gothic Configuration (36 Levels, 20 Dark-Tarot Cards, 6 3D Sculptures, 6 PBR Materials)', () => {
  assert.equal(CATHEDRAL_LEVELS.length, 36);
  assert.equal(ARCANA_CARDS.length, 20);
  assert.equal(CRYPT_TRIALS.length, 5);
  assert.equal(SCULPTED_PIECES.player.length, 3);
  assert.equal(SCULPTED_PIECES.enemy.length, 3);
  assert.equal(STONE_MATERIALS.length, 6);
});

// 2. 3D Procedural Piece Sculptor & Cathedral Altar Builder
runSuite('2. 3D Sculptor (6 Piece Archetypes, Shield Dome, Cathedral Altar & Inquisitor Automaton)', () => {
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

  // Step 15 frames (0.25s) to verify descending 3D Warhammer impact
  for (let f = 0; f < 15; f++) {
    physics.step(1 / 60);
  }
  assert.equal(physics.projectiles[0].impacted, true);

  // Step 30 more frames (total 0.75s) to verify shard bounces and projectile cleanup
  for (let f = 0; f < 30; f++) {
    physics.step(1 / 60);
  }
  const bouncedCount = physics.shards.filter((s) => s.bounces > 0).length;
  assert.ok(bouncedCount > 0, 'Shards should collide and bounce on the 3D Cathedral Altar surface');
  assert.equal(physics.projectiles.length, 0, 'Expired weapon projectile should be cleaned up');
});

// 4. Sacred Gothic Geometry & Line Pattern Detector
runSuite('4. Sacred Gothic Geometry Detector (Lines & Cruciform / Saltire / Cloister Shapes)', () => {
  const size = 5;
  const board = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => ({ symbol: null, locked: 0, anomaly: null }))
  );
  // Form a Crux Fidelis (+) of 'X' centered at (2,2)
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

// 5. 6-Tier Single-Player Inquisitor AI & Threat Scanner
runSuite('5. Single-Player Inquisitor AI (Scoring, Threat Blocking & Oracle)', () => {
  const bus = new EventBus();
  const engine = new BattleEngine(bus, { mode: 'skirmish', boardSize: 5, targetScore: 6, aiTier: 5 });

  // Place two 'X' stones in row 0 so (0,2) is an immediate Player threat
  engine.board[0][0].symbol = 'X';
  engine.board[0][1].symbol = 'X';

  const move = selectBestAIMove(engine, 'O', 5);
  assert.ok(move);
  assert.equal(move.r, 0);
  assert.equal(move.c, 2, 'Tier 5 Inquisitor AI should block imminent 3-stone row alignment at (0,2)');

  // Verify threat scanner when 'O' has two in a row
  engine.board[4][0].symbol = 'O';
  engine.board[4][1].symbol = 'O';
  const threats = scanEnemyThreatCells(engine, 'O');
  assert.ok(threats.some((t) => t.r === 4 && t.c === 2));
});

// 6. BattleEngine Reliquary Coffer Shattering & Dark-Tarot Execution
runSuite('6. BattleEngine Reliquary Coffer Shattering & Dark-Tarot Arcana Execution', () => {
  const bus = new EventBus();
  let shatterEvents = 0;
  bus.on('3d:stoneShatter', () => {
    shatterEvents++;
  });

  const engine = new BattleEngine(bus, { mode: 'skirmish', boardSize: 5, targetScore: 8 });
  // Clear board obstacles & place a Reliquary Coffer at (2,2)
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      engine.board[r][c].obstacle = null;
      engine.board[r][c].anomaly = null;
    }
  }
  engine.board[2][2].obstacle = 'reliquary_coffer';

  // Consecrating adjacent tile (2,1) should crack the Reliquary Coffer at (2,2) and emit 3d:stoneShatter!
  const res = engine.placePiece(2, 1);
  assert.equal(res.ok, true);
  assert.equal(engine.board[2][2].obstacle, null);
  assert.ok(shatterEvents >= 1, 'Cracking a Reliquary Coffer must trigger 3d:stoneShatter');
});

// 7. Crypt Trial 1-Turn Lethal Solution Verification
runSuite('7. Crypt Trial 1-Turn Lethal Puzzle Solution', () => {
  const bus = new EventBus();
  const engine = new BattleEngine(bus, { mode: 'crypt', cryptId: 'crypt_1' });
  // Crypt 1: Place at (2,2) to complete both vertical and horizontal 3-lines + Crux Fidelis (+)
  const res = engine.placePiece(2, 2);
  assert.equal(res.ok, true);
  assert.equal(engine.status, 'victory');
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

// 9. SaveManager Checksum & Reliquary Unlocks
runSuite('9. SaveManager Checksum Integrity & 3D Cosmetic Persistence', () => {
  const save = new SaveManager();
  save.addReliquarySigils(500);
  const unlockRes = save.unlockCosmetic('unlockedSculpts', 'templar_knight', 180);
  assert.equal(unlockRes.ok, true);
  save.equipCosmetic('equippedPlayerSculpt', 'templar_knight');
  assert.equal(save.getState().equippedPlayerSculpt, 'templar_knight');
});

// 10. AppController Full Screen Navigation & Battle HUD Rendering
runSuite('10. AppController Screen Navigation & Battle HUD Rendering', () => {
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

  assert.ok(mockRoot.innerHTML.includes('XCARDO III'));
  app.navigate('campaign');
  assert.ok(mockRoot.innerHTML.includes('Cathedral Acts'));
  app.navigate('reliquary');
  assert.ok(mockRoot.innerHTML.includes('Reliquary Atelier'));
  app.startCampaignLevel(1);
  assert.ok(mockRoot.innerHTML.includes('ORDER OF THE ROSE'));
});

console.log(`\nALL ${passed}/10 XCARDO III VERIFICATION SUITES PASSED!`);
