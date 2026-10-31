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
  ROGUELIKE_BOONS,
  WARLORD_DOCTRINES,
  EARLY_STAGE_MICRO_REWARDS,
  EARLY_STAGE_MODIFIERS,
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
  getWarlordDoctrineByTier,
  getCardTacticalSpec,
  getRelicTacticalSpec,
} from '../data/gothic-config.js';
import { SeededRNG } from '../core/rng.js';
import { BattleEngine } from '../engine/game-state.js';
import {
  selectBestAIMove,
  scanEnemyThreatCells,
  getThreatOverlayData,
  computeTacticalHint,
  formatCoordLabel,
} from '../engine/ai-brain.js';
import { SACRED_GEOMETRY_SHAPES } from '../engine/pattern-detector.js';
import {
  renderTarotArtSVG,
  renderBossCrestSVG,
  renderGothicIconSVG,
  renderGeometryBlueprintSVG,
  renderMiniBoardPreviewSVG,
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
    this.saved3DCameraPreset = 'high_cathedral';
    // Default side rail collapsed so the 3D War-Table has a clear, unobstructed safe area
    this.showTacticalIntel = false;
    this.confirmPlacementMode = false;
    this.stagedCoord = null;
    this.hoveredPreviewInfo = null;
    this.earlyModifierId = 'standard';
    this.showScrollPreviewDrawer = false;
    this.showPerfOverlay = false;
    this.perfInterval = null;
    this.onboardingStep = 1; // 5-step Guided First Battle sequence on Level 1
    this.showStoryModal = false;
    this.showTutorialModal = false;
    this.tutorialStep = 0;
    this.kbCursor = { r: 2, c: 2 };
    this.kbActive = false;
    this.lastScores = { X: 0, O: 0 };
    this.scorePulse = { X: false, O: false };
    this.toastMessage = null;
    this.toastTimer = null;

    this.skirmishConfig = {
      boardSize: 5,
      targetScore: 7,
      aiTier: 3,
      cathedralHallId: 'obsidian_nave',
      mode: 'skirmish',
    };

    this._syncDocumentDirection();
    this._bindEvents();
    this._setupDemoAltar();
    this.render();
  }

  t(enText, arText) {
    const lang = this.save?.getState()?.language || 'en';
    return lang === 'ar' ? arText : enText;
  }

  _syncDocumentDirection() {
    if (typeof document === 'undefined') return;
    const lang = this.save?.getState()?.language || 'en';
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }

  announceToScreenReader(message) {
    if (typeof document === 'undefined') return;
    const el = document.getElementById('sr-announcer');
    if (el) {
      el.textContent = '';
      setTimeout(() => {
        el.textContent = message;
      }, 20);
    }
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
    this.scene3d.playCinematicFlyIn?.(state.cameraPreset || 'high_cathedral', 2.35);

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
      if (this.engine.selectedCardIndex !== null || this.engine.selectedHeroAbility || this.stagedCoord) {
        this.engine.selectedCardIndex = null;
        this.engine.selectedHeroAbility = false;
        this.engine.pendingTargets = [];
        this.stagedCoord = null;
        this.showToast(this.t('Selection cancelled.', 'تم إلغاء التحديد.'));
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

    this.bus.on('3d:patternAligned', ({ patterns = [], scores }) => {
      if (patterns.length > 0) {
        const topTier = patterns.some((p) => p.tier === 'grand')
          ? 'grand'
          : patterns.some((p) => p.tier === 'major')
          ? 'major'
          : 'minor';
        this.sound?.playSacredChord(topTier);
        this.sound?.playScoreTick?.();
        if (scores) {
          this.scorePulse.X = scores.X > (this.lastScores.X || 0);
          this.scorePulse.O = scores.O > (this.lastScores.O || 0);
          this.lastScores = { ...scores };
        }
        const names = patterns.map((p) => `${p.name} (+${p.points} VP)`).join(' • ');
        this.showToast(names);
        this.announceToScreenReader(names);
      }
    });

    this.bus.on('battle:microReward', ({ title, sigils }) => {
      this.save.addReliquarySigils(sigils || 15);
      this.showToast(`🏅 Mastery Unlocked: ${title} (+${sigils} Sigils)!`);
    });

    this.bus.on('battle:bellActivated', ({ bell }) => {
      this.sound?.playCathedralBell();
      this.showToast(`${bell.name} Sounded Across the War-Table!`);
    });

    this.bus.on('battle:heroAbilityUsed', ({ ability }) => {
      this.sound?.playHeroAbility?.();
      this.showToast(`⚡ ${ability.name}: ${ability.desc}`);
    });

    this.bus.on('battle:bossTelegraph', (telegraph) => {
      this.sound?.playBossWarning?.();
      if (telegraph?.warningText) {
        this.showToast(telegraph.warningText, 3800);
        this.announceToScreenReader(telegraph.warningText);
      }
    });

    this.bus.on('battle:turnStarted', ({ activePlayer, bossEvents }) => {
      this.seerHintCoord = null;
      this.stagedCoord = null;
      if (bossEvents && bossEvents.length > 0) {
        this.showToast(bossEvents[0].text);
      }
      // Step 3 of Stage 1 Guided Onboarding: When Malakor finishes Turn 1, reveal Threat Line!
      if (
        this.engine &&
        this.engine.mode === 'campaign' &&
        this.engine.levelNumber === 1 &&
        activePlayer === 'X' &&
        this.engine.turnNumber === 2
      ) {
        this.showThreatScan = true;
        this.onboardingStep = Math.max(this.onboardingStep, 3);
      } else if (
        this.engine &&
        this.engine.mode === 'campaign' &&
        this.engine.levelNumber === 1 &&
        activePlayer === 'X' &&
        this.engine.turnNumber >= 3
      ) {
        this.onboardingStep = Math.max(this.onboardingStep, 4);
      }
      if (
        this.engine &&
        this.engine.mode === 'campaign' &&
        this.engine.levelNumber === 1 &&
        (this.engine.scores.X >= 1 || this.engine.status !== 'playing')
      ) {
        this.onboardingStep = 5;
      }

      this.render();
      this._handleTileHover(this.kbActive ? this.kbCursor : null);
      if (activePlayer === 'O' && this.engine && this.engine.mode !== 'local2p') {
        this._scheduleAITurn();
      }
    });

    this.bus.on('battle:ended', ({ status, reason }) => {
      if (this.aiTimer) {
        clearTimeout(this.aiTimer);
        this.aiTimer = null;
      }
      this.onboardingStep = 5;
      this._handleMatchEnded(status, reason);
      this.render();
    });

    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', (e) => {
        if (e.key === 'F3') {
          e.preventDefault();
          this.togglePerfOverlay();
          return;
        }
        if (e.key === 'Escape') {
          if (this.showTutorialModal) {
            this.showTutorialModal = false;
            this.save.setTutorialCompleted(true);
            this.render();
            return;
          }
          if (this.showStoryModal) {
            this.showStoryModal = false;
            this.render();
            return;
          }
          if (this.currentScreen === 'battle' && this.engine) {
            if (this.engine.selectedCardIndex !== null || this.engine.selectedHeroAbility || this.stagedCoord) {
              this.engine.selectedCardIndex = null;
              this.engine.selectedHeroAbility = false;
              this.engine.pendingTargets = [];
              this.stagedCoord = null;
              this.showToast(this.t('Selection cancelled.', 'تم إلغاء التحديد.'));
              this.render();
            }
            return;
          }
          if (this.currentScreen !== 'hub') {
            this.navigate('hub');
            return;
          }
        }
        if (e.key === 'c' || e.key === 'C') {
          this.cycleCameraPreset();
          return;
        }
        if (this.currentScreen !== 'battle' || !this.engine) return;

        // Full Keyboard Board Play (Arrow Keys + Enter/Space) with Screen-Reader Announcements!
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
          e.preventDefault();
          this.kbActive = true;
          const sz = this.engine.boardSize;
          if (e.key === 'ArrowUp') this.kbCursor.r = (this.kbCursor.r - 1 + sz) % sz;
          if (e.key === 'ArrowDown') this.kbCursor.r = (this.kbCursor.r + 1) % sz;
          if (e.key === 'ArrowLeft') this.kbCursor.c = (this.kbCursor.c - 1 + sz) % sz;
          if (e.key === 'ArrowRight') this.kbCursor.c = (this.kbCursor.c + 1) % sz;

          this._handleTileHover(this.kbCursor);
          const cell = this.engine.board[this.kbCursor.r]?.[this.kbCursor.c];
          const coordLabel = formatCoordLabel(this.kbCursor.r, this.kbCursor.c);
          const cellStatus = cell?.symbol
            ? cell.symbol === 'X'
              ? 'Your Champion'
              : cell.symbol === 'O'
              ? 'Enemy Warlord'
              : 'Wild Joker'
            : cell?.obstacle === 'reliquary_coffer'
            ? 'Mystery Bone-Chest'
            : cell?.obstacle
            ? 'Obstacle'
            : cell?.locked > 0
            ? 'Locked Tile'
            : 'Empty Legal Tile';
          const previewNote = this.hoveredPreviewInfo?.summary ? ` — ${this.hoveredPreviewInfo.summary}` : '';
          this.announceToScreenReader(
            `Tile ${coordLabel} (Row ${this.kbCursor.r + 1}, Column ${this.kbCursor.c + 1}): ${cellStatus}${previewNote}`
          );
          return;
        }

        if ((e.key === 'Enter' || e.key === ' ') && this.kbActive) {
          const activeTag = document?.activeElement?.tagName?.toLowerCase();
          if (activeTag !== 'button') {
            e.preventDefault();
            this.handleBoardCellClick(this.kbCursor.r, this.kbCursor.c);
            return;
          }
        }

        if (e.key === 'q' || e.key === 'Q') {
          this.triggerHeroAbility();
        } else if (e.key === 'e' || e.key === 'E') {
          const res = this.engine?.activatePenitenceBell('X');
          if (res && !res.ok) this.showToast(res.reason);
          this.render();
        } else if (['1', '2', '3', '4', '5'].includes(e.key)) {
          const idx = Number(e.key) - 1;
          if (this.engine.hands.X[idx]) {
            this.selectHandCard(idx);
          }
        } else if (e.key === 'h' || e.key === 'H') {
          this.requestSeerHint();
        } else if ((e.key === 'z' || e.key === 'Z') && !e.ctrlKey && !e.metaKey) {
          if (this.engine.canUndo?.() ?? true) {
            const res = this.engine.undoLastAction();
            if (!res.ok) this.showToast(res.reason);
            this.render();
          }
        }
      });
    }
  }

  togglePerfOverlay() {
    this.showPerfOverlay = !this.showPerfOverlay;
    if (this.perfInterval) {
      clearInterval(this.perfInterval);
      this.perfInterval = null;
    }
    if (this.showPerfOverlay && typeof window !== 'undefined') {
      this.perfInterval = setInterval(() => {
        this._updatePerfDOMOnly();
      }, 650);
    }
    this.render();
  }

  _updatePerfDOMOnly() {
    if (!this.rootEl || typeof this.rootEl.querySelector !== 'function') return;
    const panel = this.rootEl.querySelector('#perf-telemetry-panel');
    if (!panel || !this.scene3d?.getPerformanceMetrics) return;
    const m = this.scene3d.getPerformanceMetrics();
    panel.innerHTML = this._renderPerfTelemetryInner(m);
  }

  toggle2DView() {
    const state = this.save.getState();
    this.showMiniTacticalGrid = !this.showMiniTacticalGrid;
    if (this.showMiniTacticalGrid) {
      // Save current 3D camera preset before animating into 2D Top-Down Tactical View
      this.saved3DCameraPreset =
        state.cameraPreset && state.cameraPreset !== 'belfry_topdown'
          ? state.cameraPreset
          : 'high_cathedral';
      this.scene3d?.applyCameraPreset('belfry_topdown', false);
      this.showToast(this.t('Switched to 2D Tactical Board View', 'تم التبديل إلى عرض اللوحة التكتيكية ثنائية الأبعاد'));
      this.announceToScreenReader('Switched to 2D Tactical Board View');
    } else {
      const restoreId = this.saved3DCameraPreset || 'high_cathedral';
      this.save.equipCosmetic('cameraPreset', restoreId);
      this.scene3d?.applyCameraPreset(restoreId, false);
      this.showToast(this.t('Restored 3D War-Table View', 'تمت استعادة عرض طاولة الحرب ثلاثية الأبعاد'));
      this.announceToScreenReader('Restored 3D War-Table View');
    }
    this.render();
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
    this.lastScores = { X: 0, O: 0 };
    this.stagedCoord = null;
    this.hoveredPreviewInfo = null;
    this.kbCursor = {
      r: Math.floor((level?.boardSize || 5) / 2),
      c: Math.floor((level?.boardSize || 5) / 2),
    };
    this.engine = new BattleEngine(this.bus, {
      mode: 'campaign',
      levelNumber,
      heroId: state.selectedHeroId || 'hero_paladin',
      cathedralHallId: level?.hallId || state.equippedHall,
      activeOaths: state.equippedOaths,
      penitenceBellId: state.equippedBell,
      roguelikeBoon: state.selectedBoon || 'boon_shrine_aegis',
      earlyModifierId: this.earlyModifierId || 'standard',
      upgradedCards: state.upgradedCards,
      customDeckIds: state.customDeck,
    });
    this.currentScreen = 'battle';
    // Guided 5-Step First Battle Sequence directly on the War-Table (no blocking text modal on entry!)
    this.showTutorialModal = false;
    if (levelNumber === 1) {
      this.onboardingStep = 1;
      const hint = computeTacticalHint(this.engine, 'X');
      if (hint) {
        this.seerHintCoord = hint;
      }
    } else {
      this.seerHintCoord = null;
    }
    if (this.scene3d) {
      this.scene3d.idleOrbitActive = false;
      if (level?.isBossLevel) {
        this.scene3d.playBossEntranceCinematic?.(state.cameraPreset || 'high_cathedral', 2.45);
      } else {
        this.scene3d.playBattleZoomIn?.(state.cameraPreset || 'high_cathedral', 1.65);
      }
    }
    this.sound?.startMusic(levelNumber % 13);
    if (levelNumber === 1) {
      const hero = getFantasyHeroById(state.selectedHeroId);
      const cLabel = this.seerHintCoord?.coordLabel || 'C3';
      this.showToast(
        `⚔️ Step 1/5: Place ${hero.shortName} on highlighted tile ${cLabel} (or click any legal tile)!`
      );
    } else if (levelNumber < GAME_CONFIG.CARDS_UNLOCK_LEVEL) {
      this.showToast(
        `⚔️ Level ${levelNumber}: Pure Tactical Combat + Hero Skill [Q] — War-Scroll Shop Unlocks at Level ${GAME_CONFIG.CARDS_UNLOCK_LEVEL}!`
      );
    } else if (level?.cardUnlock) {
      this.showToast(`🔓 Level ${levelNumber}: War-Scroll Shop Open! New Scroll: ${level.cardUnlock}`);
    }
    this._handleTileHover(null);
    this.render();
  }

  startCryptTrial(cryptId) {
    const state = this.save.getState();
    this.lastScores = { X: 0, O: 0 };
    this.stagedCoord = null;
    this.hoveredPreviewInfo = null;
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
      this.scene3d.playBattleZoomIn?.(state.cameraPreset || 'high_cathedral', 1.65);
    }
    this.sound?.startMusic(3);
    this.render();
  }

  startSkirmishMatch() {
    const state = this.save.getState();
    this.lastScores = { X: 0, O: 0 };
    this.stagedCoord = null;
    this.hoveredPreviewInfo = null;
    this.engine = new BattleEngine(this.bus, {
      mode: this.skirmishConfig.mode,
      boardSize: this.skirmishConfig.boardSize,
      targetScore: this.skirmishConfig.targetScore,
      aiTier: this.skirmishConfig.aiTier,
      heroId: state.selectedHeroId || 'hero_paladin',
      cathedralHallId: this.skirmishConfig.cathedralHallId,
      activeOaths: state.equippedOaths,
      penitenceBellId: state.equippedBell,
      roguelikeBoon: state.selectedBoon || 'boon_shrine_aegis',
      upgradedCards: state.upgradedCards,
      customDeckIds: state.customDeck,
    });
    this.currentScreen = 'battle';
    if (this.scene3d) {
      this.scene3d.idleOrbitActive = false;
      this.scene3d.playBattleZoomIn?.(state.cameraPreset || 'high_cathedral', 1.65);
    }
    this.sound?.startMusic(1);
    this.render();
  }

  startDailyChallenge() {
    const state = this.save.getState();
    const dailySeed = SeededRNG.dailySeedString();
    this.lastScores = { X: 0, O: 0 };
    this.stagedCoord = null;
    this.hoveredPreviewInfo = null;
    this.engine = new BattleEngine(this.bus, {
      mode: 'daily',
      seed: dailySeed,
      boardSize: 5,
      targetScore: 8,
      aiTier: 4,
      heroId: state.selectedHeroId || 'hero_paladin',
      cathedralHallId: 'crimson_sanctuary',
      activeOaths: state.equippedOaths,
      penitenceBellId: state.equippedBell,
      roguelikeBoon: state.selectedBoon || 'boon_shrine_aegis',
      upgradedCards: state.upgradedCards,
      customDeckIds: state.customDeck,
    });
    this.currentScreen = 'battle';
    if (this.scene3d) {
      this.scene3d.idleOrbitActive = false;
      this.scene3d.playBossEntranceCinematic?.(state.cameraPreset || 'high_cathedral', 2.2);
    }
    this.sound?.startMusic(5);
    this.showToast(`🏆 Daily Seed Challenge Started (${dailySeed})!`);
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
      const modBonus =
        this.engine.mode === 'campaign' && this.engine.levelNumber < GAME_CONFIG.CARDS_UNLOCK_LEVEL
          ? this.engine.earlyModifier?.sigilBonus || 0
          : 0;
      const decisiveBonus = diff >= 2 ? 35 : 0;
      const sigilReward = 85 + stars * 35 + (this.engine.boss ? 90 : 0) + modBonus + decisiveBonus;

      if (this.engine.mode === 'campaign') {
        this.save.recordCampaignVictory(this.engine.levelNumber, stars, sigilReward);
      } else if (this.engine.mode === 'crypt') {
        const trial = CRYPT_TRIALS.find((t) => t.id === this.engine.cryptId);
        this.save.recordCryptVictory(this.engine.cryptId, trial?.rewardSigils || 140);
      } else if (this.engine.mode === 'daily') {
        const dailySeed = SeededRNG.dailySeedString();
        this.save.recordDailySeedScore(
          dailySeed,
          this.engine.scores.X,
          this.engine.turnNumber,
          this.engine.hero?.id || 'hero_paladin'
        );
        this.save.addReliquarySigils(125);
      } else {
        this.save.addReliquarySigils(70);
      }
    } else {
      this.save.recordDefeat();
    }
  }

  _computeHoverPreviewSummary(r, c) {
    if (!this.engine || !this.engine.canPlaceAt(r, c)) return null;
    const coordLabel = formatCoordLabel(r, c);
    const myPatterns = this.engine.previewMove(r, c, this.engine.activePlayer);
    const oppPatterns = this.engine.previewMove(r, c, this.engine.activePlayer === 'X' ? 'O' : 'X');
    const cell = this.engine.board[r]?.[c];
    let adjChest = false;
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (this.engine.board[r + dr]?.[c + dc]?.obstacle === 'reliquary_coffer') {
          adjChest = true;
        }
      }
    }

    if (myPatterns.length > 0) {
      const pts =
        myPatterns.reduce((s, p) => s + p.points, 0) +
        (myPatterns.length >= 2 ? myPatterns.length - 1 : 0);
      const names = myPatterns.map((p) => p.name).join(' + ');
      return {
        r,
        c,
        coordLabel,
        points: pts,
        patterns: myPatterns,
        summary: `${coordLabel}: ${names} → +${pts} VP${this.engine.cardsEnabled ? ' & +1🪙' : ''}`,
      };
    }
    if (oppPatterns.length > 0) {
      const denied = oppPatterns.reduce((s, p) => s + p.points, 0);
      return {
        r,
        c,
        coordLabel,
        points: 0,
        patterns: [],
        summary: `${coordLabel}: Tactical Block (Stops Enemy +${denied} VP Line)`,
      };
    }
    if (cell?.anomaly === 'sanctified_mosaic') {
      return {
        r,
        c,
        coordLabel,
        points: 0,
        patterns: [],
        summary: `${coordLabel}: Star-Mosaic Tile (+2 Bonus VP when aligned)`,
      };
    }
    if (adjChest) {
      return {
        r,
        c,
        coordLabel,
        points: 0,
        patterns: [],
        summary: `${coordLabel}: Cracks Adjacent Mystery War-Chest (📦)!`,
      };
    }
    return {
      r,
      c,
      coordLabel,
      points: 0,
      patterns: [],
      summary: `${coordLabel}: Legal Placement — Opens Line Rays`,
    };
  }

  _handleTileHover(coord) {
    if (!this.engine || !this.scene3d) return;
    const isPlayerTurn =
      this.engine.status === 'playing' &&
      (this.engine.activePlayer === 'X' || this.engine.mode === 'local2p');

    const previewCells = [];

    // 1. Highlight Telegraphed Boss Ritual Target Tile 1 Turn Ahead!
    if (this.engine.pendingBossRitual) {
      previewCells.push({
        r: this.engine.pendingBossRitual.r,
        c: this.engine.pendingBossRitual.c,
        mode: 'boss_telegraph',
      });
    }

    // 2. Highlight Keyboard Focus Cursor if active
    if (this.kbActive && this.kbCursor) {
      previewCells.push({
        r: this.kbCursor.r,
        c: this.kbCursor.c,
        mode: 'kb_cursor',
      });
    }

    // 3. Threat Overlay: paint enemy scoring lines in Amber (`threat_line`) and guaranteed blocks in Red (`threat_block`)
    if (this.showThreatScan) {
      const overlay = getThreatOverlayData(this.engine, 'O');
      for (const l of overlay.lineCells) {
        previewCells.push({ r: l.r, c: l.c, mode: 'threat_line' });
      }
      for (const b of overlay.blockCells) {
        previewCells.push({ r: b.r, c: b.c, mode: 'threat_block' });
      }
    }

    // 4. Seer Hint or Guided Stage 1 Recommendation: pulse recommended tile & expected line!
    if (this.seerHintCoord) {
      for (const cellItem of this.seerHintCoord.expectedLineCells || []) {
        const lr = Array.isArray(cellItem) ? cellItem[0] : cellItem.r;
        const lc = Array.isArray(cellItem) ? cellItem[1] : cellItem.c;
        if (lr !== this.seerHintCoord.r || lc !== this.seerHintCoord.c) {
          previewCells.push({ r: lr, c: lc, mode: 'expected_line' });
        }
      }
      previewCells.push({
        r: this.seerHintCoord.r,
        c: this.seerHintCoord.c,
        mode: 'recommended',
      });
    }

    // 5. Staged Confirm Tile
    if (this.stagedCoord) {
      previewCells.push({
        r: this.stagedCoord.r,
        c: this.stagedCoord.c,
        mode: 'selected_confirm',
      });
    }

    const activeCoord = coord || this.stagedCoord;
    if (!activeCoord || !isPlayerTurn) {
      this.hoveredPreviewInfo = null;
      this._updateLivePreviewBannerDOM();
      this.scene3d.setHoverAndPreview(null, previewCells, this.engine.activePlayer, false);
      return;
    }

    // If Hero Active Skill is selected, highlight target tile
    if (this.engine.selectedHeroAbility) {
      const ability = this.engine.hero?.activeAbility;
      if (ability) {
        previewCells.push({ r: activeCoord.r, c: activeCoord.c, mode: 'target' });
        if (ability.id === 'permafrost_rune') {
          const dirs = [
            [-1, 0],
            [1, 0],
            [0, -1],
            [0, 1],
          ];
          for (const [dr, dc] of dirs) {
            const nr = activeCoord.r + dr;
            const nc = activeCoord.c + dc;
            if (nr >= 0 && nr < this.engine.boardSize && nc >= 0 && nc < this.engine.boardSize) {
              previewCells.push({ r: nr, c: nc, mode: 'target' });
            }
          }
        }
      }
      this.scene3d.setHoverAndPreview(activeCoord, previewCells, null, false);
      return;
    }

    // If a War-Scroll card is selected, highlight its blast footprint on the 3D War-Table
    if (this.engine.selectedCardIndex !== null) {
      const inst = this.engine.hands[this.engine.activePlayer][this.engine.selectedCardIndex];
      const card = inst ? getArcanaCardById(inst.cardId) : null;
      if (card) {
        const footprint = getArcanaPreviewCells(card, activeCoord.r, activeCoord.c, this.engine.boardSize);
        for (const [fr, fc] of footprint) {
          previewCells.push({ r: fr, c: fc, mode: 'target' });
        }
      }
      this.scene3d.setHoverAndPreview(activeCoord, previewCells, null, false);
      return;
    }

    // Standard stone placement hover preview
    const canPlace = this.engine.canPlaceAt(activeCoord.r, activeCoord.c);
    if (canPlace) {
      this.hoveredPreviewInfo = this._computeHoverPreviewSummary(activeCoord.r, activeCoord.c);
      if (
        this.engine.mode === 'campaign' &&
        this.engine.levelNumber === 1 &&
        this.onboardingStep === 1
      ) {
        this.onboardingStep = 2;
      }
      const scoring = this.hoveredPreviewInfo?.patterns || [];
      for (const pat of scoring) {
        for (const [pr, pc] of pat.cells) {
          previewCells.push({ r: pr, c: pc, mode: 'score' });
        }
      }
    } else {
      this.hoveredPreviewInfo = null;
    }
    this._updateLivePreviewBannerDOM();
    this.scene3d.setHoverAndPreview(activeCoord, previewCells, this.engine.activePlayer, canPlace);
  }

  _updateLivePreviewBannerDOM() {
    if (!this.rootEl || typeof this.rootEl.querySelector !== 'function') return;
    const el = this.rootEl.querySelector('#live-placement-preview-pill');
    if (!el) return;
    if (this.hoveredPreviewInfo?.summary) {
      el.textContent = `🎯 Preview ${this.hoveredPreviewInfo.summary}`;
      el.classList.add('active');
    } else {
      el.textContent = this.t(
        'Hover or focus any empty tile to preview formations & VP result',
        'مرر أو ركز على أي بلاطة فارغة لمعاينة التشكيلات والنقاط'
      );
      el.classList.remove('active');
    }
  }

  triggerHeroAbility() {
    if (!this.engine || this.engine.status !== 'playing') return;
    const actor = this.engine.activePlayer;
    if (actor !== 'X' && this.engine.mode !== 'local2p') return;

    if (this.engine.selectedHeroAbility) {
      this.engine.selectedHeroAbility = false;
      this.render();
      return;
    }

    const ability = this.engine.hero?.activeAbility;
    if (!ability) return;

    if (this.engine.heroAbilityUsedThisTurn) {
      this.showToast('Hero skill already used this turn.');
      return;
    }
    const cd = this.engine.heroAbilityCooldown?.[actor] || 0;
    if (cd > 0) {
      this.showToast(`${ability.name} is on cooldown (${cd}T remaining).`);
      return;
    }
    if (!this.engine.hasValidTargetsForHeroAbility(actor)) {
      this.showToast(`No valid targets on the War-Table for ${ability.name} right now!`);
      return;
    }

    if (ability.targetType === 'none') {
      const res = this.engine.activateHeroAbility(actor, []);
      if (!res.ok) this.showToast(res.reason);
      this.render();
      return;
    }

    this.engine.selectedCardIndex = null;
    this.engine.pendingTargets = [];
    this.engine.selectedHeroAbility = true;
    this.showToast(`⚡ ${ability.name}: Click a target tile on the 3D War-Table (Esc to cancel).`);
    this.render();
  }

  handleBoardCellClick(r, c, forceCommit = false) {
    if (!this.engine || this.engine.status !== 'playing') return;
    if (this.engine.activePlayer !== 'X' && this.engine.mode !== 'local2p') return;

    const actor = this.engine.activePlayer;

    // 0. If Hero Active Skill is selected, apply target
    if (this.engine.selectedHeroAbility) {
      const res = this.engine.activateHeroAbility(actor, [[r, c]]);
      if (!res.ok) {
        this.engine.selectedHeroAbility = false;
        this.showToast(`${res.reason} (Skill selection cancelled)`);
      }
      this.render();
      return;
    }

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

    // 2. If Confirm Placement Mode is active (and not yet confirmed), stage the tile first
    if (
      this.confirmPlacementMode &&
      !forceCommit &&
      (!this.stagedCoord || this.stagedCoord.r !== r || this.stagedCoord.c !== c)
    ) {
      if (!this.engine.canPlaceAt(r, c)) {
        this.showToast('War-Table tile is obstructed or locked.');
        return;
      }
      this.stagedCoord = { r, c };
      this._handleTileHover({ r, c });
      const coordLabel = formatCoordLabel(r, c);
      this.announceToScreenReader(
        `Tile ${coordLabel} selected. ${this.hoveredPreviewInfo?.summary || ''} Click Confirm Placement or click ${coordLabel} again to deploy.`
      );
      this.render();
      return;
    }

    // 3. Place the 3D sculpted War Champion on `(r, c)`
    this.stagedCoord = null;
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
    if (nextId !== 'belfry_topdown') {
      this.saved3DCameraPreset = nextId;
    }
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
    const hint = computeTacticalHint(this.engine, 'X');
    if (hint) {
      this.seerHintCoord = hint;
      this._handleTileHover({ r: hint.r, c: hint.c });
      this.showToast(`💡 Tactical Hint: ${hint.sentence}`, 4200);
      this.announceToScreenReader(`Tactical Hint: ${hint.sentence}`);
      this.render();
    }
  }

  _renderPerfTelemetryInner(m) {
    return `
      <div class="perf-telemetry-header">
        <span class="gothic-eyebrow">⚡ RUNTIME TELEMETRY & BUDGET</span>
        <span class="perf-status-badge status-${m.status.toLowerCase().replace(/\s+/g, '-')}">${m.status}</span>
      </div>
      <div class="perf-metrics-grid">
        <div><small>FPS / Frame</small><strong class="tabular-num">${m.fps} FPS (${m.avgMs} ms)</strong></div>
        <div><small>P95 Frame</small><strong class="tabular-num">${m.p95Ms} ms / 16.7 ms</strong></div>
        <div><small>GPU Tier</small><strong>${m.gpuTier}</strong></div>
        <div><small>Draw Calls</small><strong class="tabular-num">${m.drawCalls} (${m.triangles} tris)</strong></div>
        <div><small>Assets / Boot</small><strong class="tabular-num">${m.geometries} geo • ${m.bootMs} ms</strong></div>
        <div><small>JS Heap Mem</small><strong class="tabular-num">${
          m.heapMB !== null ? `${m.heapMB} / ${m.heapLimitMB} MB` : 'Within Budget (<64 MB)'
        }</strong></div>
      </div>
    `;
  }

  _renderPerfTelemetryOverlay() {
    const m = this.scene3d?.getPerformanceMetrics
      ? this.scene3d.getPerformanceMetrics()
      : {
          fps: 60,
          avgMs: '16.6',
          p95Ms: '16.7',
          drawCalls: 42,
          triangles: 12400,
          geometries: 28,
          textures: 4,
          heapMB: null,
          heapLimitMB: null,
          bootMs: 180,
          gpuTier: 'Tier 2 (High)',
          status: 'OPTIMAL',
        };
    return `
      <aside id="perf-telemetry-panel" class="perf-telemetry-panel gothic-card-panel" role="region" aria-label="Runtime Performance Telemetry">
        ${this._renderPerfTelemetryInner(m)}
      </aside>
    `;
  }

  render() {
    if (!this.rootEl) return;
    this._syncDocumentDirection();

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
        <div id="gothic-toast-banner" role="status" aria-live="polite" class="gothic-toast ${this.toastMessage ? 'visible' : ''}">
          ${this.toastMessage || ''}
        </div>
        ${this.showPerfOverlay ? this._renderPerfTelemetryOverlay() : ''}
        ${screenHTML}
        ${this.showTutorialModal ? this._renderTutorialModal() : ''}
      </div>
    `;

    this._attachDOMListeners();
  }

  _renderTutorialModal() {
    const steps = [
      {
        title: this.t('I. The 3D War-Table & Longest-Run Scoring', '١. طاولة الحرب ثلاثية الأبعاد وقواعد التسجيل'),
        body: this.t(
          'Deploy your sculpted Champion onto any empty stone tile (Mouse Click or Arrow Keys + Enter/Space). Align 3, 4, or 5 stones in a contiguous line or Sacred Geometry shape (Cross, Diamond, Corner Fortress) to score Victory Points. Only the longest contiguous run along each line direction scores—preventing runaway snowballs!',
          'ضع بطلك المنحوت على أي بلاطة حجرية فارغة (بالماوس أو الأسهم + Enter/Space). شكّل صفاً من ٣ أو ٤ أو ٥ أحجار أو تشكيلات هندسية مقدسة لكسب نقاط النصر. يتم احتساب أطول خط متصل فقط في كل اتجاه لضمان توازن عادل!'
        ),
      },
      {
        title: this.t('II. Turn-1 Hero Active Skill [Q] & War-Horn Ultimate', '٢. المهارة الفعالة للبطل [Q] وبوق الحرب'),
        body: this.t(
          'Every Fantasy Hero commands a unique Turn-1 Active Tactical Skill [Q] usable on ALL stages (including Levels 1–2!) on a 3-turn cooldown, plus a passive trait. Dealing and taking blows charges your War-Horn Ultimate (100%) for a match-turning cataclysm!',
          'يمتلك كل بطل مهارة تكتيكية فعالة منذ الدور الأول [Q] متاحة في جميع المراحل (بما فيها المرحلة ١ و٢!) مع فترة تهدئة ٣ أدوار، بالإضافة إلى قدرة بوق الحرب القصوى عند اكتمال الشحن!'
        ),
      },
      {
        title: this.t('III. Mystery Bone-Chests & Telegraphed Boss Rituals', '٣. صناديق الغنائم وإنذار طقوس القائد'),
        body: this.t(
          'Place a stone adjacent to a Mystery Bone-Chest (📦) to crack it open for deterministic rewards (42% Gold/Aegis, 24% Wild Joker, 15% Siege Bomb, 7% Sanctified Mosaic, 12% Scroll/Horn). Watch for Crimson Telegraph Warnings—enemy Commanders telegraph their ritual target 1 full turn ahead so you can block or shield it!',
          'ضع حجراً بجانب صندوق الغنائم (📦) لفتحه وكسب مكافآت فورية. انتبه للتحذيرات القرمزية: يكشف قادة الأعداء عن هدف طقوسهم قبل دور كامل لتتمكن من صده أو حمايته بالدرع!'
        ),
      },
      {
        title: this.t('IV. Level 3+ War-Scroll Shop, Deckbuilder & Daily Seed', '٤. متجر المخطوطات وبناء المجموعة والتحدي اليومي'),
        body: this.t(
          'Levels 1 & 2 are pure tactical board warmups. Starting at Level 3, earn Gold Coins to buy from the 3-Slot War-Scroll Shop (bought scrolls cast for FREE!). Customize your 40-Scroll Deck in the Cards Grimoire and compete in the Daily Seed Challenge!',
          'المرحلتان ١ و٢ مخصصتان للتكتيك الصافي. ابتداءً من المرحلة ٣، يفتح متجر المخطوطات ذو الـ ٣ خانات (المخطوطات المشتراة تُفعّل مجاناً!). خصّص مجموعتك من بين ٤٠ مخطوطة ونافس في التحدي اليومي!'
        ),
      },
    ];
    const step = steps[this.tutorialStep] || steps[0];
    return `
      <div class="story-modal-backdrop" role="dialog" aria-modal="true" aria-label="Interactive Tutorial" data-action="close-tutorial">
        <div class="story-storyboard-modal tutorial-modal gothic-card-panel" onclick="event.stopPropagation()">
          <div class="storyboard-header">
            <span class="gothic-eyebrow">${renderGothicIconSVG('book')} ${this.t('TACTICAL COMMANDER TUTORIAL', 'دليل القائد التكتيكي')} (${this.tutorialStep + 1}/${steps.length})</span>
            <button class="icon-btn" data-action="close-tutorial" aria-label="Close Tutorial">${renderGothicIconSVG('close')}</button>
          </div>
          <div class="tutorial-step-body">
            <h3>${step.title}</h3>
            <p>${step.body}</p>
            <div class="tutorial-kbd-strip">
              <span><kbd>Arrow Keys</kbd> + <kbd>Enter</kbd> ${this.t('Keyboard Play', 'اللعب بلوحة المفاتيح')}</span>
              <span><kbd>Q</kbd> ${this.t('Hero Skill', 'مهارة البطل')}</span>
              <span><kbd>1-5</kbd> ${this.t('War-Scrolls', 'المخطوطات')}</span>
              <span><kbd>Z</kbd> ${this.t('Undo (3/Match)', 'تراجع (٣/مباراة)')}</span>
              <span><kbd>C</kbd> ${this.t('Camera View', 'زاوية الكاميرا')}</span>
            </div>
          </div>
          <div class="tutorial-footer-actions">
            <button class="btn-gothic-secondary" ${this.tutorialStep === 0 ? 'disabled' : ''} data-action="tutorial-prev">
              ${this.t('Previous', 'السابق')}
            </button>
            <div class="boss-progress-dots">
              ${steps.map((_, idx) => `<span class="chapter-dot ${idx === this.tutorialStep ? 'current' : idx < this.tutorialStep ? 'done' : ''}"></span>`).join('')}
            </div>
            ${
              this.tutorialStep < steps.length - 1
                ? `<button class="btn-gothic-primary" data-action="tutorial-next">${this.t('Next Tip', 'التالي')}</button>`
                : `<button class="btn-gothic-primary" data-action="close-tutorial">${this.t('Enter the War-Table', 'ابدأ المعركة')}</button>`
            }
          </div>
        </div>
      </div>
    `;
  }

  _renderTopNav(activeTab) {
    const state = this.save.getState();
    const hero = getFantasyHeroById(state.selectedHeroId);
    const nextLvlNum = state.highestUnlockedLevel || 1;
    const totalStars = Object.values(state.completedLevels || {}).reduce((a, b) => a + b, 0);
    const qPreset = (state.qualityPreset || 'high').toUpperCase();
    const langLabel = state.language === 'ar' ? 'EN' : 'عربي';
    return `
      <header class="sanctum-topbar">
        <div class="brand-cluster" data-action="nav" data-screen="hub" role="button" tabindex="0" aria-label="XcardO Home" title="XcardO Home">
          <img src="assets/logo-xcardo-nav.png" alt="XCARDO" class="brand-logo-nav" />
          <span class="sr-only">XCARDO</span>
        </div>

        <nav class="sanctum-nav-tabs" aria-label="Main Navigation">
          <button class="nav-tab-btn nav-play-cta" data-action="start-level" data-level="${nextLvlNum}" title="Start Battle Stage #${nextLvlNum}">
            ${renderGothicIconSVG('sword')}
            <span>${this.t('Play', 'العب')}</span>
          </button>
          <button class="nav-tab-btn ${activeTab === 'hub' ? 'active' : ''}" ${activeTab === 'hub' ? 'aria-current="page"' : ''} data-action="nav" data-screen="hub">
            ${renderGothicIconSVG('castle')}
            <span>${this.t('Home', 'الرئيسية')}</span>
          </button>
          <button class="nav-tab-btn ${activeTab === 'campaign' ? 'active' : ''}" ${activeTab === 'campaign' ? 'aria-current="page"' : ''} data-action="nav" data-screen="campaign">
            ${renderGothicIconSVG('map')}
            <span>${this.t('Map', 'الخريطة')}</span>
          </button>
          <button class="nav-tab-btn ${activeTab === 'reliquary' ? 'active' : ''}" ${activeTab === 'reliquary' ? 'aria-current="page"' : ''} data-action="nav" data-screen="reliquary">
            ${renderGothicIconSVG('crown')}
            <span>${this.t('Heroes', 'الأبطال')}</span>
          </button>
          <button class="nav-tab-btn ${activeTab === 'codex' ? 'active' : ''}" ${activeTab === 'codex' ? 'aria-current="page"' : ''} data-action="nav" data-screen="codex">
            ${renderGothicIconSVG('scroll')}
            <span>${this.t('Cards', 'البطاقات')}</span>
          </button>
          <button class="nav-tab-btn ${activeTab === 'skirmish' || activeTab === 'crypt' ? 'active' : ''}" ${activeTab === 'skirmish' || activeTab === 'crypt' ? 'aria-current="page"' : ''} data-action="nav" data-screen="skirmish">
            ${renderGothicIconSVG('dice')}
            <span>${this.t('Modes', 'الأطوار')}</span>
          </button>
        </nav>

        <div class="sanctum-currencies">
          <div class="currency-pill" title="Active Champion: ${hero.name}">
            ${renderGothicIconSVG('crown')}
            <span>${hero.shortName.split(' ').pop()}</span>
          </div>
          <div class="currency-pill" title="Campaign Stars Earned">
            ${renderGothicIconSVG('star')}
            <span class="tabular-num">${totalStars}</span>
          </div>
          <div class="currency-pill" title="Reliquary Sigils">
            ${renderGothicIconSVG('sigil')}
            <span class="tabular-num">${state.reliquarySigils}</span>
          </div>
          <button class="icon-btn ${this.showPerfOverlay ? 'active' : ''}" data-action="toggle-perf" aria-label="Toggle Performance Telemetry (Shortcut: F3)" title="Performance Budget & Telemetry (F3)">
            <span class="btn-badge-txt">FPS</span>
          </button>
          <button class="icon-btn" data-action="cycle-quality" aria-label="Graphics Quality: ${qPreset}" title="Graphics Quality: ${qPreset}">
            <span class="btn-badge-txt">${qPreset[0]}</span>
          </button>
          <button class="icon-btn" data-action="toggle-lang" aria-label="Switch Language (Arabic / English)" title="Switch Language (AR / EN)">
            <span class="btn-badge-txt">${langLabel}</span>
          </button>
          <button class="icon-btn" data-action="toggle-tutorial" aria-label="Open Tactical Tutorial" title="Tactical Tutorial (?)">
            <span class="btn-badge-txt">?</span>
          </button>
          <button class="icon-btn" data-action="cycle-camera" aria-label="Switch 3D Camera (Shortcut: C)" title="Switch 3D Camera (C)">
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
              ${this.t(`CHAPTER ${currentAct.roman} • ${shortActTitle.toUpperCase()}`, `الفصل ${currentAct.roman} • ${shortActTitle.toUpperCase()}`)}
            </span>
            <button class="ribbon-story-btn" data-action="toggle-story-modal" title="View Chapter Storyboard">
              ${renderGothicIconSVG('book')}
              <span>${this.t('Story', 'القصة')}</span>
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
                <span class="visual-role-pill" style="color:${hero.accent}">${this.t('YOUR CHAMPION', 'بطلك المختار')}</span>
                <h2 class="visual-char-name">${hero.shortName}</h2>
                <span class="visual-passive-chip">${renderGothicIconSVG('bolt')} <span>${hero.activeAbility?.name || hero.shortPassive}</span></span>
              </div>
            </div>

            <div class="visual-avatar-strip" role="radiogroup" aria-label="Switch Champion">
              ${FANTASY_HEROES.map(
                (h) => `
                  <button class="visual-avatar-btn ${h.id === hero.id ? 'active' : ''}" role="radio" aria-checked="${h.id === hero.id}" aria-label="${h.name}" data-action="select-hero" data-hero="${h.id}" title="${h.name} — ${h.activeAbility?.name}: ${h.activeAbility?.desc}" style="--char-color:${h.color}">
                    ${renderFantasyHeroPortraitSVG(h.id, h.color)}
                  </button>
                `
              ).join('')}
            </div>
          </div>

          <!-- CENTER: ICONIC PLAY STAGE BUTTON, CAMERA PILLS & 4 QUICK TILES -->
          <div class="hub-center-action-pod">
            <div class="stage-visual-chips">
              <span class="stage-chip">${this.t(`STAGE #${nextLevel.level}`, `المرحلة #${nextLevel.level}`)}</span>
              <span class="stage-chip">${nextLevel.boardSize}×${nextLevel.boardSize}</span>
              <span class="stage-chip ${nextLevel.cardsEnabled ? 'chip-shop' : 'chip-pure'}">
                ${nextLevel.cardsEnabled ? `${renderGothicIconSVG('shop')} <span>${this.t('Shop Open', 'المتجر مفتوح')}</span>` : `${renderGothicIconSVG('leaf')} <span>${this.t('Pure Board', 'تكتيك صافي')}</span>`}
              </span>
            </div>

            <button class="btn-gothic-primary btn-play-monumental" data-action="start-level" data-level="${nextLevel.level}">
              ${renderGothicIconSVG('sword')}
              <span>${this.t(`PLAY STAGE #${nextLevel.level}`, `العب المرحلة #${nextLevel.level}`)}</span>
            </button>

            <div class="hub-mini-tiles-row">
              <button class="mini-visual-tile" data-action="nav" data-screen="campaign" title="Campaign Map">
                <span class="tile-svg-icon">${renderGothicIconSVG('map')}</span>
                <small>${this.t('Map', 'الخريطة')}</small>
              </button>
              <button class="mini-visual-tile" data-action="nav" data-screen="skirmish" title="Game Modes & Daily Seed">
                <span class="tile-svg-icon">${renderGothicIconSVG('dice')}</span>
                <small>${this.t('Modes', 'الأطوار')}</small>
              </button>
              <button class="mini-visual-tile" data-action="nav" data-screen="reliquary" title="Heroes & 3D Relics">
                <span class="tile-svg-icon">${renderGothicIconSVG('crown')}</span>
                <small>${this.t('Forge', 'الحدادة')}</small>
              </button>
              <button class="mini-visual-tile" data-action="demo-shatter" title="Test 3D Stone Shatter Physics">
                <span class="tile-svg-icon">${renderGothicIconSVG('spark')}</span>
                <small>${this.t('Shatter', 'تحطيم')}</small>
              </button>
            </div>

            <div class="hub-camera-bar" role="group" aria-label="3D Camera Presets">
              <span class="hub-cam-label">${renderGothicIconSVG('camera')} ${this.t('View:', 'الكاميرا:')}</span>
              ${CAMERA_PRESETS.map(
                (p) => `
                  <button class="hub-cam-pill ${state.cameraPreset === p.id ? 'active' : ''}" data-action="set-camera" data-cam="${p.id}" title="${p.name}">
                    ${p.name.split(' ')[0]}
                  </button>
                `
              ).join('')}
            </div>
          </div>

          <!-- RIGHT: RIVAL WARLORD VISUAL MEDALLION -->
          <div class="gothic-card-panel hub-journey-card visual-boss-card">
            <div class="visual-duel-row boss-duel-row">
              <div class="visual-char-info boss-char-info">
                <span class="visual-role-pill enemy-pill">${this.t('CHAPTER RIVAL', 'خصم الفصل')}</span>
                <h2 class="visual-char-name">${currentBoss.name}</h2>
                <span class="visual-passive-chip enemy-chip">${renderGothicIconSVG('sword')} <span>${nextLevel.name}</span></span>
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
              <div class="story-modal-backdrop" role="dialog" aria-modal="true" aria-label="Chapter Story Chronicle" data-action="toggle-story-modal">
                <div class="story-storyboard-modal gothic-card-panel" onclick="event.stopPropagation()">
                  <div class="storyboard-header">
                    <span class="gothic-eyebrow">${renderGothicIconSVG('book')} VISUAL STORY CHRONICLE • CHAPTER ${currentAct.roman}</span>
                    <button class="icon-btn" data-action="toggle-story-modal" aria-label="Close Story Modal">${renderGothicIconSVG('close')}</button>
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
                      <p>${currentAct.storyGoal}</p>
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
    const nextLvlNum = state.highestUnlockedLevel || 1;
    const nextLvl = getLevelByNumber(nextLvlNum);
    const act = CATHEDRAL_ACTS.find((a) => a.id === this.selectedActId) || CATHEDRAL_ACTS[0];
    const boss = INQUISITOR_BOSSES.find((b) => b.id === act.bossId) || INQUISITOR_BOSSES[0];
    const actLevels = CATHEDRAL_LEVELS.filter((l) => l.actId === act.id);
    const selectedBoon = state.selectedBoon || 'boon_shrine_aegis';

    return `
      ${this._renderTopNav('campaign')}
      <section class="modal-screen-container gothic-card-panel">
        <div class="screen-header-row">
          <div>
            <div class="gothic-eyebrow">36-LEVEL TACTICAL EXPEDITION MAP • SCANNABLE STAGE BRIEFINGS</div>
            <h2>${this.t('Campaign Strongholds, Doctrines & Rewards', 'خريطة الحملة والعقائد القتالية والمكافآت')}</h2>
          </div>
          <div class="act-selector-tabs">
            ${CATHEDRAL_ACTS.map(
              (a) => `
                <button class="act-tab ${a.id === act.id ? 'active' : ''}" data-action="select-act" data-act="${a.id}">
                  <span>CHAPTER ${a.roman}</span>
                  <small>${a.name.replace(/^Chapter [IVX]+:\s*/i, '')}</small>
                </button>
              `
            ).join('')}
          </div>
        </div>

        <!-- VISIBLE NEXT-ACTION PATH BANNER -->
        <div class="campaign-next-action-banner">
          <div class="next-action-left">
            <span class="next-action-badge">NEXT RECOMMENDED ACTION</span>
            <div>
              <strong>Stage #${nextLvl.level}: ${nextLvl.name}</strong>
              <span>${nextLvl.objectiveLabel} • ${nextLvl.boardSize}×${nextLvl.boardSize} Grid • ${nextLvl.doctrine?.badge || `Tier ${nextLvl.aiTier}`} • Unlock: ${nextLvl.nextUnlockLabel}</span>
            </div>
          </div>
          <button class="btn-gothic-primary" data-action="start-level" data-level="${nextLvl.level}">
            ${renderGothicIconSVG('sword')} Continue Stage #${nextLvl.level}
          </button>
        </div>

        <!-- ROGUELIKE ACT EXPEDITION BOON WAYPOINTS -->
        <div class="roguelike-boons-bar">
          <div class="gothic-eyebrow">${renderGothicIconSVG('compass')} ${this.t('ACTIVE EXPEDITION WAYPOINT BOON (APPLIES TO ALL STAGES)', 'بركة معسكر الحملة النشطة')}</div>
          <div class="roguelike-boons-grid">
            ${ROGUELIKE_BOONS.map((boon) => {
              const isSelected = selectedBoon === boon.id;
              return `
                <button class="roguelike-boon-card ${isSelected ? 'active' : ''}" data-action="select-boon" data-boon="${boon.id}">
                  <span class="boon-icon">${renderGothicIconSVG('sigil')}</span>
                  <div class="boon-copy">
                    <strong>${boon.name}</strong>
                    <small>${boon.desc}</small>
                  </div>
                </button>
              `;
            }).join('')}
          </div>
        </div>

        <!-- COLLAPSIBLE "READ STORY" DRAWER (KEEPS MAP SCANNABLE FIRST) -->
        <details class="story-lore-drawer">
          <summary class="story-lore-summary">
            <span>${renderGothicIconSVG('book')} <strong>Read Story & Chapter Lore:</strong> Chapter ${act.roman} (${act.name}) — Rival Commander ${boss.name}</span>
            <span class="drawer-toggle-hint">Click to Expand / Collapse Chronicle</span>
          </summary>
          <div class="act-story-showcase">
            <div class="act-story-narrative-box">
              <div class="gothic-eyebrow">CHAPTER ${act.roman}: ${act.name.toUpperCase()} — ${act.subtitle.toUpperCase()}</div>
              <p class="act-story-paragraph">${act.storySummary || act.lore}</p>
              <div class="act-story-goal">
                <span>${renderGothicIconSVG('target')} <strong>Mission Objective:</strong> ${act.storyGoal || 'Triumph across all 6 stages to reclaim the Chapter Star-Stone.'}</span>
              </div>
              <div class="act-hero-companion-note">
                <span>${renderGothicIconSVG('crown')} <strong>${hero.shortName}:</strong> "${hero.storyCounsel}"</span>
              </div>
            </div>

            <div class="act-boss-banner">
              <div class="act-boss-crest">${renderBossCrestSVG(boss.id, boss.color)}</div>
              <div class="act-boss-info">
                <div class="gothic-eyebrow">RIVAL CHAPTER COMMANDER</div>
                <h3>${boss.name} — <span>${boss.title}</span></h3>
                <p class="act-boss-quote">${boss.quote}</p>
                <div class="act-boss-passive"><strong>Commander Trait (Telegraphed 1T Ahead):</strong> ${boss.passiveDesc}</div>
              </div>
            </div>
          </div>
        </details>

        <!-- SCANNABLE STAGE CARDS -->
        <div class="campaign-nodes-grid">
          ${actLevels
            .map((lvl) => {
              const unlocked = lvl.level <= nextLvlNum;
              const isNext = lvl.level === nextLvlNum;
              const stars = (state.completedLevels && state.completedLevels[lvl.level]) || 0;
              return `
                <div class="campaign-node-card ${unlocked ? 'unlocked' : 'locked'} ${
                lvl.isBossLevel ? 'boss-node' : ''
              } ${isNext ? 'next-stage-highlight' : ''}">
                  <div class="node-top">
                    <span class="node-num">
                      STAGE #${lvl.level} ${lvl.isBossLevel ? '• BOSS FINALE' : ''}
                      ${isNext ? '<em class="node-next-pill">NEXT</em>' : ''}
                    </span>
                    <span class="node-stars" aria-label="${stars} of 3 stars">${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}</span>
                  </div>
                  <h4>${lvl.name}</h4>

                  <dl class="node-scannable-grid">
                    <div>
                      <dt>Objective</dt>
                      <dd>${lvl.objectiveLabel || `Reach ${lvl.targetScore} VP`}</dd>
                    </div>
                    <div>
                      <dt>Board Size</dt>
                      <dd>${lvl.boardSize}×${lvl.boardSize} Grid (${lvl.cardsEnabled ? 'Shop Open' : 'Pure Board'})</dd>
                    </div>
                    <div>
                      <dt>Enemy Doctrine</dt>
                      <dd title="${lvl.doctrine?.summary || ''}">${lvl.doctrine?.badge || `Tier ${lvl.aiTier}`} · ${lvl.enemyRuleLabel}</dd>
                    </div>
                    <div>
                      <dt>Clear Reward</dt>
                      <dd>${lvl.rewardLabel}</dd>
                    </div>
                    <div>
                      <dt>First-Clear</dt>
                      <dd>${stars > 0 ? '✓ Claimed' : lvl.firstClearReward}</dd>
                    </div>
                    <div>
                      <dt>Next Unlock</dt>
                      <dd>${lvl.nextUnlockLabel}</dd>
                    </div>
                  </dl>

                  <button class="btn-gothic-primary" ${
                    unlocked ? '' : 'disabled'
                  } data-action="start-level" data-level="${lvl.level}">
                    ${unlocked ? (lvl.isBossLevel ? '⚔️ Challenge Commander' : isNext ? `▶ Play Stage #${lvl.level}` : `Replay Stage #${lvl.level}`) : `🔒 Complete Stage #${lvl.level - 1}`}
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
        <div class="gothic-eyebrow">RELIQUARY ATELIER • CHAMPIONS, COMPARISON TRAY & 3D WAR-FORGE</div>
        <h2>Playable Fantasy War Heroes, Turn-1 Active Skills & Sacred Relics</h2>

        <!-- HERO COMPARISON TRAY (RECOGNITION OVER RECALL) -->
        <div class="hero-comparison-tray gothic-card-panel" role="region" aria-label="Hero Passive & Loadout Comparison Tray">
          <div class="gothic-eyebrow">⚖️ QUICK CHAMPION COMPARISON TRAY — STARTING STATS, PASSIVE TRIGGERS & BEST FIT</div>
          <div class="comparison-table-wrap">
            <table class="hero-comparison-table">
              <thead>
                <tr>
                  <th>Champion</th>
                  <th>Playstyle Tag</th>
                  <th>Starting Stats</th>
                  <th>Passive Trigger</th>
                  <th>Turn-1 Skill [Q]</th>
                  <th>Best For</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                ${FANTASY_HEROES.map((h) => {
                  const isSel = state.selectedHeroId === h.id;
                  return `
                    <tr class="${isSel ? 'active-row' : ''}">
                      <td><strong style="color:${h.accent}">${h.shortName}</strong><br/><small>${h.classTitle}</small></td>
                      <td><span class="spec-badge">${h.playstyleTag}</span></td>
                      <td>${h.startingStats}</td>
                      <td>${h.passiveTrigger}</td>
                      <td><strong>${h.activeAbility?.name}</strong> (${h.activeAbility?.cooldown || 3}T CD)</td>
                      <td>${h.bestFor}</td>
                      <td>
                        <button class="btn-gothic-small ${isSel ? 'deck-active' : ''}" data-action="select-hero" data-hero="${h.id}">
                          ${isSel ? '✓ Equipped' : 'Select'}
                        </button>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>

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
                    <span class="char-class-badge" style="color:${hero.accent}">${hero.classTitle} • ${hero.playstyleTag}</span>
                    <h4>${hero.name}</h4>
                    <div class="char-title-sub">${hero.title} · <em>${hero.weapon}</em></div>
                  </div>
                </div>
                <div class="hero-quick-specs">
                  <span><strong>Stats:</strong> ${hero.startingStats}</span>
                  <span><strong>Trigger:</strong> ${hero.passiveTrigger}</span>
                  <span><strong>Best For:</strong> ${hero.bestFor}</span>
                </div>
                <div class="char-passive-box">
                  <strong>Passive:</strong> ${hero.passiveDesc}<br/>
                  <strong>⚡ Turn-1 Active Skill [Q] (${hero.activeAbility?.cooldown || 3}T CD):</strong> ${hero.activeAbility?.name} — ${hero.activeAbility?.desc}
                </div>
                <button class="btn-gothic-secondary" data-action="select-hero" data-hero="${hero.id}">
                  ${selected ? '✓ Active War Champion' : 'Select War Champion'}
                </button>
              </div>
            `;
          }).join('')}
        </div>

        <h3 class="reliquary-section-title">2. Sacred War Relics (Equip Up to 2 Passives • Full Tactical Specs & Previews)</h3>
        <div class="reliquary-grid">
          ${BLOOD_OATHS.map((oath) => {
            const unlocked = state.unlockedOaths.includes(oath.id);
            const equipped = state.equippedOaths.includes(oath.id);
            const spec = getRelicTacticalSpec(oath);
            return `
              <div class="reliquary-item-card relic-spec-card ${equipped ? 'equipped' : ''}">
                <div class="relic-card-top">
                  <div>
                    <span class="spec-rarity-pill rarity-${spec.rarity.toLowerCase()}">${spec.rarity} Relic · ${oath.cost === 0 ? 'Starter' : `${oath.cost} Sigils`}</span>
                    <h4>${oath.name}</h4>
                  </div>
                  <div class="mini-preview-box" title="Board Formation / Trigger Preview">
                    ${renderMiniBoardPreviewSVG(spec.previewCells, spec.previewMode)}
                  </div>
                </div>
                <p>${oath.desc}</p>
                <dl class="card-tactical-specs">
                  <div><dt>Timing</dt><dd>${spec.timing}</dd></div>
                  <div><dt>Target</dt><dd>${spec.targetRule}</dd></div>
                  <div><dt>Counterplay</dt><dd>${spec.counterplay}</dd></div>
                </dl>
                <button class="btn-gothic-secondary" data-action="toggle-oath" data-id="${oath.id}" data-cost="${oath.cost}">
                  ${equipped ? 'Active Relic (Unequip)' : unlocked ? 'Equip Relic' : `Claim (${oath.cost} Sigils)`}
                </button>
              </div>
            `;
          }).join('')}
        </div>

        <h3 class="reliquary-section-title">3. 3D Sculpted War Miniatures</h3>
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
    const customDeck = state.customDeck || [];
    const deckActive = customDeck.length >= (GAME_CONFIG.MIN_CUSTOM_DECK_SIZE || 8);
    return `
      ${this._renderTopNav('codex')}
      <section class="modal-screen-container gothic-card-panel">
        <div class="screen-header-row">
          <div>
            <div class="gothic-eyebrow">40 WAR-SCROLLS • COST, TIMING, TARGET RULES, COUNTERPLAY & MINI BOARD PREVIEWS</div>
            <h2>Grimoire of the War-Table (40 Scrolls • Shop Unlocks at Level 3)</h2>
            <p class="screen-sub-note">
              <strong>📜 Custom Deck-Builder:</strong> ${customDeck.length} Scrolls Selected
              (${deckActive ? '✓ Custom Deck Active in Shop & Draws!' : `Select at least ${GAME_CONFIG.MIN_CUSTOM_DECK_SIZE || 8} Scrolls to activate your custom deck, or leave < 8 to use all unlocked scrolls`})
            </p>
          </div>
          ${
            customDeck.length > 0
              ? `<button class="btn-gothic-secondary" data-action="clear-custom-deck">Reset Custom Deck (${customDeck.length})</button>`
              : ''
          }
        </div>

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
            const inDeck = customDeck.includes(card.id);
            const spec = getCardTacticalSpec(card);
            return `
              <div class="codex-tarot-card ${exalted ? 'exalted' : ''} ${inDeck ? 'in-custom-deck' : ''}">
                <div class="codex-tarot-top">
                  <span class="tarot-num">${card.numeral} · Lvl ${card.unlockLevel || 3}+</span>
                  <span class="spec-rarity-pill rarity-${spec.rarity.toLowerCase()}">${spec.rarity}</span>
                  <span class="tarot-cost">🪙 ${card.cost}G</span>
                </div>
                <div class="codex-art-and-preview">
                  <div class="codex-tarot-art">${renderTarotArtSVG(card)}</div>
                  <div class="mini-preview-box" title="Tactical Board Target Preview">
                    ${renderMiniBoardPreviewSVG(spec.previewCells, spec.previewMode)}
                    <small>Target Grid</small>
                  </div>
                </div>
                <h4>${card.name} ${exalted ? '<span class="exalt-badge">[+]</span>' : ''}</h4>
                <p>${exalted ? card.exaltedDesc : card.desc}</p>
                <dl class="card-tactical-specs">
                  <div><dt>Timing</dt><dd>${spec.timing}</dd></div>
                  <div><dt>Target</dt><dd>${spec.targetRule}</dd></div>
                  <div><dt>Counterplay</dt><dd>${spec.counterplay}</dd></div>
                </dl>
                <div class="codex-card-actions">
                  <button class="btn-gothic-small ${inDeck ? 'deck-active' : ''}" data-action="toggle-deck-card" data-card="${card.id}">
                    ${inDeck ? '✓ In Custom Deck' : '+ Add to Deck'}
                  </button>
                  <button class="btn-gothic-small" ${exalted ? 'disabled' : ''} data-action="exalt-card" data-card="${card.id}">
                    ${exalted ? 'Exalted [+]' : 'Exalt (150)'}
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </section>
    `;
  }

  _renderSkirmishScreen() {
    const state = this.save.getState();
    const dailySeed = SeededRNG.dailySeedString();
    const dailyRecord = state.dailyBestScores?.[dailySeed] || null;
    const allDailyEntries = Object.entries(state.dailyBestScores || {})
      .sort((a, b) => (b[1].composite || 0) - (a[1].composite || 0))
      .slice(0, 5);
    const activeDoctrine = getWarlordDoctrineByTier(this.skirmishConfig.aiTier || 3);

    return `
      ${this._renderTopNav('skirmish')}
      <section class="modal-screen-container gothic-card-panel skirmish-panel">
        <div class="screen-header-row">
          <div>
            <div class="gothic-eyebrow">DAILY SEED LEADERBOARD, WARLORD DOCTRINES & TACTICAL PUZZLES</div>
            <h2>Custom 3D War-Table Duel, Daily Seed & 1-Turn Trials</h2>
          </div>
          <div class="act-selector-tabs">
            <button class="act-tab active" data-action="nav" data-screen="skirmish">
              <span>🎲 Custom & Daily Seed</span>
              <small>AI Doctrines, 2P & Leaderboard</small>
            </button>
            <button class="act-tab" data-action="nav" data-screen="crypt">
              <span>🧩 5 Puzzle Trials</span>
              <small>1-Turn Brainteasers</small>
            </button>
          </div>
        </div>

        <!-- DAILY SEED CHALLENGE & LEADERBOARD SHOWCASE -->
        <div class="daily-seed-showcase gothic-card-panel">
          <div class="daily-seed-info">
            <div class="gothic-eyebrow">🏆 DETERMINISTIC DAILY SEED CHALLENGE • ${dailySeed}</div>
            <h3>Today's Seeded War-Table Gauntlet (5×5 • Target 8 VP • Tier 4 Pyromancer Doctrine)</h3>
            <p>Every Commander worldwide faces the exact same Mystery Chest rolls, Shop offerings, and AI opening under seed <strong>${dailySeed}</strong>.</p>
            <div class="daily-record-pills">
              <span class="stage-chip">
                ${
                  dailyRecord
                    ? `★ Today's Personal Best: ${dailyRecord.score} VP in ${dailyRecord.turns} Turns`
                    : '☆ Not Completed Today — Claim +125 Sigils!'
                }
              </span>
              ${allDailyEntries
                .map(
                  ([seed, rec]) =>
                    `<span class="stage-chip">${seed.replace('DAILY-', '')}: <strong>${rec.score} VP</strong> (${rec.turns}T)</span>`
                )
                .join('')}
            </div>
          </div>
          <button class="btn-gothic-primary" data-action="start-daily-seed">
            ${renderGothicIconSVG('sword')} Play Daily Seed (${dailySeed})
          </button>
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
            <label>Enemy Warlord Doctrine (Readable AI Personality)</label>
            <div class="pill-group">
              ${Object.values(WARLORD_DOCTRINES)
                .map(
                  (doc) => `
                    <button class="cam-pill ${this.skirmishConfig.aiTier === doc.tier ? 'active' : ''}" data-action="skirmish-set" data-key="aiTier" data-val="${doc.tier}" title="${doc.summary}">
                      ${doc.badge}
                    </button>
                  `
                )
                .join('')}
            </div>
            <p class="doctrine-preview-note">
              <strong>${activeDoctrine.badge}:</strong> ${activeDoctrine.summary}
            </p>
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
    const heroCalloutName = hero.shortName.split(' ').pop();
    const boss = snap.boss || INQUISITOR_BOSSES[0];
    const doctrine = snap.doctrine || getWarlordDoctrineByTier(snap.aiTier || 1);
    const xPct = Math.min(100, Math.round((snap.scores.X / snap.targetScore) * 100));
    const oPct = Math.min(100, Math.round((snap.scores.O / snap.targetScore) * 100));
    const bellReady = !snap.bellUsedThisMatch.X && snap.bellCharge.X >= 100;
    const ability = hero.activeAbility;
    const abilityCd = snap.heroAbilityCooldown?.X || 0;
    const abilityReady = snap.canUseHeroAbility;
    const pulseX = this.scorePulse.X ? 'score-pulse' : '';
    const pulseO = this.scorePulse.O ? 'score-pulse' : '';
    this.scorePulse = { X: false, O: false };

    const selectedInst =
      this.engine.selectedCardIndex !== null
        ? snap.hands.X[this.engine.selectedCardIndex]
        : null;
    const selectedCard = selectedInst ? selectedInst.card : null;

    // Advance 5-step Stage 1 Guided Onboarding based on live board state
    if (snap.mode === 'campaign' && snap.levelNumber === 1) {
      if (snap.turnNumber === 1 && snap.moveHistory.length === 0) {
        this.onboardingStep = 1;
      } else if (snap.turnNumber === 2 && this.onboardingStep < 3) {
        this.onboardingStep = 3;
        this.showThreatScan = true;
      } else if (snap.turnNumber >= 3 && this.onboardingStep < 4) {
        this.onboardingStep = 4;
      }
    }

    // Threat & Hint Overlay lookup sets for the Parallel DOM Board Grid
    const threatData = this.showThreatScan
      ? getThreatOverlayData(this.engine, 'O')
      : { blockCells: [], lineCells: [] };
    const blockSet = new Set(threatData.blockCells.map((t) => `${t.r},${t.c}`));
    const lineSet = new Set(threatData.lineCells.map((t) => `${t.r},${t.c}`));
    const expectedLineSet = new Set(
      (this.seerHintCoord?.expectedLineCells || []).map((t) =>
        Array.isArray(t) ? `${t[0]},${t[1]}` : `${t.r},${t.c}`
      )
    );

    let actionPromptHTML = '';
    if (snap.selectedHeroAbility && ability) {
      actionPromptHTML = `
        <div class="tactical-action-prompt prompt-targeting">
          <span class="prompt-pulse-dot targeting-dot"></span>
          <span>${renderGothicIconSVG('bolt')} <strong>${ability.name}:</strong> ${ability.desc} — Click a target tile on the board</span>
          <button class="prompt-cancel-chip" data-action="cancel-card">Cancel [Esc]</button>
        </div>
      `;
    } else if (selectedCard) {
      actionPromptHTML = `
        <div class="tactical-action-prompt prompt-targeting">
          <span class="prompt-pulse-dot targeting-dot"></span>
          <span><strong>Targeting ${selectedCard.name}:</strong> Click a valid tile on the board</span>
          <button class="prompt-cancel-chip" data-action="cancel-card">Cancel [Esc]</button>
        </div>
      `;
    } else if (snap.pendingBossRitual && snap.activePlayer === 'X') {
      actionPromptHTML = `
        <div class="tactical-action-prompt prompt-targeting">
          <span class="prompt-pulse-dot enemy-dot"></span>
          <span><strong>${snap.pendingBossRitual.warningText}</strong></span>
        </div>
      `;
    } else if (this.seerHintCoord?.sentence && snap.activePlayer === 'X') {
      actionPromptHTML = `
        <div class="tactical-action-prompt prompt-player">
          <span class="prompt-pulse-dot player-dot"></span>
          <span>${renderGothicIconSVG('eye')} <strong>Tactical Hint (${this.seerHintCoord.coordLabel}):</strong> ${this.seerHintCoord.sentence}</span>
        </div>
      `;
    } else if (snap.mode === 'campaign' && snap.levelNumber === 1 && snap.activePlayer === 'X') {
      const stepMessages = {
        1: `Step 1/5: Click highlighted center tile C3 ("Place ${heroCalloutName} here") or press Enter to command the War-Table.`,
        2: `Step 2/5: Preview your line & VP delta before confirming placement.`,
        3: `Step 3/5: Enemy Threat Scan active! Amber tiles show ${boss.name}'s line; Red tiles mark critical blocks.`,
        4: `Step 4/5: Complete a 3-stone line (+1 VP & Shatter) or press [Q] to unleash ${hero.shortName}'s ${ability?.name || 'Skill'}!`,
      };
      actionPromptHTML = `
        <div class="tactical-action-prompt prompt-player">
          <span class="prompt-pulse-dot player-dot"></span>
          <span>${renderGothicIconSVG('target')} <strong>Guided Battle:</strong> ${stepMessages[this.onboardingStep] || stepMessages[4]}</span>
        </div>
      `;
    } else if (snap.activePlayer === 'X') {
      actionPromptHTML = `
        <div class="tactical-action-prompt prompt-player">
          <span class="prompt-pulse-dot player-dot"></span>
          <span><strong>${this.t('Your Turn:', 'دورك:')}</strong> ${this.t('Select any empty tile (Click or Arrow Keys + Enter) to deploy your Champion', 'اختر أي بلاطة فارغة (بالنقر أو الأسهم + Enter) لنشر بطلك')}</span>
        </div>
      `;
    } else {
      actionPromptHTML = `
        <div class="tactical-action-prompt prompt-enemy">
          <span class="prompt-pulse-dot enemy-dot"></span>
          <span><strong>${boss.name} (${doctrine.title})</strong> ${this.t('is executing battle doctrine...', 'ينفذ عقيدته القتالية...')}</span>
        </div>
      `;
    }

    const previewSummary =
      this.stagedCoord && snap.activePlayer === 'X'
        ? this._computeHoverPreviewSummary(this.stagedCoord.r, this.stagedCoord.c)
        : this.hoveredPreviewInfo;

    const previewFirstScrolls = ARCANA_CARDS.slice(0, 3);

    return `
      <header class="battle-hud-topbar">
        <!-- PLAYER FANTASY WAR HERO WING -->
        <div class="hud-wing player-wing ${snap.activePlayer === 'X' ? 'active-turn' : ''}">
          <div class="hud-commander-row">
            <div class="hud-commander-avatar player-avatar" style="--char-color:${hero.color}">
              ${renderFantasyHeroPortraitSVG(hero.id, hero.color)}
            </div>
            <div class="hud-commander-details">
              <div class="wing-faction-tag">${hero.shortName.toUpperCase()} · ${hero.playstyleTag || hero.classTitle}</div>
              <div class="wing-score-row">
                <span class="score-big tabular-num ${pulseX}">${snap.scores.X}</span>
                <span class="score-target tabular-num">/ ${snap.targetScore} VP</span>
              </div>
              <div class="gothic-progress-track" role="progressbar" aria-label="Player Score Progress" aria-valuenow="${snap.scores.X}" aria-valuemin="0" aria-valuemax="${snap.targetScore}">
                <div class="gothic-progress-fill player-fill" style="width:${xPct}%"></div>
              </div>
              <div class="wing-sub-row">
                <span class="tithe-readout">
                  ${
                    snap.cardsEnabled
                      ? `${renderGothicIconSVG('coin')} Gold: <strong class="tabular-num">${snap.tithe.X}</strong>/${GAME_CONFIG.MAX_BLOOD_TITHE}`
                      : `${renderGothicIconSVG('leaf')} <strong>Pure Tactics</strong> · Next: ${snap.levelData?.nextUnlockLabel || 'Lvl 3 Shop'}`
                  }
                </span>
                <span class="placements-readout">Moves: <strong class="tabular-num">${snap.placementsRemaining}</strong></span>
              </div>
            </div>
          </div>
        </div>

        <!-- CENTER BATTLE MEDALLION & COMPACT TOOLBAR -->
        <div class="hud-center-medallion">
          <div class="medallion-status-row">
            <div class="turn-pill ${snap.activePlayer === 'X' ? 'turn-x' : 'turn-o'}">
              ${snap.activePlayer === 'X' ? `${hero.shortName.toUpperCase()}'S TURN` : `${boss.name.split(' ')[0].toUpperCase()} MOVING`} • T<span class="tabular-num">${snap.turnNumber}</span>
            </div>
            <span class="view-mode-badge ${this.showMiniTacticalGrid ? 'badge-2d' : 'badge-3d'}" role="status">
              ${this.showMiniTacticalGrid ? '2D TACTICAL BOARD' : '3D WAR-TABLE'}
            </span>
            <span class="doctrine-mode-badge" title="${doctrine.summary}">
              ${renderGothicIconSVG('sword')} ${doctrine.badge}
            </span>
          </div>

          <div class="hud-utility-strip" role="toolbar" aria-label="Battle Controls">
            ${
              this.engine.selectedCardIndex !== null || snap.selectedHeroAbility
                ? `<button class="hud-tool-btn active" data-action="cancel-card" title="Cancel Selection (Esc / Right-Click)">${renderGothicIconSVG('close')} <span>Cancel</span></button>`
                : ''
            }
            <button class="hud-tool-btn ${this.showMiniTacticalGrid ? 'active' : ''}" aria-pressed="${this.showMiniTacticalGrid}" data-action="toggle-minigrid" title="Switch between 2D Tactical Board and 3D War-Table">
              ${renderGothicIconSVG('grid')} <span>${this.showMiniTacticalGrid ? '3D View' : '2D View'}</span>
            </button>
            <button class="hud-tool-btn" data-action="cycle-camera" title="Switch 3D Camera Angle (Shortcut: C)">
              ${renderGothicIconSVG('camera')} <span>Camera</span> <kbd class="hud-kbd">C</kbd>
            </button>
            <button class="hud-tool-btn ${this.seerHintCoord ? 'active' : ''}" data-action="seer-hint" title="Point at Recommended Tile, Pulse Outline & Show Tactical Reason (Shortcut: H)">
              ${renderGothicIconSVG('eye')} <span>Hint</span> <kbd class="hud-kbd">H</kbd>
            </button>
            <button class="hud-tool-btn ${this.showThreatScan ? 'active' : ''}" aria-pressed="${this.showThreatScan}" data-action="toggle-threat" title="Paint Enemy Scoring Lines in Amber & Guaranteed Blocks in Red">
              ${renderGothicIconSVG('target')} <span>Threats</span>
            </button>
            <button class="hud-tool-btn ${this.confirmPlacementMode ? 'active' : ''}" aria-pressed="${this.confirmPlacementMode}" data-action="toggle-confirm-mode" title="Toggle 2-Step Confirm Placement vs Instant Placement">
              ${renderGothicIconSVG(this.confirmPlacementMode ? 'check' : 'bolt')} <span>${this.confirmPlacementMode ? 'Confirm: ON' : 'Instant'}</span>
            </button>
            <button class="hud-tool-btn ${this.showTacticalIntel ? 'active' : ''}" aria-pressed="${this.showTacticalIntel}" data-action="toggle-intel" title="Toggle Move History Strip, Micro-Rewards & Intel Drawer">
              ${renderGothicIconSVG('book')} <span>History (${snap.moveHistory?.length || 0})</span>
            </button>
            <button class="hud-tool-btn" ${snap.canUndo ? '' : 'disabled'} data-action="undo-move" title="Undo Last Action (${snap.undosRemaining}/${snap.maxUndos} Left • Shortcut: Z)">
              ${renderGothicIconSVG('undo')} <span>${snap.undosRemaining}</span> <kbd class="hud-kbd">Z</kbd>
            </button>
            <button class="hud-tool-btn ${this.showPerfOverlay ? 'active' : ''}" data-action="toggle-perf" title="Toggle Performance Telemetry Overlay (F3)">
              <span>FPS</span>
            </button>
            <button class="hud-tool-btn" data-action="nav" data-screen="hub" title="Return to Sanctuary Menu">
              ${renderGothicIconSVG('castle')} <span>Menu</span>
            </button>
          </div>
          ${actionPromptHTML}
        </div>

        <!-- ENEMY WARLORD COMMANDER WING -->
        <div class="hud-wing enemy-wing ${snap.activePlayer === 'O' ? 'active-turn' : ''}">
          <div class="hud-commander-row enemy-commander-row">
            <div class="hud-commander-details enemy-details">
              <div class="wing-faction-tag" title="${doctrine.summary}">${boss.name.toUpperCase()} · ${doctrine.title.toUpperCase()}</div>
              <div class="wing-score-row">
                <span class="score-big tabular-num ${pulseO}">${snap.scores.O}</span>
                <span class="score-target tabular-num">/ ${snap.targetScore} VP</span>
              </div>
              <div class="gothic-progress-track" role="progressbar" aria-label="Enemy Score Progress" aria-valuenow="${snap.scores.O}" aria-valuemin="0" aria-valuemax="${snap.targetScore}">
                <div class="gothic-progress-fill enemy-fill" style="width:${oPct}%"></div>
              </div>
              <div class="wing-sub-row">
                <span title="${doctrine.summary}">${snap.cardsEnabled ? `${renderGothicIconSVG('coin')} Gold: <strong class="tabular-num">${snap.tithe.O}</strong>` : `${renderGothicIconSVG('target')} ${doctrine.rule}`}</span>
                <span>Shattered: <strong class="tabular-num">${snap.stonesShatteredThisMatch}</strong></span>
              </div>
            </div>
            <div class="hud-commander-avatar enemy-avatar" style="--char-color:${boss.color}">
              ${renderBossCrestSVG(boss.id, boss.color)}
            </div>
          </div>
        </div>
      </header>

      <!-- CENTRAL BOARD SAFE AREA + PARALLEL ACCESSIBLE DOM BOARD GRID -->
      <main class="battle-board-safe-area ${this.showMiniTacticalGrid ? 'is-2d-mode' : 'is-3d-mode'}" aria-label="War-Table Tactical Board Safe Area">
        <div id="parallel-board-grid" class="parallel-board-grid ${this.showMiniTacticalGrid ? 'mode-2d-active' : 'mode-3d-overlay'}" role="grid" aria-label="War-Table Tactical Board (${snap.boardSize} by ${snap.boardSize})" style="--grid-size: ${snap.boardSize}">
          ${snap.board
            .map((row, rIdx) => `
              <div class="parallel-board-row" role="row">
                ${row
                  .map((cell, cIdx) => {
                    const coordLabel = formatCoordLabel(cell.r, cell.c);
                    const key = `${cell.r},${cell.c}`;
                    const isOccupied = Boolean(cell.symbol);
                    const isLegal =
                      !isOccupied &&
                      !cell.obstacle &&
                      cell.locked === 0 &&
                      snap.activePlayer === 'X' &&
                      snap.status === 'playing';
                    const isRecommended =
                      this.seerHintCoord &&
                      this.seerHintCoord.r === cell.r &&
                      this.seerHintCoord.c === cell.c;
                    const isExpectedLine = expectedLineSet.has(key);
                    const isStaged =
                      this.stagedCoord &&
                      this.stagedCoord.r === cell.r &&
                      this.stagedCoord.c === cell.c;
                    const isKbdFocus =
                      this.kbActive &&
                      this.kbCursor &&
                      this.kbCursor.r === cell.r &&
                      this.kbCursor.c === cell.c;
                    const isThreatBlock = blockSet.has(key);
                    const isThreatLine = !isThreatBlock && lineSet.has(key);
                    const isBossRitual =
                      snap.pendingBossRitual &&
                      snap.pendingBossRitual.r === cell.r &&
                      snap.pendingBossRitual.c === cell.c;

                    const stateClasses = [
                      isOccupied ? `is-occupied sym-${cell.symbol}` : 'is-empty',
                      isLegal ? 'is-legal' : '',
                      isRecommended ? 'is-recommended' : '',
                      isExpectedLine ? 'is-expected-line' : '',
                      isStaged ? 'is-selected' : '',
                      isKbdFocus ? 'is-kbd-cursor' : '',
                      isThreatBlock ? 'is-threat-block' : '',
                      isThreatLine ? 'is-threat-line' : '',
                      cell.locked > 0 ? 'is-locked' : '',
                      cell.shield > 0 ? 'is-shielded' : '',
                      cell.obstacle === 'reliquary_coffer' ? 'is-chest' : '',
                      cell.anomaly === 'cursed_censer' ? 'is-bomb' : '',
                      cell.anomaly === 'sanctified_mosaic' ? 'is-mosaic' : '',
                      isBossRitual ? 'is-boss-ritual' : '',
                    ]
                      .filter(Boolean)
                      .join(' ');

                    let statusDesc = 'Empty legal tile';
                    if (cell.symbol === 'X') statusDesc = `${hero.shortName} Stone (Player X)`;
                    else if (cell.symbol === 'O') statusDesc = `${boss.name} Stone (Enemy O)`;
                    else if (cell.obstacle === 'reliquary_coffer') statusDesc = 'Mystery Bone-Chest (Place adjacent stone to claim)';
                    else if (cell.obstacle) statusDesc = 'Blocked Pillar';
                    else if (cell.locked > 0) statusDesc = `Crater Locked (${cell.locked} turns)`;
                    if (isRecommended) statusDesc += ` — Recommended placement: Place ${heroCalloutName} here`;
                    if (isThreatBlock) statusDesc += ' — Critical Red Block (Stops enemy line)';
                    else if (isThreatLine) statusDesc += ' — Amber Enemy Threat Line';
                    if (cell.anomaly === 'sanctified_mosaic') statusDesc += ' — Sanctified Mosaic (+1 Bonus VP)';
                    if (cell.anomaly === 'cursed_censer') statusDesc += ` — Siege Bomb (${cell.bombTimer || 1}T)`;
                    if (isBossRitual) statusDesc += ' — Telegraphed Boss Ritual Target';

                    let centerBadge = '';
                    if (cell.symbol === 'X') centerBadge = renderGothicIconSVG('crown');
                    else if (cell.symbol === 'O') centerBadge = renderGothicIconSVG('skull');
                    else if (cell.obstacle === 'reliquary_coffer') centerBadge = renderGothicIconSVG('chest');
                    else if (cell.anomaly === 'cursed_censer') centerBadge = `${renderGothicIconSVG('bomb')}<small>${cell.bombTimer || ''}</small>`;
                    else if (cell.anomaly === 'sanctified_mosaic') centerBadge = renderGothicIconSVG('spark');
                    else if (cell.locked > 0) centerBadge = `${renderGothicIconSVG('lock')}<small>${cell.locked}</small>`;
                    else if (isThreatBlock) centerBadge = renderGothicIconSVG('shield');

                    const showHeroCallout =
                      isRecommended &&
                      !isOccupied &&
                      snap.activePlayer === 'X';

                    return `
                      <button
                        type="button"
                        role="gridcell"
                        class="board-tile-btn ${stateClasses}"
                        data-action="board-cell"
                        data-r="${cell.r}"
                        data-c="${cell.c}"
                        aria-label="Tile ${coordLabel} (Row ${rIdx + 1}, Column ${cIdx + 1}): ${statusDesc}"
                        title="Tile ${coordLabel}: ${statusDesc}"
                      >
                        <span class="tile-coord-tag">${coordLabel}</span>
                        <span class="tile-center-glyph">${centerBadge}</span>
                        ${cell.shield > 0 ? `<span class="tile-shield-badge" title="Shielded">${renderGothicIconSVG('shield')}</span>` : ''}
                        ${
                          showHeroCallout
                            ? `<span class="tile-callout-pill">${
                                snap.mode === 'campaign' && snap.levelNumber === 1 && this.onboardingStep === 1
                                  ? `Place ${heroCalloutName} here`
                                  : `★ Recommended (${coordLabel})`
                              }</span>`
                            : ''
                        }
                      </button>
                    `;
                  })
                  .join('')}
              </div>
            `)
            .join('')}
        </div>

        <!-- LIVE PRE-COMMIT FORMATION & VP DELTA PREVIEW BAR + CONFIRM PLACEMENT CTA -->
        <div class="board-tactical-footer-bar">
          ${
            !this.showMiniTacticalGrid && this.seerHintCoord && snap.activePlayer === 'X'
              ? `
                <button type="button" class="floating-3d-callout-badge" data-action="board-cell" data-r="${this.seerHintCoord.r}" data-c="${this.seerHintCoord.c}">
                  ${renderGothicIconSVG('target')}
                  <span>${
                    snap.mode === 'campaign' && snap.levelNumber === 1 && this.onboardingStep === 1
                      ? `Place ${heroCalloutName} here (${this.seerHintCoord.coordLabel || formatCoordLabel(this.seerHintCoord.r, this.seerHintCoord.c)})`
                      : `Recommended Tile: ${this.seerHintCoord.coordLabel || formatCoordLabel(this.seerHintCoord.r, this.seerHintCoord.c)}`
                  }</span>
                </button>
              `
              : ''
          }
          <div id="live-placement-preview-pill" class="live-placement-preview-pill ${previewSummary ? 'visible' : ''}" role="status" aria-live="polite">
            ${
              previewSummary
                ? `<span class="preview-coord">${previewSummary.coordLabel}</span> <span class="preview-summary">${previewSummary.summary}</span>`
                : `<span class="preview-idle">Hover or focus any tile (${formatCoordLabel(0, 0)}–${formatCoordLabel(snap.boardSize - 1, snap.boardSize - 1)}) to preview formations & VP delta</span>`
            }
          </div>
          ${
            this.stagedCoord && snap.activePlayer === 'X'
              ? `
                <button class="btn-gothic-primary btn-confirm-placement" data-action="confirm-placement">
                  ${renderGothicIconSVG('check')} Confirm Placement at ${formatCoordLabel(this.stagedCoord.r, this.stagedCoord.c)} [Enter]
                </button>
              `
              : ''
          }
        </div>
      </main>

      <!-- COLLAPSIBLE SIDE RAIL: MOVE HISTORY STRIP, MICRO-REWARDS, DOCTRINE & CHEST ODDS -->
      <aside class="battle-side-widgets ${this.showTacticalIntel ? 'intel-open' : 'intel-collapsed'}" aria-label="Tactical Intel & Move History">
        ${
          this.showTacticalIntel
            ? `
              <div class="chronicle-feed-panel move-history-panel">
                <div class="gothic-eyebrow">${renderGothicIconSVG('scroll')} MOVE HISTORY STRIP (TURN · COORD · FORMATION · VP)</div>
                ${
                  !snap.moveHistory || snap.moveHistory.length === 0
                    ? `<p class="war-counsel-text">No placements yet. Claim ${formatCoordLabel(Math.floor(snap.boardSize / 2), Math.floor(snap.boardSize / 2))} to open the battle!</p>`
                    : `
                      <ul class="move-history-list">
                        ${snap.moveHistory
                          .slice(0, 6)
                          .map(
                            (m) => `
                              <li class="history-item player-${m.player.toLowerCase()}">
                                <span class="hist-turn">T${m.turn}</span>
                                <strong class="hist-coord">${m.player}@${m.coord}</strong>
                                <span class="hist-form">${m.formation}</span>
                                <span class="hist-vp ${m.vpDelta > 0 ? 'vp-gain' : ''}">${m.vpDelta > 0 ? `+${m.vpDelta} VP` : '0 VP'}</span>
                                ${m.shattered > 0 ? `<span class="hist-shatter">${renderGothicIconSVG('spark')}${m.shattered}</span>` : ''}
                              </li>
                            `
                          )
                          .join('')}
                      </ul>
                    `
                }
              </div>

              <div class="chronicle-feed-panel doctrine-intel-panel">
                <div class="gothic-eyebrow">${renderGothicIconSVG('sword')} ENEMY DOCTRINE • ${doctrine.badge.toUpperCase()}</div>
                <p class="war-counsel-text">${doctrine.summary}</p>
              </div>

              <div class="chronicle-feed-panel chest-odds-panel">
                <div class="gothic-eyebrow">${renderGothicIconSVG('chest')} MYSTERY CHEST REWARDS</div>
                <div class="chest-odds-badges">
                  ${V1_BOX_ODDS.map(
                    (o) => `<span class="odds-chip" title="${o.label}">${o.icon} <span class="tabular-num">${o.pct}%</span></span>`
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
            `
            : ''
        }
      </aside>

      <!-- COMPACT BOTTOM ACTION TRAY: TURN-1 HERO SKILL, WAR-HORN, EARLY MICRO-REWARDS OR LEVEL 3+ SHOP -->
      <footer class="battle-hud-bottom">
        <div class="penitence-bell-dock">
          ${
            ability
              ? `
                <button class="bell-ultimate-btn hero-skill-btn ${abilityReady ? 'ready' : ''} ${
                  snap.selectedHeroAbility ? 'selected-skill' : ''
                }" ${abilityReady ? '' : 'disabled'} data-action="hero-ability" title="${ability.name}: ${ability.desc} (Hotkey: Q)">
                  ${renderGothicIconSVG('bolt')}
                  <div>
                    <div class="bell-label">${ability.name.toUpperCase()} [Q]</div>
                    <div class="bell-pct tabular-num">${
                      snap.heroAbilityUsedThisTurn
                        ? 'USED'
                        : abilityCd > 0
                        ? `CD: ${abilityCd}T`
                        : 'READY'
                    }</div>
                  </div>
                </button>
              `
              : ''
          }
          <button class="bell-ultimate-btn ${bellReady ? 'ready' : ''}" ${
      bellReady ? '' : 'disabled'
    } data-action="toll-bell" title="War-Horn Ultimate (Hotkey: E)">
            ${renderGothicIconSVG('bell')}
            <div>
              <div class="bell-label">WAR-HORN [E]</div>
              <div class="bell-pct tabular-num">${
                snap.bellUsedThisMatch.X ? 'UNLEASHED' : `${Math.floor(snap.bellCharge.X)}%`
              }</div>
            </div>
          </button>
        </div>

        ${
          !snap.cardsEnabled
            ? `
              <div class="early-stage-mastery-bar gothic-card-panel">
                <div class="mastery-rewards-strip" role="group" aria-label="Stage Mastery Micro-Rewards">
                  <span class="mastery-eyebrow">${renderGothicIconSVG('trophy')} STAGE REWARDS:</span>
                  ${EARLY_STAGE_MICRO_REWARDS.map((r) => {
                    const done = Boolean(snap.microRewards?.[r.id]);
                    return `
                      <span class="micro-reward-pill ${done ? 'claimed' : ''}" title="${r.condition} → ${r.rewardLabel}">
                        ${done ? renderGothicIconSVG('check') : renderGothicIconSVG('star')} <strong>${r.title}</strong> <small>(${r.rewardLabel})</small>
                      </span>
                    `;
                  }).join('')}
                </div>

                <div class="mastery-actions-strip">
                  <div class="modifier-pills" role="group" aria-label="Optional Stage Modifier">
                    ${EARLY_STAGE_MODIFIERS.map((mod) => {
                      const active = (this.earlyModifierId || 'mod_standard') === mod.id;
                      return `
                        <button class="modifier-pill-btn ${active ? 'active' : ''}" data-action="set-early-modifier" data-mod="${mod.id}" title="${mod.desc}">
                          ${renderGothicIconSVG('sigil')} <span>${mod.name}</span>
                        </button>
                      `;
                    }).join('')}
                  </div>
                  <button class="btn-gothic-small preview-scrolls-btn ${this.showScrollPreviewDrawer ? 'deck-active' : ''}" data-action="toggle-scroll-preview">
                    ${renderGothicIconSVG('scroll')} <span>${this.showScrollPreviewDrawer ? 'Hide Lvl 3 Scrolls' : 'Preview Lvl 3 Scrolls'}</span>
                  </button>
                </div>

                ${
                  this.showScrollPreviewDrawer
                    ? `
                      <div class="scroll-preview-popover" role="region" aria-label="Level 3 War-Scroll Vault Preview">
                        <div class="popover-head">
                          <strong>${renderGothicIconSVG('unlock')} UNLOCKING AT STAGE #3: 3-SLOT WAR-SCROLL SHOP & GOLD ECONOMY</strong>
                          <button class="prompt-cancel-chip" data-action="toggle-scroll-preview">Close</button>
                        </div>
                        <div class="scroll-preview-cards-row">
                          ${previewFirstScrolls
                            .map((c) => {
                              const spec = getCardTacticalSpec(c);
                              return `
                                <div class="scroll-preview-mini-card">
                                  <div class="mini-preview-box">${renderMiniBoardPreviewSVG(spec.previewCells, spec.previewMode)}</div>
                                  <div>
                                    <strong>${c.name} (${c.cost}G · ${spec.rarity})</strong>
                                    <p>${c.desc}</p>
                                    <small>${spec.timing} · Target: ${spec.targetRule}</small>
                                  </div>
                                </div>
                              `;
                            })
                            .join('')}
                        </div>
                      </div>
                    `
                    : ''
                }
              </div>
            `
            : `
              <!-- V1 3-SLOT IN-BATTLE WAR-SCROLL SHOP + PLAYER HAND -->
              <div class="v1-battle-cards-zone">
                <div class="v1-shop-strip gothic-card-panel">
                  <div class="v1-shop-header">
                    <div>
                      <span class="shop-title">${renderGothicIconSVG('shop')} WAR-SCROLL SHOP</span>
                      <span class="shop-sub">Buy with Gold • Bought Scrolls Cast FREE</span>
                    </div>
                    <button class="btn-shop-reroll" data-action="reroll-shop" ${
                      snap.tithe.X >= snap.shopRerollCost ? '' : 'disabled'
                    }>
                      ${renderGothicIconSVG('refresh')} Reroll (${snap.shopRerollCost})
                    </button>
                  </div>
                  <div class="v1-shop-slots">
                    ${(snap.shop || [])
                      .map((slot, sIdx) => {
                        if (!slot || !slot.card) {
                          return `<div class="v1-shop-slot sold-out"><span>EMPTY</span></div>`;
                        }
                        const c = slot.card;
                        const spec = getCardTacticalSpec(c);
                        const price = slot.price ?? c.cost;
                        const canBuy =
                          snap.tithe.X >= price &&
                          snap.hands.X.length < GAME_CONFIG.MAX_HAND_SIZE;
                        return `
                          <div class="v1-shop-slot ${slot.locked ? 'locked' : ''}" title="${spec.timing} | Target: ${spec.targetRule} | Counter: ${spec.counterplay}">
                            <div class="shop-slot-top">
                              <span class="shop-slot-price tabular-num">${renderGothicIconSVG('coin')} ${price}</span>
                              <span class="spec-rarity-pill rarity-${spec.rarity.toLowerCase()}">${spec.rarity[0]}</span>
                              <button class="shop-lock-btn" data-action="lock-shop-slot" data-slot="${sIdx}" aria-label="${slot.locked ? 'Unlock Shop Slot' : 'Lock Shop Slot'}" title="Lock/Unlock Slot">
                                ${renderGothicIconSVG(slot.locked ? 'lock' : 'unlock')}
                              </button>
                            </div>
                            <div class="shop-slot-body">
                              <div class="shop-slot-art">${renderTarotArtSVG(c)}</div>
                              <div class="shop-slot-copy">
                                <div class="shop-slot-name">${c.name}</div>
                                <div class="shop-slot-desc">${c.desc}</div>
                              </div>
                            </div>
                            <button class="btn-shop-buy" ${
                              canBuy ? '' : 'disabled'
                            } data-action="buy-shop-card" data-slot="${sIdx}">
                              BUY (${price})
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
                      ? `<div class="empty-hand-hint">Hand Empty — Buy War-Scrolls from the Shop (Left) or Claim Mystery Chests on the Board!</div>`
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
                          }" role="listitem" tabindex="0" data-action="select-card" data-index="${idx}" title="Hotkey [${idx + 1}] — ${card.name}">
                              <div class="tarot-card-header">
                                <span class="tarot-roman">[${idx + 1}] ${card.numeral}</span>
                                <span class="tarot-cost-gem tabular-num">${
                                  inst.paidInShop ? 'FREE' : `${card.cost}G`
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

        <div class="camera-quick-dock" role="group" aria-label="3D Camera View">
          <div class="dock-caption">CAMERA</div>
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
    const isEarlyStage = snap.mode === 'campaign' && snap.levelNumber <= 2;
    const state = this.save.getState();
    const hero = snap.hero || getFantasyHeroById(state.selectedHeroId);
    const heroCalloutName = hero.shortName.split(' ').pop();
    const nextStage =
      isWin && snap.mode === 'campaign' && snap.levelNumber < 36
        ? getLevelByNumber(snap.levelNumber + 1)
        : null;
    const previewScrolls = ARCANA_CARDS.slice(0, 3);

    return `
      <div class="endgame-modal-backdrop" role="dialog" aria-modal="true" aria-label="Battle Result">
        <div class="endgame-modal-card gothic-card-panel">
          <div class="gothic-eyebrow">${isWin ? `${renderGothicIconSVG('book')} STORY CHRONICLE ADVANCED` : `${renderGothicIconSVG('sword')} THE WAR-TABLE AWAITS YOUR RETURN`}</div>
          <h2>${isWin ? 'VICTORY ON THE STAR-ALTAR' : 'REGROUP & TRY AGAIN'}</h2>
          <p class="endgame-score-summary">
            Final Score: <strong>${hero.shortName} ${snap.scores.X} VP</strong> — <strong>Commander ${snap.scores.O} VP</strong>
            · Turns: <strong>${snap.turnNumber}</strong> · Stones Shattered: <strong>${snap.stonesShatteredThisMatch}</strong>
            ${
              unlockedLvl3
                ? `<br/><span class="unlock-callout">STORY MILESTONE UNLOCKED: The Ancient Scroll Vault is open! Level 3+ features Gold Coins and the 3-Slot War-Scroll Shop!</span>`
                : ''
            }
          </p>

          ${
            isEarlyStage
              ? `
                <div class="endgame-micro-rewards-box">
                  <div class="gothic-eyebrow">🏆 STAGE MASTERY MICRO-REWARDS & LEVEL 3 SHOP PREVIEW</div>
                  <div class="mastery-rewards-strip">
                    ${EARLY_STAGE_MICRO_REWARDS.map((r) => {
                      const done = Boolean(snap.microRewards?.[r.id]);
                      return `
                        <span class="micro-reward-pill ${done ? 'claimed' : ''}">
                          ${done ? '✓' : r.icon} <strong>${r.title}:</strong> ${r.rewardLabel}
                        </span>
                      `;
                    }).join('')}
                  </div>
                  <div class="endgame-scroll-preview-row">
                    ${previewScrolls
                      .map((c) => {
                        const spec = getCardTacticalSpec(c);
                        return `
                          <div class="scroll-preview-mini-card">
                            <div class="mini-preview-box">${renderMiniBoardPreviewSVG(spec.previewCells, spec.previewMode)}</div>
                            <div>
                              <strong>${c.name} (${c.cost}G)</strong>
                              <small>Unlocks at Stage #3 Shop</small>
                            </div>
                          </div>
                        `;
                      })
                      .join('')}
                  </div>
                </div>
              `
              : ''
          }

          ${
            nextStage
              ? `
                <div class="endgame-story-next">
                  <div class="gothic-eyebrow">NEXT IN THE CHRONICLE • STAGE #${nextStage.level}: ${nextStage.name.toUpperCase()}</div>
                  <p>${nextStage.objectiveLabel} · ${nextStage.boardSize}×${nextStage.boardSize} Grid · ${nextStage.doctrine?.badge || ''} · Reward: ${nextStage.rewardLabel}</p>
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

    // Bind hover & keyboard focus on Parallel DOM Board Tiles so 3D War-Table & Live Preview stay in lockstep
    const boardBtns = this.rootEl.querySelectorAll('.board-tile-btn');
    boardBtns.forEach((btn) => {
      const r = Number(btn.getAttribute('data-r'));
      const c = Number(btn.getAttribute('data-c'));
      btn.addEventListener('mouseenter', () => {
        this._handleTileHover({ r, c });
      });
      btn.addEventListener('focus', () => {
        this.kbActive = true;
        this.kbCursor = { r, c };
        this._handleTileHover({ r, c });
      });
    });

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
          case 'start-daily-seed':
            this.startDailyChallenge();
            break;
          case 'select-act':
            this.selectedActId = Number(el.getAttribute('data-act') || 1);
            this.render();
            break;
          case 'select-boon': {
            const boonId = el.getAttribute('data-boon');
            this.save.selectBoon(boonId);
            const boon = ROGUELIKE_BOONS.find((b) => b.id === boonId);
            if (boon) this.showToast(`🏕️ Expedition Boon Active: ${boon.name}`);
            this.render();
            break;
          }
          case 'toggle-story-modal':
            this.showStoryModal = !this.showStoryModal;
            this.sound?.playUIHover();
            this.render();
            break;
          case 'toggle-tutorial':
            this.showTutorialModal = !this.showTutorialModal;
            this.tutorialStep = 0;
            this.sound?.playUIHover();
            this.render();
            break;
          case 'tutorial-next':
            this.tutorialStep = Math.min(3, this.tutorialStep + 1);
            this.sound?.playUIHover();
            this.render();
            break;
          case 'tutorial-prev':
            this.tutorialStep = Math.max(0, this.tutorialStep - 1);
            this.sound?.playUIHover();
            this.render();
            break;
          case 'close-tutorial':
            this.showTutorialModal = false;
            this.save.setTutorialCompleted(true);
            this.render();
            break;
          case 'toggle-perf':
            this.togglePerfOverlay();
            break;
          case 'cycle-quality': {
            const order = ['low', 'high', 'ultra'];
            const curr = this.save.getState().qualityPreset || 'high';
            const next = order[(order.indexOf(curr) + 1) % order.length];
            this.save.setQualityPreset(next);
            this.scene3d?.setQualityPreset?.(next);
            this.showToast(`Graphics Quality: ${next.toUpperCase()}`);
            this.render();
            break;
          }
          case 'toggle-lang': {
            const curr = this.save.getState().language || 'en';
            const next = curr === 'ar' ? 'en' : 'ar';
            this.save.setLanguage(next);
            this._syncDocumentDirection();
            this.showToast(next === 'ar' ? 'تم تفعيل اللغة العربية (RTL)' : 'Language: English (LTR)');
            this.render();
            break;
          }
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
          case 'hero-ability':
            this.triggerHeroAbility();
            break;
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
              this.engine.selectedHeroAbility = false;
              this.engine.pendingTargets = [];
              this.stagedCoord = null;
              this.showToast(this.t('Selection cancelled.', 'تم إلغاء التحديد.'));
              this.render();
            }
            break;
          case 'board-cell':
            this.handleBoardCellClick(
              Number(el.getAttribute('data-r')),
              Number(el.getAttribute('data-c'))
            );
            break;
          case 'confirm-placement':
            if (this.stagedCoord) {
              this.handleBoardCellClick(this.stagedCoord.r, this.stagedCoord.c, true);
            }
            break;
          case 'toggle-confirm-mode':
            this.confirmPlacementMode = !this.confirmPlacementMode;
            this.stagedCoord = null;
            this.showToast(
              this.confirmPlacementMode
                ? '✓ 2-Step Confirm Placement Mode Enabled'
                : '⚡ 1-Click Instant Placement Mode Enabled'
            );
            this.render();
            break;
          case 'set-early-modifier': {
            const modId = el.getAttribute('data-mod') || 'mod_standard';
            this.earlyModifierId = modId;
            if (this.engine && this.engine.mode === 'campaign' && this.engine.levelNumber <= 2) {
              this.startCampaignLevel(this.engine.levelNumber);
            } else {
              this.render();
            }
            break;
          }
          case 'toggle-scroll-preview':
            this.showScrollPreviewDrawer = !this.showScrollPreviewDrawer;
            this.sound?.playUIHover();
            this.render();
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
            this.toggle2DView();
            break;
          case 'toggle-intel':
            this.showTacticalIntel = !this.showTacticalIntel;
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
          case 'toggle-deck-card': {
            const cardId = el.getAttribute('data-card');
            const res = this.save.toggleCustomDeckCard(cardId);
            const card = getArcanaCardById(cardId);
            this.showToast(
              res.inDeck
                ? `Added ${card?.name || cardId} to Custom Deck (${res.count} Scrolls)`
                : `Removed ${card?.name || cardId} from Custom Deck (${res.count} Scrolls)`
            );
            this.render();
            break;
          }
          case 'clear-custom-deck': {
            this.save.state.customDeck = [];
            this.save.save();
            this.showToast('Custom Deck reset — using full unlocked scroll pool.');
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
