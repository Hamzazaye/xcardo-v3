/**
 * XcardO — 3D Fantasy War-Table Strategy
 * Core Battle State Machine, v1 Rules Engine (No Cards Until Level 3, 3-Slot In-Battle Card Shop,
 * Coin Economy, Mystery War-Chests & Siege Bombs) & 3D Event Bridge
 */

import { SeededRNG } from '../core/rng.js';
import {
  GAME_CONFIG,
  ARCANA_CARDS,
  EARLY_STAGE_MODIFIERS,
  getArcanaCardById,
  getLevelByNumber,
  getCryptTrialById,
  getFantasyHeroById,
  getWarlordDoctrineByTier,
  PENITENCE_BELLS,
} from '../data/gothic-config.js';
import { scanBoardPatterns, previewPlacementScoring } from './pattern-detector.js';
import {
  selectBestAIMove,
  selectBestAICardAction,
  selectBestAIShopPurchase,
  formatCoordLabel,
} from './ai-brain.js';

export class BattleEngine {
  constructor(eventBus, options = {}) {
    this.bus = eventBus;
    this.mode = options.mode || 'campaign'; // 'campaign' | 'skirmish' | 'crypt' | 'local2p' | 'daily'
    this.levelNumber = Number(options.levelNumber || 1);
    this.cryptId = options.cryptId || null;
    this.heroId = options.heroId || 'hero_paladin';
    this.hero = getFantasyHeroById(this.heroId);

    const levelData =
      this.mode === 'campaign'
        ? getLevelByNumber(this.levelNumber)
        : this.mode === 'crypt'
        ? getCryptTrialById(this.cryptId)
        : null;

    this.levelData = levelData;
    this.earlyModifierId = options.earlyModifierId || 'standard';
    this.earlyModifier =
      EARLY_STAGE_MODIFIERS.find((m) => m.id === this.earlyModifierId) ||
      EARLY_STAGE_MODIFIERS[0];

    const modTargetBonus =
      this.mode === 'campaign' && this.levelNumber < GAME_CONFIG.CARDS_UNLOCK_LEVEL
        ? this.earlyModifier.targetBonus || 0
        : 0;

    this.boardSize = options.boardSize || (levelData ? levelData.boardSize : 5);
    this.targetScore =
      (options.targetScore || (levelData ? levelData.targetScore : 6)) + modTargetBonus;
    this.aiTier = options.aiTier || (levelData ? levelData.aiTier : 3);
    this.doctrine = getWarlordDoctrineByTier(this.aiTier);
    this.boss = options.boss || (levelData ? levelData.boss : null);
    this.cathedralHallId = options.cathedralHallId || (levelData ? levelData.hallId : 'obsidian_nave');

    // v1 RULE: NO CARDS & NO SHOP UNTIL LEVEL 3 IN CAMPAIGN MODE!
    if (options.cardsEnabled !== undefined) {
      this.cardsEnabled = Boolean(options.cardsEnabled);
    } else if (this.mode === 'campaign') {
      this.cardsEnabled = this.levelNumber >= GAME_CONFIG.CARDS_UNLOCK_LEVEL;
    } else {
      this.cardsEnabled = true;
    }

    // Blood Oath Relics, Penitence Bell Ultimate & Roguelike Expedition Boon
    this.activeOaths = new Set(options.activeOaths || ['oath_blood_chalice']);
    this.penitenceBellId = options.penitenceBellId || 'bell_dies_irae';
    this.upgradedCards = new Set(options.upgradedCards || []);
    this.customDeckIds = options.customDeckIds || null;
    this.unlockedCardIds = options.unlockedCardIds || null;
    this.roguelikeBoon = options.roguelikeBoon || null;
    this.maxUndos = options.maxUndos ?? GAME_CONFIG.MAX_UNDOS_PER_MATCH;
    this.balanceFirstMove = options.balanceFirstMove !== false && this.mode !== 'crypt';

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

  _pickWeightedCard(pool) {
    return this.rng.weightedPick(pool, (card) => {
      if (card.rarity === 'common') return 45;
      if (card.rarity === 'rare') return 30;
      if (card.rarity === 'epic') return 17;
      return 8;
    });
  }

  resetMatch() {
    this.turnNumber = 1;
    this.activePlayer = 'X';
    this.status = 'playing'; // 'playing' | 'victory' | 'defeat' | 'draw'
    this.winner = null;

    this.scores = { X: 0, O: 0 };
    this.ownTurns = { X: 1, O: 0 };
    this.secondPlayerKomiGranted = false;

    // v1 Rule: If cardsEnabled is false (Levels 1 & 2), players start with 0 Gold and 0 Cards!
    if (!this.cardsEnabled) {
      this.tithe = { X: 0, O: 0 };
    } else {
      const oathCoins = this.hasOath('oath_blood_chalice') ? 2 : 0;
      const heroCoins = this.hero?.id === 'hero_paladin' ? 1 : 0;
      const boonCoins = this.roguelikeBoon === 'boon_caravan_gold' ? 2 : 0;
      this.tithe = {
        X: Math.min(GAME_CONFIG.MAX_BLOOD_TITHE, GAME_CONFIG.INITIAL_BLOOD_TITHE + oathCoins + heroCoins + boonCoins),
        O: GAME_CONFIG.INITIAL_BLOOD_TITHE + (this.balanceFirstMove ? 1 : 0),
      };
    }

    this.placementsRemaining = 1;
    this.cardsPlayedThisTurn = 0;
    this.cardsPlayedTotal = 0;
    this.stonesShatteredThisMatch = 0;

    // Hero Active Ability State (usable from Turn 1 on all levels!)
    this.heroAbilityCooldown = { X: 0, O: 0 };
    this.heroAbilityUsedThisTurn = false;
    this.selectedHeroAbility = false;

    // Telegraphed Boss Ritual (shown 1 turn ahead of execution)
    this.pendingBossRitual = null;

    // War-Horn / Penitence Bell Ultimate Charge (0..100)
    const heroBellBonus = this.hero?.id === 'hero_valkyrie' ? 20 : 0;
    const boonBellBonus = this.roguelikeBoon === 'boon_forge_horn' ? 30 : 0;
    this.bellCharge = {
      X: Math.min(100, (this.hasOath('oath_cathedral_chime') ? 35 : 0) + heroBellBonus + boonBellBonus),
      O: this.balanceFirstMove ? 20 : 0,
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

    // Deterministic Undo Snapshot Stack (capped at maxUndos per match)
    this.undoStack = [];
    this.undosRemaining = this.maxUndos;
    this.battleChronicle = [];
    this.moveHistory = [];
    this.microRewards = {
      firstLine: false,
      counterBlock: false,
      decisiveWin: false,
    };

    // Build 2D/3D Altar Grid
    this.board = Array.from({ length: this.boardSize }, (_, r) =>
      Array.from({ length: this.boardSize }, (_, c) => ({
        r,
        c,
        symbol: null,       // 'X' | 'O' | 'W' | null
        locked: 0,          // Iron Cage / Crater revive turns remaining
        shield: 0,          // Gargoyle Aegis turns remaining
        obstacle: null,     // 'gargoyle_bastion' | 'reliquary_coffer' | null
        anomaly: null,      // 'sanctified_mosaic' | 'cursed_censer' | 'blood_chalice' | null
        bombTimer: 0,       // v1 Ticking Siege Bomb countdown (4 turns -> 3x3 blast)
        placedTurn: 0,
      }))
    );

    this.scoredRegistry = new Set();
    this.hands = { X: [], O: [] };
    this.shop = [];
    this.shopLockedSlots = new Set();
    this.shopRerollCount = 0;
    this._cardInstanceSeq = 1;

    if (this.mode === 'crypt' && this.levelData) {
      this._setupCryptTrial(this.levelData);
    } else {
      this._populateAltarHazards();
      if (this.cardsEnabled) {
        const heroCardBonus = this.hero?.id === 'hero_deathknight' ? 1 : 0;
        const oathCardBonus = this.hasOath('oath_forbidden_tome') ? 1 : 0;
        const initialHandCount = GAME_CONFIG.INITIAL_HAND_SIZE + oathCardBonus + heroCardBonus;
        for (let i = 0; i < initialHandCount; i++) {
          this.drawCard('X', true);
        }
        for (let i = 0; i < GAME_CONFIG.INITIAL_HAND_SIZE; i++) {
          this.drawCard('O', true);
        }
        this.refillShop();
      }
    }

    this.selectedCardIndex = null;
    this.pendingTargets = [];

    const modeMsg = !this.cardsEnabled
      ? `Level ${this.levelNumber}: Pure Tactical Combat (War-Scrolls Unlock at Lv 3) — Target: ${this.targetScore} VP`
      : `War-Table Consecrated — Target: ${this.targetScore} VP`;
    this._logChronicle('system', modeMsg);
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

  _getCardPoolForPlayer(player = 'X') {
    let pool = ARCANA_CARDS;
    if (player === 'X' && Array.isArray(this.customDeckIds) && this.customDeckIds.length >= 6) {
      const customPool = ARCANA_CARDS.filter((c) => this.customDeckIds.includes(c.id));
      if (customPool.length > 0) return customPool;
    }
    if (this.mode === 'campaign' && this.levelNumber >= 3) {
      // Unlock cards progressively up to current campaign level (min 5 cards in pool at Lv 3)
      const maxUnlockLvl = Math.max(7, this.levelNumber + 2);
      const levelPool = ARCANA_CARDS.filter((c) => (c.unlockLevel || 3) <= maxUnlockLvl);
      if (levelPool.length >= 3) return levelPool;
    }
    return pool;
  }

  // ────────── v1 3-SLOT IN-BATTLE WAR-SCROLL SHOP ──────────
  getShopRerollCost() {
    if (!this.cardsEnabled) return 0;
    let base = GAME_CONFIG.SHOP_REROLL_BASE_COST;
    if (this.hero?.id === 'hero_archmage' && this.shopRerollCount === 0) {
      base = Math.max(0, base - 1);
    }
    return base + this.shopRerollCount * GAME_CONFIG.SHOP_REROLL_ESCALATION;
  }

  refillShop() {
    if (!this.cardsEnabled) {
      this.shop = [];
      return;
    }
    const pool = this._getCardPoolForPlayer('X');
    const nextShop = [];
    for (let i = 0; i < GAME_CONFIG.SHOP_SLOTS; i++) {
      if (this.shopLockedSlots.has(i) && this.shop[i]) {
        nextShop.push(this.shop[i]);
        continue;
      }
      const uniquePool = pool.filter((c) => !nextShop.some((s) => s.cardId === c.id));
      const pickFrom = uniquePool.length > 0 ? uniquePool : pool;
      const picked = this._pickWeightedCard(pickFrom);
      nextShop.push({
        slotIndex: i,
        cardId: picked.id,
        price: this.getEffectiveCardPrice(picked, 'X'),
        exalted: this.isCardExalted(picked.id, 'X'),
      });
    }
    this.shop = nextShop;
  }

  getEffectiveCardPrice(card, player = 'X') {
    if (!card) return 2;
    let price = card.cost;
    if (player === 'X' && this.hasOath('oath_executioner_hood') && card.order === 'inquisition') {
      price = Math.max(1, price - 1);
    }
    return price;
  }

  toggleShopLock(slotIndex) {
    if (!this.cardsEnabled) return { ok: false, reason: 'Shop unlocks at Level 3.' };
    if (slotIndex < 0 || slotIndex >= this.shop.length) return { ok: false };
    if (this.shopLockedSlots.has(slotIndex)) {
      this.shopLockedSlots.delete(slotIndex);
    } else {
      this.shopLockedSlots.add(slotIndex);
    }
    this.bus.emit('battle:updated', this.getSnapshot());
    return { ok: true, locked: this.shopLockedSlots.has(slotIndex) };
  }

  rerollShop(player = 'X') {
    if (!this.cardsEnabled) {
      return { ok: false, reason: 'War-Scroll Shop unlocks at Level 3!' };
    }
    if (this.status !== 'playing' || this.activePlayer !== player) {
      return { ok: false, reason: 'Wait for your turn to reroll the Shop.' };
    }
    const cost = this.getShopRerollCost();
    if (this.tithe[player] < cost) {
      return { ok: false, reason: `Need ${cost} Gold Coins to reroll Shop.` };
    }
    if (player === 'X') {
      this.saveUndoSnapshot();
    }
    this.tithe[player] -= cost;
    this.shopRerollCount++;
    this.refillShop();
    this._logChronicle('shop', `Rerolled War-Scroll Shop (-${cost}🪙)`, player);
    this.bus.emit('battle:shopRerolled', { player, cost, snapshot: this.getSnapshot() });
    this.bus.emit('battle:updated', this.getSnapshot());
    return { ok: true, cost };
  }

  buyShopCard(slotIndex, player = 'X') {
    if (!this.cardsEnabled) {
      return { ok: false, reason: 'War-Scroll Shop unlocks at Level 3!' };
    }
    if (this.status !== 'playing' || this.activePlayer !== player) {
      return { ok: false, reason: 'Wait for your turn to buy War-Scrolls.' };
    }
    const slot = this.shop[slotIndex];
    if (!slot || !slot.cardId) {
      return { ok: false, reason: 'Shop slot is empty.' };
    }
    if (this.hands[player].length >= GAME_CONFIG.MAX_HAND_SIZE) {
      return { ok: false, reason: `Hand is full (${GAME_CONFIG.MAX_HAND_SIZE}/${GAME_CONFIG.MAX_HAND_SIZE})! Play a Scroll first.` };
    }
    const card = getArcanaCardById(slot.cardId);
    if (!card) return { ok: false, reason: 'Unknown War-Scroll.' };

    const price = this.getEffectiveCardPrice(card, player);
    if (this.tithe[player] < price) {
      return { ok: false, reason: `Need ${price} Gold Coins to buy ${card.name}.` };
    }

    if (player === 'X') {
      this.saveUndoSnapshot();
    }

    // Pay Gold Coin price on purchase — playing this card from Hand is then FREE (v1 rule!)
    this.tithe[player] -= price;
    const instance = {
      instanceId: `arcana_${this._cardInstanceSeq++}`,
      cardId: card.id,
      exalted: this.isCardExalted(card.id, player),
      paidInShop: true,
    };
    this.hands[player].push(instance);
    this.shopLockedSlots.delete(slotIndex);

    // Replace bought slot with a fresh card using rarity weights!
    const pool = this._getCardPoolForPlayer(player);
    const uniquePool = pool.filter((c) => !this.shop.some((s) => s && s.cardId === c.id));
    const pickFrom = uniquePool.length > 0 ? uniquePool : pool;
    const replacement = this._pickWeightedCard(pickFrom);
    this.shop[slotIndex] = {
      slotIndex,
      cardId: replacement.id,
      price: this.getEffectiveCardPrice(replacement, 'X'),
      exalted: this.isCardExalted(replacement.id, 'X'),
    };

    this._logChronicle('shop', `Bought ${card.name} for ${price}🪙`, player);
    this.bus.emit('battle:cardDrawn', { player, instance, card, fromShop: true });
    this.bus.emit('battle:updated', this.getSnapshot());
    return { ok: true, card, instance, price };
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
    if (!this.levelData && !this.roguelikeBoon) return;
    const emptyCoords = [];
    for (let r = 0; r < this.boardSize; r++) {
      for (let c = 0; c < this.boardSize; c++) {
        emptyCoords.push([r, c]);
      }
    }
    this.rng.shuffle(emptyCoords);

    // 1. Gargoyle Bastions (indestructible pillars)
    const bastionCount = this.levelData?.bastions || 0;
    for (let i = 0; i < bastionCount && emptyCoords.length > 0; i++) {
      const [r, c] = emptyCoords.pop();
      this.board[r][c].obstacle = 'gargoyle_bastion';
    }

    // 2. Mystery War-Chests / Reliquary Coffers (shatter when an adjacent stone is consecrated!)
    const modCoffers =
      this.mode === 'campaign' && this.levelNumber < GAME_CONFIG.CARDS_UNLOCK_LEVEL
        ? this.earlyModifier?.bonusCoffers || 0
        : 0;
    const cofferCount = (this.levelData?.reliquaryCoffers || 0) + modCoffers;
    for (let i = 0; i < cofferCount && emptyCoords.length > 0; i++) {
      const [r, c] = emptyCoords.pop();
      this.board[r][c].obstacle = 'reliquary_coffer';
    }

    // 3. Sanctified Mosaics (+2 bonus VP)
    const boonMosaic =
      this.roguelikeBoon === 'boon_observatory_mosaic' ||
      (!this.cardsEnabled && this.roguelikeBoon === 'boon_caravan_gold')
        ? 1
        : 0;
    const mosaicCount = (this.levelData?.mosaics || 0) + boonMosaic;
    for (let i = 0; i < mosaicCount && emptyCoords.length > 0; i++) {
      const [r, c] = emptyCoords.pop();
      this.board[r][c].anomaly = 'sanctified_mosaic';
    }

    // 4. Cursed Censers / Ticking Siege Bombs
    const censerCount = this.levelData?.censers || 0;
    for (let i = 0; i < censerCount && emptyCoords.length > 0; i++) {
      const [r, c] = emptyCoords.pop();
      this.board[r][c].anomaly = 'cursed_censer';
      this.board[r][c].bombTimer = GAME_CONFIG.BOMB_COUNTDOWN;
    }

    // 5. Blood Chalices (+3 Gold Coins + card draw on Level 3+)
    if (this.cardsEnabled && this.boardSize >= 5 && emptyCoords.length > 0 && this.rng.chance(0.65)) {
      const [r, c] = emptyCoords.pop();
      this.board[r][c].anomaly = 'blood_chalice';
    }
  }

  saveUndoSnapshot() {
    if (this.activePlayer !== 'X' || this.status !== 'playing') return;
    if (this.undosRemaining <= 0) return;
    const snap = {
      turnNumber: this.turnNumber,
      rngState: this.rng.getState(),
      cardInstanceSeq: this._cardInstanceSeq,
      secondPlayerKomiGranted: this.secondPlayerKomiGranted,
      scores: { ...this.scores },
      tithe: { ...this.tithe },
      ownTurns: { ...this.ownTurns },
      placementsRemaining: this.placementsRemaining,
      cardsPlayedThisTurn: this.cardsPlayedThisTurn,
      cardsPlayedTotal: this.cardsPlayedTotal,
      stonesShatteredThisMatch: this.stonesShatteredThisMatch,
      bellCharge: { ...this.bellCharge },
      bellUsedThisMatch: { ...this.bellUsedThisMatch },
      heroAbilityCooldown: { ...this.heroAbilityCooldown },
      heroAbilityUsedThisTurn: this.heroAbilityUsedThisTurn,
      pendingBossRitual: this.pendingBossRitual ? { ...this.pendingBossRitual } : null,
      orderTally: { ...this.orderTally },
      scoredRegistry: Array.from(this.scoredRegistry),
      shop: this.shop.map((s) => ({ ...s })),
      shopLockedSlots: Array.from(this.shopLockedSlots),
      shopRerollCount: this.shopRerollCount,
      moveHistory: this.moveHistory.map((m) => ({ ...m })),
      microRewards: { ...this.microRewards },
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
    if (this.undosRemaining <= 0) {
      return { ok: false, reason: `Undo limit reached (0/${this.maxUndos} remaining this battle).` };
    }
    if (this.undoStack.length === 0) return { ok: false, reason: 'No prior tactical step to restore.' };
    const snap = this.undoStack.pop();
    this.undosRemaining--;
    if (snap.rngState !== undefined) {
      this.rng.setState(snap.rngState);
    }
    if (snap.cardInstanceSeq !== undefined) {
      this._cardInstanceSeq = snap.cardInstanceSeq;
    }
    this.secondPlayerKomiGranted = Boolean(snap.secondPlayerKomiGranted);
    this.turnNumber = snap.turnNumber;
    this.activePlayer = 'X';
    this.status = 'playing';
    this.winner = null;
    this.scores = { ...snap.scores };
    this.tithe = { ...snap.tithe };
    this.ownTurns = { ...(snap.ownTurns || { X: 1, O: 0 }) };
    this.placementsRemaining = snap.placementsRemaining;
    this.cardsPlayedThisTurn = snap.cardsPlayedThisTurn;
    this.cardsPlayedTotal = snap.cardsPlayedTotal;
    this.stonesShatteredThisMatch = snap.stonesShatteredThisMatch;
    this.bellCharge = { ...snap.bellCharge };
    this.bellUsedThisMatch = { ...snap.bellUsedThisMatch };
    this.heroAbilityCooldown = { ...(snap.heroAbilityCooldown || { X: 0, O: 0 }) };
    this.heroAbilityUsedThisTurn = Boolean(snap.heroAbilityUsedThisTurn);
    this.pendingBossRitual = snap.pendingBossRitual ? { ...snap.pendingBossRitual } : null;
    this.orderTally = { ...snap.orderTally };
    this.scoredRegistry = new Set(snap.scoredRegistry);
    this.shop = (snap.shop || []).map((s) => ({ ...s }));
    this.shopLockedSlots = new Set(snap.shopLockedSlots || []);
    this.shopRerollCount = snap.shopRerollCount || 0;
    this.moveHistory = (snap.moveHistory || []).map((m) => ({ ...m }));
    this.microRewards = {
      firstLine: false,
      counterBlock: false,
      decisiveWin: false,
      ...(snap.microRewards || {}),
    };
    this.hands = {
      X: snap.hands.X.map((h) => ({ ...h })),
      O: snap.hands.O.map((h) => ({ ...h })),
    };
    this.board = snap.board.map((row) => row.map((c) => ({ ...c })));
    this.selectedCardIndex = null;
    this.selectedHeroAbility = false;
    this.pendingTargets = [];

    this._logChronicle('system', `War-Chronicle Rewound (${this.undosRemaining}/${this.maxUndos} Undos Left)`);
    this.bus.emit('battle:updated', this.getSnapshot());
    this.bus.emit('3d:boardRebuild', this.getSnapshot());
    return { ok: true, undosRemaining: this.undosRemaining };
  }

  addBellCharge(player, amount) {
    if (this.bellUsedThisMatch[player]) return;
    this.bellCharge[player] = Math.min(100, (this.bellCharge[player] || 0) + amount);
  }

  drawCard(player, silent = false) {
    // v1 RULE: No cards can be drawn on Levels 1 & 2!
    if (!this.cardsEnabled) return null;
    if (this.hands[player].length >= GAME_CONFIG.MAX_HAND_SIZE) return null;

    const pool = this._getCardPoolForPlayer(player);
    const picked = this._pickWeightedCard(pool);

    const instance = {
      instanceId: `arcana_${this._cardInstanceSeq++}`,
      cardId: picked.id,
      exalted: this.isCardExalted(picked.id, player),
      paidInShop: false,
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
   * Place a 3D sculpted War-Champion piece on `(r, c)` for `this.activePlayer`
   */
  placePiece(r, c) {
    if (!this.canPlaceAt(r, c)) {
      return { ok: false, reason: 'War-Table tile is obstructed or locked.' };
    }

    if (this.activePlayer === 'X') {
      this.saveUndoSnapshot();
    }

    const player = this.activePlayer;
    const enemy = player === 'X' ? 'O' : 'X';
    const oppThreatPatterns = previewPlacementScoring(
      this.board,
      this.boardSize,
      r,
      c,
      enemy,
      this.scoredRegistry
    );
    const blockedEnemyThreat = oppThreatPatterns.length > 0;
    const shatteredBefore = this.stonesShatteredThisMatch;
    const scoreBefore = this.scores[player] || 0;

    const cell = this.board[r][c];
    cell.symbol = player;
    cell.placedTurn = this.turnNumber;
    this.placementsRemaining--;
    this.addBellCharge(player, 18);

    // Roguelike Shrine Boon: Player's first placed stone gets 2-turn Golden Aegis Shield
    if (player === 'X' && this.turnNumber === 1 && this.roguelikeBoon === 'boon_shrine_aegis') {
      cell.shield = Math.max(cell.shield, 2);
    }

    // First-Move Advantage Balance (Second-Player Komi & Vanguard Aegis on O's first turn)
    if (player === 'O' && !this.secondPlayerKomiGranted && this.balanceFirstMove) {
      this.secondPlayerKomiGranted = true;
      cell.shield = Math.max(cell.shield, 1);
      // On pure-board levels (Levels 1–2) or high-tempo duels, Second Player receives +1 Komi VP
      this.scores.O += GAME_CONFIG.SECOND_PLAYER_KOMI_VP;
      this._logChronicle(
        'system',
        'Second-Player Counter-Initiative: +1 Komi VP & Vanguard Shield granted to Warlord!',
        'O'
      );
    }

    // If Player occupies a tile where a Boss Ritual was telegraphed, the ritual is disrupted!
    if (
      player === 'X' &&
      this.pendingBossRitual &&
      this.pendingBossRitual.r === r &&
      this.pendingBossRitual.c === c
    ) {
      const disruptedName = this.pendingBossRitual.bossName || 'Warlord';
      this.pendingBossRitual = null;
      this.addBellCharge('X', 20);
      this._logChronicle('boss', `⚡ Disrupted ${disruptedName}'s telegraphed ritual at [${r + 1}, ${c + 1}]!`, 'X');
    }

    const coord = formatCoordLabel(r, c);
    const actorLabel = player === 'X' ? (this.hero?.shortName || 'Hero') : (this.boss?.name || 'Warlord');
    this._logChronicle(
      'move',
      `${actorLabel} deployed Champion to ${coord} [${r + 1}, ${c + 1}]${blockedEnemyThreat ? ' (Blocked Threat!)' : ''}`,
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
      if (this.cardsEnabled) {
        this.tithe[player] = Math.min(GAME_CONFIG.MAX_BLOOD_TITHE, this.tithe[player] + 3);
        this.drawCard(player);
        anomalyEvent = { type: 'blood_chalice', r, c, player, text: 'Golden Chalice Claimed! +3🪙 & +1 War-Scroll' };
      } else {
        cell.shield = Math.max(cell.shield, 2);
        anomalyEvent = { type: 'blood_chalice', r, c, player, text: 'Golden Chalice Claimed! +2T Aegis Shield!' };
      }
      this._logChronicle('anomaly', anomalyEvent.text, player);
    } else if (cell.anomaly === 'cursed_censer') {
      cell.anomaly = null;
      cell.bombTimer = 0;
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
        text: 'Siege Bomb Detonated! Champions Shattered!',
      };
      this._logChronicle('anomaly', anomalyEvent.text, player);
    }

    // Crack adjacent Mystery War-Chests (Reliquary Coffers) with exact V1_BOX_ODDS!
    const crackedCoffers = this._checkAdjacentReliquaryCoffers(r, c, player);

    // Evaluate Sacred Geometry & Line Scoring (+v1 Coin Reward per score!)
    const newlyScored = this.evaluateBoardScoring(player);

    const vpDelta = (this.scores[player] || 0) - scoreBefore;
    const shatteredDelta = this.stonesShatteredThisMatch - shatteredBefore;
    const formationLabel =
      newlyScored.length > 0
        ? newlyScored.map((p) => p.name).join(' + ')
        : blockedEnemyThreat
        ? 'Counter-Block'
        : crackedCoffers.length > 0
        ? 'Cracked Chest'
        : 'Positioning';

    this.moveHistory.unshift({
      turn: this.turnNumber,
      player,
      r,
      c,
      coord,
      formation: formationLabel,
      vpDelta,
      shattered: shatteredDelta,
      blockedThreat: blockedEnemyThreat,
    });
    if (this.moveHistory.length > 24) {
      this.moveHistory.pop();
    }

    // Check Early-Stage Micro-Rewards for Player ('X')
    if (player === 'X') {
      if (newlyScored.length > 0 && !this.microRewards.firstLine) {
        this.microRewards.firstLine = true;
        this.bus.emit('battle:microReward', {
          id: 'firstLine',
          title: 'I. First Formation',
          sigils: 15,
        });
      }
      if (blockedEnemyThreat && !this.microRewards.counterBlock) {
        this.microRewards.counterBlock = true;
        this.addBellCharge('X', 12);
        this.bus.emit('battle:microReward', {
          id: 'counterBlock',
          title: 'II. Tactical Block',
          sigils: 25,
        });
      }
    }

    this.bus.emit('battle:piecePlaced', {
      r,
      c,
      coord,
      player,
      blockedEnemyThreat,
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
            this.addBellCharge(player, 20);

            // Strictly match V1_BOX_ODDS: 42% Gold, 24% Joker, 15% Bomb, 7% Jackpot, 12% Free Scroll!
            // Zero hidden pre-roll rewards and zero direct VP swings on Levels 1–2!
            const roll = this.rng.nextInt(1, 100);
            const rangerBonus = player === 'X' && this.hero?.id === 'hero_ranger' ? 1 : 0;
            let rewardText = '';

            if (roll <= 42) {
              // 42%: Gold Cache (+2🪙 on Lv 3+, or 2-turn Aegis Shield on Lv 1–2)
              if (this.cardsEnabled) {
                const goldGain = 2 + rangerBonus;
                this.tithe[player] = Math.min(GAME_CONFIG.MAX_BLOOD_TITHE, this.tithe[player] + goldGain);
                rewardText = `Mystery War-Chest [${nr + 1}, ${nc + 1}]: Gold Cache (+${goldGain}🪙)!`;
              } else {
                if (this.board[r]?.[c]?.symbol === player) {
                  this.board[r][c].shield = Math.max(this.board[r][c].shield, 2);
                }
                rewardText = `Mystery War-Chest [${nr + 1}, ${nc + 1}]: Golden Aegis Shield (2T)!`;
              }
            } else if (roll <= 66) {
              // 24%: Wild Joker Idol (W) spawns in the chest tile!
              nCell.symbol = 'W';
              if (this.cardsEnabled && rangerBonus > 0) {
                this.tithe[player] = Math.min(GAME_CONFIG.MAX_BLOOD_TITHE, this.tithe[player] + rangerBonus);
              }
              this.bus.emit('3d:piecePlaced', { r: nr, c: nc, symbol: 'W', snapshot: this.getSnapshot() });
              rewardText = `Mystery War-Chest [${nr + 1}, ${nc + 1}]: Wild Joker Idol (★) Awakened!`;
            } else if (roll <= 81) {
              // 15%: Siege Bomb Fuse (4T)!
              nCell.anomaly = 'cursed_censer';
              nCell.bombTimer = GAME_CONFIG.BOMB_COUNTDOWN;
              rewardText = `Mystery War-Chest [${nr + 1}, ${nc + 1}]: Trap! Ticking Siege Bomb (4T)!`;
            } else if (roll <= 88) {
              // 7%: War Chest Jackpot (+5🪙 on Lv 3+, or Sanctified Mosaic on Lv 1–2)
              if (this.cardsEnabled) {
                const jackpotGold = 5 + rangerBonus;
                this.tithe[player] = Math.min(GAME_CONFIG.MAX_BLOOD_TITHE, this.tithe[player] + jackpotGold);
                rewardText = `Mystery War-Chest [${nr + 1}, ${nc + 1}]: JACKPOT TREASURY (+${jackpotGold}🪙)!`;
              } else {
                nCell.anomaly = 'sanctified_mosaic';
                rewardText = `Mystery War-Chest [${nr + 1}, ${nc + 1}]: Sanctified Mosaic Revealed!`;
              }
            } else {
              // 12%: Free War-Scroll on Lv 3+, or +25% War-Horn Charge on Lv 1–2
              if (this.cardsEnabled) {
                if (rangerBonus > 0) {
                  this.tithe[player] = Math.min(GAME_CONFIG.MAX_BLOOD_TITHE, this.tithe[player] + rangerBonus);
                }
                this.drawCard(player);
                rewardText = `Mystery War-Chest [${nr + 1}, ${nc + 1}]: Free War-Scroll Drawn!`;
              } else {
                this.addBellCharge(player, 25);
                rewardText = `Mystery War-Chest [${nr + 1}, ${nc + 1}]: +25% War-Horn Charge!`;
              }
            }

            cracked.push({ r: nr, c: nc, player, rewardText });

            // Trigger 3D Stone Coffer Shatter Physics!
            this.bus.emit('3d:stoneShatter', {
              cells: [{ r: nr, c: nc, symbol: 'COFFER', wasObstacle: 'reliquary_coffer' }],
              cause: 'reliquary_coffer',
              intensity: 1.25,
            });
            this._logChronicle('reliquary', rewardText, player);
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

      // v1 Rule: +1 Gold Coin per scoring alignment when cardsEnabled!
      if (this.cardsEnabled) {
        this.tithe[pattern.symbol] = Math.min(
          GAME_CONFIG.MAX_BLOOD_TITHE,
          this.tithe[pattern.symbol] + GAME_CONFIG.COIN_PER_SCORE
        );
      }

      this._logChronicle(
        'score',
        `${pattern.name} (+${pattern.points} VP${this.cardsEnabled ? ' & +1🪙' : ''})`,
        pattern.symbol
      );
    }

    // Multi-Combo Consecration Bonus (2+ patterns in one action)
    if (triggerPlayer) {
      const playerPatterns = allNewPatterns.filter((p) => p.symbol === triggerPlayer);
      if (playerPatterns.length >= 2) {
        const comboBonus = playerPatterns.length - 1;
        this.scores[triggerPlayer] += comboBonus;
        if (this.cardsEnabled) {
          this.tithe[triggerPlayer] = Math.min(
            GAME_CONFIG.MAX_BLOOD_TITHE,
            this.tithe[triggerPlayer] + 1
          );
        }
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
   * Unleash the Player's War-Horn / Penitence Bell Ultimate Power (when bellCharge.X >= 100)
   */
  activatePenitenceBell(player = 'X') {
    if (this.status !== 'playing' || this.activePlayer !== player) {
      return { ok: false, reason: 'Not your turn.' };
    }
    if (this.bellUsedThisMatch[player] || (this.bellCharge[player] || 0) < 100) {
      return { ok: false, reason: 'War-Horn Ultimate is not fully charged.' };
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
      if (this.cardsEnabled) {
        this.tithe[player] = Math.min(GAME_CONFIG.MAX_BLOOD_TITHE, this.tithe[player] + 4);
      }
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
      if (this.cardsEnabled) {
        this.drawCard(player);
        this.drawCard(player);
      }
    }

    this._logChronicle('bell', `War-Horn Sounded: ${bell.name}!`, player);
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
   * Check whether a player's Turn-1 Hero Active Ability is ready & has valid targets
   */
  canUseHeroAbility(player = 'X') {
    if (this.status !== 'playing' || this.activePlayer !== player) return false;
    if (this.heroAbilityUsedThisTurn) return false;
    if ((this.heroAbilityCooldown[player] || 0) > 0) return false;
    const ability = this.hero?.activeAbility;
    if (!ability) return false;
    return this.hasValidTargetsForHeroAbility(player);
  }

  hasValidTargetsForHeroAbility(player = 'X') {
    const ability = this.hero?.activeAbility;
    if (!ability || ability.targetType === 'none') return true;
    const enemy = player === 'X' ? 'O' : 'X';
    for (let r = 0; r < this.boardSize; r++) {
      for (let c = 0; c < this.boardSize; c++) {
        const cell = this.board[r][c];
        if (ability.targetType === 'friendly_cell' && (cell.symbol === player || cell.symbol === 'W')) {
          return true;
        }
        if (ability.targetType === 'enemy_cell' && cell.symbol === enemy && cell.shield === 0) {
          return true;
        }
        if (ability.targetType === 'empty_cell' && !cell.symbol && !cell.obstacle && cell.locked === 0) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Activate the Hero's Turn-1 Active Tactical Skill (available on all levels, 3-turn cooldown)
   */
  activateHeroAbility(player = 'X', targets = []) {
    if (this.status !== 'playing' || this.activePlayer !== player) {
      return { ok: false, reason: 'Not your turn.' };
    }
    const ability = this.hero?.activeAbility;
    if (!ability) {
      return { ok: false, reason: 'No active ability equipped.' };
    }
    if (this.heroAbilityUsedThisTurn) {
      return { ok: false, reason: 'Hero skill already used this turn.' };
    }
    if ((this.heroAbilityCooldown[player] || 0) > 0) {
      return { ok: false, reason: `Skill on cooldown (${this.heroAbilityCooldown[player]}T remaining).` };
    }

    const enemy = player === 'X' ? 'O' : 'X';
    const inBounds = (r, c) => r >= 0 && r < this.boardSize && c >= 0 && c < this.boardSize;

    if (ability.targetType !== 'none') {
      if (!targets || targets.length < 1) {
        return { ok: false, reason: `Select a target tile for ${ability.name}.` };
      }
      const [r, c] = targets[0];
      if (!inBounds(r, c)) return { ok: false, reason: 'Target outside War-Table.' };
      const cell = this.board[r][c];
      if (ability.targetType === 'friendly_cell' && cell.symbol !== player && cell.symbol !== 'W') {
        return { ok: false, reason: 'Must target a friendly Champion.' };
      }
      if (ability.targetType === 'enemy_cell') {
        if (cell.symbol !== enemy) return { ok: false, reason: 'Must target an enemy Champion.' };
        if (cell.shield > 0) return { ok: false, reason: 'Target is protected by Aegis Shield!' };
      }
      if (ability.targetType === 'empty_cell' && (cell.symbol !== null || cell.obstacle || cell.locked > 0)) {
        return { ok: false, reason: 'Must target an open War-Table tile.' };
      }
    }

    if (player === 'X') {
      this.saveUndoSnapshot();
    }

    this.heroAbilityUsedThisTurn = true;
    this.heroAbilityCooldown[player] = ability.cooldown || 3;
    this.selectedHeroAbility = false;

    const events = [];
    switch (ability.id) {
      case 'solar_bulwark': {
        const [r, c] = targets[0];
        this.board[r][c].shield = Math.max(this.board[r][c].shield, 2);
        this.addBellCharge(player, 15);
        events.push({ type: 'shield', r, c });
        this.bus.emit('3d:boardRebuild', this.getSnapshot());
        break;
      }
      case 'valkyrie_rune': {
        const [r, c] = targets[0];
        this.board[r][c].anomaly = 'sanctified_mosaic';
        events.push({ type: 'mosaic', r, c });
        this.bus.emit('3d:boardRebuild', this.getSnapshot());
        break;
      }
      case 'astral_seal': {
        const [r, c] = targets[0];
        this.board[r][c].locked = 2;
        if (this.cardsEnabled) {
          this.tithe[player] = Math.min(GAME_CONFIG.MAX_BLOOD_TITHE, this.tithe[player] + 1);
        }
        events.push({ type: 'lock', r, c });
        this.bus.emit('3d:boardRebuild', this.getSnapshot());
        break;
      }
      case 'dragon_scorch': {
        const [r, c] = targets[0];
        this.board[r][c].symbol = null;
        this.stonesShatteredThisMatch++;
        this.addBellCharge(player, 15);
        events.push({ type: 'destroy', r, c, symbol: enemy });
        this.bus.emit('3d:stoneShatter', {
          cells: [{ r, c, symbol: enemy }],
          cause: 'dragon_scorch',
          weapon: 'warhammer',
          target: [r, c],
          intensity: 1.45,
        });
        break;
      }
      case 'pathfinder_drop': {
        const [r, c] = targets[0];
        this.board[r][c].obstacle = 'reliquary_coffer';
        if (this.cardsEnabled) {
          this.tithe[player] = Math.min(GAME_CONFIG.MAX_BLOOD_TITHE, this.tithe[player] + 1);
        }
        events.push({ type: 'coffer', r, c });
        this.bus.emit('3d:boardRebuild', this.getSnapshot());
        break;
      }
      case 'permafrost_rune': {
        const [r, c] = targets[0];
        const coords = [
          [r, c],
          [r - 1, c],
          [r + 1, c],
          [r, c - 1],
          [r, c + 1],
        ];
        for (const [lr, lc] of coords) {
          if (inBounds(lr, lc)) {
            const cell = this.board[lr][lc];
            if (!cell.symbol && !cell.obstacle) {
              cell.locked = 2;
              events.push({ type: 'lock', r: lr, c: lc });
            }
          }
        }
        this.bus.emit('3d:boardRebuild', this.getSnapshot());
        break;
      }
    }

    this._logChronicle('ability', `${this.hero?.shortName || 'Hero'} unleashed ${ability.name}!`, player);
    const newlyScored = this.evaluateBoardScoring(player);

    this.bus.emit('battle:heroAbilityUsed', {
      player,
      ability,
      targets,
      events,
      newlyScored,
      snapshot: this.getSnapshot(),
    });
    this.checkVictoryConditions();
    this.bus.emit('battle:updated', this.getSnapshot());
    return { ok: true, ability, events, newlyScored };
  }

  /**
   * Play a War-Scroll Card from `player`'s hand (1 Card / Turn v1 rule)
   */
  playCard(player, handIndex, targets = []) {
    if (!this.cardsEnabled) {
      return { ok: false, reason: 'War-Scrolls unlock at Level 3!' };
    }
    if (this.status !== 'playing' || this.activePlayer !== player) {
      return { ok: false, reason: 'Cannot invoke War-Scrolls outside your turn.' };
    }
    if (this.cardsPlayedThisTurn >= 1 && this.mode !== 'crypt') {
      return { ok: false, reason: '1 War-Scroll per turn limit reached!' };
    }

    const hand = this.hands[player];
    const instance = hand[handIndex];
    if (!instance) return { ok: false, reason: 'Invalid War-Scroll selection.' };

    const card = getArcanaCardById(instance.cardId);
    if (!card) return { ok: false, reason: 'Unknown War-Scroll.' };

    // v1 Rule: Cards bought from the in-battle Shop already had their Gold paid on purchase (`paidInShop: true`)!
    // Cards drawn directly cost their Gold price unless already paid in shop.
    let effectiveCost = instance.paidInShop ? 0 : this.getEffectiveCardPrice(card, player);

    if (this.tithe[player] < effectiveCost) {
      return { ok: false, reason: `Need ${effectiveCost} Gold Coins to invoke ${card.name}.` };
    }

    const validation = this.validateCardTargets(player, card, targets);
    if (!validation.ok) return validation;

    if (player === 'X') {
      this.saveUndoSnapshot();
    }

    // Deduct Gold & remove from hand
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
        this._logChronicle('synergy', `Order Resonance (${card.order.toUpperCase()}): +1 VP, +2🪙, +1 Scroll!`, 'X');
      }
    }

    const actorLabel = player === 'X' ? (this.hero?.shortName || 'Hero') : (this.boss?.name || 'Warlord');
    this._logChronicle(
      'card',
      `${actorLabel} invoked ${card.name}${exalted ? ' [+]' : ''}`,
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
        if (targets.length < 1) return { ok: false, reason: 'Select an enemy Champion on the War-Table.' };
        const [r, c] = targets[0];
        if (!inBounds(r, c)) return { ok: false, reason: 'Target outside War-Table.' };
        const cell = this.board[r][c];
        if (cell.symbol !== enemy) return { ok: false, reason: 'Must target an enemy Champion.' };
        if (cell.shield > 0) return { ok: false, reason: 'Target is protected by Aegis Shield!' };
        return { ok: true };
      }

      case 'friendly_cell': {
        if (targets.length < 1) return { ok: false, reason: 'Select one of your friendly Champions.' };
        const [r, c] = targets[0];
        if (!inBounds(r, c)) return { ok: false, reason: 'Target outside War-Table.' };
        const cell = this.board[r][c];
        if (cell.symbol !== player && cell.symbol !== 'W') {
          return { ok: false, reason: 'Must target a friendly Champion.' };
        }
        return { ok: true };
      }

      case 'empty_cell': {
        if (targets.length < 1) return { ok: false, reason: 'Select an empty War-Table tile.' };
        const [r, c] = targets[0];
        if (!inBounds(r, c)) return { ok: false, reason: 'Target outside War-Table.' };
        const cell = this.board[r][c];
        if (cell.symbol !== null || cell.obstacle) {
          return { ok: false, reason: 'War-Table tile must be empty.' };
        }
        return { ok: true };
      }

      case 'any_cell':
      case 'row':
      case 'col': {
        if (targets.length < 1) return { ok: false, reason: 'Select a target tile on the War-Table.' };
        const [r, c] = targets[0];
        if (!inBounds(r, c)) return { ok: false, reason: 'Target outside War-Table.' };
        return { ok: true };
      }

      case 'two_occupied': {
        if (targets.length < 2) return { ok: false, reason: 'Select two Champions to swap.' };
        const [[r1, c1], [r2, c2]] = targets;
        if (!inBounds(r1, c1) || !inBounds(r2, c2)) return { ok: false, reason: 'Out of bounds.' };
        if (r1 === r2 && c1 === c2) return { ok: false, reason: 'Select two distinct Champions.' };
        const cell1 = this.board[r1][c1];
        const cell2 = this.board[r2][c2];
        if (!cell1.symbol || !cell2.symbol) return { ok: false, reason: 'Both tiles must contain Champions.' };
        if (cell1.shield > 0 || cell2.shield > 0) {
          return { ok: false, reason: 'Shielded Champions cannot be swapped.' };
        }
        return { ok: true };
      }

      default:
        return { ok: true };
    }
  }

  /**
   * Check whether a card currently has at least one valid target on the War-Table
   * so selecting a card never locks the player into an impossible targeting state.
   */
  hasValidTargetsForCard(player, card) {
    if (!card || card.targetType === 'none') return true;
    const enemy = player === 'X' ? 'O' : 'X';
    let enemyUnshielded = 0;
    let friendlyCount = 0;
    let emptyCount = 0;
    let swappableOccupied = 0;

    for (let r = 0; r < this.boardSize; r++) {
      for (let c = 0; c < this.boardSize; c++) {
        const cell = this.board[r][c];
        if (cell.symbol === enemy && cell.shield === 0) enemyUnshielded++;
        if (cell.symbol === player || cell.symbol === 'W') friendlyCount++;
        if (cell.symbol === null && !cell.obstacle) emptyCount++;
        if (cell.symbol && cell.shield === 0) swappableOccupied++;
      }
    }

    switch (card.targetType) {
      case 'enemy_cell':
        return enemyUnshielded >= 1;
      case 'friendly_cell':
        return friendlyCount >= 1;
      case 'empty_cell':
        return emptyCount >= 1;
      case 'two_occupied':
        return swappableOccupied >= 2;
      default:
        return true;
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
        if (this.cardsEnabled) {
          this.tithe[player] = Math.min(GAME_CONFIG.MAX_BLOOD_TITHE, this.tithe[player] + 2);
          this.drawCard(player);
        }
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

      if (player === 'X' && this.hero?.id === 'hero_dragonknight') {
        this.addBellCharge('X', 10);
      }
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
        this.board[r][c].locked = 0; // Revives locked/cratered tile!
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

      case 'shield_row': {
        const [r] = targets[0];
        for (let c = 0; c < this.boardSize; c++) {
          if (this.board[r][c].symbol === player || this.board[r][c].symbol === 'W') {
            this.board[r][c].shield = Math.max(this.board[r][c].shield, 2);
          }
        }
        this.tithe[player] = Math.min(GAME_CONFIG.MAX_BLOOD_TITHE, this.tithe[player] + (exalted ? 2 : 1));
        this.bus.emit('3d:boardRebuild', this.getSnapshot());
        break;
      }

      case 'shield_col': {
        const [, c] = targets[0];
        for (let r = 0; r < this.boardSize; r++) {
          if (this.board[r][c].symbol === player || this.board[r][c].symbol === 'W') {
            this.board[r][c].shield = Math.max(this.board[r][c].shield, 2);
          }
        }
        this.drawCard(player);
        this.bus.emit('3d:boardRebuild', this.getSnapshot());
        break;
      }

      case 'shatter_diag': {
        const [r, c] = targets[0];
        const coords = [
          [r, c],
          [r - 1, c - 1],
          [r - 1, c + 1],
          [r + 1, c - 1],
          [r + 1, c + 1],
        ];
        for (const [dr, dc] of coords) {
          shatterCell(dr, dc, false);
        }
        if (exalted) this.drawCard(player);
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

      case 'harvest_gold': {
        let friendlyCount = 0;
        for (let r = 0; r < this.boardSize; r++) {
          for (let c = 0; c < this.boardSize; c++) {
            if (this.board[r][c].symbol === player || this.board[r][c].symbol === 'W') {
              friendlyCount++;
            }
          }
        }
        const gain = Math.min(exalted ? 6 : 4, Math.max(1, friendlyCount));
        this.tithe[player] = Math.min(GAME_CONFIG.MAX_BLOOD_TITHE, this.tithe[player] + gain);
        this.drawCard(player);
        break;
      }

      case 'cleanse_locks': {
        for (let r = 0; r < this.boardSize; r++) {
          for (let c = 0; c < this.boardSize; c++) {
            const cell = this.board[r][c];
            cell.locked = 0;
            if (cell.anomaly === 'cursed_censer') {
              cell.anomaly = null;
              cell.bombTimer = 0;
            }
            if (exalted && (cell.symbol === player || cell.symbol === 'W')) {
              cell.shield = Math.max(cell.shield, 2);
            }
          }
        }
        this.drawCard(player);
        this.bus.emit('3d:boardRebuild', this.getSnapshot());
        break;
      }

      case 'spawn_coffer': {
        const [r, c] = targets[0];
        this.board[r][c].obstacle = 'reliquary_coffer';
        this.tithe[player] = Math.min(GAME_CONFIG.MAX_BLOOD_TITHE, this.tithe[player] + (exalted ? 3 : 2));
        this.bus.emit('3d:boardRebuild', this.getSnapshot());
        break;
      }

      case 'plant_censer': {
        const [r, c] = targets[0];
        this.board[r][c].anomaly = 'cursed_censer';
        this.board[r][c].bombTimer = exalted ? 2 : 3;
        this.bus.emit('3d:boardRebuild', this.getSnapshot());
        break;
      }

      case 'empower_adjacent': {
        const [r, c] = targets[0];
        this.board[r][c].shield = Math.max(this.board[r][c].shield, 3);
        const dirs = [
          [-1, 0],
          [1, 0],
          [0, -1],
          [0, 1],
        ];
        for (const [dr, dc] of dirs) {
          const adj = this.board[r + dr]?.[c + dc];
          if (adj && !adj.obstacle) {
            adj.anomaly = 'sanctified_mosaic';
          }
        }
        this.bus.emit('3d:boardRebuild', this.getSnapshot());
        break;
      }

      case 'free_shop_refresh': {
        this._refillShop(true);
        this.drawCard(player);
        if (exalted) this.drawCard(player);
        this.tithe[player] = Math.min(GAME_CONFIG.MAX_BLOOD_TITHE, this.tithe[player] + (exalted ? 3 : 2));
        break;
      }

      case 'charge_warhorn': {
        this.addBellCharge(player, exalted ? 80 : 50);
        this.drawCard(player);
        break;
      }

      case 'shatter_2x2': {
        const [r, c] = targets[0];
        for (let dr = 0; dr <= 1; dr++) {
          for (let dc = 0; dc <= 1; dc++) {
            shatterCell(r + dr, c + dc, false);
          }
        }
        if (exalted) {
          this.tithe[player] = Math.min(GAME_CONFIG.MAX_BLOOD_TITHE, this.tithe[player] + 2);
        }
        if (shatteredCells.length > 0) {
          this.bus.emit('3d:stoneShatter', {
            cells: shatteredCells,
            cause: card.id,
            weapon: 'brimstone_meteor',
            target: [r, c],
            intensity: 1.55,
          });
        }
        break;
      }

      case 'drain_and_shatter': {
        const [r, c] = targets[0];
        shatterCell(r, c, false);
        const stolen = Math.min(exalted ? 3 : 2, this.tithe[enemy]);
        this.tithe[enemy] -= stolen;
        this.tithe[player] = Math.min(GAME_CONFIG.MAX_BLOOD_TITHE, this.tithe[player] + stolen + 1);
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

      case 'mirror_col': {
        const [, c] = targets[0];
        for (let r = 0; r < Math.floor(this.boardSize / 2); r++) {
          const mirrorR = this.boardSize - 1 - r;
          const cellA = this.board[r][c];
          const cellB = this.board[mirrorR][c];
          if (cellA.shield === 0 && cellB.shield === 0 && !cellA.obstacle && !cellB.obstacle) {
            const tmp = cellA.symbol;
            cellA.symbol = cellB.symbol;
            cellB.symbol = tmp;
          }
        }
        if (exalted) this.drawCard(player);
        this.bus.emit('3d:boardRebuild', this.getSnapshot());
        break;
      }

      case 'fortify_corners': {
        const last = this.boardSize - 1;
        const corners = [
          [0, 0],
          [0, last],
          [last, 0],
          [last, last],
        ];
        for (const [cr, cc] of corners) {
          const cell = this.board[cr]?.[cc];
          if (!cell) continue;
          cell.anomaly = 'sanctified_mosaic';
          if (cell.symbol === player || cell.symbol === 'W') {
            cell.shield = Math.max(cell.shield, 3);
          }
        }
        this.drawCard(player);
        this.bus.emit('3d:boardRebuild', this.getSnapshot());
        break;
      }

      case 'demolish_obstacle': {
        const [r, c] = targets[0];
        const cell = this.board[r][c];
        cell.obstacle = null;
        cell.locked = 0;
        if (!cell.symbol) {
          cell.symbol = player;
          if (exalted) cell.shield = 2;
          this.bus.emit('3d:piecePlaced', { r, c, symbol: player, snapshot: this.getSnapshot() });
        } else {
          this.bus.emit('3d:boardRebuild', this.getSnapshot());
        }
        break;
      }

      case 'place_shielded_joker': {
        const [r, c] = targets[0];
        this.board[r][c].symbol = 'W';
        this.board[r][c].shield = exalted ? 3 : 2;
        this.bus.emit('3d:piecePlaced', { r, c, symbol: 'W', snapshot: this.getSnapshot() });
        this._checkAdjacentReliquaryCoffers(r, c, player);
        break;
      }

      case 'place_and_draw': {
        const [r, c] = targets[0];
        this.board[r][c].symbol = player;
        if (exalted) this.board[r][c].shield = 2;
        this.drawCard(player);
        this.bus.emit('3d:piecePlaced', { r, c, symbol: player, snapshot: this.getSnapshot() });
        this._checkAdjacentReliquaryCoffers(r, c, player);
        break;
      }

      case 'lock_row_empty': {
        const [r] = targets[0];
        for (let c = 0; c < this.boardSize; c++) {
          const cell = this.board[r][c];
          if (!cell.symbol && !cell.obstacle) {
            cell.locked = exalted ? 3 : 2;
          }
        }
        this.bus.emit('3d:boardRebuild', this.getSnapshot());
        break;
      }

      case 'omni_ascension': {
        this.placementsRemaining += 1;
        this.tithe[player] = Math.min(GAME_CONFIG.MAX_BLOOD_TITHE, this.tithe[player] + (exalted ? 5 : 3));
        this.drawCard(player);
        for (let r = 0; r < this.boardSize; r++) {
          for (let c = 0; c < this.boardSize; c++) {
            if (this.board[r][c].symbol === player || this.board[r][c].symbol === 'W') {
              this.board[r][c].shield = Math.max(this.board[r][c].shield, 2);
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
   * End current player's turn, tick statuses & Siege Bombs in two phases (preventing position-dependent crater locks),
   * grant v1 Coins, and advance turn
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
    this.ownTurns[this.activePlayer] = (this.ownTurns[this.activePlayer] || 0) + 1;
    this.placementsRemaining = 1;
    this.cardsPlayedThisTurn = 0;
    this.heroAbilityUsedThisTurn = false;
    this.selectedHeroAbility = false;

    if ((this.heroAbilityCooldown[this.activePlayer] || 0) > 0) {
      this.heroAbilityCooldown[this.activePlayer]--;
    }

    // Phase 1: Tick down existing Iron Cage locks and Gargoyle Aegis shields first
    // (Separating Phase 1 from Phase 2 Bomb detonation guarantees crater locks never depend on tile (r, c) position!)
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

    // Phase 2: Tick and detonate Siege Bombs
    const bombShatters = [];
    for (let r = 0; r < this.boardSize; r++) {
      for (let c = 0; c < this.boardSize; c++) {
        const cell = this.board[r][c];
        if (cell.anomaly === 'cursed_censer' && cell.bombTimer > 0) {
          cell.bombTimer--;
          if (cell.bombTimer === 0) {
            // Detonate 3×3 Siege Bomb!
            cell.anomaly = null;
            boardChanged = true;
            for (let dr = -1; dr <= 1; dr++) {
              for (let dc = -1; dc <= 1; dc++) {
                const bCell = this.board[r + dr]?.[c + dc];
                if (!bCell) continue;
                if (bCell.symbol && bCell.shield === 0) {
                  bombShatters.push({ r: r + dr, c: c + dc, symbol: bCell.symbol });
                  bCell.symbol = null;
                  bCell.locked = 1;
                  this.stonesShatteredThisMatch++;
                }
              }
            }
            this._logChronicle('anomaly', `💣 Siege Bomb detonated at [${r + 1}, ${c + 1}] in a 3×3 blast!`);
          }
        }
      }
    }

    if (bombShatters.length > 0) {
      this.bus.emit('3d:stoneShatter', {
        cells: bombShatters,
        cause: 'siege_bomb_3x3',
        weapon: 'brimstone_meteor',
        intensity: 1.65,
      });
    }

    // v1 Economy Rule: Only grant Coins when `this.cardsEnabled` (Level 3+)!
    // Fair Economy Fix: AI no longer receives free cards out of thin air — AI buys from the 3-Slot Shop using its Gold!
    if (this.cardsEnabled) {
      const isCoinTurn = this.ownTurns[this.activePlayer] % GAME_CONFIG.COIN_EVERY_OWN_TURNS === 0;
      const coinGain = isCoinTurn ? 2 : 1;
      this.tithe[this.activePlayer] = Math.min(
        GAME_CONFIG.MAX_BLOOD_TITHE,
        this.tithe[this.activePlayer] + coinGain
      );

      if (this.activePlayer === 'X' && this.hands.X.length === 0 && this.ownTurns.X % 3 === 0) {
        this.drawCard('X');
      }
    }

    // Telegraphed Warlord Boss Rituals:
    // - On AI turns right before a ritual turn (`aiTurnCount % 3 === 2`), telegraph the target 1 turn ahead (`this.pendingBossRitual`)!
    // - On AI ritual turns (`aiTurnCount % 3 === 0`), execute the telegraphed ritual (unless the player disrupted/shielded the target!).
    const bossEvents = [];
    if (this.activePlayer === 'O' && this.boss && (this.levelNumber >= 3 || this.mode !== 'campaign')) {
      const aiTurnCount = Math.ceil(this.turnNumber / 2);
      if (aiTurnCount % 3 === 0) {
        this._executeBossRitual(bossEvents);
        this.pendingBossRitual = null;
        boardChanged = true;
      } else if (aiTurnCount % 3 === 2) {
        this._telegraphBossRitual(bossEvents);
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

  /**
   * Telegraph the Boss Ritual 1 full turn ahead so the player can see the target tile & disrupt it!
   */
  _telegraphBossRitual(bossEvents) {
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

    const pId = this.boss.passiveId;
    let target = null;
    let warningText = '';

    if (pId === 'iron_maiden_lock' && emptyCells.length > 0) {
      target = this.rng.pick(emptyCells);
      warningText = `⚠️ ${this.boss.name} aims Frost-Bind at [${target[0] + 1}, ${target[1] + 1}] next turn!`;
    } else if (pId === 'ossuary_pillar' && emptyCells.length > 0) {
      target = this.rng.pick(emptyCells);
      warningText = `⚠️ ${this.boss.name} summons a Bone-Chest at [${target[0] + 1}, ${target[1] + 1}] next turn!`;
    } else if (pId === 'plague_censer' && emptyCells.length > 0) {
      target = this.rng.pick(emptyCells);
      warningText = `⚠️ ${this.boss.name} arms a Siege Bomb at [${target[0] + 1}, ${target[1] + 1}] next turn!`;
    } else if (pId === 'blood_tithe_tax' && this.cardsEnabled) {
      target = [Math.floor(this.boardSize / 2), Math.floor(this.boardSize / 2)];
      warningText = `⚠️ ${this.boss.name} prepares a Gold Tax Siphon next turn!`;
    } else if (pId === 'bell_shockwave' && playerCells.length > 0) {
      target = this.rng.pick(playerCells);
      warningText = `⚠️ ${this.boss.name} locks Wyrm-Hammer onto [${target[0] + 1}, ${target[1] + 1}]! Shield it to block!`;
    } else if (pId === 'seraph_aegis' && aiCells.length > 0) {
      target = this.rng.pick(aiCells);
      warningText = `⚠️ ${this.boss.name} channels War-God Aegis on [${target[0] + 1}, ${target[1] + 1}] next turn!`;
    }

    if (target) {
      this.pendingBossRitual = {
        passiveId: pId,
        r: target[0],
        c: target[1],
        bossName: this.boss.name,
        passiveName: this.boss.passiveName,
        warningText,
      };
      this._logChronicle('boss_telegraph', warningText, 'O');
      this.bus.emit('battle:bossTelegraph', this.pendingBossRitual);
    }
  }

  _executeBossRitual(bossEvents) {
    // Use the telegraphed target if one was prepared; otherwise pick a fallback
    let telegraphed = this.pendingBossRitual;
    if (!telegraphed) {
      this._telegraphBossRitual([]);
      telegraphed = this.pendingBossRitual;
    }
    if (!telegraphed) return;

    const { r, c, passiveId } = telegraphed;
    const cell = this.board[r]?.[c];
    if (!cell) return;

    if (passiveId === 'iron_maiden_lock') {
      if (!cell.symbol && !cell.obstacle) {
        cell.locked = 2;
        bossEvents.push({ boss: this.boss.name, text: `${this.boss.name} caged tile [${r + 1}, ${c + 1}]!` });
      } else {
        bossEvents.push({ boss: this.boss.name, text: `🛡️ You disrupted ${this.boss.name}'s Frost-Bind at [${r + 1}, ${c + 1}]!` });
      }
    } else if (passiveId === 'ossuary_pillar') {
      if (!cell.symbol && !cell.obstacle) {
        cell.obstacle = 'reliquary_coffer';
        bossEvents.push({ boss: this.boss.name, text: `${this.boss.name} summoned a Mystery Bone-Chest at [${r + 1}, ${c + 1}]!` });
      } else {
        bossEvents.push({ boss: this.boss.name, text: `🛡️ You blocked ${this.boss.name}'s Bone-Chest summon at [${r + 1}, ${c + 1}]!` });
      }
    } else if (passiveId === 'plague_censer') {
      if (!cell.obstacle) {
        cell.anomaly = 'cursed_censer';
        cell.bombTimer = GAME_CONFIG.BOMB_COUNTDOWN;
        bossEvents.push({ boss: this.boss.name, text: `${this.boss.name} planted a Siege Bomb at [${r + 1}, ${c + 1}] (4T)!` });
      }
    } else if (passiveId === 'blood_tithe_tax' && this.cardsEnabled) {
      this.tithe.X = Math.max(0, this.tithe.X - 1);
      this.tithe.O = Math.min(GAME_CONFIG.MAX_BLOOD_TITHE, this.tithe.O + 1);
      bossEvents.push({ boss: this.boss.name, text: `${this.boss.name} siphoned 1🪙 Gold Coin!` });
    } else if (passiveId === 'bell_shockwave') {
      if (cell.symbol === 'X' && cell.shield === 0) {
        cell.symbol = null;
        this.stonesShatteredThisMatch++;
        this.bus.emit('3d:stoneShatter', {
          cells: [{ r, c, symbol: 'X' }],
          cause: 'boss_bell_shockwave',
          weapon: 'warhammer',
          intensity: 1.5,
        });
        bossEvents.push({ boss: this.boss.name, text: `${this.boss.name}'s Wyrm-Hammer shattered [${r + 1}, ${c + 1}]!` });
      } else {
        bossEvents.push({ boss: this.boss.name, text: `🛡️ Aegis Shield deflected ${this.boss.name}'s Wyrm-Hammer at [${r + 1}, ${c + 1}]!` });
      }
    } else if (passiveId === 'seraph_aegis') {
      if (cell.symbol === 'O') {
        cell.shield = 2;
        if (this.cardsEnabled) {
          this.tithe.O = Math.min(GAME_CONFIG.MAX_BLOOD_TITHE, this.tithe.O + 1);
        }
        bossEvents.push({ boss: this.boss.name, text: `${this.boss.name} consecrated War-God Aegis on [${r + 1}, ${c + 1}]!` });
      } else {
        bossEvents.push({ boss: this.boss.name, text: `⚔️ You shattered ${this.boss.name}'s Aegis anchor at [${r + 1}, ${c + 1}]!` });
      }
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
   * War-Table Cataclysm Stalemate Breaker: shatters oldest unshielded stones so the duel never softlocks
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
      this._logChronicle('system', 'War-Table Tremor shattered 4 ancient Champions to clear the battlefield!');
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

      if (this.status === 'victory' && (this.scores.X - this.scores.O) >= 2) {
        this.microRewards.decisiveWin = true;
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
   * Execute Single-Player Warlord AI Turn:
   * 1. Unleash War-Horn Ultimate if `bellCharge.O >= 100`
   * 2. Buy a War-Scroll from the 3-Slot Shop using AI Gold (`selectBestAIShopPurchase`)
   * 3. Play a War-Scroll from hand (`selectBestAICardAction`)
   * 4. Place Champion via Depth-3 Alpha-Beta Minimax (`selectBestAIMove`)
   */
  executeAITurnStep() {
    if (this.status !== 'playing' || this.activePlayer !== 'O') return null;

    // 1. AI War-Horn Ultimate when charged!
    if (!this.bellUsedThisMatch.O && (this.bellCharge.O || 0) >= 100 && this.aiTier >= 2) {
      const bellRes = this.activatePenitenceBell('O');
      if (bellRes.ok && this.status !== 'playing') {
        return { action: 'bell', ...bellRes };
      }
    }

    // 2. AI Shop Purchase & Card Cast (only when cardsEnabled is true on Level 3+!)
    if (this.cardsEnabled && this.cardsPlayedThisTurn < 1) {
      if (this.hands.O.length < 2) {
        const shopSlot = selectBestAIShopPurchase(this, this.aiTier);
        if (shopSlot && typeof shopSlot.slotIndex === 'number') {
          this.buyShopCard(shopSlot.slotIndex, 'O');
        }
      }

      const cardDecision = selectBestAICardAction(this, this.aiTier);
      if (cardDecision) {
        this.bus.emit('3d:inquisitorReact', { mood: 'cast', text: `${this.boss?.name || 'Warlord'} invokes a War-Scroll` });
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
      if (res.ok) {
        return { action: 'move', r: move.r, c: move.c, reason: move.reason, ...res };
      }
    }

    // Fallback: scan for any valid playable tile so AI turn never stalls
    for (let r = 0; r < this.boardSize; r++) {
      for (let c = 0; c < this.boardSize; c++) {
        if (this.canPlaceAt(r, c)) {
          const res = this.placePiece(r, c);
          if (res.ok) {
            return { action: 'move', r, c, reason: 'Fallback placement', ...res };
          }
        }
      }
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
      hero: this.hero,
      boss: this.boss,
      aiTier: this.aiTier,
      doctrine: this.doctrine,
      earlyModifier: this.earlyModifier,
      roguelikeBoon: this.roguelikeBoon,
      cardsEnabled: this.cardsEnabled,
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
      heroAbilityCooldown: { ...this.heroAbilityCooldown },
      heroAbilityUsedThisTurn: this.heroAbilityUsedThisTurn,
      canUseHeroAbility: this.canUseHeroAbility('X'),
      selectedHeroAbility: this.selectedHeroAbility,
      pendingBossRitual: this.pendingBossRitual ? { ...this.pendingBossRitual } : null,
      orderTally: { ...this.orderTally },
      activeOaths: Array.from(this.activeOaths),
      placementsRemaining: this.placementsRemaining,
      cardsPlayedThisTurn: this.cardsPlayedThisTurn,
      cardsPlayedTotal: this.cardsPlayedTotal,
      stonesShatteredThisMatch: this.stonesShatteredThisMatch,
      undosRemaining: this.undosRemaining,
      maxUndos: this.maxUndos,
      canUndo:
        this.undoStack.length > 0 &&
        this.undosRemaining > 0 &&
        this.activePlayer === 'X' &&
        this.status === 'playing',
      microRewards: { ...this.microRewards },
      moveHistory: this.moveHistory.slice(0, 12),
      battleChronicle: this.battleChronicle.slice(0, 12),
      shop: this.shop.map((slot, i) => ({
        ...slot,
        locked: this.shopLockedSlots.has(i),
        card: getArcanaCardById(slot.cardId),
      })),
      shopRerollCost: this.getShopRerollCost(),
      hands: {
        X: this.hands.X.map((h) => ({ ...h, card: getArcanaCardById(h.cardId) })),
        O: this.hands.O.map((h) => ({ ...h, card: getArcanaCardById(h.cardId) })),
      },
      board: this.board.map((row) => row.map((cell) => ({ ...cell }))),
    };
  }
}
