/**
 * XcardO III: Obsidian Sanctum
 * Core Battle State Machine, Dark-Tarot Execution & 3D Event Bridge
 */

import { SeededRNG } from '../core/rng.js';
import {
  GAME_CONFIG,
  ARCANA_CARDS,
  getArcanaCardById,
  getLevelByNumber,
  getCryptTrialById,
  PENITENCE_BELLS,
} from '../data/gothic-config.js';
import { scanBoardPatterns, previewPlacementScoring } from './pattern-detector.js';
import { selectBestAIMove, selectBestAICardAction } from './ai-brain.js';

export class BattleEngine {
  constructor(eventBus, options = {}) {
    this.bus = eventBus;
    this.mode = options.mode || 'campaign'; // 'campaign' | 'skirmish' | 'crypt' | 'local2p'
    this.levelNumber = options.levelNumber || 1;
    this.cryptId = options.cryptId || null;

    const levelData =
      this.mode === 'campaign'
        ? getLevelByNumber(this.levelNumber)
        : this.mode === 'crypt'
        ? getCryptTrialById(this.cryptId)
        : null;

    this.levelData = levelData;
    this.boardSize = options.boardSize || (levelData ? levelData.boardSize : 5);
    this.targetScore = options.targetScore || (levelData ? levelData.targetScore : 6);
    this.aiTier = options.aiTier || (levelData ? levelData.aiTier : 3);
    this.boss = levelData ? levelData.boss : null;
    this.cathedralHallId = options.cathedralHallId || (levelData ? levelData.hallId : 'obsidian_nave');

    // Blood Oath Relics & Penitence Bell Ultimate
    this.activeOaths = new Set(options.activeOaths || ['oath_blood_chalice']);
    this.penitenceBellId = options.penitenceBellId || 'bell_dies_irae';
    this.upgradedCards = new Set(options.upgradedCards || []);
    this.customDeckIds = options.customDeckIds || null;

    this.seed = options.seed || Date.now();
    this.rng = new SeededRNG(this.seed);

    this.resetMatch();
  }

  hasOath(oathId) {
    return this.activeOaths.has(oathId);
  }

  isCardExalted(cardId, actor = 'X') {
    return actor === 'X' && this.upgradedCards.has(cardId);
  }

  resetMatch() {
    this.turnNumber = 1;
    this.activePlayer = 'X';
    this.status = 'playing'; // 'playing' | 'victory' | 'defeat' | 'draw'
    this.winner = null;

    this.scores = { X: 0, O: 0 };
    const bonusTitheX = this.hasOath('oath_blood_chalice') ? 2 : 0;
    this.tithe = {
      X: GAME_CONFIG.INITIAL_BLOOD_TITHE + bonusTitheX,
      O: GAME_CONFIG.INITIAL_BLOOD_TITHE,
    };

    this.placementsRemaining = 1;
    this.cardsPlayedThisTurn = 0;
    this.cardsPlayedTotal = 0;
    this.stonesShatteredThisMatch = 0;

    // Penitence Bell Ultimate Charge (0..100)
    this.bellCharge = {
      X: this.hasOath('oath_cathedral_chime') ? 35 : 0,
      O: 0,
    };
    this.bellUsedThisMatch = { X: false, O: false };

    // Order Synergy Consecration Tally for Player ('X')
    this.orderTally = {
      inquisition: 0,
      sanctum: 0,
      blood: 0,
      chronicle: 0,
      apocrypha: 0,
    };

    // Undo Snapshot Stack for Crypt Trials & Skirmish
    this.undoStack = [];
    this.battleChronicle = [];

    // Build 2D/3D Altar Grid
    this.board = Array.from({ length: this.boardSize }, (_, r) =>
      Array.from({ length: this.boardSize }, (_, c) => ({
        r,
        c,
        symbol: null,       // 'X' | 'O' | 'W' | null
        locked: 0,          // Iron Cage turns remaining
        shield: 0,          // Gargoyle Aegis turns remaining
        obstacle: null,     // 'gargoyle_bastion' | 'reliquary_coffer' | null
        anomaly: null,      // 'sanctified_mosaic' | 'cursed_censer' | 'blood_chalice' | null
        placedTurn: 0,
      }))
    );

    this.scoredRegistry = new Set();
    this.hands = { X: [], O: [] };
    this._cardInstanceSeq = 1;

    if (this.mode === 'crypt' && this.levelData) {
      this._setupCryptTrial(this.levelData);
    } else {
      this._populateAltarHazards();
      const initialHandCount = GAME_CONFIG.INITIAL_HAND_SIZE + (this.hasOath('oath_forbidden_tome') ? 1 : 0);
      for (let i = 0; i < initialHandCount; i++) {
        this.drawCard('X', true);
      }
      for (let i = 0; i < GAME_CONFIG.INITIAL_HAND_SIZE; i++) {
        this.drawCard('O', true);
      }
    }

    this.selectedCardIndex = null;
    this.pendingTargets = [];

    this._logChronicle('system', `Obsidian Sanctum Consecrated — Target: ${this.targetScore} VP`);
    this.bus.emit('battle:initialized', this.getSnapshot());
    this.bus.emit('3d:boardRebuild', this.getSnapshot());
  }

  _logChronicle(type, text, symbol = null) {
    this.battleChronicle.unshift({
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      turn: this.turnNumber,
      type,
      text,
      symbol,
    });
    if (this.battleChronicle.length > 35) {
      this.battleChronicle.pop();
    }
  }

  _setupCryptTrial(crypt) {
    this.scores.X = 0;
    this.scores.O = 0;
    this.tithe.X = crypt.tithe;
    this.placementsRemaining = crypt.placementsRemaining ?? 1;

    for (const item of crypt.initialBoard) {
      const cell = this.board[item.r]?.[item.c];
      if (!cell) continue;
      if (item.symbol) cell.symbol = item.symbol;
      if (item.obstacle) cell.obstacle = item.obstacle;
      if (item.anomaly) cell.anomaly = item.anomaly;
      if (item.shield) cell.shield = item.shield;
    }

    const existingPatterns = scanBoardPatterns(this.board, this.boardSize, this.scoredRegistry);
    for (const p of existingPatterns) {
      this.scoredRegistry.add(p.key);
    }

    for (const cardId of crypt.hand || []) {
      this.hands.X.push({
        instanceId: `crypt_${this._cardInstanceSeq++}`,
        cardId,
        exalted: false,
      });
    }
  }

