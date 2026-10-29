/**
 * XcardO III: Obsidian Sanctum
 * Master Application Controller, 3D Battle HUD, Reliquary 3D Atelier & Single-Player Campaign
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
  getArcanaCardById,
  getArcanaPreviewCells,
  getLevelByNumber,
} from '../data/gothic-config.js';
import { BattleEngine } from '../engine/game-state.js';
import { selectBestAIMove, scanEnemyThreatCells } from '../engine/ai-brain.js';
import { SACRED_GEOMETRY_SHAPES } from '../engine/pattern-detector.js';
import {
  renderTarotArtSVG,
  renderBossCrestSVG,
  renderGothicIconSVG,
  renderGeometryBlueprintSVG,
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
    this.scene3d.rebuildAltar(5, state.equippedHall || 'obsidian_nave', null);
    this.scene3d.placePieceImmediate(2, 2, 'X', 0);
    this.scene3d.placePieceImmediate(1, 2, 'O', 0);
    this.scene3d.placePieceImmediate(2, 1, 'O', 0);
    this.scene3d.placePieceImmediate(3, 3, 'X', 0);
    this.scene3d.placePieceImmediate(1, 3, 'W', 0);
  }

  _bindEvents() {
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
      this.showToast(`${bell.name} Tolled Across the Sanctum!`);
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
      cathedralHallId: level?.hallId || state.equippedHall,
      activeOaths: state.equippedOaths,
      penitenceBellId: state.equippedBell,
      upgradedCards: state.upgradedCards,
      customDeckIds: state.customDeck,
    });
    this.currentScreen = 'battle';
    this.sound?.startMusic(levelNumber % 13);
    this.render();
  }

  startCryptTrial(cryptId) {
    const state = this.save.getState();
    this.engine = new BattleEngine(this.bus, {
      mode: 'crypt',
      cryptId,
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

    // If a Dark-Tarot card is selected, highlight its blast footprint on the 3D Altar
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

    // 1. If a Dark-Tarot card is selected, apply target
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
        this.showToast('Select the second consecrated stone to transpose.');
        this.render();
      }
      return;
    }

    // 2. Otherwise place a 3D sculpted stone piece on `(r, c)`
    const res = this.engine.placePiece(r, c);
    if (!res.ok) {
      this.showToast(res.reason);
    }
    this.render();
  }

  selectHandCard(index) {
    if (!this.engine || this.engine.status !== 'playing') return;
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
    this.showToast(`${card.name}: Click a valid target on the 3D Altar.`);
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
    if (this.engine.tithe.X < 1) {
      this.showToast('Requires 1 Blood Tithe to consult the Seer Oracle.');
      return;
    }
    this.engine.tithe.X -= 1;
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
    return `
      <header class="sanctum-topbar">
        <div class="brand-cluster" data-action="nav" data-screen="hub">
          <img src="XCardO.png" alt="XcardO III Crest" class="brand-crest-img" />
          <div>
            <div class="brand-title">XCARDO III</div>
            <div class="brand-subtitle">OBSIDIAN SANCTUM • 3D GOTHIC EDITION</div>
          </div>
        </div>

        <nav class="sanctum-nav-tabs">
          <button class="nav-tab-btn ${activeTab === 'hub' ? 'active' : ''}" data-action="nav" data-screen="hub">Sanctum</button>
          <button class="nav-tab-btn ${activeTab === 'campaign' ? 'active' : ''}" data-action="nav" data-screen="campaign">Cathedral Acts (36)</button>
          <button class="nav-tab-btn ${activeTab === 'crypt' ? 'active' : ''}" data-action="nav" data-screen="crypt">Crypt Trials</button>
          <button class="nav-tab-btn ${activeTab === 'reliquary' ? 'active' : ''}" data-action="nav" data-screen="reliquary">3D Reliquary</button>
          <button class="nav-tab-btn ${activeTab === 'codex' ? 'active' : ''}" data-action="nav" data-screen="codex">Dark-Tarot Codex</button>
          <button class="nav-tab-btn ${activeTab === 'skirmish' ? 'active' : ''}" data-action="nav" data-screen="skirmish">3D Skirmish</button>
        </nav>

        <div class="sanctum-currency-bar">
          <span class="sigil-pill" title="Reliquary Sigils">
            ${renderGothicIconSVG('crown')} <strong>${state.reliquarySigils}</strong> Sigils
          </span>
          <span class="shatter-pill" title="Total 3D Stones Shattered">
            ${renderGothicIconSVG('shatter')} <strong>${state.totalStonesShattered}</strong> Shattered
          </span>
        </div>
      </header>
    `;
  }

  _renderSanctumHub() {
    const state = this.save.getState();
    const curLevel = getLevelByNumber(state.highestUnlockedLevel);

    return `
      ${this._renderTopNav('hub')}
      <main class="hub-split-layout">
        <section class="hub-hero-panel gothic-card-panel">
          <div class="gothic-eyebrow">INTERACTIVE 3D WEBGL TABLETOP & DARK-TAROT DUEL</div>
          <h1 class="gothic-hero-title">CONSECRATE THE ALTAR.<br/>SHATTER HERETICAL STONE.</h1>
          <p class="gothic-hero-desc">
            Command sculpted 3D marble and obsidian relics across a candlelit Cathedral Altar.
            Align Sacred Gothic Geometry, invoke 20 Dark-Tarot Arcana cards, and watch enemy formations
            detonate with real-time rigid-body stone shatter physics against a 6-tier Single-Player Inquisitor AI.
          </p>

          <div class="hub-cta-row">
            <button class="btn-gothic-primary" data-action="start-level" data-level="${state.highestUnlockedLevel}">
              ${renderGothicIconSVG('sword')}
              <span>Enter Sanctum Vow #${state.highestUnlockedLevel}: ${curLevel?.name || 'Nave'}</span>
            </button>
            <button class="btn-gothic-secondary" data-action="nav" data-screen="skirmish">
              Instant 3D AI Duel
            </button>
            <button class="btn-gothic-ghost" data-action="demo-shatter">
              ${renderGothicIconSVG('shatter')} Test 3D Stone Shatter
            </button>
          </div>

          <div class="hub-feature-strip">
            <div class="feature-badge">
              <strong>6 Sculpted 3D Relics</strong>
              <span>Seraph Cross, Templar Helm, Gargoyle, Iron Torus, Ossuary Skull & Obelisk</span>
            </div>
            <div class="feature-badge">
              <strong>Rigid-Body Shatter Physics</strong>
              <span>30+ polyhedral stone shards per blast with altar restitution & Warhammers</span>
            </div>
            <div class="feature-badge">
              <strong>6-Tier Inquisitor AI</strong>
              <span>Single-player bosses with live 3D head tracking & tactical Tarot counters</span>
            </div>
          </div>
        </section>

        <aside class="hub-Viewport-Callout">
          <div class="viewport-controls-floating">
            <div class="viewport-hint-tag">LIVE 3D ALTAR PREVIEW — Drag to Orbit • Scroll to Zoom</div>
            <div class="camera-preset-pills">
              ${CAMERA_PRESETS.map(
                (p) => `
                  <button class="cam-pill ${state.cameraPreset === p.id ? 'active' : ''}" data-action="set-camera" data-cam="${p.id}">
                    ${p.name}
                  </button>
                `
              ).join('')}
            </div>
          </div>
        </aside>
      </main>
    `;
  }

  _renderCampaignScreen() {
    const state = this.save.getState();
    const actLevels = CATHEDRAL_LEVELS.filter((l) => l.actId === this.selectedActId);
    const activeAct = CATHEDRAL_ACTS.find((a) => a.actId === this.selectedActId) || CATHEDRAL_ACTS[0];

    return `
      ${this._renderTopNav('campaign')}
      <section class="modal-screen-container gothic-card-panel">
        <div class="screen-header-row">
          <div>
            <div class="gothic-eyebrow">SINGLE-PLAYER SANCTUM CAMPAIGN • 36 CONSECRATIONS</div>
            <h2>Cathedral Acts & Inquisitor Bosses</h2>
          </div>
          <div class="act-selector-pills">
            ${CATHEDRAL_ACTS.map(
              (act) => `
                <button class="act-pill-btn ${act.actId === this.selectedActId ? 'active' : ''}" data-action="select-act" data-act="${act.actId}">
                  Act ${act.actId}: ${act.name}
                </button>
              `
            ).join('')}
          </div>
        </div>

        <div class="act-banner-card">
          <div class="act-boss-crest">
            ${renderBossCrestSVG(activeAct.boss.id, activeAct.boss.color)}
          </div>
          <div class="act-boss-info">
            <div class="gothic-eyebrow">ACT ${activeAct.actId} ARCH-INQUISITOR</div>
            <h3>${activeAct.boss.name} — <span>${activeAct.boss.title}</span></h3>
            <p>${activeAct.boss.quote} • <strong>Ritual Passive:</strong> ${activeAct.boss.passiveDesc}</p>
          </div>
        </div>

        <div class="levels-grid">
          ${actLevels
            .map((lvl) => {
              const unlocked = lvl.level <= state.highestUnlockedLevel;
              const stars = state.completedLevels[lvl.level] || 0;
              return `
                <div class="level-node-card ${unlocked ? 'unlocked' : 'locked'} ${lvl.isBossLevel ? 'boss-node' : ''}">
                  <div class="level-node-top">
                    <span class="level-num">VOW #${lvl.level}</span>
                    <span class="level-stars">${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}</span>
                  </div>
                  <h4>${lvl.name}</h4>
                  <div class="level-meta">
                    <span>${lvl.boardSize}×${lvl.boardSize} Altar</span>
                    <span>Target: ${lvl.targetScore} VP</span>
                    <span>AI Tier ${lvl.aiTier}</span>
                  </div>
                  <button class="btn-gothic-small" ${unlocked ? '' : 'disabled'} data-action="start-level" data-level="${lvl.level}">
                    ${unlocked ? (lvl.isBossLevel ? 'Confront Boss' : 'Enter Altar') : 'Sealed'}
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
        <div class="screen-header-row">
          <div>
            <div class="gothic-eyebrow">1-TURN LETHAL SACRED GEOMETRY PUZZLES</div>
            <h2>Crypt Trials of the Ossuary</h2>
          </div>
        </div>

        <div class="crypt-trials-grid">
          ${CRYPT_TRIALS.map((trial) => {
            const solved = Boolean(state.completedCrypts[trial.id]);
            return `
              <div class="crypt-trial-card ${solved ? 'solved' : ''}">
                <div class="crypt-card-header">
                  <span class="crypt-badge">${solved ? 'CONSECRATED' : 'UNSOLVED'}</span>
                  <span class="crypt-reward">+${trial.rewardSigils} Sigils</span>
                </div>
                <h3>${trial.name}</h3>
                <p>${trial.subtitle}</p>
                <div class="crypt-hint-box"><strong>Scroll Hint:</strong> ${trial.hint}</div>
                <button class="btn-gothic-primary" data-action="start-crypt" data-crypt="${trial.id}">
                  Attempt Crypt Trial
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
      <section class="modal-screen-container gothic-card-panel reliquary-layout">
        <div class="screen-header-row">
          <div>
            <div class="gothic-eyebrow">CUSTOMIZE 3D SCULPTED PIECES, PBR STONE MATERIALS & OATHS</div>
            <h2>The 3D Cathedral Reliquary Atelier</h2>
          </div>
          <button class="btn-gothic-ghost" data-action="demo-shatter">
            ${renderGothicIconSVG('shatter')} Test Shatter on Current Sculptures
          </button>
        </div>

        <div class="reliquary-columns">
          <div class="reliquary-section">
            <h3>Order ('X') 3D Piece Sculpture</h3>
            <div class="cosmetic-list">
              ${SCULPTED_PIECES.player
                .map((s) => {
                  const owned = state.unlockedSculpts.includes(s.id);
                  const equipped = state.equippedPlayerSculpt === s.id;
                  return `
                    <div class="cosmetic-item ${equipped ? 'equipped' : ''}">
                      <div>
                        <strong>${s.name}</strong>
                        <p>${s.desc}</p>
                      </div>
                      <button class="btn-gothic-small" data-action="select-sculpt" data-faction="player" data-id="${s.id}" data-cost="${s.cost}">
                        ${equipped ? 'Equipped' : owned ? 'Equip' : `Unlock (${s.cost})`}
                      </button>
                    </div>
                  `;
                })
                .join('')}
            </div>

            <h3>Inquisition ('O') 3D Piece Sculpture</h3>
            <div class="cosmetic-list">
              ${SCULPTED_PIECES.enemy
                .map((s) => {
                  const owned = state.unlockedSculpts.includes(s.id);
                  const equipped = state.equippedEnemySculpt === s.id;
                  return `
                    <div class="cosmetic-item ${equipped ? 'equipped' : ''}">
                      <div>
                        <strong>${s.name}</strong>
                        <p>${s.desc}</p>
                      </div>
                      <button class="btn-gothic-small" data-action="select-sculpt" data-faction="enemy" data-id="${s.id}" data-cost="${s.cost}">
                        ${equipped ? 'Equipped' : owned ? 'Equip' : `Unlock (${s.cost})`}
                      </button>
                    </div>
                  `;
                })
                .join('')}
            </div>
          </div>

          <div class="reliquary-section">
            <h3>PBR Stone & Metal Finish (Player 'X')</h3>
            <div class="cosmetic-list">
              ${STONE_MATERIALS.map((m) => {
                const owned = state.unlockedMaterials.includes(m.id);
                const equipped = state.equippedPlayerMaterial === m.id;
                return `
                  <div class="cosmetic-item ${equipped ? 'equipped' : ''}">
                    <div>
                      <strong>${m.name}</strong>
                      <p>${m.desc}</p>
                    </div>
                    <button class="btn-gothic-small" data-action="select-material" data-id="${m.id}" data-cost="${m.cost}">
                      ${equipped ? 'Active' : owned ? 'Apply' : `Unlock (${m.cost})`}
                    </button>
                  </div>
                `;
              }).join('')}
            </div>

            <h3>Blood Oath Relics (Equip up to 2) & Penitence Bell</h3>
            <div class="cosmetic-list">
              ${BLOOD_OATHS.map((oath) => {
                const owned = state.unlockedOaths.includes(oath.id);
                const equipped = state.equippedOaths.includes(oath.id);
                return `
                  <div class="cosmetic-item ${equipped ? 'equipped' : ''}">
                    <div>
                      <strong>${oath.name}</strong>
                      <p>${oath.desc}</p>
                    </div>
                    <button class="btn-gothic-small" data-action="toggle-oath" data-id="${oath.id}" data-cost="${oath.cost}">
                      ${equipped ? 'Equipped' : owned ? 'Equip' : `Unlock (${oath.cost})`}
                    </button>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>
      </section>
    `;
  }

  _renderCodexScreen() {
    const state = this.save.getState();
    return `
      ${this._renderTopNav('codex')}
      <section class="modal-screen-container gothic-card-panel">
        <div class="screen-header-row">
          <div>
            <div class="gothic-eyebrow">20 DARK-TAROT ARCANA SCRIPTS & SACRED GEOMETRY BLUEPRINTS</div>
            <h2>The Forbidden Scriptorium</h2>
          </div>
        </div>

        <div class="sacred-geometry-strip">
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
                  <span class="tarot-num">${card.numeral}</span>
                  <span class="tarot-cost">${card.cost} Tithe</span>
                </div>
                <div class="codex-tarot-art">${renderTarotArtSVG(card)}</div>
                <h4>${card.name} ${exalted ? '<span class="exalt-badge">[+]</span>' : ''}</h4>
                <p>${exalted ? card.exaltedDesc : card.desc}</p>
                <button class="btn-gothic-small" ${exalted ? 'disabled' : ''} data-action="exalt-card" data-card="${card.id}">
                  ${exalted ? 'Exalted [+]' : 'Exalt Script (150 Sigils)'}
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
        <div class="gothic-eyebrow">CUSTOM 3D ALTAR DUEL</div>
        <h2>Configure Single-Player AI or Pass-and-Play Duel</h2>

        <div class="skirmish-options-grid">
          <div class="skirmish-field">
            <label>Opponent Mode</label>
            <div class="pill-group">
              <button class="cam-pill ${this.skirmishConfig.mode === 'skirmish' ? 'active' : ''}" data-action="skirmish-set" data-key="mode" data-val="skirmish">Single-Player Inquisitor AI</button>
              <button class="cam-pill ${this.skirmishConfig.mode === 'local2p' ? 'active' : ''}" data-action="skirmish-set" data-key="mode" data-val="local2p">Local 2-Player Altar</button>
            </div>
          </div>

          <div class="skirmish-field">
            <label>Altar Grid Dimensions</label>
            <div class="pill-group">
              ${[4, 5, 6, 7]
                .map(
                  (sz) => `
                    <button class="cam-pill ${this.skirmishConfig.boardSize === sz ? 'active' : ''}" data-action="skirmish-set" data-key="boardSize" data-val="${sz}">
                      ${sz}×${sz} Altar
                    </button>
                  `
                )
                .join('')}
            </div>
          </div>

          <div class="skirmish-field">
            <label>Inquisitor AI Intelligence Tier</label>
            <div class="pill-group">
              ${[
                [1, '1: Acolyte'],
                [2, '2: Deacon'],
                [3, '3: Canon'],
                [4, '4: Prior'],
                [5, '5: Grand Inquisitor'],
                [6, '6: Hollow Seraph'],
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
            <label>3D Cathedral Hall & Lighting</label>
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
            ${renderGothicIconSVG('sword')} Consecrate 3D Skirmish Altar
          </button>
        </div>
      </section>
    `;
  }

  _renderBattleHUD() {
    if (!this.engine) return '';
    const snap = this.engine.getSnapshot();
    const state = this.save.getState();
    const xPct = Math.min(100, Math.round((snap.scores.X / snap.targetScore) * 100));
    const oPct = Math.min(100, Math.round((snap.scores.O / snap.targetScore) * 100));
    const bellReady = !snap.bellUsedThisMatch.X && snap.bellCharge.X >= 100;

    return `
      <header class="battle-hud-topbar">
        <div class="hud-wing player-wing ${snap.activePlayer === 'X' ? 'active-turn' : ''}">
          <div class="wing-faction-tag">ORDER OF THE ROSE (X)</div>
          <div class="wing-score-row">
            <span class="score-big">${snap.scores.X}</span>
            <span class="score-target">/ ${snap.targetScore} VP</span>
          </div>
          <div class="gothic-progress-track">
            <div class="gothic-progress-fill player-fill" style="width:${xPct}%"></div>
          </div>
          <div class="wing-sub-row">
            <span class="tithe-readout">${renderGothicIconSVG('chalice')} Blood Tithe: <strong>${snap.tithe.X}</strong>/${GAME_CONFIG.MAX_BLOOD_TITHE}</span>
            <span class="placements-readout">Placements: <strong>${snap.placementsRemaining}</strong></span>
          </div>
        </div>

        <div class="hud-center-medallion">
          <div class="turn-pill ${snap.activePlayer === 'X' ? 'turn-x' : 'turn-o'}">
            ${snap.activePlayer === 'X' ? 'YOUR CONSECRATION' : 'INQUISITOR RITUAL'} • TURN ${snap.turnNumber}
          </div>
          <div class="battle-sub-title">
            ${snap.boss ? `${snap.boss.name} (${snap.boss.title})` : snap.levelData?.name || 'Cathedral Altar Duel'}
          </div>
          <div class="hud-utility-strip">
            <button class="hud-tool-btn" data-action="cycle-camera" title="Switch 3D Camera Angle (C)">
              ${renderGothicIconSVG('camera')} <span>Camera</span>
            </button>
            <button class="hud-tool-btn" data-action="seer-hint" title="Oracle Best Move Hint (1 Tithe)">
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
            <button class="hud-tool-btn" data-action="nav" data-screen="hub" title="Retreat to Sanctum Hub">
              <span>Exit</span>
            </button>
          </div>
        </div>

        <div class="hud-wing enemy-wing ${snap.activePlayer === 'O' ? 'active-turn' : ''}">
          <div class="wing-faction-tag">${snap.boss ? snap.boss.name.toUpperCase() : 'INQUISITION AUTOMATON (O)'}</div>
          <div class="wing-score-row">
            <span class="score-big">${snap.scores.O}</span>
            <span class="score-target">/ ${snap.targetScore} VP</span>
          </div>
          <div class="gothic-progress-track">
            <div class="gothic-progress-fill enemy-fill" style="width:${oPct}%"></div>
          </div>
          <div class="wing-sub-row">
            <span>Enemy Tithe: <strong>${snap.tithe.O}</strong></span>
            <span>Shattered: <strong>${snap.stonesShatteredThisMatch}</strong></span>
          </div>
        </div>
      </header>

      <!-- Optional 2D Tactical Mini-Grid for instant precision or headless testing -->
      <aside class="battle-side-widgets">
        ${
          this.showMiniTacticalGrid
            ? `
              <div class="mini-tactical-grid-panel gothic-card-panel">
                <div class="gothic-eyebrow">TACTICAL ALTAR MATRIX</div>
                <div class="mini-grid-board" style="grid-template-columns: repeat(${snap.boardSize}, 1fr)">
                  ${snap.board
                    .map((row) =>
                      row
                        .map(
                          (cell) => `
                            <button class="mini-grid-cell ${cell.symbol ? `sym-${cell.symbol}` : ''} ${
                            cell.obstacle ? 'has-obstacle' : ''
                          }" data-action="board-cell" data-r="${cell.r}" data-c="${cell.c}">
                              ${cell.symbol || (cell.obstacle === 'reliquary_coffer' ? '□' : cell.obstacle ? '■' : '·')}
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

        <div class="chronicle-feed-panel">
          <div class="gothic-eyebrow">SANCTUM CHRONICLE</div>
          <ul class="chronicle-list">
            ${snap.battleChronicle
              .slice(0, 4)
              .map((entry) => `<li class="chron-${entry.type}">[T${entry.turn}] ${entry.text}</li>`)
              .join('')}
          </ul>
        </div>
      </aside>

      <!-- Bottom Dark-Tarot Hand & Penitence Bell Dock -->
      <footer class="battle-hud-bottom">
        <div class="penitence-bell-dock">
          <button class="bell-ultimate-btn ${bellReady ? 'ready' : ''}" ${
      bellReady ? '' : 'disabled'
    } data-action="toll-bell">
            ${renderGothicIconSVG('bell')}
            <div>
              <div class="bell-label">PENITENCE BELL</div>
              <div class="bell-pct">${
                snap.bellUsedThisMatch.X ? 'TOLLED' : `${Math.floor(snap.bellCharge.X)}%`
              }</div>
            </div>
          </button>
        </div>

        <div class="dark-tarot-hand" role="list" aria-label="Dark-Tarot Arcana Hand">
          ${snap.hands.X.map((inst, idx) => {
            const card = inst.card;
            if (!card) return '';
            const selected = this.engine.selectedCardIndex === idx;
            const affordable = snap.tithe.X >= card.cost;
            return `
              <div class="tarot-hand-card ${selected ? 'selected' : ''} ${
              affordable ? 'affordable' : 'unaffordable'
            }" data-action="select-card" data-index="${idx}">
                <div class="tarot-card-header">
                  <span class="tarot-roman">${card.numeral}</span>
                  <span class="tarot-cost-gem">${card.cost}</span>
                </div>
                <div class="tarot-card-illustration">
                  ${renderTarotArtSVG(card)}
                </div>
                <div class="tarot-card-title">${card.name}${inst.exalted ? ' [+]' : ''}</div>
                <div class="tarot-card-desc">${inst.exalted ? card.exaltedDesc : card.desc}</div>
              </div>
            `;
          }).join('')}
        </div>

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
    return `
      <div class="endgame-modal-backdrop">
        <div class="endgame-modal-card gothic-card-panel">
          <div class="gothic-eyebrow">${isWin ? 'SANCTUM CONSECRATED' : 'ALTAR OVERRUN BY INQUISITION'}</div>
          <h2>${isWin ? 'VICTORY IN THE CATHEDRAL' : 'DEFEAT IN THE DARK'}</h2>
          <p class="endgame-score-summary">
            Final Alignment: <strong>Order ${snap.scores.X} VP</strong> — <strong>Inquisition ${snap.scores.O} VP</strong>
            <br/>Stones Shattered This Duel: <strong>${snap.stonesShatteredThisMatch}</strong>
          </p>
          <div class="endgame-actions">
            ${
              isWin && snap.mode === 'campaign' && snap.levelNumber < 36
                ? `<button class="btn-gothic-primary" data-action="start-level" data-level="${snap.levelNumber + 1}">Next Sanctum Vow (#${snap.levelNumber + 1})</button>`
                : ''
            }
            <button class="btn-gothic-secondary" data-action="rematch">Rematch Altar</button>
            <button class="btn-gothic-ghost" data-action="nav" data-screen="hub">Return to Sanctum Hub</button>
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
            else this.showToast('Dark-Tarot Script Exalted to [+] Mastery!');
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
        }
      });
    });
  }
}
