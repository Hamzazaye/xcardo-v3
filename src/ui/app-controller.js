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

    this.scene3d.rebuildAltar(5, state.equippedHall || 'obsidian_nave', currentBoss);
    this.scene3d.placePieceImmediate(2, 2, 'X', 0);
    this.scene3d.placePieceImmediate(1, 2, 'O', 0);
    this.scene3d.placePieceImmediate(2, 1, 'O', 0);
    this.scene3d.placePieceImmediate(3, 3, 'X', 0);
    this.scene3d.placePieceImmediate(1, 3, 'W', 0);
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
    this.currentScreen = screen;
    this.sound?.playUIHover();
    if (screen !== 'battle') {
      this.engine = null;
      this._setupDemoAltar();
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
    this.sound?.startMusic(1);
    this.render();
  }

  _scheduleAITurn() {
    if (this.aiTimer) clearTimeout(this.aiTimer);
    this.aiTimer = setTimeout(() => {
      if (!this.engine || this.engine.status !== 'playing' || this.engine.activePlayer !== 'O') return;
      const stepRes = this.engine.executeAITurnStep();
      this.render();
      if (
        stepRes &&
        stepRes.action === 'card' &&
        this.engine.status === 'playing' &&
        this.engine.activePlayer === 'O'
      ) {
        this._scheduleAITurn();
      }
    }, 620);
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
      if (!card) return;

      this.engine.pendingTargets.push([r, c]);
      const needed = card.targetType === 'two_occupied' ? 2 : 1;

      if (this.engine.pendingTargets.length >= needed) {
        const res = this.engine.playCard(actor, this.engine.selectedCardIndex, this.engine.pendingTargets);
        if (!res.ok) {
          this.showToast(res.reason);
          this.engine.pendingTargets = [];
        }
        this.render();
      } else {
        this.showToast('Select the second Champion to transpose.');
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

    if (card.targetType === 'none') {
      const res = this.engine.playCard(actor, index, []);
      if (!res.ok) {
        this.showToast(res.reason);
      }
      this.render();
      return;
    }

    this.engine.selectedCardIndex = index;
    this.engine.pendingTargets = [];
    this.showToast(`${card.name}: Click a valid target on the 3D War-Table.`);
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
    return `
      <header class="sanctum-topbar">
        <div class="brand-cluster" data-action="nav" data-screen="hub">
          <div class="brand-rose-mini">${renderRoseWindowSVG(38)}</div>
          <div>
            <div class="brand-title">XCARDO</div>
            <div class="brand-subtitle">WARLORDS OF THE OBSIDIAN ALTAR</div>
          </div>
        </div>

        <nav class="sanctum-nav-tabs" aria-label="War-Table Navigation">
          <button class="nav-tab-btn ${activeTab === 'hub' ? 'active' : ''}" data-action="nav" data-screen="hub">War-Table</button>
          <button class="nav-tab-btn ${activeTab === 'campaign' ? 'active' : ''}" data-action="nav" data-screen="campaign">36-Level Campaign</button>
          <button class="nav-tab-btn ${activeTab === 'skirmish' ? 'active' : ''}" data-action="nav" data-screen="skirmish">3D Skirmish</button>
          <button class="nav-tab-btn ${activeTab === 'crypt' ? 'active' : ''}" data-action="nav" data-screen="crypt">Chaos Trials</button>
          <button class="nav-tab-btn ${activeTab === 'reliquary' ? 'active' : ''}" data-action="nav" data-screen="reliquary">Heroes & Forge</button>
          <button class="nav-tab-btn ${activeTab === 'codex' ? 'active' : ''}" data-action="nav" data-screen="codex">War-Scrolls</button>
        </nav>

        <div class="sanctum-currencies">
          <div class="currency-pill" title="Active Fantasy War Hero">
            <span>⚔️</span>
            <span>${hero.shortName}</span>
          </div>
          <div class="currency-pill" title="War Sigils">
            ${renderGothicIconSVG('sigil')}
            <span>${state.reliquarySigils} Sigils</span>
          </div>
          <button class="icon-btn" data-action="cycle-camera" title="Switch 3D Camera Angle (Key: C)">
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
    const totalStars = Object.values(state.completedLevels || {}).reduce((a, b) => a + b, 0);

    return `
      ${this._renderTopNav('hub')}
      <main class="hub-main-grid">
        <!-- LEFT WING: CHOSEN FANTASY WAR HERO & 6-HERO QUICK ROSTER -->
        <section class="hub-left-column">
          <div class="gothic-card-panel hero-confrontation-card player-hero-card">
            <div class="gothic-eyebrow">YOUR CHOSEN FANTASY WAR HERO</div>
            <div class="character-showcase-row">
              <div class="character-portrait-frame hero-frame" style="--char-color:${hero.color}">
                ${renderFantasyHeroPortraitSVG(hero.id, hero.color)}
              </div>
              <div class="character-meta">
                <span class="char-class-badge" style="color:${hero.accent}">${hero.classTitle}</span>
                <h2 class="char-name">${hero.name}</h2>
                <div class="char-title-sub">${hero.title} · <em>${hero.weapon}</em></div>
                <div class="char-passive-box">
                  <strong>Hero Passive:</strong> ${hero.passiveDesc}
                </div>
              </div>
            </div>
            <blockquote class="char-battle-cry">${hero.battleCry}</blockquote>

            <div class="hero-quick-roster-label">SELECT FANTASY WAR CHAMPION (6 HEROES):</div>
            <div class="hero-quick-roster-strip">
              ${FANTASY_HEROES.map(
                (h) => `
                  <button class="hero-mini-Roster-btn ${h.id === hero.id ? 'active' : ''}" data-action="select-hero" data-hero="${h.id}" title="${h.name} (${h.classTitle}) — ${h.passiveDesc}">
                    <div class="hero-mini-avatar">${renderFantasyHeroPortraitSVG(h.id, h.color)}</div>
                    <span>${h.shortName}</span>
                  </button>
                `
              ).join('')}
            </div>
          </div>

          <div class="gothic-card-panel hub-campaign-spotlight">
            <div class="act-badge" style="border-color:${currentAct.themeColor}">
              ACT ${currentAct.roman} • ${currentAct.name.toUpperCase()}
            </div>
            <h3 class="hub-spotlight-title">Level #${nextLevel.level}: ${nextLevel.name}</h3>
            <p class="hub-lore-quote">${nextLevel.lore}</p>

            <div class="v1-rule-callout ${nextLevel.cardsEnabled ? 'cards-live' : 'cards-sealed'}">
              ${
                nextLevel.cardsEnabled
                  ? `<span>🏪 <strong>Level 3+ Rules Active:</strong> 3-Slot In-Battle War-Scroll Shop & Gold Economy Unlocked!</span>`
                  : `<span>🔒 <strong>v1 Pure Tactical Warmup (Levels 1–2):</strong> No Cards & No Shop until Level 3!</span>`
              }
            </div>

            <div class="hub-meta-grid">
              <div class="meta-stat">
                <span class="meta-label">War-Table Grid</span>
                <span class="meta-val">${nextLevel.boardSize}×${nextLevel.boardSize} Stones</span>
              </div>
              <div class="meta-stat">
                <span class="meta-label">Victory Target</span>
                <span class="meta-val">${nextLevel.targetScore} VP</span>
              </div>
              <div class="meta-stat">
                <span class="meta-label">Campaign Stars</span>
                <span class="meta-val">${totalStars} / 108 ★</span>
              </div>
              <div class="meta-stat">
                <span class="meta-label">Stones Shattered</span>
                <span class="meta-val">${state.totalStonesShattered || 0}</span>
              </div>
            </div>

            <div class="hub-cta-stack">
              <button class="btn-gothic-primary" data-action="start-level" data-level="${nextLevel.level}">
                ${renderGothicIconSVG('sword')}
                <span>Enter Battle (Level #${nextLevel.level})</span>
              </button>
              <button class="btn-gothic-secondary" data-action="nav" data-screen="campaign">
                <span>36-Level War Map</span>
              </button>
            </div>
          </div>
        </section>

        <!-- CENTER MEDALLION: GRAND WAR-TABLE ROSE & COMMAND MODES -->
        <section class="hub-center-medallion">
          <div class="rose-halo-wrapper">
            ${renderRoseWindowSVG(142)}
            <div class="medallion-caption">3D FANTASY WAR-TABLE • DRAG TO ORBIT • CLICK TO SHATTER</div>
          </div>

          <div class="hub-command-deck gothic-card-panel">
            <div class="gothic-eyebrow">WAR-TABLE COMMAND DECK</div>
            <div class="command-deck-grid">
              <button class="command-card-btn primary-cmd" data-action="start-level" data-level="${nextLevel.level}">
                <span class="cmd-icon">⚔️</span>
                <div>
                  <strong>Campaign Lvl #${nextLevel.level}</strong>
                  <small>${nextLevel.cardsEnabled ? '3-Slot Shop Active' : 'Pure Tactical (No Cards)'}</small>
                </div>
              </button>
              <button class="command-card-btn" data-action="nav" data-screen="skirmish">
                <span class="cmd-icon">🛡️</span>
                <div>
                  <strong>3D Skirmish Duel</strong>
                  <small>Custom AI or 2P Local</small>
                </div>
              </button>
              <button class="command-card-btn" data-action="nav" data-screen="crypt">
                <span class="cmd-icon">💀</span>
                <div>
                  <strong>5 Chaos Trials</strong>
                  <small>1-Turn Lethal Puzzles</small>
                </div>
              </button>
              <button class="command-card-btn" data-action="nav" data-screen="reliquary">
                <span class="cmd-icon">👑</span>
                <div>
                  <strong>6 War Heroes</strong>
                  <small>Portraits & 3D Minis</small>
                </div>
              </button>
            </div>
          </div>
        </section>

        <!-- RIGHT WING: ENEMY WARLORD COMMANDER & LIVE 3D CUSTOMIZER -->
        <section class="hub-right-column">
          <div class="gothic-card-panel hero-confrontation-card enemy-boss-card">
            <div class="gothic-eyebrow">OPPOSING ACT WARLORD COMMANDER</div>
            <div class="character-showcase-row">
              <div class="character-portrait-frame boss-frame" style="--char-color:${currentBoss.color}">
                ${renderBossCrestSVG(currentBoss.id, currentBoss.color)}
              </div>
              <div class="character-meta">
                <span class="char-class-badge enemy-badge">${currentBoss.classTitle || currentBoss.title}</span>
                <h2 class="char-name">${currentBoss.name}</h2>
                <div class="char-title-sub">Act ${currentAct.roman} Commander · AI Tier ${nextLevel.aiTier}</div>
                <div class="char-passive-box enemy-passive">
                  <strong>Warlord Decree:</strong> ${currentBoss.passiveDesc}
                </div>
              </div>
            </div>
            <blockquote class="char-battle-cry enemy-cry">${currentBoss.quote}</blockquote>
          </div>

          <div class="gothic-card-panel hub-3d-showcase-card">
            <div class="gothic-eyebrow">LIVE 3D MINIATURE & WAR-TABLE INSPECTOR</div>

            <div class="hub-customizer-group">
              <span class="customizer-label">3D Champion Miniature</span>
              <div class="pill-group">
                ${SCULPTED_PIECES.player
                  .map(
                    (s) => `
                      <button class="cam-pill ${state.equippedPlayerSculpt === s.id ? 'active' : ''}" data-action="hub-preview-sculpt" data-id="${s.id}">
                        ${s.name.split(' ')[0]}
                      </button>
                    `
                  )
                  .join('')}
              </div>
            </div>

            <div class="hub-customizer-group">
              <span class="customizer-label">Armor & Stone Material</span>
              <div class="pill-group">
                ${STONE_MATERIALS.slice(0, 4)
                  .map(
                    (m) => `
                      <button class="cam-pill ${state.equippedPlayerMaterial === m.id ? 'active' : ''}" data-action="hub-preview-material" data-id="${m.id}">
                        ${m.name.split(' ')[0]}
                      </button>
                    `
                  )
                  .join('')}
              </div>
            </div>

            <div class="hub-customizer-group">
              <span class="customizer-label">3D Camera Perspective</span>
              <div class="camera-pill-row">
                ${CAMERA_PRESETS.map(
                  (p) => `
                    <button class="cam-pill ${state.cameraPreset === p.id ? 'active' : ''}" data-action="set-camera" data-cam="${p.id}">
                      ${p.name.split(' ')[0]}
                    </button>
                  `
                ).join('')}
              </div>
            </div>

            <div class="hub-card-actions-row">
              <button class="btn-gothic-ghost" data-action="demo-shatter">
                ${renderGothicIconSVG('shatter')}
                <span>Test 3D Stone Shatter</span>
              </button>
              <button class="btn-gothic-ghost" data-action="nav" data-screen="codex">
                <span>20 War-Scrolls</span>
              </button>
            </div>
          </div>
        </section>
      </main>
    `;
  }

  _renderCampaignScreen() {
    const state = this.save.getState();
    const act = CATHEDRAL_ACTS.find((a) => a.id === this.selectedActId) || CATHEDRAL_ACTS[0];
    const boss = INQUISITOR_BOSSES.find((b) => b.id === act.bossId) || INQUISITOR_BOSSES[0];
    const actLevels = CATHEDRAL_LEVELS.filter((l) => l.actId === act.id);

    return `
      ${this._renderTopNav('campaign')}
      <section class="modal-screen-container gothic-card-panel">
        <div class="screen-header-row">
          <div>
            <div class="gothic-eyebrow">36-LEVEL WAR CAMPAIGN • V1 PROGRESSION RULES</div>
            <h2>Cathedral Acts & Warlord Strongholds</h2>
            <p class="screen-sub-note">
              <strong>Levels 1–2:</strong> Pure Tactical Combat (No Cards / No Shop) •
              <strong>Level 3+:</strong> 3-Slot In-Battle War-Scroll Shop & Gold Economy Unlocked!
            </p>
          </div>
          <div class="act-selector-tabs">
            ${CATHEDRAL_ACTS.map(
              (a) => `
                <button class="act-tab ${a.id === act.id ? 'active' : ''}" data-action="select-act" data-act="${a.id}">
                  <span>ACT ${a.roman}</span>
                  <small>${a.name}</small>
                </button>
              `
            ).join('')}
          </div>
        </div>

        <div class="act-boss-banner">
          <div class="act-boss-crest">${renderBossCrestSVG(boss.id, boss.color)}</div>
          <div class="act-boss-info">
            <div class="gothic-eyebrow">ACT ${act.roman} WARLORD COMMANDER • ${act.subtitle.toUpperCase()}</div>
            <h3>${boss.name} — <span>${boss.title}</span></h3>
            <p class="act-boss-quote">${boss.quote}</p>
            <div class="act-boss-passive"><strong>Warlord Decree:</strong> ${boss.passiveDesc}</div>
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
                    <span class="node-num">LEVEL #${lvl.level}</span>
                    <span class="node-stars">${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}</span>
                  </div>
                  <h4>${lvl.name}</h4>
                  <p class="node-lore">${lvl.lore}</p>
                  <div class="node-rule-tag ${lvl.cardsEnabled ? 'shop-open' : 'pure-tactical'}">
                    ${
                      !lvl.cardsEnabled
                        ? '🔒 Pure Tactical (No Cards / Shop)'
                        : lvl.cardUnlock
                        ? `🔓 Unlocks: ${lvl.cardUnlock}`
                        : '🏪 3-Slot War-Scroll Shop Active'
                    }
                  </div>
                  <div class="node-specs">
                    <span>${lvl.boardSize}×${lvl.boardSize} Grid</span>
                    <span>Target ${lvl.targetScore} VP</span>
                    <span>AI Tier ${lvl.aiTier}</span>
                  </div>
                  <button class="btn-gothic-primary" ${
                    unlocked ? '' : 'disabled'
                  } data-action="start-level" data-level="${lvl.level}">
                    ${unlocked ? (lvl.isBossLevel ? '⚔️ Challenge Warlord' : 'Enter Battle') : 'Sealed'}
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
    return `
      ${this._renderTopNav('skirmish')}
      <section class="modal-screen-container gothic-card-panel skirmish-panel">
        <div class="gothic-eyebrow">CUSTOM 3D WAR-TABLE DUEL</div>
        <h2>Configure Single-Player Warlord AI or Local 2-Player Battle</h2>

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
                [1, '1: Vanguard Scout'],
                [2, '2: Lich Acolyte'],
                [3, '3: Siege Captain'],
                [4, '4: Pyromancer'],
                [5, '5: Blood Countess'],
                [6, '6: Abyssal War-God'],
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
            <label>3D War-Hall & Lighting</label>
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
            ${renderGothicIconSVG('sword')} Launch 3D Skirmish Battle
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
                      : `🔒 Shop & Gold: <strong>Unlocks Lvl 3</strong>`
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
            ${snap.activePlayer === 'X' ? `${hero.shortName.toUpperCase()}'S TURN` : `${boss.name.split(' ')[0].toUpperCase()} ATTACKING`} • TURN ${snap.turnNumber}
          </div>
          <div class="battle-sub-title">
            ${
              snap.mode === 'campaign'
                ? `Level #${snap.levelNumber}: ${snap.levelData?.name || 'War-Table Clash'} ${
                    !snap.cardsEnabled ? '• [PURE TACTICAL — NO CARDS]' : ''
                  }`
                : `${boss.name} (${boss.title})`
            }
          </div>
          <div class="hud-utility-strip">
            <button class="hud-tool-btn" data-action="cycle-camera" title="Switch 3D Camera Angle (C)">
              ${renderGothicIconSVG('camera')} <span>Camera</span>
            </button>
            <button class="hud-tool-btn" data-action="seer-hint" title="War-Oracle Best Move Hint">
              ${renderGothicIconSVG('eye')} <span>Oracle</span>
            </button>
            <button class="hud-tool-btn ${this.showThreatScan ? 'active' : ''}" data-action="toggle-threat" title="Highlight Enemy Scoring Threats">
              <span>Threats</span>
            </button>
            <button class="hud-tool-btn ${this.showMiniTacticalGrid ? 'active' : ''}" data-action="toggle-minigrid" title="Toggle 2D Tactical Grid Overlay">
              <span>2D Grid</span>
            </button>
            <button class="hud-tool-btn" ${snap.canUndo ? '' : 'disabled'} data-action="undo-move" title="Rewind Last Action">
              ${renderGothicIconSVG('undo')}
            </button>
            <button class="hud-tool-btn" data-action="nav" data-screen="hub" title="Retreat to War-Table Hub">
              <span>Exit</span>
            </button>
          </div>
        </div>

        <!-- ENEMY WARLORD COMMANDER WING -->
        <div class="hud-wing enemy-wing ${snap.activePlayer === 'O' ? 'active-turn' : ''}">
          <div class="hud-commander-row enemy-commander-row">
            <div class="hud-commander-details enemy-details">
              <div class="wing-faction-tag">${boss.name.toUpperCase()} (${boss.classTitle || 'WARLORD'})</div>
              <div class="wing-score-row">
                <span class="score-big">${snap.scores.O}</span>
                <span class="score-target">/ ${snap.targetScore} VP</span>
              </div>
              <div class="gothic-progress-track">
                <div class="gothic-progress-fill enemy-fill" style="width:${oPct}%"></div>
              </div>
              <div class="wing-sub-row">
                <span>${snap.cardsEnabled ? `🪙 Enemy Gold: <strong>${snap.tithe.O}</strong>` : `⚔️ Pure Tactical AI`}</span>
                <span>Shattered: <strong>${snap.stonesShatteredThisMatch}</strong></span>
              </div>
            </div>
            <div class="hud-commander-avatar enemy-avatar" style="--char-color:${boss.color}">
              ${renderBossCrestSVG(boss.id, boss.color)}
            </div>
          </div>
        </div>
      </header>

      <!-- RIGHT SIDE WIDGETS: 2D MATRIX, WAR-COUNSEL TIP, CHEST ODDS & CHRONICLE -->
      <aside class="battle-side-widgets">
        ${
          this.showMiniTacticalGrid
            ? `
              <div class="mini-tactical-grid-panel gothic-card-panel">
                <div class="gothic-eyebrow">TACTICAL WAR-TABLE MATRIX</div>
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

        ${
          snap.levelData?.tip
            ? `
              <div class="chronicle-feed-panel war-counsel-box">
                <div class="gothic-eyebrow">💡 WAR-COUNSEL TACTICAL TIP</div>
                <p class="war-counsel-text">${snap.levelData.tip}</p>
              </div>
            `
            : ''
        }

        <div class="chronicle-feed-panel chest-odds-panel">
          <div class="gothic-eyebrow">📦 MYSTERY WAR-CHEST ODDS</div>
          <div class="chest-odds-badges">
            ${V1_BOX_ODDS.map(
              (o) => `<span class="odds-chip" title="${o.label}">${o.icon} ${o.pct}%</span>`
            ).join('')}
          </div>
        </div>

        <div class="chronicle-feed-panel">
          <div class="gothic-eyebrow">WAR CHRONICLE</div>
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
              <div class="bell-label">WAR-HORN CATACLYSM</div>
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
                <div class="sealed-icon">🔒</div>
                <div class="sealed-copy">
                  <div class="gothic-eyebrow">V1 CAMPAIGN RULES • LEVELS 1 & 2 WARMUP</div>
                  <h4>WAR-SCROLL SHOP & CARDS UNLOCK AT LEVEL 3</h4>
                  <p>Master pure tactical alignments and obstacle positioning first. Complete Level 2 to unlock Gold Coins and the 3-Slot In-Battle War-Scroll Shop!</p>
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
                      ? `<div class="empty-hand-hint">Hand Empty — Buy War-Scrolls from the Shop (Left) or Crack 📦 Mystery Chests!</div>`
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
          <div class="dock-caption">3D CAMERA PRESET</div>
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
    return `
      <div class="endgame-modal-backdrop">
        <div class="endgame-modal-card gothic-card-panel">
          <div class="gothic-eyebrow">${isWin ? 'WAR-TABLE CONQUERED' : 'OVERRUN BY ENEMY WARLORD'}</div>
          <h2>${isWin ? 'VICTORY ON THE ALTAR' : 'DEFEAT IN BATTLE'}</h2>
          <p class="endgame-score-summary">
            Final Alignment: <strong>Champion ${snap.scores.X} VP</strong> — <strong>Warlord ${snap.scores.O} VP</strong>
            <br/>Stones Shattered This Duel: <strong>${snap.stonesShatteredThisMatch}</strong>
            ${
              unlockedLvl3
                ? `<br/><span class="unlock-callout">🔓 LEVEL 3 UNLOCKED: 3-Slot War-Scroll Shop & Gold Coin Economy Now Available!</span>`
                : ''
            }
          </p>
          <div class="endgame-actions">
            ${
              isWin && snap.mode === 'campaign' && snap.levelNumber < 36
                ? `<button class="btn-gothic-primary" data-action="start-level" data-level="${snap.levelNumber + 1}">Next Battle (Level #${snap.levelNumber + 1})</button>`
                : ''
            }
            <button class="btn-gothic-secondary" data-action="rematch">Rematch War-Table</button>
            <button class="btn-gothic-ghost" data-action="nav" data-screen="hub">Return to War-Table Hub</button>
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
              const res = this.engine.undoLastAction();
              if (!res.ok) this.showToast(res.reason);
              this.render();
            }
            break;
          case 'rematch':
            if (this.engine) {
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