  _populateAltarHazards() {
    if (!this.levelData) return;
    const emptyCoords = [];
    for (let r = 0; r < this.boardSize; r++) {
      for (let c = 0; c < this.boardSize; c++) {
        emptyCoords.push([r, c]);
      }
    }
    this.rng.shuffle(emptyCoords);

    // 1. Gargoyle Bastions (indestructible pillars)
    const bastionCount = this.levelData.bastions || 0;
    for (let i = 0; i < bastionCount && emptyCoords.length > 0; i++) {
      const [r, c] = emptyCoords.pop();
      this.board[r][c].obstacle = 'gargoyle_bastion';
    }

    // 2. Reliquary Coffers (shatter when an adjacent stone is consecrated!)
    const cofferCount = this.levelData.reliquaryCoffers || 0;
    for (let i = 0; i < cofferCount && emptyCoords.length > 0; i++) {
      const [r, c] = emptyCoords.pop();
      this.board[r][c].obstacle = 'reliquary_coffer';
    }

    // 3. Sanctified Mosaics (+2 bonus VP)
    const mosaicCount = this.levelData.mosaics || 0;
    for (let i = 0; i < mosaicCount && emptyCoords.length > 0; i++) {
      const [r, c] = emptyCoords.pop();
      this.board[r][c].anomaly = 'sanctified_mosaic';
    }

    // 4. Cursed Censers (volatile incense burners that shatter pieces if disturbed)
    const censerCount = this.levelData.censers || 0;
    for (let i = 0; i < censerCount && emptyCoords.length > 0; i++) {
      const [r, c] = emptyCoords.pop();
      this.board[r][c].anomaly = 'cursed_censer';
    }

    // 5. Blood Chalices (+3 Blood Tithe + card draw)
    if (this.boardSize >= 5 && emptyCoords.length > 0 && this.rng.chance(0.65)) {
      const [r, c] = emptyCoords.pop();
      this.board[r][c].anomaly = 'blood_chalice';
    }
  }

  saveUndoSnapshot() {
    if (this.activePlayer !== 'X' || this.status !== 'playing') return;
    const snap = {
      turnNumber: this.turnNumber,
      scores: { ...this.scores },
      tithe: { ...this.tithe },
      placementsRemaining: this.placementsRemaining,
      cardsPlayedThisTurn: this.cardsPlayedThisTurn,
      cardsPlayedTotal: this.cardsPlayedTotal,
      stonesShatteredThisMatch: this.stonesShatteredThisMatch,
      bellCharge: { ...this.bellCharge },
      bellUsedThisMatch: { ...this.bellUsedThisMatch },
      orderTally: { ...this.orderTally },
      scoredRegistry: Array.from(this.scoredRegistry),
      hands: {
        X: this.hands.X.map((h) => ({ ...h })),
        O: this.hands.O.map((h) => ({ ...h })),
      },
      board: this.board.map((row) => row.map((c) => ({ ...c }))),
    };
    this.undoStack.push(snap);
    if (this.undoStack.length > 8) this.undoStack.shift();
  }

  undoLastAction() {
    if (this.undoStack.length === 0) return { ok: false, reason: 'No prior ritual step to restore.' };
    const snap = this.undoStack.pop();
    this.turnNumber = snap.turnNumber;
    this.status = 'playing';
    this.winner = null;
    this.scores = { ...snap.scores };
    this.tithe = { ...snap.tithe };
    this.placementsRemaining = snap.placementsRemaining;
    this.cardsPlayedThisTurn = snap.cardsPlayedThisTurn;
    this.cardsPlayedTotal = snap.cardsPlayedTotal;
    this.stonesShatteredThisMatch = snap.stonesShatteredThisMatch;
    this.bellCharge = { ...snap.bellCharge };
    this.bellUsedThisMatch = { ...snap.bellUsedThisMatch };
    this.orderTally = { ...snap.orderTally };
    this.scoredRegistry = new Set(snap.scoredRegistry);
    this.hands = {
      X: snap.hands.X.map((h) => ({ ...h })),
      O: snap.hands.O.map((h) => ({ ...h })),
    };
    this.board = snap.board.map((row) => row.map((c) => ({ ...c })));
    this.selectedCardIndex = null;
    this.pendingTargets = [];

    this._logChronicle('system', 'Chronicle Rewound to Prior Step');
    this.bus.emit('battle:updated', this.getSnapshot());
    this.bus.emit('3d:boardRebuild', this.getSnapshot());
    return { ok: true };
  }

  addBellCharge(player, amount) {
    if (this.bellUsedThisMatch[player]) return;
    this.bellCharge[player] = Math.min(100, (this.bellCharge[player] || 0) + amount);
  }

  drawCard(player, silent = false) {
    if (this.hands[player].length >= GAME_CONFIG.MAX_HAND_SIZE) return null;

    let pool = ARCANA_CARDS;
    if (player === 'X' && Array.isArray(this.customDeckIds) && this.customDeckIds.length >= 6) {
      const customPool = ARCANA_CARDS.filter((c) => this.customDeckIds.includes(c.id));
      if (customPool.length > 0) pool = customPool;
    }

    const picked = this.rng.weightedPick(pool, (card) => {
      if (card.rarity === 'common') return 45;
      if (card.rarity === 'rare') return 30;
      if (card.rarity === 'epic') return 17;
      return 8;
    });

    const instance = {
      instanceId: `arcana_${this._cardInstanceSeq++}`,
      cardId: picked.id,
      exalted: this.isCardExalted(picked.id, player),
    };

    this.hands[player].push(instance);
    if (!silent) {
      this.bus.emit('battle:cardDrawn', { player, instance, card: picked });
    }
    return instance;
  }

  canPlaceAt(r, c) {
    if (this.status !== 'playing') return false;
    if (this.placementsRemaining <= 0) return false;
    if (r < 0 || r >= this.boardSize || c < 0 || c >= this.boardSize) return false;
    const cell = this.board[r][c];
    return cell.symbol === null && cell.locked === 0 && !cell.obstacle;
  }

  previewMove(r, c, symbol = this.activePlayer) {
    if (!this.canPlaceAt(r, c)) return [];
    const shapeBonus = symbol === 'X' && this.hasOath('oath_rose_window') ? 1 : 0;
    return previewPlacementScoring(this.board, this.boardSize, r, c, symbol, this.scoredRegistry, {
      shapeBonus,
    });
  }

