/**
 * ============================================================================
 * XcardO — Warlords of the Obsidian Altar
 * Master Application Controller, 3D War-Table HUD, V1 Rules Shop & Hero Roster
 * ============================================================================
 */

import {
  GAME_CONFIG,
  CATHEDRAL_HALLS,
  SCULPTED_PIECES,
  STONE_MATERIALS,
  CAMERA_PRESETS,
  BLOOD_OATHS,
  PENITENCE_BELLS,
  ARCANA_CARDS,
  CATHEDRAL_ACTS,
  CATHEDRAL_LEVELS,
  CRYPT_TRIALS,
  INQUISITOR_BOSSES,
  FANTASY_HEROES,
  V1_BOX_ODDS,
  getArcanaCardById,
  getArcanaPreviewCells,
  getLevelByNumber,
  getFantasyHeroById,
} from '../data/gothic-config.js';
import { BattleEngine } from '../engine/game-state.js';
import { selectBestAIMove, scanEnemyThreatCells } from '../engine/ai-brain.js';
import { SACRED_GEOMETRY_SHAPES } from '../engine/pattern-detector.js';
import {
  renderTarotArtSVG,
  renderBossCrestSVG,
  renderGothicIconSVG,
  renderGeometryBlueprintSVG,
  renderRoseWindowSVG,
  renderFantasyHeroPortraitSVG,
} from './gothic-svg.js';

export class AppController {
  constructor({ rootEl, eventBus, saveManager, scene3d, soundEngine }) {
    this.rootEl = rootEl;
    this.bus = eventBus;
    this.save = saveManager;
    this.scene3d = scene3d;
    this.sound = soundEngine;

    this.currentScreen = 'hub'; // 'hub' | 'campaign' | 'crypt' | 'reliquary' | 'codex' | 'skirmish' | 'battle'
    this.selectedActId = 1;
    this.engine = null;
    this.aiTimer = null;

    this.seerHintCoord = null;
    this.showThreatScan = false;
    this.showMiniTacticalGrid = false;
    this.showStoryModal = false;
    this.toastMessage = null;
    this.toastTimer = null;

    this.skirmishConfig = {
      boardSize: 5,
      targetScore: 7,
      aiTier: 3,
      cathedralHallId: 'obsidian_nave',
      mode: 'skirmish',
    };

    this._bindEvents();
    this._setupDemoAltar();
    this.render();
  }

  _setupDemoAltar() {
    if (!this.scene3d) return;
    const state = this.save.getState();
    const nextLvl = getLevelByNumber(state.highestUnlockedLevel || 1);
    const currentAct =
      CATHEDRAL_ACTS.find((a) => a.id === nextLvl.actId) || CATHEDRAL_ACTS[0];
    const currentBoss =
      INQUISITOR_BOSSES.find((b) => b.id === currentAct.bossId) || INQUISITOR_BOSSES[0];

    this.scene3d.idleOrbitActive = true;
    this.scene3d.rebuildAltar(5, state.equippedHall || 'obsidian_nave', currentBoss);
    this.scene3d.playCinematicFlyIn?.(state.cameraPreset || 'commander_angle', 2.65);

    // Strictly 2 stone types on the War-Table: Your Golden Champion (X) vs Enemy Crimson Warlord (O)
    // Slam down cinematically onto the board as the camera sweeps in!
    this.scene3d.animatePieceSlam(2, 2, 'X');
    this.scene3d.animatePieceSlam(1, 2, 'O');
    this.scene3d.animatePieceSlam(2, 1, 'O');
    this.scene3d.animatePieceSlam(3, 3, 'X');
  }