  /**
   * Place a 3D sculpted stone piece on `(r, c)` for `this.activePlayer`
   */
  placePiece(r, c) {
    if (!this.canPlaceAt(r, c)) {
      return { ok: false, reason: 'Altar tile is obstructed or consecrated.' };
    }

    if (this.activePlayer === 'X') {
      this.saveUndoSnapshot();
    }

    const player = this.activePlayer;
    const cell = this.board[r][c];
    cell.symbol = player;
    cell.placedTurn = this.turnNumber;
    this.placementsRemaining--;
    this.addBellCharge(player, 18);

    this._logChronicle(
      'move',
      `${player === 'X' ? 'Order' : 'Inquisition'} consecrated [${r + 1}, ${c + 1}]`,
      player
    );

    // Emit 3D Stone Slam Event
    this.bus.emit('3d:piecePlaced', {
      r,
      c,
      symbol: player,
      turn: this.turnNumber,
      snapshot: this.getSnapshot(),
    });

    // Trigger Tile Anomaly if present
    let anomalyEvent = null;
    if (cell.anomaly === 'blood_chalice') {
      cell.anomaly = null;
      this.tithe[player] = Math.min(GAME_CONFIG.MAX_BLOOD_TITHE, this.tithe[player] + 3);
      this.drawCard(player);
      anomalyEvent = { type: 'blood_chalice', r, c, player, text: 'Blood Chalice Claimed! +3 Tithe & +1 Card' };
      this._logChronicle('anomaly', anomalyEvent.text, player);
    } else if (cell.anomaly === 'cursed_censer') {
      cell.anomaly = null;
      cell.symbol = null;
      this.stonesShatteredThisMatch++;
      // Emit 3D Stone Shatter Physics explosion!
      this.bus.emit('3d:stoneShatter', {
        cells: [{ r, c, symbol: player, wasObstacle: 'cursed_censer' }],
        cause: 'cursed_censer',
        intensity: 1.35,
      });
      // Also crack any orthogonal unshielded stones
      const neighbors = [
        [r - 1, c],
        [r + 1, c],
        [r, c - 1],
        [r, c + 1],
      ];
      const neighborShatters = [];
      for (const [nr, nc] of neighbors) {
        if (nr >= 0 && nr < this.boardSize && nc >= 0 && nc < this.boardSize) {
          const nCell = this.board[nr][nc];
          if (nCell.symbol && nCell.shield === 0) {
            neighborShatters.push({ r: nr, c: nc, symbol: nCell.symbol });
            nCell.symbol = null;
            this.stonesShatteredThisMatch++;
          }
        }
      }
      if (neighborShatters.length > 0) {
        this.bus.emit('3d:stoneShatter', {
          cells: neighborShatters,
          cause: 'cursed_censer_blast',
          intensity: 1.15,
        });
      }
      anomalyEvent = {
        type: 'cursed_censer',
        r,
        c,
        player,
        shatteredNeighbors: neighborShatters,
        text: 'Cursed Censer Detonated! Stone Shattered!',
      };
      this._logChronicle('anomaly', anomalyEvent.text, player);
    }

    // Crack adjacent Reliquary Coffers!
    const crackedCoffers = this._checkAdjacentReliquaryCoffers(r, c, player);

    // Evaluate Sacred Gothic Geometry & Line Scoring
    const newlyScored = this.evaluateBoardScoring(player);

    this.bus.emit('battle:piecePlaced', {
      r,
      c,
      player,
      anomalyEvent,
      crackedCoffers,
      newlyScored,
      snapshot: this.getSnapshot(),
    });

    if (this.checkVictoryConditions()) {
      return { ok: true, newlyScored, gameEnded: true };
    }

    if (this.placementsRemaining <= 0) {
      this.endTurn();
    } else {
      this.bus.emit('battle:updated', this.getSnapshot());
    }

    return { ok: true, newlyScored, gameEnded: false };
  }

  _checkAdjacentReliquaryCoffers(r, c, player) {
    const cracked = [];
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < this.boardSize && nc >= 0 && nc < this.boardSize) {
          const nCell = this.board[nr][nc];
          if (nCell.obstacle === 'reliquary_coffer') {
            nCell.obstacle = null;
            this.stonesShatteredThisMatch++;
            this.tithe[player] = Math.min(GAME_CONFIG.MAX_BLOOD_TITHE, this.tithe[player] + 2);
            this.drawCard(player);
            this.addBellCharge(player, 25);
            cracked.push({ r: nr, c: nc, player });

            // Trigger 3D Stone Coffer Shatter Physics!
            this.bus.emit('3d:stoneShatter', {
              cells: [{ r: nr, c: nc, symbol: 'COFFER', wasObstacle: 'reliquary_coffer' }],
              cause: 'reliquary_coffer',
              intensity: 1.25,
            });
            this._logChronicle('reliquary', `Reliquary Coffer Shattered at [${nr + 1}, ${nc + 1}]! +2 Tithe & +1 Card`, player);
          }
        }
      }
    }
    return cracked;
  }

  evaluateBoardScoring(triggerPlayer = null) {
    const shapeBonusX = this.hasOath('oath_rose_window') ? 1 : 0;
    const allNewPatterns = scanBoardPatterns(this.board, this.boardSize, this.scoredRegistry);
    if (allNewPatterns.length === 0) return [];

    for (const pattern of allNewPatterns) {
      this.scoredRegistry.add(pattern.key);
      if (pattern.type === 'SHAPE' && pattern.symbol === 'X' && shapeBonusX > 0) {
        pattern.points += shapeBonusX;
      }
      this.scores[pattern.symbol] += pattern.points;
      this.addBellCharge(pattern.symbol, pattern.points * 12);
      this._logChronicle('score', `${pattern.name} (+${pattern.points} VP)`, pattern.symbol);
    }

    // Multi-Combo Consecration Bonus (2+ patterns in one action)
    if (triggerPlayer) {
      const playerPatterns = allNewPatterns.filter((p) => p.symbol === triggerPlayer);
      if (playerPatterns.length >= 2) {
        const comboBonus = playerPatterns.length - 1;
        this.scores[triggerPlayer] += comboBonus;
        this.tithe[triggerPlayer] = Math.min(
          GAME_CONFIG.MAX_BLOOD_TITHE,
          this.tithe[triggerPlayer] + 1
        );
        this.bus.emit('battle:comboAchieved', {
          player: triggerPlayer,
          count: playerPatterns.length,
          comboBonus,
        });
      }
    }

    // Emit 3D Sacred Geometry Alignment & Cinematic Camera Focus!
    this.bus.emit('3d:patternAligned', {
      patterns: allNewPatterns,
      scores: { ...this.scores },
    });
    this.bus.emit('battle:patternsScored', {
      patterns: allNewPatterns,
      scores: { ...this.scores },
    });

    return allNewPatterns;
  }

  /**
   * Unleash the Player's Penitence Bell Ultimate Power (when bellCharge.X >= 100)
   */
  activatePenitenceBell(player = 'X') {
    if (this.status !== 'playing' || this.activePlayer !== player) {
      return { ok: false, reason: 'Not your turn.' };
    }
    if (this.bellUsedThisMatch[player] || (this.bellCharge[player] || 0) < 100) {
      return { ok: false, reason: 'Penitence Bell is not fully consecrated.' };
    }

    if (player === 'X') this.saveUndoSnapshot();

    this.bellUsedThisMatch[player] = true;
    this.bellCharge[player] = 0;

    const enemy = player === 'X' ? 'O' : 'X';
    const bell = PENITENCE_BELLS.find((b) => b.id === this.penitenceBellId) || PENITENCE_BELLS[0];
    const events = [];

    if (bell.id === 'bell_dies_irae') {
      const enemyCells = [];
      for (let r = 0; r < this.boardSize; r++) {
        for (let c = 0; c < this.boardSize; c++) {
          if (this.board[r][c].symbol === enemy && this.board[r][c].shield === 0) {
            enemyCells.push([r, c]);
          }
        }
      }
      this.rng.shuffle(enemyCells);
      const shattered = [];
      for (const [r, c] of enemyCells.slice(0, 3)) {
        this.board[r][c].symbol = null;
        this.stonesShatteredThisMatch++;
        shattered.push({ r, c, symbol: enemy });
        events.push({ type: 'destroy', r, c });
      }
      if (shattered.length > 0) {
        this.bus.emit('3d:stoneShatter', {
          cells: shattered,
          cause: 'bell_dies_irae',
          weapon: 'warhammer',
          intensity: 1.65,
        });
      }
      const empty = [];
      for (let r = 0; r < this.boardSize; r++) {
        for (let c = 0; c < this.boardSize; c++) {
          if (!this.board[r][c].symbol && !this.board[r][c].obstacle && this.board[r][c].locked === 0) {
            empty.push([r, c]);
          }
        }
      }
      if (empty.length > 0) {
        const [wr, wc] = this.rng.pick(empty);
        this.board[wr][wc].symbol = 'W';
        events.push({ type: 'wild', r: wr, c: wc });
        this.bus.emit('3d:piecePlaced', { r: wr, c: wc, symbol: 'W', snapshot: this.getSnapshot() });
      }
    } else if (bell.id === 'bell_sanctus_aegis') {
      for (let r = 0; r < this.boardSize; r++) {
        for (let c = 0; c < this.boardSize; c++) {
          if (this.board[r][c].symbol === player) {
            this.board[r][c].shield = 3;
            events.push({ type: 'shield', r, c });
          }
        }
      }
      this.placementsRemaining += 1;
      this.tithe[player] = Math.min(GAME_CONFIG.MAX_BLOOD_TITHE, this.tithe[player] + 4);
      this.bus.emit('3d:boardRebuild', this.getSnapshot());
    } else if (bell.id === 'bell_memento_mori') {
      const enemyCells = [];
      for (let r = 0; r < this.boardSize; r++) {
        for (let c = 0; c < this.boardSize; c++) {
          if (this.board[r][c].symbol === enemy && this.board[r][c].shield === 0) {
            enemyCells.push([r, c]);
          }
        }
      }
      this.rng.shuffle(enemyCells);
      for (const [r, c] of enemyCells.slice(0, 2)) {
        this.board[r][c].symbol = player;
        events.push({ type: 'convert', r, c, to: player });
        this.bus.emit('3d:pieceTransmuted', { r, c, from: enemy, to: player });
      }
      this.drawCard(player);
      this.drawCard(player);
    }

    this._logChronicle('bell', `Penitence Bell Tolled: ${bell.name}!`, player);
    const newlyScored = this.evaluateBoardScoring(player);

    this.bus.emit('battle:bellActivated', {
      player,
      bell,
      events,
      newlyScored,
      snapshot: this.getSnapshot(),
    });
    this.bus.emit('3d:cameraFocus', { type: 'bell', bellId: bell.id });

    this.checkVictoryConditions();
    this.bus.emit('battle:updated', this.getSnapshot());
    return { ok: true, bell, events, newlyScored };
  }

  /**
   * Play a Dark-Tarot Arcana Card from `player`'s hand
   */
  playCard(player, handIndex, targets = []) {
    if (this.status !== 'playing' || this.activePlayer !== player) {
      return { ok: false, reason: 'Cannot invoke Dark-Tarot outside your turn.' };
    }

    const hand = this.hands[player];
    const instance = hand[handIndex];
    if (!instance) return { ok: false, reason: 'Invalid Tarot selection.' };

    const card = getArcanaCardById(instance.cardId);
    if (!card) return { ok: false, reason: 'Unknown Tarot script.' };

    let effectiveCost = card.cost;
    if (player === 'X' && this.hasOath('oath_executioner_hood') && card.order === 'inquisition') {
      effectiveCost = Math.max(0, effectiveCost - 1);
    }

    if (this.tithe[player] < effectiveCost) {
      return { ok: false, reason: 'Insufficient Blood Tithe.' };
    }

    const validation = this.validateCardTargets(player, card, targets);
    if (!validation.ok) return validation;

    if (player === 'X') {
      this.saveUndoSnapshot();
    }

    // Deduct Tithe & remove from hand
    this.tithe[player] -= effectiveCost;
    hand.splice(handIndex, 1);
    this.cardsPlayedThisTurn++;
    this.cardsPlayedTotal++;
    this.addBellCharge(player, 16);

    const exalted = Boolean(instance.exalted);
    const effectSummary = this.executeCardEffect(player, card, targets, exalted);

    // Order Consecration Synergy (Every 3rd card of the same Order grants a Sanctuary Boon!)
    let synergyBonus = null;
    if (player === 'X' && card.order && this.orderTally[card.order] !== undefined) {
      this.orderTally[card.order]++;
      const count = this.orderTally[card.order];
      if (count % 3 === 0) {
        this.scores.X += 1;
        this.tithe.X = Math.min(GAME_CONFIG.MAX_BLOOD_TITHE, this.tithe.X + 2);
        this.drawCard('X');
        synergyBonus = { order: card.order, count };
        this._logChronicle('synergy', `Order Resonance (${card.order.toUpperCase()}): +1 VP, +2 Tithe, +1 Card!`, 'X');
      }
    }

    this._logChronicle(
      'card',
      `${player === 'X' ? 'Order' : 'Inquisition'} invoked ${card.name}${exalted ? ' [+]' : ''}`,
      player
    );

    const newlyScored = this.evaluateBoardScoring(player);

    this.bus.emit('3d:cardCast', {
      player,
      card,
      exalted,
      targets,
      effectSummary,
      snapshot: this.getSnapshot(),
    });

    this.bus.emit('battle:cardPlayed', {
      player,
      card,
      exalted,
      targets,
      effectSummary,
      synergyBonus,
      newlyScored,
      snapshot: this.getSnapshot(),
    });

    this.selectedCardIndex = null;
    this.pendingTargets = [];

    this.checkVictoryConditions();
    this.bus.emit('battle:updated', this.getSnapshot());

    return { ok: true, card, effectSummary, newlyScored };
  }

  validateCardTargets(player, card, targets) {
    const enemy = player === 'X' ? 'O' : 'X';
    const inBounds = (r, c) => r >= 0 && r < this.boardSize && c >= 0 && c < this.boardSize;

    switch (card.targetType) {
      case 'none':
        return { ok: true };

      case 'enemy_cell': {
        if (targets.length < 1) return { ok: false, reason: 'Select an enemy stone on the altar.' };
        const [r, c] = targets[0];
        if (!inBounds(r, c)) return { ok: false, reason: 'Target outside altar.' };
        const cell = this.board[r][c];
        if (cell.symbol !== enemy) return { ok: false, reason: 'Must target an Adversary stone.' };
        if (cell.shield > 0) return { ok: false, reason: 'Target is protected by Gargoyle Aegis!' };
        return { ok: true };
      }

      case 'friendly_cell': {
        if (targets.length < 1) return { ok: false, reason: 'Select one of your consecrated stones.' };
        const [r, c] = targets[0];
        if (!inBounds(r, c)) return { ok: false, reason: 'Target outside altar.' };
        const cell = this.board[r][c];
        if (cell.symbol !== player && cell.symbol !== 'W') {
          return { ok: false, reason: 'Must target a friendly stone.' };
        }
        return { ok: true };
      }

      case 'empty_cell': {
        if (targets.length < 1) return { ok: false, reason: 'Select an empty altar tile.' };
        const [r, c] = targets[0];
        if (!inBounds(r, c)) return { ok: false, reason: 'Target outside altar.' };
        const cell = this.board[r][c];
        if (cell.symbol !== null || cell.obstacle) {
          return { ok: false, reason: 'Altar tile must be empty.' };
        }
        return { ok: true };
      }

      case 'any_cell':
      case 'row':
      case 'col': {
        if (targets.length < 1) return { ok: false, reason: 'Select a target tile on the altar.' };
        const [r, c] = targets[0];
        if (!inBounds(r, c)) return { ok: false, reason: 'Target outside altar.' };
        return { ok: true };
      }

      case 'two_occupied': {
        if (targets.length < 2) return { ok: false, reason: 'Select two consecrated stones to transpose.' };
        const [[r1, c1], [r2, c2]] = targets;
        if (!inBounds(r1, c1) || !inBounds(r2, c2)) return { ok: false, reason: 'Out of bounds.' };
        if (r1 === r2 && c1 === c2) return { ok: false, reason: 'Select two distinct stones.' };
        const cell1 = this.board[r1][c1];
        const cell2 = this.board[r2][c2];
        if (!cell1.symbol || !cell2.symbol) return { ok: false, reason: 'Both tiles must contain stones.' };
        if (cell1.shield > 0 || cell2.shield > 0) {
          return { ok: false, reason: 'Gargoyle Aegis stones cannot be transposed.' };
        }
        return { ok: true };
      }

      default:
        return { ok: true };
    }
  }

  executeCardEffect(player, card, targets, exalted = false) {
    const enemy = player === 'X' ? 'O' : 'X';
    const events = [];
    const shatteredCells = [];

    const shatterCell = (r, c, allowFriendly = false) => {
      const cell = this.board[r]?.[c];
      if (!cell) return false;
      if (cell.obstacle === 'reliquary_coffer') {
        cell.obstacle = null;
        this.stonesShatteredThisMatch++;
        this.tithe[player] = Math.min(GAME_CONFIG.MAX_BLOOD_TITHE, this.tithe[player] + 2);
        this.drawCard(player);
        shatteredCells.push({ r, c, symbol: 'COFFER', wasObstacle: 'reliquary_coffer' });
        events.push({ type: 'destroy', r, c });
        return true;
      }
      if (!cell.symbol || cell.shield > 0) return false;
      if (!allowFriendly && cell.symbol !== enemy) return false;

      const prevSymbol = cell.symbol;
      cell.symbol = null;
      this.stonesShatteredThisMatch++;
      shatteredCells.push({ r, c, symbol: prevSymbol });
      events.push({ type: 'destroy', r, c, symbol: prevSymbol });

      if (player === 'X' && this.hasOath('oath_shattered_crown') && prevSymbol === enemy) {
        this.tithe.X = Math.min(GAME_CONFIG.MAX_BLOOD_TITHE, this.tithe.X + 1);
      }
      return true;
    };

    switch (card.effect) {
      case 'shatter_single': {
        const [r, c] = targets[0];
        shatterCell(r, c, false);
        if (exalted) {
          this.tithe[player] = Math.min(GAME_CONFIG.MAX_BLOOD_TITHE, this.tithe[player] + 2);
        }
        if (shatteredCells.length > 0) {
          this.bus.emit('3d:stoneShatter', {
            cells: shatteredCells,
            cause: card.id,
            weapon: 'warhammer',
            target: [r, c],
            intensity: 1.45,
          });
        }
        break;
      }

      case 'shatter_cross': {
        const [r, c] = targets[0];
        const coords = [
          [r, c],
          [r - 1, c],
          [r + 1, c],
          [r, c - 1],
          [r, c + 1],
        ];
        for (const [cr, cc] of coords) {
          shatterCell(cr, cc, false);
        }
        if (exalted) {
          this.scores[player] += 1;
        }
        if (shatteredCells.length > 0) {
          this.bus.emit('3d:stoneShatter', {
            cells: shatteredCells,
            cause: card.id,
            weapon: 'cruciform_lance',
            target: [r, c],
            intensity: 1.5,
          });
        }
        break;
      }

      case 'guillotine_row': {
        const [r] = targets[0];
        for (let c = 0; c < this.boardSize; c++) {
          shatterCell(r, c, false);
        }
        if (exalted) this.drawCard(player);
        this.bus.emit('3d:stoneShatter', {
          cells: shatteredCells.length > 0 ? shatteredCells : [{ r, c: Math.floor(this.boardSize / 2), symbol: enemy }],
          cause: card.id,
          weapon: 'guillotine_row',
          target: [r, Math.floor(this.boardSize / 2)],
          intensity: 1.6,
        });
        break;
      }

      case 'guillotine_col': {
        const [, c] = targets[0];
        for (let r = 0; r < this.boardSize; r++) {
          shatterCell(r, c, false);
        }
        if (exalted) {
          this.tithe[player] = Math.min(GAME_CONFIG.MAX_BLOOD_TITHE, this.tithe[player] + 2);
        }
        this.bus.emit('3d:stoneShatter', {
          cells: shatteredCells.length > 0 ? shatteredCells : [{ r: Math.floor(this.boardSize / 2), c, symbol: enemy }],
          cause: card.id,
          weapon: 'guillotine_col',
          target: [Math.floor(this.boardSize / 2), c],
          intensity: 1.6,
        });
        break;
      }

      case 'brimstone_3x3': {
        const [r, c] = targets[0];
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            // Exalted spares friendly pieces!
            shatterCell(r + dr, c + dc, !exalted);
          }
        }
        this.bus.emit('3d:stoneShatter', {
          cells: shatteredCells.length > 0 ? shatteredCells : [{ r, c, symbol: enemy }],
          cause: card.id,
          weapon: 'brimstone_meteor',
          target: [r, c],
          intensity: 1.85,
        });
        break;
      }

      case 'iron_cage': {
        const [r, c] = targets[0];
        const coords = exalted
          ? [
              [r, c],
              [r - 1, c],
              [r + 1, c],
              [r, c - 1],
              [r, c + 1],
            ]
          : [[r, c]];
        for (const [lr, lc] of coords) {
          if (lr >= 0 && lr < this.boardSize && lc >= 0 && lc < this.boardSize) {
            const cell = this.board[lr][lc];
            if (!cell.symbol && !cell.obstacle) {
              cell.locked = exalted ? 3 : 2;
              events.push({ type: 'lock', r: lr, c: lc });
            }
          }
        }
        this.bus.emit('3d:boardRebuild', this.getSnapshot());
        break;
      }

      case 'aegis_gargoyle': {
        const [r, c] = targets[0];
        const coords = exalted
          ? [
              [r, c],
              [r - 1, c],
              [r + 1, c],
              [r, c - 1],
              [r, c + 1],
            ]
          : [[r, c]];
        for (const [sr, sc] of coords) {
          if (sr >= 0 && sr < this.boardSize && sc >= 0 && sc < this.boardSize) {
            const cell = this.board[sr][sc];
            if (cell.symbol === player || cell.symbol === 'W') {
              cell.shield = 3;
              events.push({ type: 'shield', r: sr, c: sc });
            }
          }
        }
        this.bus.emit('3d:boardRebuild', this.getSnapshot());
        break;
      }

      case 'sanctified_relic': {
        const [r, c] = targets[0];
        this.board[r][c].symbol = 'W';
        if (exalted) this.board[r][c].shield = 2;
        events.push({ type: 'wild', r, c });
        this.bus.emit('3d:piecePlaced', { r, c, symbol: 'W', snapshot: this.getSnapshot() });
        this._checkAdjacentReliquaryCoffers(r, c, player);
        break;
      }

      case 'double_consecration': {
        this.placementsRemaining += 1;
        if (exalted) {
          this.tithe[player] = Math.min(GAME_CONFIG.MAX_BLOOD_TITHE, this.tithe[player] + 2);
        }
        events.push({ type: 'extra_placement', player });
        break;
      }

      case 'transpose_stones': {
        const [[r1, c1], [r2, c2]] = targets;
        const temp = this.board[r1][c1].symbol;
        this.board[r1][c1].symbol = this.board[r2][c2].symbol;
        this.board[r2][c2].symbol = temp;
        if (exalted) this.drawCard(player);
        events.push({ type: 'swap', from: [r1, c1], to: [r2, c2] });
        this.bus.emit('3d:pieceSwapped', { from: [r1, c1], to: [r2, c2], snapshot: this.getSnapshot() });
        break;
      }

      case 'transmute_piece': {
        const [r, c] = targets[0];
        const prev = this.board[r][c].symbol;
        this.board[r][c].symbol = player;
        if (exalted) this.board[r][c].shield = 2;
        events.push({ type: 'convert', r, c, to: player });
        this.bus.emit('3d:pieceTransmuted', { r, c, from: prev, to: player, snapshot: this.getSnapshot() });
        break;
      }

      case 'mirror_nave': {
        const [r] = targets[0];
        for (let c = 0; c < Math.floor(this.boardSize / 2); c++) {
          const mirrorC = this.boardSize - 1 - c;
          const cellA = this.board[r][c];
          const cellB = this.board[r][mirrorC];
          if (cellA.shield === 0 && cellB.shield === 0 && !cellA.obstacle && !cellB.obstacle) {
            const tmp = cellA.symbol;
            cellA.symbol = cellB.symbol;
            cellB.symbol = tmp;
          }
        }
        if (exalted) {
          this.tithe[player] = Math.min(GAME_CONFIG.MAX_BLOOD_TITHE, this.tithe[player] + 2);
        }
        events.push({ type: 'mirror_row', r });
        this.bus.emit('3d:boardRebuild', this.getSnapshot());
        break;
      }

      case 'blood_communion': {
        this.drawCard(player);
        this.drawCard(player);
        if (exalted) this.drawCard(player);
        this.tithe[player] = Math.min(
          GAME_CONFIG.MAX_BLOOD_TITHE,
          this.tithe[player] + (exalted ? 5 : 4)
        );
        events.push({ type: 'communion', player });
        break;
      }

      case 'tithe_drain': {
        const drainAmt = exalted ? 3 : 2;
        const stolen = Math.min(drainAmt, this.tithe[enemy]);
        this.tithe[enemy] -= stolen;
        this.tithe[player] = Math.min(GAME_CONFIG.MAX_BLOOD_TITHE, this.tithe[player] + stolen + 1);
        this.drawCard(player);
        events.push({ type: 'drain', stolen });
        break;
      }

      case 'raise_bastion': {
        const [r, c] = targets[0];
        this.board[r][c].obstacle = 'gargoyle_bastion';
        if (exalted) {
          this.scores[player] += 1;
        }
        events.push({ type: 'bastion', r, c });
        this.bus.emit('3d:boardRebuild', this.getSnapshot());
        break;
      }

      case 'consecrate_mosaic': {
        const [r, c] = targets[0];
        this.board[r][c].anomaly = 'sanctified_mosaic';
        if (exalted && !this.board[r][c].symbol && !this.board[r][c].obstacle) {
          this.board[r][c].symbol = player;
          this.bus.emit('3d:piecePlaced', { r, c, symbol: player, snapshot: this.getSnapshot() });
        } else {
          this.bus.emit('3d:boardRebuild', this.getSnapshot());
        }
        events.push({ type: 'mosaic', r, c });
        break;
      }

      case 'sanguine_feast': {
        const [r, c] = targets[0];
        this.board[r][c].symbol = null;
        this.stonesShatteredThisMatch++;
        this.bus.emit('3d:stoneShatter', {
          cells: [{ r, c, symbol: player }],
          cause: card.id,
          intensity: 1.25,
        });
        this.tithe[player] = Math.min(
          GAME_CONFIG.MAX_BLOOD_TITHE,
          this.tithe[player] + (exalted ? 7 : 5)
        );
        this.drawCard(player);
        this.drawCard(player);
        if (exalted) this.drawCard(player);
        events.push({ type: 'sacrifice', r, c });
        break;
      }

      case 'eclipse_shroud': {
        const candidates = [];
        for (let r = 0; r < this.boardSize; r++) {
          for (let c = 0; c < this.boardSize; c++) {
            const cell = this.board[r][c];
            if (!cell.symbol && !cell.obstacle && cell.locked === 0) {
              candidates.push([r, c]);
            }
          }
        }
        this.rng.shuffle(candidates);
        for (const [lr, lc] of candidates.slice(0, exalted ? 5 : 3)) {
          this.board[lr][lc].locked = 2;
          events.push({ type: 'lock', r: lr, c: lc });
        }
        this.drawCard(player);
        this.bus.emit('3d:boardRebuild', this.getSnapshot());
        break;
      }

      case 'excommunication': {
        let latestCell = null;
        let maxTurn = -1;
        for (let r = 0; r < this.boardSize; r++) {
          for (let c = 0; c < this.boardSize; c++) {
            const cell = this.board[r][c];
            if (cell.symbol === enemy && cell.shield === 0 && cell.placedTurn >= maxTurn) {
              maxTurn = cell.placedTurn;
              latestCell = [r, c];
            }
          }
        }
        if (latestCell) {
          const [lr, lc] = latestCell;
          shatterCell(lr, lc, false);
          this.board[lr][lc].locked = exalted ? 3 : 2;
          this.bus.emit('3d:stoneShatter', {
            cells: shatteredCells,
            cause: card.id,
            weapon: 'warhammer',
            target: [lr, lc],
            intensity: 1.45,
          });
        }
        this.drawCard(player);
        break;
      }

      case 'cathedral_judgment': {
        const enemyCells = [];
        for (let r = 0; r < this.boardSize; r++) {
          for (let c = 0; c < this.boardSize; c++) {
            if (this.board[r][c].symbol === enemy && this.board[r][c].shield === 0) {
              enemyCells.push([r, c]);
            }
          }
        }
        this.rng.shuffle(enemyCells);
        for (const [er, ec] of enemyCells.slice(0, exalted ? 3 : 2)) {
          shatterCell(er, ec, false);
        }
        if (shatteredCells.length > 0) {
          this.bus.emit('3d:stoneShatter', {
            cells: shatteredCells,
            cause: card.id,
            weapon: 'warhammer',
            intensity: 1.75,
          });
        }
        for (let r = 0; r < this.boardSize; r++) {
          for (let c = 0; c < this.boardSize; c++) {
            if (this.board[r][c].symbol === player) {
              this.board[r][c].shield = 2;
            }
          }
        }
        this.bus.emit('3d:boardRebuild', this.getSnapshot());
        break;
      }
    }

    return events;
  }

  /**
   * End current player's turn, tick statuses, fire Inquisitor Boss passives, and advance turn
   */
  endTurn() {
    if (this.status !== 'playing') return;

    // Crypt Trials are 1-turn lethal stone puzzles
    if (this.mode === 'crypt' && this.activePlayer === 'X') {
      if (!this.checkVictoryConditions()) {
        this.status = 'defeat';
        this.winner = 'O';
        this.bus.emit('battle:ended', {
          status: this.status,
          winner: 'O',
          reason: 'Crypt Trial Failed — Target VP Not Reached in 1 Turn!',
          snapshot: this.getSnapshot(),
        });
      }
      return;
    }

    this.turnNumber++;
    this.activePlayer = this.activePlayer === 'X' ? 'O' : 'X';
    this.placementsRemaining = 1;
    this.cardsPlayedThisTurn = 0;

    // Tick down Iron Cage locks and Gargoyle Aegis shields
    let boardChanged = false;
    for (let r = 0; r < this.boardSize; r++) {
      for (let c = 0; c < this.boardSize; c++) {
        const cell = this.board[r][c];
        if (cell.locked > 0) {
          cell.locked--;
          if (cell.locked === 0) boardChanged = true;
        }
        if (cell.shield > 0) {
          cell.shield--;
          if (cell.shield === 0) boardChanged = true;
        }
      }
    }

    // Grant Blood Tithe & draw 1 Dark-Tarot card
    let titheGain = GAME_CONFIG.TITHE_PER_TURN;
    if (
      this.activePlayer === 'X' &&
      this.hasOath('oath_Gargoyle_vigil') &&
      Math.ceil(this.turnNumber / 2) % 2 === 0
    ) {
      titheGain += 1;
    }

    this.tithe[this.activePlayer] = Math.min(
      GAME_CONFIG.MAX_BLOOD_TITHE,
      this.tithe[this.activePlayer] + titheGain
    );
    this.drawCard(this.activePlayer);

    // Trigger Inquisitor Boss Ritual at start of AI turn
    const bossEvents = [];
    if (this.activePlayer === 'O' && this.boss) {
      const aiTurnCount = Math.ceil(this.turnNumber / 2);
      if (aiTurnCount % 3 === 0) {
        this._executeBossRitual(bossEvents);
        boardChanged = true;
      }
    }

    if (boardChanged) {
      this.bus.emit('3d:boardRebuild', this.getSnapshot());
    }

    if (!this.hasAnyValidMove()) {
      this._resolveStalemateBreaker();
    }

    this.bus.emit('battle:turnStarted', {
      turnNumber: this.turnNumber,
      activePlayer: this.activePlayer,
      bossEvents,
      snapshot: this.getSnapshot(),
    });
  }

  _executeBossRitual(bossEvents) {
    const emptyCells = [];
    const playerCells = [];
    const aiCells = [];

    for (let r = 0; r < this.boardSize; r++) {
      for (let c = 0; c < this.boardSize; c++) {
        const cell = this.board[r][c];
        if (!cell.symbol && !cell.obstacle && cell.locked === 0) emptyCells.push([r, c]);
        else if (cell.symbol === 'X' && cell.shield === 0) playerCells.push([r, c]);
        else if (cell.symbol === 'O') aiCells.push([r, c]);
      }
    }

    if (this.boss.passiveId === 'iron_maiden_lock' && emptyCells.length > 0) {
      const [r, c] = this.rng.pick(emptyCells);
      this.board[r][c].locked = 2;
      bossEvents.push({ boss: this.boss.name, text: `${this.boss.name} caged tile [${r + 1}, ${c + 1}]!` });
    } else if (this.boss.passiveId === 'ossuary_pillar' && emptyCells.length > 0) {
      const [r, c] = this.rng.pick(emptyCells);
      this.board[r][c].obstacle = 'reliquary_coffer';
      bossEvents.push({ boss: this.boss.name, text: `${this.boss.name} raised an Ossuary Coffer!` });
    } else if (this.boss.passiveId === 'plague_censer' && emptyCells.length > 0) {
      const [r, c] = this.rng.pick(emptyCells);
      this.board[r][c].anomaly = 'cursed_censer';
      bossEvents.push({ boss: this.boss.name, text: `${this.boss.name} ignited a Cursed Censer!` });
    } else if (this.boss.passiveId === 'blood_tithe_tax') {
      this.tithe.X = Math.max(0, this.tithe.X - 1);
      this.tithe.O = Math.min(GAME_CONFIG.MAX_BLOOD_TITHE, this.tithe.O + 1);
      bossEvents.push({ boss: this.boss.name, text: `${this.boss.name} siphoned 1 Blood Tithe!` });
    } else if (this.boss.passiveId === 'bell_shockwave' && playerCells.length > 0) {
      const [r, c] = this.rng.pick(playerCells);
      this.board[r][c].symbol = null;
      this.stonesShatteredThisMatch++;
      this.bus.emit('3d:stoneShatter', {
        cells: [{ r, c, symbol: 'X' }],
        cause: 'boss_bell_shockwave',
        weapon: 'warhammer',
        intensity: 1.5,
      });
      bossEvents.push({ boss: this.boss.name, text: `${this.boss.name}'s Bell Shockwave shattered [${r + 1}, ${c + 1}]!` });
    } else if (this.boss.passiveId === 'seraph_aegis' && aiCells.length > 0) {
      const [r, c] = this.rng.pick(aiCells);
      this.board[r][c].shield = 2;
      this.tithe.O = Math.min(GAME_CONFIG.MAX_BLOOD_TITHE, this.tithe.O + 1);
      bossEvents.push({ boss: this.boss.name, text: `${this.boss.name} consecrated Seraph Aegis!` });
    }

    if (bossEvents.length > 0) {
      this._logChronicle('boss', bossEvents[0].text, 'O');
      this.bus.emit('3d:inquisitorReact', { mood: 'wrath', text: bossEvents[0].text });
    }
  }

  hasAnyValidMove() {
    for (let r = 0; r < this.boardSize; r++) {
      for (let c = 0; c < this.boardSize; c++) {
        const cell = this.board[r][c];
        if (cell.symbol === null && cell.locked === 0 && !cell.obstacle) return true;
      }
    }
    return false;
  }

  /**
   * Cathedral Cataclysm Stalemate Breaker: shatters oldest unshielded stones so the duel never softlocks
   */
  _resolveStalemateBreaker() {
    for (let r = 0; r < this.boardSize; r++) {
      for (let c = 0; c < this.boardSize; c++) {
        this.board[r][c].locked = 0;
      }
    }
    if (this.hasAnyValidMove()) return;

    const occupied = [];
    for (let r = 0; r < this.boardSize; r++) {
      for (let c = 0; c < this.boardSize; c++) {
        const cell = this.board[r][c];
        if (cell.symbol && cell.shield === 0) {
          occupied.push(cell);
        }
      }
    }
    occupied.sort((a, b) => a.placedTurn - b.placedTurn);
    const toShatter = occupied.slice(0, Math.min(4, occupied.length));
    const shatteredList = [];
    for (const cell of toShatter) {
      shatteredList.push({ r: cell.r, c: cell.c, symbol: cell.symbol });
      cell.symbol = null;
      this.stonesShatteredThisMatch++;
    }
    if (shatteredList.length > 0) {
      this.bus.emit('3d:stoneShatter', {
        cells: shatteredList,
        cause: 'cathedral_cataclysm',
        intensity: 1.6,
      });
      this._logChronicle('system', 'Cathedral Tremor shattered 4 ancient stones to clear the altar!');
    }
  }

  checkVictoryConditions() {
    const xWon = this.scores.X >= this.targetScore;
    const oWon = this.scores.O >= this.targetScore;

    if (xWon || oWon) {
      if (xWon && oWon) {
        if (this.scores.X > this.scores.O) {
          this.status = 'victory';
          this.winner = 'X';
        } else if (this.scores.O > this.scores.X) {
          this.status = 'defeat';
          this.winner = 'O';
        } else {
          this.status = this.activePlayer === 'X' ? 'victory' : 'defeat';
          this.winner = this.activePlayer;
        }
      } else if (xWon) {
        this.status = 'victory';
        this.winner = 'X';
      } else {
        this.status = 'defeat';
        this.winner = 'O';
      }

      this.bus.emit('battle:ended', {
        status: this.status,
        winner: this.winner,
        scores: { ...this.scores },
        snapshot: this.getSnapshot(),
      });
      return true;
    }
    return false;
  }

  /**
   * Execute Single-Player Inquisitor AI Turn (Card Cast + Stone Placement)
   */
  executeAITurnStep() {
    if (this.status !== 'playing' || this.activePlayer !== 'O') return null;

    if (this.cardsPlayedThisTurn < 1) {
      const cardDecision = selectBestAICardAction(this, this.aiTier);
      if (cardDecision) {
        this.bus.emit('3d:inquisitorReact', { mood: 'cast', text: 'Inquisitor invokes Dark-Tarot' });
        const res = this.playCard('O', cardDecision.handIndex, cardDecision.targets);
        if (res.ok) {
          return { action: 'card', ...res };
        }
      }
    }

    const move = selectBestAIMove(this, 'O', this.aiTier);
    if (move) {
      this.bus.emit('3d:inquisitorReact', { mood: 'strike', reason: move.reason, target: [move.r, move.c] });
      const res = this.placePiece(move.r, move.c);
      return { action: 'move', r: move.r, c: move.c, reason: move.reason, ...res };
    }

    this.endTurn();
    return { action: 'pass' };
  }

  getSnapshot() {
    return {
      mode: this.mode,
      levelNumber: this.levelNumber,
      cryptId: this.cryptId,
      levelData: this.levelData,
      boss: this.boss,
      cathedralHallId: this.cathedralHallId,
      boardSize: this.boardSize,
      targetScore: this.targetScore,
      turnNumber: this.turnNumber,
      activePlayer: this.activePlayer,
      status: this.status,
      winner: this.winner,
      scores: { ...this.scores },
      tithe: { ...this.tithe },
      bellCharge: { ...this.bellCharge },
      bellUsedThisMatch: { ...this.bellUsedThisMatch },
      penitenceBellId: this.penitenceBellId,
      orderTally: { ...this.orderTally },
      activeOaths: Array.from(this.activeOaths),
      placementsRemaining: this.placementsRemaining,
      cardsPlayedThisTurn: this.cardsPlayedThisTurn,
      cardsPlayedTotal: this.cardsPlayedTotal,
      stonesShatteredThisMatch: this.stonesShatteredThisMatch,
      canUndo: this.undoStack.length > 0 && this.activePlayer === 'X' && this.status === 'playing',
      battleChronicle: this.battleChronicle.slice(0, 12),
      hands: {
        X: this.hands.X.map((h) => ({ ...h, card: getArcanaCardById(h.cardId) })),
        O: this.hands.O.map((h) => ({ ...h, card: getArcanaCardById(h.cardId) })),
      },
      board: this.board.map((row) => row.map((cell) => ({ ...cell }))),
    };
  }
}