  _bindEvents() {
    if (!this.bus) return;

    // 3D Raycaster Tile Hover & Click from GothicScene3D
    this.bus.on('3d:tileHover', (coord) => {
      if (this.currentScreen !== 'battle' || !this.engine) return;
      this._handleTileHover(coord);
    });

    this.bus.on('3d:tileClick', (coord) => {
      if (this.currentScreen !== 'battle' || !this.engine) return;
      if (coord) {
        this.handleBoardCellClick(coord.r, coord.c);
      }
    });

    this.bus.on('3d:cancelSelection', () => {
      if (this.currentScreen !== 'battle' || !this.engine) return;
      if (this.engine.selectedCardIndex !== null) {
        this.engine.selectedCardIndex = null;
        this.engine.pendingTargets = [];
        this.showToast('War-Scroll selection cancelled.');
        this.render();
      }
    });

    // Audio & Telemetry Hooks
    this.bus.on('3d:piecePlaced', ({ symbol }) => {
      this.sound?.playStoneSlam(symbol);
    });

    this.bus.on('3d:stoneShatter', ({ cells = [], intensity = 1.3 }) => {
      this.sound?.playStoneShatter(intensity);
      if (cells.length > 0) {
        this.save.recordStonesShattered(cells.length);
      }
    });

    this.bus.on('3d:patternAligned', ({ patterns = [] }) => {
      if (patterns.length > 0) {
        const topTier = patterns.some((p) => p.tier === 'grand')
          ? 'grand'
          : patterns.some((p) => p.tier === 'major')
          ? 'major'
          : 'minor';
        this.sound?.playSacredChord(topTier);
        const names = patterns.map((p) => `${p.name} (+${p.points} VP)`).join(' • ');
        this.showToast(names);
      }
    });

    this.bus.on('battle:bellActivated', ({ bell }) => {
      this.sound?.playCathedralBell();
      this.showToast(`${bell.name} Sounded Across the War-Table!`);
    });

    this.bus.on('battle:turnStarted', ({ activePlayer, bossEvents }) => {
      this.seerHintCoord = null;
      if (bossEvents && bossEvents.length > 0) {
        this.showToast(bossEvents[0].text);
      }
      this.render();
      if (activePlayer === 'O' && this.engine && this.engine.mode !== 'local2p') {
        this._scheduleAITurn();
      }
    });

    this.bus.on('battle:ended', ({ status, reason }) => {
      if (this.aiTimer) {
        clearTimeout(this.aiTimer);
        this.aiTimer = null;
      }
      this._handleMatchEnded(status, reason);
      this.render();
    });

    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', (e) => {
        if (this.currentScreen !== 'battle' || !this.engine) return;
        if (e.key === 'Escape') {
          this.engine.selectedCardIndex = null;
          this.engine.pendingTargets = [];
          this.render();
        } else if (['1', '2', '3', '4', '5'].includes(e.key)) {
          const idx = Number(e.key) - 1;
          if (this.engine.hands.X[idx]) {
            this.selectHandCard(idx);
          }
        } else if (e.key === 'c' || e.key === 'C') {
          this.cycleCameraPreset();
        }
      });
    }
  }

  showToast(text, duration = 2900) {
    this.toastMessage = text;
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.renderToastOnly();
    this.toastTimer = setTimeout(() => {
      this.toastMessage = null;
      this.renderToastOnly();
    }, duration);
  }

  renderToastOnly() {
    if (!this.rootEl || typeof this.rootEl.querySelector !== 'function') return;
    const banner = this.rootEl.querySelector('#gothic-toast-banner');
    if (banner) {
      banner.textContent = this.toastMessage || '';
      banner.classList.toggle('visible', Boolean(this.toastMessage));
    }
  }

  navigate(screen) {
    if (this.aiTimer) {
      clearTimeout(this.aiTimer);
      this.aiTimer = null;
    }
    const wasBattle = this.currentScreen === 'battle';
    const isSameNonBattle = this.currentScreen === screen && !wasBattle;
    this.currentScreen = screen;
    this.sound?.playUIHover();
    if (screen !== 'battle') {
      this.engine = null;
      if (wasBattle || !isSameNonBattle) {
        this._setupDemoAltar();
      }
    }
    this.render();
  }

  startCampaignLevel(levelNumber) {
    const state = this.save.getState();
    const level = getLevelByNumber(levelNumber);
    this.engine = new BattleEngine(this.bus, {
      mode: 'campaign',
      levelNumber,
      heroId: state.selectedHeroId || 'hero_paladin',
      cathedralHallId: level?.hallId || state.equippedHall,
      activeOaths: state.equippedOaths,
      penitenceBellId: state.equippedBell,
      upgradedCards: state.upgradedCards,
      customDeckIds: state.customDeck,
    });
    this.currentScreen = 'battle';
    if (this.scene3d) {
      this.scene3d.idleOrbitActive = false;
      this.scene3d.playBattleZoomIn?.(state.cameraPreset || 'commander_angle', 1.85);
    }
    this.sound?.startMusic(levelNumber % 13);
    if (levelNumber < GAME_CONFIG.CARDS_UNLOCK_LEVEL) {
      this.showToast(
        `⚔️ Level ${levelNumber}: Pure Tactical Combat — War-Scroll Shop & Cards Unlock at Level ${GAME_CONFIG.CARDS_UNLOCK_LEVEL}!`
      );
    } else if (level?.cardUnlock) {
      this.showToast(`🔓 Level ${levelNumber}: War-Scroll Shop Open! New Scroll: ${level.cardUnlock}`);
    }
    this.render();
  }

  startCryptTrial(cryptId) {
    const state = this.save.getState();
    this.engine = new BattleEngine(this.bus, {
      mode: 'crypt',
      cryptId,
      heroId: state.selectedHeroId || 'hero_paladin',
      cathedralHallId: 'ossuary_crypt',
      activeOaths: state.equippedOaths,
      penitenceBellId: state.equippedBell,
      upgradedCards: state.upgradedCards,
    });
    this.currentScreen = 'battle';
    if (this.scene3d) {
      this.scene3d.idleOrbitActive = false;
      this.scene3d.playBattleZoomIn?.(state.cameraPreset || 'commander_angle', 1.85);
    }
    this.sound?.startMusic(3);
    this.render();
  }

  startSkirmishMatch() {
    const state = this.save.getState();
    this.engine = new BattleEngine(this.bus, {
      mode: this.skirmishConfig.mode,
      boardSize: this.skirmishConfig.boardSize,
      targetScore: this.skirmishConfig.targetScore,
      aiTier: this.skirmishConfig.aiTier,
      heroId: state.selectedHeroId || 'hero_paladin',
      cathedralHallId: this.skirmishConfig.cathedralHallId,
      activeOaths: state.equippedOaths,
      penitenceBellId: state.equippedBell,
      upgradedCards: state.upgradedCards,
      customDeckIds: state.customDeck,
    });
    this.currentScreen = 'battle';
    if (this.scene3d) {
      this.scene3d.idleOrbitActive = false;
      this.scene3d.playBattleZoomIn?.(state.cameraPreset || 'commander_angle', 1.85);
    }
    this.sound?.startMusic(1);
    this.render();
  }

  _scheduleAITurn(stepCount = 0) {
    if (this.aiTimer) clearTimeout(this.aiTimer);
    this.aiTimer = setTimeout(() => {
      this.aiTimer = null;
      if (!this.engine || this.engine.status !== 'playing' || this.engine.activePlayer !== 'O') return;
      if (stepCount >= 5) {
        this.engine.endTurn();
        this.render();
        return;
      }
      this.engine.executeAITurnStep();
      this.render();
      // If AI played a card or had Twin Strike (2 placements) and is still the active player, continue AI turn!
      if (this.engine && this.engine.status === 'playing' && this.engine.activePlayer === 'O') {
        this._scheduleAITurn(stepCount + 1);
      }
    }, 580);
  }

  _handleMatchEnded(status) {
    if (!this.engine) return;
    if (status === 'victory') {
      this.sound?.playCathedralBell();
      const diff = this.engine.scores.X - this.engine.scores.O;
      const stars = diff >= 4 ? 3 : diff >= 2 ? 2 : 1;
      const sigilReward = 85 + stars * 35 + (this.engine.boss ? 90 : 0);

      if (this.engine.mode === 'campaign') {
        this.save.recordCampaignVictory(this.engine.levelNumber, stars, sigilReward);
      } else if (this.engine.mode === 'crypt') {
        const trial = CRYPT_TRIALS.find((t) => t.id === this.engine.cryptId);
        this.save.recordCryptVictory(this.engine.cryptId, trial?.rewardSigils || 140);
      } else {
        this.save.addReliquarySigils(70);
      }
    } else {
      this.save.recordDefeat();
    }
  }

  _handleTileHover(coord) {
    if (!this.engine || !this.scene3d) return;
    const isPlayerTurn =
      this.engine.status === 'playing' &&
      (this.engine.activePlayer === 'X' || this.engine.mode === 'local2p');

    const previewCells = [];

    // Include Seer Hint or Threat cells if active
    if (this.seerHintCoord) {
      previewCells.push({ r: this.seerHintCoord.r, c: this.seerHintCoord.c, mode: 'hint' });
    }
    if (this.showThreatScan) {
      const threats = scanEnemyThreatCells(this.engine, 'O');
      for (const t of threats) {
        previewCells.push({ r: t.r, c: t.c, mode: 'threat' });
      }
    }

    if (!coord || !isPlayerTurn) {
      this.scene3d.setHoverAndPreview(null, previewCells, this.engine.activePlayer, false);
      return;
    }

    // If a War-Scroll card is selected, highlight its blast footprint on the 3D War-Table
    if (this.engine.selectedCardIndex !== null) {
      const inst = this.engine.hands[this.engine.activePlayer][this.engine.selectedCardIndex];
      const card = inst ? getArcanaCardById(inst.cardId) : null;
      if (card) {
        const footprint = getArcanaPreviewCells(card, coord.r, coord.c, this.engine.boardSize);
        for (const [fr, fc] of footprint) {
          previewCells.push({ r: fr, c: fc, mode: 'target' });
        }
      }
      this.scene3d.setHoverAndPreview(coord, previewCells, null, false);
      return;
    }

    // Standard stone placement hover preview
    const canPlace = this.engine.canPlaceAt(coord.r, coord.c);
    if (canPlace) {
      const scoring = this.engine.previewMove(coord.r, coord.c, this.engine.activePlayer);
      for (const pat of scoring) {
        for (const [pr, pc] of pat.cells) {
          previewCells.push({ r: pr, c: pc, mode: 'score' });
        }
      }
    }
    this.scene3d.setHoverAndPreview(coord, previewCells, this.engine.activePlayer, canPlace);
  }

  handleBoardCellClick(r, c) {
    if (!this.engine || this.engine.status !== 'playing') return;
    if (this.engine.activePlayer !== 'X' && this.engine.mode !== 'local2p') return;

    const actor = this.engine.activePlayer;

    // 1. If a War-Scroll card is selected, apply target
    if (this.engine.selectedCardIndex !== null) {
      const inst = this.engine.hands[actor][this.engine.selectedCardIndex];
      const card = inst ? getArcanaCardById(inst.cardId) : null;
      if (!card) {
        this.engine.selectedCardIndex = null;
        this.engine.pendingTargets = [];
        return;
      }

      this.engine.pendingTargets.push([r, c]);
      const needed = card.targetType === 'two_occupied' ? 2 : 1;

      if (this.engine.pendingTargets.length >= needed) {
        const res = this.engine.playCard(actor, this.engine.selectedCardIndex, this.engine.pendingTargets);
        if (!res.ok) {
          // Clear card selection so the player is never trapped in card-targeting mode
          this.engine.selectedCardIndex = null;
          this.engine.pendingTargets = [];
          this.showToast(`${res.reason} (Scroll selection cancelled)`);
        }
        this.render();
      } else {
        this.showToast('Select the second Champion to transpose (or Right-Click to cancel).');
        this.render();
      }
      return;
    }

    // 2. Otherwise place a 3D sculpted War Champion on `(r, c)`
    const res = this.engine.placePiece(r, c);
    if (!res.ok) {
      this.showToast(res.reason);
    }
    this.render();
  }

  selectHandCard(index) {
    if (!this.engine || this.engine.status !== 'playing') return;
    if (!this.engine.cardsEnabled) {
      this.showToast(`🔒 War-Scrolls unlock at Level ${GAME_CONFIG.CARDS_UNLOCK_LEVEL}!`);
      return;
    }
    const actor = this.engine.activePlayer;
    if (actor !== 'X' && this.engine.mode !== 'local2p') return;

    if (this.engine.selectedCardIndex === index) {
      this.engine.selectedCardIndex = null;
      this.engine.pendingTargets = [];
      this.render();
      return;
    }

    const inst = this.engine.hands[actor][index];
    const card = inst ? getArcanaCardById(inst.cardId) : null;
    if (!card) return;

    // Prevent selecting a card that cannot be played this turn so the board never locks up
    if (this.engine.cardsPlayedThisTurn >= 1) {
      this.showToast('Only 1 War-Scroll may be invoked per turn.');
      return;
    }
    const effectiveCost = inst.paidInShop ? 0 : card.cost;
    if (this.engine.tithe[actor] < effectiveCost) {
      this.showToast(`Requires ${effectiveCost}🪙 Gold Coins to invoke ${card.name}.`);
      return;
    }

    if (card.targetType === 'none') {
      const res = this.engine.playCard(actor, index, []);
      if (!res.ok) {
        this.showToast(res.reason);
      }
      this.render();
      return;
    }

    if (!this.engine.hasValidTargetsForCard(actor, card)) {
      this.showToast(`No valid targets on the War-Table for ${card.name} right now!`);
      return;
    }

    this.engine.selectedCardIndex = index;
    this.engine.pendingTargets = [];
    this.showToast(`${card.name}: Click a valid target on the 3D War-Table (Right-Click to cancel).`);
    this.render();
  }

  cycleCameraPreset(presetId = null) {
    const state = this.save.getState();
    let nextId = presetId;
    if (!nextId) {
      const idx = CAMERA_PRESETS.findIndex((p) => p.id === state.cameraPreset);
      nextId = CAMERA_PRESETS[(idx + 1) % CAMERA_PRESETS.length].id;
    }
    this.save.equipCosmetic('cameraPreset', nextId);
    this.scene3d?.applyCameraPreset(nextId, false);
    const preset = CAMERA_PRESETS.find((p) => p.id === nextId);
    if (preset) this.showToast(`Camera: ${preset.name}`);
    this.render();
  }

  triggerDemoShatter() {
    if (!this.scene3d) return;
    this.sound?.playStoneShatter(1.5);
    this.scene3d.triggerStoneShatterEvent({
      cells: [
        { r: 2, c: 2, symbol: 'X' },
        { r: 1, c: 2, symbol: 'O' },
      ],
      weapon: 'warhammer',
      target: [2, 2],
      intensity: 1.55,
    });
    setTimeout(() => {
      if (this.currentScreen !== 'battle') {
        this._setupDemoAltar();
      }
    }, 1500);
  }

  requestSeerHint() {
    if (!this.engine || this.engine.status !== 'playing') return;
    const cost = this.engine.cardsEnabled ? 1 : 0;
    if (cost > 0 && this.engine.tithe.X < cost) {
      this.showToast('Requires 1 Gold Coin to consult the War-Oracle.');
      return;
    }
    this.engine.tithe.X -= cost;
    const best = selectBestAIMove(this.engine, 'X', 5);
    if (best) {
      this.seerHintCoord = { r: best.r, c: best.c, reason: best.reason };
      this._handleTileHover(null);
      this.showToast(`Oracle Vision: Tile [${best.r + 1}, ${best.c + 1}] (${best.reason})`);
      this.render();
    }
  }

  render() {
    if (!this.rootEl) return;

    let screenHTML = '';
    switch (this.currentScreen) {
      case 'hub':
        screenHTML = this._renderSanctumHub();
        break;
      case 'campaign':
        screenHTML = this._renderCampaignScreen();
        break;
      case 'crypt':
        screenHTML = this._renderCryptScreen();
        break;
      case 'reliquary':
        screenHTML = this._renderReliquaryScreen();
        break;
      case 'codex':
        screenHTML = this._renderCodexScreen();
        break;
      case 'skirmish':
        screenHTML = this._renderSkirmishScreen();
        break;
      case 'battle':
        screenHTML = this._renderBattleHUD();
        break;
      default:
        screenHTML = this._renderSanctumHub();
    }

    this.rootEl.innerHTML = `
      <div class="gothic-ui-frame ${this.currentScreen === 'battle' ? 'mode-battle' : 'mode-menu'}">
        <div id="gothic-toast-banner" class="gothic-toast ${this.toastMessage ? 'visible' : ''}">
          ${this.toastMessage || ''}
        </div>
        ${screenHTML}
      </div>
    `;

    this._attachDOMListeners();
  }

  _renderTopNav(activeTab) {
    const state = this.save.getState();
    const hero = getFantasyHeroById(state.selectedHeroId);
    const nextLvlNum = state.highestUnlockedLevel || 1;
    const totalStars = Object.values(state.completedLevels || {}).reduce((a, b) => a + b, 0);
    return `
      <header class="sanctum-topbar">
        <div class="brand-cluster" data-action="nav" data-screen="hub" title="XcardO Home">
          <img src="assets/logo-xcardo-nav.png" alt="XCARDO" class="brand-logo-nav" />
          <span class="sr-only">XCARDO</span>
        </div>

        <nav class="sanctum-nav-tabs" aria-label="Main Navigation">
          <button class="nav-tab-btn nav-play-cta" data-action="start-level" data-level="${nextLvlNum}" title="Start Battle Stage #${nextLvlNum}">⚔️ Play</button>
          <button class="nav-tab-btn ${activeTab === 'hub' ? 'active' : ''}" data-action="nav" data-screen="hub">🏰 Home</button>
          <button class="nav-tab-btn ${activeTab === 'campaign' ? 'active' : ''}" data-action="nav" data-screen="campaign">🗺️ Map</button>
          <button class="nav-tab-btn ${activeTab === 'reliquary' ? 'active' : ''}" data-action="nav" data-screen="reliquary">👑 Heroes</button>
          <button class="nav-tab-btn ${activeTab === 'codex' ? 'active' : ''}" data-action="nav" data-screen="codex">📜 Cards</button>
          <button class="nav-tab-btn ${activeTab === 'skirmish' || activeTab === 'crypt' ? 'active' : ''}" data-action="nav" data-screen="skirmish">🎲 Modes</button>
        </nav>

        <div class="sanctum-currencies">
          <div class="currency-pill" title="${hero.name}">
            <span>👑</span>
            <span>${hero.shortName.split(' ').pop()}</span>
          </div>
          <div class="currency-pill" title="Stars">
            <span>★</span>
            <span>${totalStars}</span>
          </div>
          <div class="currency-pill" title="Sigils">
            ${renderGothicIconSVG('sigil')}
            <span>${state.reliquarySigils}</span>
          </div>
          <button class="icon-btn" data-action="cycle-camera" title="Switch 3D Camera (C)">
            ${renderGothicIconSVG('camera')}
          </button>
        </div>
      </header>
    `;
  }

  _renderSanctumHub() {
    const state = this.save.getState();
    const nextLvlNum = state.highestUnlockedLevel || 1;
    const nextLevel = getLevelByNumber(nextLvlNum);
    const currentAct =
      CATHEDRAL_ACTS.find((a) => a.id === nextLevel.actId) || CATHEDRAL_ACTS[0];
    const currentBoss =
      INQUISITOR_BOSSES.find((b) => b.id === currentAct.bossId) || INQUISITOR_BOSSES[0];
    const hero = getFantasyHeroById(state.selectedHeroId);
    const shortActTitle = currentAct.name.replace(/^Chapter [IVX]+:\s*/i, '');

    return `
      ${this._renderTopNav('hub')}
      <main class="hub-comfort-layout hub-visual-max">
        <!-- TOP-CENTER FLOATING NANO BANANA MASTER LOGO CREST & VISUAL STORY TRIGGER -->
        <section class="hub-logo-centerpiece">
          <div class="master-logo-crest-frame">
            <img src="assets/logo-xcardo-crest.png" alt="XcardO Master Crest" class="master-logo-crest-img" />
          </div>
          <div class="chapter-visual-ribbon">
            <span class="ribbon-chapter-tag" style="--act-color:${currentAct.themeColor}">
              CHAPTER ${currentAct.roman} • ${shortActTitle.toUpperCase()}
            </span>
            <button class="ribbon-story-btn" data-action="toggle-story-modal" title="View Chapter Storyboard">
              📖 Story
            </button>
          </div>
        </section>

        <!-- BOTTOM DOCK: PURE VISUAL DUEL & 3-BUTTON ACTION DECK (MINIMAL TEXT, MAX ART) -->
        <section class="hub-bottom-visual-dock">
          <!-- LEFT: YOUR CHAMPION VISUAL MEDALLION + 6-AVATAR SWITCHER -->
          <div class="gothic-card-panel story-chronicle-card visual-hero-card">
            <div class="visual-duel-row">
              <div class="visual-portrait-big hero-frame" style="--char-color:${hero.color}">
                ${renderFantasyHeroPortraitSVG(hero.id, hero.color)}
              </div>
              <div class="visual-char-info">
                <span class="visual-role-pill" style="color:${hero.accent}">YOUR CHAMPION</span>
                <h2 class="visual-char-name">${hero.shortName}</h2>
                <span class="visual-passive-chip">${hero.shortPassive || '☀️ +1 Start Gold'}</span>
              </div>
            </div>

            <div class="visual-avatar-strip" aria-label="Switch Champion">
              ${FANTASY_HEROES.map(
                (h) => `
                  <button class="visual-avatar-btn ${h.id === hero.id ? 'active' : ''}" data-action="select-hero" data-hero="${h.id}" title="${h.name} — ${h.shortPassive || h.passiveDesc}" style="--char-color:${h.color}">
                    ${renderFantasyHeroPortraitSVG(h.id, h.color)}
                  </button>
                `
              ).join('')}
            </div>
          </div>

          <!-- CENTER: ICONIC PLAY STAGE BUTTON & 3 QUICK TILES -->
          <div class="hub-center-action-pod">
            <div class="stage-visual-chips">
              <span class="stage-chip">STAGE #${nextLevel.level}</span>
              <span class="stage-chip">${nextLevel.boardSize}×${nextLevel.boardSize}</span>
              <span class="stage-chip ${nextLevel.cardsEnabled ? 'chip-shop' : 'chip-pure'}">
                ${nextLevel.cardsEnabled ? '🏪 Shop Open' : '🌱 Pure Board'}
              </span>
            </div>

            <button class="btn-gothic-primary btn-play-monumental" data-action="start-level" data-level="${nextLevel.level}">
              ${renderGothicIconSVG('sword')}
              <span>PLAY STAGE #${nextLevel.level}</span>
            </button>

            <div class="hub-mini-tiles-row">
              <button class="mini-visual-tile" data-action="nav" data-screen="campaign">
                <span>🗺️</span>
                <small>Map</small>
              </button>
              <button class="mini-visual-tile" data-action="nav" data-screen="skirmish">
                <span>🎲</span>
                <small>Modes</small>
              </button>
              <button class="mini-visual-tile" data-action="nav" data-screen="reliquary">
                <span>👑</span>
                <small>Forge</small>
              </button>
              <button class="mini-visual-tile" data-action="demo-shatter" title="Test 3D Stone Shatter">
                <span>✨</span>
                <small>Shatter</small>
              </button>
            </div>
          </div>

          <!-- RIGHT: RIVAL WARLORD VISUAL MEDALLION -->
          <div class="gothic-card-panel hub-journey-card visual-boss-card">
            <div class="visual-duel-row boss-duel-row">
              <div class="visual-char-info boss-char-info">
                <span class="visual-role-pill enemy-pill">CHAPTER RIVAL</span>
                <h2 class="visual-char-name">${currentBoss.name}</h2>
                <span class="visual-passive-chip enemy-chip">⚔️ ${nextLevel.name}</span>
              </div>
              <div class="visual-portrait-big boss-frame" style="--char-color:${currentBoss.color}">
                ${renderBossCrestSVG(currentBoss.id, currentBoss.color)}
              </div>
            </div>
            <div class="boss-progress-dots" title="Chapter Progress">
              ${Array.from({ length: 6 }, (_, i) => {
                const stg = (currentAct.id - 1) * 6 + i + 1;
                const done = Boolean(state.completedLevels && state.completedLevels[stg]);
                const curr = stg === nextLevel.level;
                return `<span class="chapter-dot ${done ? 'done' : ''} ${curr ? 'current' : ''}"></span>`;
              }).join('')}
            </div>
          </div>
        </section>

        ${
          this.showStoryModal
            ? `
              <div class="story-modal-backdrop" data-action="toggle-story-modal">
                <div class="story-storyboard-modal gothic-card-panel" onclick="event.stopPropagation()">
                  <div class="storyboard-header">
                    <span class="gothic-eyebrow">📖 VISUAL STORY CHRONICLE • CHAPTER ${currentAct.roman}</span>
                    <button class="icon-btn" data-action="toggle-story-modal">✕</button>
                  </div>
                  <div class="storyboard-cards-grid">
                    <div class="storyboard-card">
                      <div class="storyboard-art">${renderRoseWindowSVG(88)}</div>
                      <h4>I. ${shortActTitle}</h4>
                      <p>${currentAct.storySummary}</p>
                    </div>
                    <div class="storyboard-card">
                      <div class="storyboard-art" style="--char-color:${hero.color}">${renderFantasyHeroPortraitSVG(hero.id, hero.color)}</div>
                      <h4>II. ${hero.shortName}'s Counsel</h4>
                      <p>"${hero.storyCounsel}"</p>
                    </div>
                    <div class="storyboard-card">
                      <div class="storyboard-art" style="--char-color:${currentBoss.color}">${renderBossCrestSVG(currentBoss.id, currentBoss.color)}</div>
                      <h4>III. Rival: ${currentBoss.name}</h4>
                      <p>🎯 ${currentAct.storyGoal}</p>
                    </div>
                  </div>
                </div>
              </div>
            `
            : ''
        }
      </main>
    `;
  }

  _renderCampaignScreen() {
    const state = this.save.getState();
    const hero = getFantasyHeroById(state.selectedHeroId);
    const act = CATHEDRAL_ACTS.find((a) => a.id === this.selectedActId) || CATHEDRAL_ACTS[0];
    const boss = INQUISITOR_BOSSES.find((b) => b.id === act.bossId) || INQUISITOR_BOSSES[0];
    const actLevels = CATHEDRAL_LEVELS.filter((l) => l.actId === act.id);

    return `
      ${this._renderTopNav('campaign')}
      <section class="modal-screen-container gothic-card-panel">
        <div class="screen-header-row">
          <div>
            <div class="gothic-eyebrow">36-LEVEL STORY CAMPAIGN • THE CHRONICLE OF THE STAR-STONES</div>
            <h2>Story Chapters & Strongholds</h2>
            <p class="screen-sub-note">
              <strong>🌱 Levels 1–2:</strong> Relaxed Tactical Warmup (No Cards / No Shop) •
              <strong>🏪 Level 3+:</strong> 3-Slot In-Battle War-Scroll Shop & Gold Economy Unlocked!
            </p>
          </div>
          <div class="act-selector-tabs">
            ${CATHEDRAL_ACTS.map(
              (a) => `
                <button class="act-tab ${a.id === act.id ? 'active' : ''}" data-action="select-act" data-act="${a.id}">
                  <span>CHAPTER ${a.roman}</span>
                  <small>${a.name}</small>
                </button>
              `
            ).join('')}
          </div>
        </div>

        <div class="act-story-showcase">
          <div class="act-story-narrative-box">
            <div class="gothic-eyebrow">📖 CHAPTER ${act.roman}: ${act.name.toUpperCase()} — ${act.subtitle.toUpperCase()}</div>
            <h3>The Story So Far</h3>
            <p class="act-story-paragraph">${act.storySummary || act.lore}</p>
            <div class="act-story-goal">
              <span>🎯 <strong>Mission Objective:</strong> ${act.storyGoal || 'Triumph across all 6 stages to reclaim the Chapter Star-Stone.'}</span>
            </div>
            <div class="act-hero-companion-note">
              <span>👑 <strong>${hero.shortName}:</strong> "${hero.storyCounsel}"</span>
            </div>
          </div>

          <div class="act-boss-banner">
            <div class="act-boss-crest">${renderBossCrestSVG(boss.id, boss.color)}</div>
            <div class="act-boss-info">
              <div class="gothic-eyebrow">RIVAL CHAPTER COMMANDER</div>
              <h3>${boss.name} — <span>${boss.title}</span></h3>
              <p class="act-boss-quote">${boss.quote}</p>
              <div class="act-boss-passive"><strong>Commander Trait:</strong> ${boss.passiveDesc}</div>
            </div>
          </div>
        </div>

        <div class="campaign-nodes-grid">
          ${actLevels
            .map((lvl) => {
              const unlocked = lvl.level <= (state.highestUnlockedLevel || 1);
              const stars = (state.completedLevels && state.completedLevels[lvl.level]) || 0;
              return `
                <div class="campaign-node-card ${unlocked ? 'unlocked' : 'locked'} ${
                lvl.isBossLevel ? 'boss-node' : ''
              }">
                  <div class="node-top">
                    <span class="node-num">STAGE #${lvl.level} ${lvl.isBossLevel ? '• CHAPTER FINALE' : ''}</span>
                    <span class="node-stars">${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}</span>
                  </div>
                  <h4>${lvl.name}</h4>
                  <p class="node-lore">"${lvl.lore}"</p>
                  <div class="node-rule-tag ${lvl.cardsEnabled ? 'shop-open' : 'pure-tactical'}">
                    ${
                      !lvl.cardsEnabled
                        ? '🌱 Warmup Stage (No Cards / No Shop)'
                        : lvl.cardUnlock
                        ? `🔓 New Scroll in Shop: ${lvl.cardUnlock}`
                        : '🏪 3-Slot Scroll Shop Active'
                    }
                  </div>
                  <div class="node-specs">
                    <span>${lvl.boardSize}×${lvl.boardSize} Board</span>
                    <span>Target ${lvl.targetScore} VP</span>
                    <span>Tier ${lvl.aiTier}</span>
                  </div>
                  <button class="btn-gothic-primary" ${
                    unlocked ? '' : 'disabled'
                  } data-action="start-level" data-level="${lvl.level}">
                    ${unlocked ? (lvl.isBossLevel ? '⚔️ Challenge Commander' : 'Play Stage') : 'Locked'}
                  </button>
                </div>
              `;
            })
            .join('')}
        </div>
      </section>
    `;
  }

  _renderCryptScreen() {
    const state = this.save.getState();
    return `
      ${this._renderTopNav('crypt')}
      <section class="modal-screen-container gothic-card-panel">
        <div class="gothic-eyebrow">1-TURN LETHAL WAR-TABLE PUZZLES</div>
        <h2>The 5 Chaos Trials of the Undercroft</h2>
        <p class="screen-desc">Reach the target Victory Points in a single decisive turn using War-Scrolls and Sacred Geometry alignments.</p>

        <div class="crypt-trials-grid">
          ${CRYPT_TRIALS.map((trial) => {
            const cleared = Boolean(state.completedCrypts && state.completedCrypts[trial.id]);
            return `
              <div class="crypt-trial-card ${cleared ? 'cleared' : ''}">
                <div class="crypt-header">
                  <span>${trial.name}</span>
                  <span>+${trial.rewardSigils} Sigils</span>
                </div>
                <p>${trial.subtitle}</p>
                <div class="crypt-hint-box">💡 Hint: ${trial.hint}</div>
                <div class="node-specs">
                  <span>${trial.boardSize}×${trial.boardSize} Grid</span>
                  <span>Target ${trial.targetScore} VP</span>
                </div>
                <button class="btn-gothic-primary" data-action="start-crypt" data-crypt="${trial.id}">
                  ${cleared ? 'Re-Conquer Trial' : 'Enter Trial'}
                </button>
              </div>
            `;
          }).join('')}
        </div>
      </section>
    `;
  }

  _renderReliquaryScreen() {
    const state = this.save.getState();
    return `
      ${this._renderTopNav('reliquary')}
      <section class="modal-screen-container gothic-card-panel">
        <div class="gothic-eyebrow">RELIQUARY ATELIER • CHAMPIONS & 3D WAR-FORGE</div>
        <h2>Playable Fantasy War Heroes, 3D Miniatures & Relics</h2>

        <h3 class="reliquary-section-title">1. Choose Your Playable Fantasy War Hero (6 Champions)</h3>
        <div class="heroes-roster-grid">
          ${FANTASY_HEROES.map((hero) => {
            const selected = state.selectedHeroId === hero.id;
            return `
              <div class="reliquary-item-card hero-roster-card ${selected ? 'equipped' : ''}">
                <div class="hero-roster-top">
                  <div class="hero-roster-portrait" style="--char-color:${hero.color}">
                    ${renderFantasyHeroPortraitSVG(hero.id, hero.color)}
                  </div>
                  <div>
                    <span class="char-class-badge" style="color:${hero.accent}">${hero.classTitle}</span>
                    <h4>${hero.name}</h4>
                    <div class="char-title-sub">${hero.title} · <em>${hero.weapon}</em></div>
                  </div>
                </div>
                <p class="hero-lore-text">${hero.lore}</p>
                <div class="char-passive-box"><strong>Hero Passive:</strong> ${hero.passiveDesc}</div>
                <button class="btn-gothic-secondary" data-action="select-hero" data-hero="${hero.id}">
                  ${selected ? '✓ Active War Champion' : 'Select War Champion'}
                </button>
              </div>
            `;
          }).join('')}
        </div>

        <h3 class="reliquary-section-title">2. 3D Sculpted War Miniatures</h3>
        <div class="reliquary-grid">
          ${SCULPTED_PIECES.player
            .map((sculpt) => {
              const unlocked = state.unlockedSculpts.includes(sculpt.id);
              const equipped = state.equippedPlayerSculpt === sculpt.id;
              return `
                <div class="reliquary-item-card ${equipped ? 'equipped' : ''}">
                  <h4>${sculpt.name}</h4>
                  <p>${sculpt.desc}</p>
                  <button class="btn-gothic-secondary" data-action="select-sculpt" data-faction="player" data-id="${sculpt.id}" data-cost="${sculpt.cost}">
                    ${equipped ? 'Equipped on 3D Board' : unlocked ? 'Equip Miniature' : `Forge (${sculpt.cost} Sigils)`}
                  </button>
                </div>
              `;
            })
            .join('')}
        </div>

        <h3 class="reliquary-section-title">3. Sacred War Relics (Equip Up to 2 Passives)</h3>
        <div class="reliquary-grid">
          ${BLOOD_OATHS.map((oath) => {
            const unlocked = state.unlockedOaths.includes(oath.id);
            const equipped = state.equippedOaths.includes(oath.id);
            return `
              <div class="reliquary-item-card ${equipped ? 'equipped' : ''}">
                <h4>${oath.name}</h4>
                <p>${oath.desc}</p>
                <button class="btn-gothic-secondary" data-action="toggle-oath" data-id="${oath.id}" data-cost="${oath.cost}">
                  ${equipped ? 'Active Relic (Unequip)' : unlocked ? 'Equip Relic' : `Claim (${oath.cost} Sigils)`}
                </button>
              </div>
            `;
          }).join('')}
        </div>

        <h3 class="reliquary-section-title">4. 3D Armor & Stone Materials</h3>
        <div class="reliquary-grid">
          ${STONE_MATERIALS.map((mat) => {
            const unlocked = state.unlockedMaterials.includes(mat.id);
            const equipped = state.equippedPlayerMaterial === mat.id;
            return `
              <div class="reliquary-item-card ${equipped ? 'equipped' : ''}">
                <div class="mat-swatch" style="background:#${mat.color.toString(16).padStart(6, '0')}"></div>
                <h4>${mat.name}</h4>
                <button class="btn-gothic-secondary" data-action="select-material" data-id="${mat.id}" data-cost="${mat.cost}">
                  ${equipped ? 'Equipped Material' : unlocked ? 'Apply Material' : `Acquire (${mat.cost} Sigils)`}
                </button>
              </div>
            `;
          }).join('')}
        </div>
      </section>
    `;
  }

  _renderCodexScreen() {
    const state = this.save.getState();
    return `
      ${this._renderTopNav('codex')}
      <section class="modal-screen-container gothic-card-panel">
        <div class="gothic-eyebrow">20 WAR-SCROLLS & SACRED ALIGNMENT BLUEPRINTS</div>
        <h2>Grimoire of the War-Table (Shop Unlocks at Campaign Level 3)</h2>

        <div class="codex-geometries-strip">
          ${SACRED_GEOMETRY_SHAPES.map(
            (shape) => `
              <div class="geometry-mini-card">
                ${renderGeometryBlueprintSVG(shape.variants[0], shape.color)}
                <div>
                  <strong>${shape.name}</strong>
                  <span>+${shape.points} VP (${shape.tier.toUpperCase()})</span>
                </div>
              </div>
            `
          ).join('')}
        </div>

        <div class="codex-cards-grid">
          ${ARCANA_CARDS.map((card) => {
            const exalted = state.upgradedCards.includes(card.id);
            return `
              <div class="codex-tarot-card ${exalted ? 'exalted' : ''}">
                <div class="codex-tarot-top">
                  <span class="tarot-num">${card.numeral} · Lvl ${card.unlockLevel || 3}+</span>
                  <span class="tarot-cost">🪙 ${card.cost} Gold</span>
                </div>
                <div class="codex-tarot-art">${renderTarotArtSVG(card)}</div>
                <h4>${card.name} ${exalted ? '<span class="exalt-badge">[+]</span>' : ''}</h4>
                <p>${exalted ? card.exaltedDesc : card.desc}</p>
                <button class="btn-gothic-small" ${exalted ? 'disabled' : ''} data-action="exalt-card" data-card="${card.id}">
                  ${exalted ? 'Exalted [+]' : 'Exalt Scroll (150 Sigils)'}
                </button>
              </div>
            `;
          }).join('')}
        </div>
      </section>
    `;
  }

  _renderSkirmishScreen() {
    const state = this.save.getState();
    return `
      ${this._renderTopNav('skirmish')}
      <section class="modal-screen-container gothic-card-panel skirmish-panel">
        <div class="screen-header-row">
          <div>
            <div class="gothic-eyebrow">RELAXED FREE PLAY & TACTICAL PUZZLES</div>
            <h2>Custom 3D War-Table Duel & 1-Turn Trials</h2>
          </div>
          <div class="act-selector-tabs">
            <button class="act-tab active" data-action="nav" data-screen="skirmish">
              <span>🎲 Custom Free Play</span>
              <small>AI or 2-Player Local</small>
            </button>
            <button class="act-tab" data-action="nav" data-screen="crypt">
              <span>🧩 5 Puzzle Trials</span>
              <small>1-Turn Brainteasers</small>
            </button>
          </div>
        </div>

        <div class="skirmish-options-grid">
          <div class="skirmish-field">
            <label>Battle Mode</label>
            <div class="pill-group">
              <button class="cam-pill ${this.skirmishConfig.mode === 'skirmish' ? 'active' : ''}" data-action="skirmish-set" data-key="mode" data-val="skirmish">Single-Player Warlord AI</button>
              <button class="cam-pill ${this.skirmishConfig.mode === 'local2p' ? 'active' : ''}" data-action="skirmish-set" data-key="mode" data-val="local2p">Local 2-Player War-Table</button>
            </div>
          </div>

          <div class="skirmish-field">
            <label>War-Table Grid Dimensions</label>
            <div class="pill-group">
              ${[4, 5, 6, 7]
                .map(
                  (sz) => `
                    <button class="cam-pill ${this.skirmishConfig.boardSize === sz ? 'active' : ''}" data-action="skirmish-set" data-key="boardSize" data-val="${sz}">
                      ${sz}×${sz} Grid
                    </button>
                  `
                )
                .join('')}
            </div>
          </div>

          <div class="skirmish-field">
            <label>Enemy Warlord AI Tier</label>
            <div class="pill-group">
              ${[
                [1, '1: Friendly Scout'],
                [2, '2: Lich Scholar'],
                [3, '3: Siege Captain'],
                [4, '4: Pyromancer'],
                [5, '5: Crimson Duchess'],
                [6, '6: Grand War-God'],
              ]
                .map(
                  ([tier, label]) => `
                    <button class="cam-pill ${this.skirmishConfig.aiTier === tier ? 'active' : ''}" data-action="skirmish-set" data-key="aiTier" data-val="${tier}">
                      ${label}
                    </button>
                  `
                )
                .join('')}
            </div>
          </div>

          <div class="skirmish-field">
            <label>3D Sanctuary Hall & Lighting</label>
            <div class="pill-group">
              ${CATHEDRAL_HALLS.map(
                (h) => `
                  <button class="cam-pill ${this.skirmishConfig.cathedralHallId === h.id ? 'active' : ''}" data-action="skirmish-set" data-key="cathedralHallId" data-val="${h.id}">
                    ${h.name}
                  </button>
                `
              ).join('')}
            </div>
          </div>
        </div>

        <div class="skirmish-launch-row">
          <button class="btn-gothic-primary" data-action="launch-skirmish">
            ${renderGothicIconSVG('sword')} Start Custom 3D Match
          </button>
          <button class="btn-gothic-secondary" data-action="nav" data-screen="crypt">
            🧩 Play 1-Turn Puzzle Trials (${Object.keys(state.completedCrypts || {}).length}/5 Solved)
          </button>
        </div>
      </section>
    `;
  }

  _renderBattleHUD() {
    if (!this.engine) return '';
    const snap = this.engine.getSnapshot();
    const state = this.save.getState();
    const hero = snap.hero || getFantasyHeroById(state.selectedHeroId);
    const boss = snap.boss || INQUISITOR_BOSSES[0];
    const xPct = Math.min(100, Math.round((snap.scores.X / snap.targetScore) * 100));
    const oPct = Math.min(100, Math.round((snap.scores.O / snap.targetScore) * 100));
    const bellReady = !snap.bellUsedThisMatch.X && snap.bellCharge.X >= 100;

    return `
      <header class="battle-hud-topbar">
        <!-- PLAYER FANTASY WAR HERO WING -->
        <div class="hud-wing player-wing ${snap.activePlayer === 'X' ? 'active-turn' : ''}">
          <div class="hud-commander-row">
            <div class="hud-commander-avatar player-avatar" style="--char-color:${hero.color}">
              ${renderFantasyHeroPortraitSVG(hero.id, hero.color)}
            </div>
            <div class="hud-commander-details">
              <div class="wing-faction-tag">${hero.name.toUpperCase()} (${hero.classTitle})</div>
              <div class="wing-score-row">
                <span class="score-big">${snap.scores.X}</span>
                <span class="score-target">/ ${snap.targetScore} VP</span>
              </div>
              <div class="gothic-progress-track">
                <div class="gothic-progress-fill player-fill" style="width:${xPct}%"></div>
              </div>
              <div class="wing-sub-row">
                <span class="tithe-readout">
                  ${
                    snap.cardsEnabled
                      ? `🪙 Gold Coins: <strong>${snap.tithe.X}</strong>/${GAME_CONFIG.MAX_BLOOD_TITHE}`
                      : `🌱 Warmup Stage: <strong>Shop Unlocks Lvl 3</strong>`
                  }
                </span>
                <span class="placements-readout">Moves: <strong>${snap.placementsRemaining}</strong></span>
              </div>
            </div>
          </div>
        </div>

        <!-- CENTER BATTLE MEDALLION -->
        <div class="hud-center-medallion">
          <div class="turn-pill ${snap.activePlayer === 'X' ? 'turn-x' : 'turn-o'}">
            ${snap.activePlayer === 'X' ? `${hero.shortName.toUpperCase()}'S TURN` : `${boss.name.split(' ')[0].toUpperCase()} MOVING`} • TURN ${snap.turnNumber}
          </div>
          <div class="battle-sub-title">
            ${
              snap.mode === 'campaign'
                ? `${snap.levelData?.chapterName || 'Story Stage'} • Level #${snap.levelNumber}: ${
                    snap.levelData?.name || 'War-Table Clash'
                  }`
                : `${boss.name} (${boss.title})`
            }
          </div>
          <div class="hud-utility-strip">
            ${
              this.engine.selectedCardIndex !== null
                ? `<button class="hud-tool-btn active" data-action="cancel-card" title="Cancel Selected War-Scroll (Esc / Right-Click)">✕ Cancel Scroll</button>`
                : ''
            }
            <button class="hud-tool-btn" data-action="cycle-camera" title="Switch 3D Camera Angle (C)">
              ${renderGothicIconSVG('camera')} <span>Camera</span>
            </button>
            <button class="hud-tool-btn" data-action="seer-hint" title="Ask Companion for Best Move Hint">
              ${renderGothicIconSVG('eye')} <span>Hint</span>
            </button>
            <button class="hud-tool-btn ${this.showThreatScan ? 'active' : ''}" data-action="toggle-threat" title="Highlight Enemy Scoring Threats">
              <span>Threats</span>
            </button>
            <button class="hud-tool-btn ${this.showMiniTacticalGrid ? 'active' : ''}" data-action="toggle-minigrid" title="Toggle 2D Tactical Grid Overlay">
              <span>2D View</span>
            </button>
            <button class="hud-tool-btn" ${snap.canUndo ? '' : 'disabled'} data-action="undo-move" title="Undo Last Action">
              ${renderGothicIconSVG('undo')}
            </button>
            <button class="hud-tool-btn" data-action="nav" data-screen="hub" title="Return to Sanctuary Menu">
              <span>Menu</span>
            </button>
          </div>
        </div>

        <!-- ENEMY WARLORD COMMANDER WING -->
        <div class="hud-wing enemy-wing ${snap.activePlayer === 'O' ? 'active-turn' : ''}">
          <div class="hud-commander-row enemy-commander-row">
            <div class="hud-commander-details enemy-details">
              <div class="wing-faction-tag">${boss.name.toUpperCase()} (${boss.classTitle || 'COMMANDER'})</div>
              <div class="wing-score-row">
                <span class="score-big">${snap.scores.O}</span>
                <span class="score-target">/ ${snap.targetScore} VP</span>
              </div>
              <div class="gothic-progress-track">
                <div class="gothic-progress-fill enemy-fill" style="width:${oPct}%"></div>
              </div>
              <div class="wing-sub-row">
                <span>${snap.cardsEnabled ? `🪙 Enemy Gold: <strong>${snap.tithe.O}</strong>` : `⚔️ Board Tactics AI`}</span>
                <span>Shattered: <strong>${snap.stonesShatteredThisMatch}</strong></span>
              </div>
            </div>
            <div class="hud-commander-avatar enemy-avatar" style="--char-color:${boss.color}">
              ${renderBossCrestSVG(boss.id, boss.color)}
            </div>
          </div>
        </div>
      </header>

      <!-- RIGHT SIDE WIDGETS: 2D MATRIX, HERO STORY COUNSEL, CHEST ODDS & CHRONICLE -->
      <aside class="battle-side-widgets">
        ${
          this.showMiniTacticalGrid
            ? `
              <div class="mini-tactical-grid-panel gothic-card-panel">
                <div class="gothic-eyebrow">2D BOARD VIEW</div>
                <div class="mini-grid-board" style="grid-template-columns: repeat(${snap.boardSize}, 1fr)">
                  ${snap.board
                    .map((row) =>
                      row
                        .map(
                          (cell) => `
                            <button class="mini-grid-cell ${cell.symbol ? `sym-${cell.symbol}` : ''} ${
                            cell.obstacle ? 'has-obstacle' : ''
                          }" data-action="board-cell" data-r="${cell.r}" data-c="${cell.c}">
                              ${
                                cell.symbol ||
                                (cell.obstacle === 'reliquary_coffer'
                                  ? '📦'
                                  : cell.anomaly === 'cursed_censer'
                                  ? `💣${cell.bombTimer || ''}`
                                  : cell.obstacle
                                  ? '■'
                                  : '·')
                              }
                            </button>
                          `
                        )
                        .join('')
                    )
                    .join('')}
                </div>
              </div>
            `
            : ''
        }

        <div class="chronicle-feed-panel war-counsel-box">
          <div class="gothic-eyebrow">👑 ${hero.shortName.toUpperCase()}'S STORY COUNSEL</div>
          ${
            snap.levelData?.lore
              ? `<p class="war-story-whisper">"${snap.levelData.lore}"</p>`
              : ''
          }
          <p class="war-counsel-text">
            💡 ${snap.levelData?.tip || hero.storyCounsel || 'Hold the center tiles and build intersecting lines to score rapidly.'}
          </p>
        </div>

        <div class="chronicle-feed-panel chest-odds-panel">
          <div class="gothic-eyebrow">📦 MYSTERY CHEST REWARDS</div>
          <div class="chest-odds-badges">
            ${V1_BOX_ODDS.map(
              (o) => `<span class="odds-chip" title="${o.label}">${o.icon} ${o.pct}%</span>`
            ).join('')}
          </div>
        </div>

        <div class="chronicle-feed-panel">
          <div class="gothic-eyebrow">BATTLE LOG</div>
          <ul class="chronicle-list">
            ${snap.battleChronicle
              .slice(0, 4)
              .map((entry) => `<li class="chron-${entry.type}">[T${entry.turn}] ${entry.text}</li>`)
              .join('')}
          </ul>
        </div>
      </aside>

      <!-- BOTTOM DOCK: V1 LEVEL 1-2 SEALED BANNER OR LEVEL 3+ 3-SLOT SHOP & HAND -->
      <footer class="battle-hud-bottom">
        <div class="penitence-bell-dock">
          <button class="bell-ultimate-btn ${bellReady ? 'ready' : ''}" ${
      bellReady ? '' : 'disabled'
    } data-action="toll-bell">
            ${renderGothicIconSVG('bell')}
            <div>
              <div class="bell-label">WAR-HORN ULTIMATE</div>
              <div class="bell-pct">${
                snap.bellUsedThisMatch.X ? 'UNLEASHED' : `${Math.floor(snap.bellCharge.X)}%`
              }</div>
            </div>
          </button>
        </div>

        ${
          !snap.cardsEnabled
            ? `
              <div class="v1-sealed-scrolls-banner gothic-card-panel">
                <div class="sealed-icon">🌱</div>
                <div class="sealed-copy">
                  <div class="gothic-eyebrow">RELAXED WARMUP STAGE • LEVELS 1 & 2</div>
                  <h4>WAR-SCROLL SHOP & CARDS UNLOCK AT LEVEL 3</h4>
                  <p>Enjoy pure board strategy first! Place your Champions to align 3 in a row. Complete Stage 2 to open the Ancient Scroll Vault & 3-Slot Shop!</p>
                </div>
              </div>
            `
            : `
              <!-- V1 3-SLOT IN-BATTLE WAR-SCROLL SHOP + PLAYER HAND -->
              <div class="v1-battle-cards-zone">
                <div class="v1-shop-strip gothic-card-panel">
                  <div class="v1-shop-header">
                    <div>
                      <span class="shop-title">🏪 WAR-SCROLL SHOP</span>
                      <span class="shop-sub">Buy with 🪙 Gold • Bought Scrolls Cast FREE</span>
                    </div>
                    <button class="btn-shop-reroll" data-action="reroll-shop" ${
                      snap.tithe.X >= snap.shopRerollCost ? '' : 'disabled'
                    }>
                      🔄 Reroll (${snap.shopRerollCost}🪙)
                    </button>
                  </div>
                  <div class="v1-shop-slots">
                    ${(snap.shop || [])
                      .map((slot, sIdx) => {
                        if (!slot || !slot.card) {
                          return `<div class="v1-shop-slot sold-out"><span>EMPTY</span></div>`;
                        }
                        const c = slot.card;
                        const price = slot.price ?? c.cost;
                        const canBuy =
                          snap.tithe.X >= price &&
                          snap.hands.X.length < GAME_CONFIG.MAX_HAND_SIZE;
                        return `
                          <div class="v1-shop-slot ${slot.locked ? 'locked' : ''}">
                            <div class="shop-slot-top">
                              <span class="shop-slot-price">🪙 ${price}</span>
                              <button class="shop-lock-btn" data-action="lock-shop-slot" data-slot="${sIdx}" title="Lock/Unlock Slot">
                                ${slot.locked ? '🔒' : '🔓'}
                              </button>
                            </div>
                            <div class="shop-slot-name">${c.name}</div>
                            <div class="shop-slot-desc">${c.desc}</div>
                            <button class="btn-shop-buy" ${
                              canBuy ? '' : 'disabled'
                            } data-action="buy-shop-card" data-slot="${sIdx}">
                              BUY (${price}🪙)
                            </button>
                          </div>
                        `;
                      })
                      .join('')}
                  </div>
                </div>

                <div class="dark-tarot-hand" role="list" aria-label="War-Scroll Hand">
                  ${
                    snap.hands.X.length === 0
                      ? `<div class="empty-hand-hint">Hand Empty — Buy War-Scrolls from the Shop (Left) or Claim 📦 Mystery Chests!</div>`
                      : snap.hands.X.map((inst, idx) => {
                          const card = inst.card;
                          if (!card) return '';
                          const selected = this.engine.selectedCardIndex === idx;
                          const effectiveCost = inst.paidInShop ? 0 : card.cost;
                          const affordable =
                            snap.tithe.X >= effectiveCost && snap.cardsPlayedThisTurn < 1;
                          return `
                            <div class="tarot-hand-card ${selected ? 'selected' : ''} ${
                            affordable ? 'affordable' : 'unaffordable'
                          }" data-action="select-card" data-index="${idx}">
                              <div class="tarot-card-header">
                                <span class="tarot-roman">${card.numeral}</span>
                                <span class="tarot-cost-gem">${
                                  inst.paidInShop ? 'FREE' : `${card.cost}🪙`
                                }</span>
                              </div>
                              <div class="tarot-card-illustration">
                                ${renderTarotArtSVG(card)}
                              </div>
                              <div class="tarot-card-title">${card.name}${inst.exalted ? ' [+]' : ''}</div>
                              <div class="tarot-card-desc">${inst.exalted ? card.exaltedDesc : card.desc}</div>
                            </div>
                          `;
                        }).join('')
                  }
                </div>
              </div>
            `
        }

        <div class="camera-quick-dock">
          <div class="dock-caption">3D CAMERA VIEW</div>
          <div class="dock-cam-buttons">
            ${CAMERA_PRESETS.map(
              (p) => `
                <button class="dock-cam-btn ${state.cameraPreset === p.id ? 'active' : ''}" data-action="set-camera" data-cam="${p.id}">
                  ${p.name.split(' ')[0]}
                </button>
              `
            ).join('')}
          </div>
        </div>
      </footer>

      ${snap.status !== 'playing' ? this._renderEndgameOverlay(snap) : ''}
    `;
  }

  _renderEndgameOverlay(snap) {
    const isWin = snap.status === 'victory';
    const unlockedLvl3 = isWin && snap.mode === 'campaign' && snap.levelNumber === 2;
    const state = this.save.getState();
    const hero = snap.hero || getFantasyHeroById(state.selectedHeroId);
    const nextStage =
      isWin && snap.mode === 'campaign' && snap.levelNumber < 36
        ? getLevelByNumber(snap.levelNumber + 1)
        : null;

    return `
      <div class="endgame-modal-backdrop">
        <div class="endgame-modal-card gothic-card-panel">
          <div class="gothic-eyebrow">${isWin ? '📖 STORY CHRONICLE ADVANCED' : '⚔️ THE WAR-TABLE AWAITS YOUR RETURN'}</div>
          <h2>${isWin ? 'VICTORY ON THE STAR-ALTAR' : 'REGROUP & TRY AGAIN'}</h2>
          <p class="endgame-score-summary">
            Final Score: <strong>${hero.shortName} ${snap.scores.X} VP</strong> — <strong>Commander ${snap.scores.O} VP</strong>
            <br/>Stones Shattered: <strong>${snap.stonesShatteredThisMatch}</strong>
            ${
              unlockedLvl3
                ? `<br/><span class="unlock-callout">🔓 STORY MILESTONE UNLOCKED: The Ancient Scroll Vault is open! Level 3+ features Gold Coins and the 3-Slot War-Scroll Shop!</span>`
                : ''
            }
          </p>
          ${
            nextStage
              ? `
                <div class="endgame-story-next">
                  <div class="gothic-eyebrow">NEXT IN THE CHRONICLE • STAGE #${nextStage.level}: ${nextStage.name.toUpperCase()}</div>
                  <p>"${nextStage.lore}"</p>
                </div>
              `
              : ''
          }
          <div class="endgame-actions">
            ${
              nextStage
                ? `<button class="btn-gothic-primary" data-action="start-level" data-level="${nextStage.level}">Continue Story (Level #${nextStage.level})</button>`
                : ''
            }
            <button class="btn-gothic-secondary" data-action="rematch">Play Stage Again</button>
            <button class="btn-gothic-ghost" data-action="nav" data-screen="hub">Return to Sanctuary Menu</button>
          </div>
        </div>
      </div>
    `;
  }

  _attachDOMListeners() {
    if (!this.rootEl || typeof this.rootEl.querySelectorAll !== 'function') return;

    const actionEls = this.rootEl.querySelectorAll('[data-action]');
    actionEls.forEach((el) => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = el.getAttribute('data-action');

        switch (action) {
          case 'nav':
            this.navigate(el.getAttribute('data-screen'));
            break;
          case 'start-level':
            this.startCampaignLevel(Number(el.getAttribute('data-level') || 1));
            break;
          case 'start-crypt':
            this.startCryptTrial(el.getAttribute('data-crypt'));
            break;
          case 'select-act':
            this.selectedActId = Number(el.getAttribute('data-act') || 1);
            this.render();
            break;
          case 'toggle-story-modal':
            this.showStoryModal = !this.showStoryModal;
            this.sound?.playUIHover();
            this.render();
            break;
          case 'select-hero': {
            const heroId = el.getAttribute('data-hero');
            const hero = getFantasyHeroById(heroId);
            this.save.selectHero(hero.id);
            this.save.equipCosmetic('equippedPlayerSculpt', hero.defaultSculpt);
            this.save.equipCosmetic('equippedPlayerMaterial', hero.defaultMaterial);
            this.sound?.playStoneSlam('X');
            this.showToast(`⚔️ Champion Selected: ${hero.name} (${hero.classTitle})`);
            if (this.currentScreen === 'hub') {
              this._setupDemoAltar();
            }
            this.render();
            break;
          }
          case 'buy-shop-card': {
            if (!this.engine) break;
            const slotIdx = Number(el.getAttribute('data-slot'));
            const res = this.engine.buyShopCard(slotIdx, 'X');
            if (!res.ok) {
              this.showToast(res.reason);
            } else {
              this.sound?.playSacredChord('minor');
              this.showToast(`Bought ${res.card.name} — Cast from Hand for FREE!`);
            }
            this.render();
            break;
          }
          case 'reroll-shop': {
            if (!this.engine) break;
            const res = this.engine.rerollShop('X');
            if (!res.ok) {
              this.showToast(res.reason);
            } else {
              this.sound?.playUIHover();
              this.showToast('War-Scroll Shop Refreshed!');
            }
            this.render();
            break;
          }
          case 'lock-shop-slot': {
            if (!this.engine) break;
            const slotIdx = Number(el.getAttribute('data-slot'));
            this.engine.toggleShopLock(slotIdx);
            this.render();
            break;
          }
          case 'set-camera':
            this.cycleCameraPreset(el.getAttribute('data-cam'));
            break;
          case 'cycle-camera':
            this.cycleCameraPreset();
            break;
          case 'demo-shatter':
            this.triggerDemoShatter();
            break;
          case 'select-card':
            this.selectHandCard(Number(el.getAttribute('data-index')));
            break;
          case 'cancel-card':
            if (this.engine) {
              this.engine.selectedCardIndex = null;
              this.engine.pendingTargets = [];
              this.showToast('War-Scroll selection cancelled.');
              this.render();
            }
            break;
          case 'board-cell':
            this.handleBoardCellClick(
              Number(el.getAttribute('data-r')),
              Number(el.getAttribute('data-c'))
            );
            break;
          case 'toll-bell': {
            const res = this.engine?.activatePenitenceBell('X');
            if (res && !res.ok) this.showToast(res.reason);
            this.render();
            break;
          }
          case 'seer-hint':
            this.requestSeerHint();
            break;
          case 'toggle-threat':
            this.showThreatScan = !this.showThreatScan;
            this._handleTileHover(null);
            this.render();
            break;
          case 'toggle-minigrid':
            this.showMiniTacticalGrid = !this.showMiniTacticalGrid;
            this.render();
            break;
          case 'undo-move':
            if (this.engine) {
              if (this.aiTimer) {
                clearTimeout(this.aiTimer);
                this.aiTimer = null;
              }
              const res = this.engine.undoLastAction();
              if (!res.ok) this.showToast(res.reason);
              this.render();
            }
            break;
          case 'rematch':
            if (this.engine) {
              if (this.aiTimer) {
                clearTimeout(this.aiTimer);
                this.aiTimer = null;
              }
              this.engine.resetMatch();
              this.render();
            }
            break;
          case 'select-sculpt': {
            const id = el.getAttribute('data-id');
            const faction = el.getAttribute('data-faction');
            const cost = Number(el.getAttribute('data-cost') || 0);
            const state = this.save.getState();
            if (!state.unlockedSculpts.includes(id)) {
              const res = this.save.unlockCosmetic('unlockedSculpts', id, cost);
              if (!res.ok) {
                this.showToast(res.reason);
                return;
              }
            }
            this.save.equipCosmetic(
              faction === 'player' ? 'equippedPlayerSculpt' : 'equippedEnemySculpt',
              id
            );
            this._setupDemoAltar();
            this.render();
            break;
          }
          case 'select-material': {
            const id = el.getAttribute('data-id');
            const cost = Number(el.getAttribute('data-cost') || 0);
            const state = this.save.getState();
            if (!state.unlockedMaterials.includes(id)) {
              const res = this.save.unlockCosmetic('unlockedMaterials', id, cost);
              if (!res.ok) {
                this.showToast(res.reason);
                return;
              }
            }
            this.save.equipCosmetic('equippedPlayerMaterial', id);
            this._setupDemoAltar();
            this.render();
            break;
          }
          case 'toggle-oath': {
            const id = el.getAttribute('data-id');
            const cost = Number(el.getAttribute('data-cost') || 0);
            const state = this.save.getState();
            if (!state.unlockedOaths.includes(id)) {
              const res = this.save.unlockCosmetic('unlockedOaths', id, cost);
              if (!res.ok) {
                this.showToast(res.reason);
                return;
              }
            }
            this.save.toggleEquippedOath(id);
            this.render();
            break;
          }
          case 'exalt-card': {
            const cardId = el.getAttribute('data-card');
            const res = this.save.exaltArcanaCard(cardId, 150);
            if (!res.ok) this.showToast(res.reason);
            else this.showToast('War-Scroll Exalted to [+] Mastery!');
            this.render();
            break;
          }
          case 'skirmish-set': {
            const key = el.getAttribute('data-key');
            const val = el.getAttribute('data-val');
            this.skirmishConfig[key] =
              key === 'boardSize' || key === 'aiTier' ? Number(val) : val;
            if (key === 'cathedralHallId') {
              this.scene3d?.rebuildAltar(this.skirmishConfig.boardSize, val, null);
            }
            this.render();
            break;
          }
          case 'launch-skirmish':
            this.startSkirmishMatch();
            break;
          case 'hub-preview-sculpt': {
            const id = el.getAttribute('data-id');
            this.save.equipCosmetic('equippedPlayerSculpt', id);
            this.sound?.playStoneSlam('X');
            this._setupDemoAltar();
            this.render();
            break;
          }
          case 'hub-preview-material': {
            const id = el.getAttribute('data-id');
            this.save.equipCosmetic('equippedPlayerMaterial', id);
            this.sound?.playStoneSlam('X');
            this._setupDemoAltar();
            this.render();
            break;
          }
          case 'hub-preview-hall': {
            const id = el.getAttribute('data-id');
            this.save.equipCosmetic('equippedHall', id);
            this.sound?.playUIHover();
            this._setupDemoAltar();
            this.render();
            break;
          }
        }
      });
    });
  }
}
