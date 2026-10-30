/**
 * XcardO: Warlords of the Obsidian Altar
 * Interactive 3D Gothic WebGL Scene, Cinematic Camera Director & Raycaster Controller
 */

import * as THREE from '../vendor/three.module.js';
import { CATHEDRAL_HALLS, CAMERA_PRESETS } from '../data/gothic-config.js';
import {
  createPieceSculpture3D,
  createTileEntity3D,
  createCathedralAltar3D,
  createInquisitorAutomaton3D,
} from './sculptor-3d.js';
import { StoneShatterPhysics } from './shatter-physics.js';

export class GothicScene3D {
  constructor(canvasEl, eventBus, saveManager) {
    this.canvas = canvasEl;
    this.bus = eventBus;
    this.save = saveManager;

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x09070d, 0.032);

    this.camera = new THREE.PerspectiveCamera(42, 16 / 9, 0.1, 120);

    // Spherical Orbit Camera State (supports presets + interactive mouse/touch drag + cinematic focus)
    this.camSpherical = {
      theta: 0,
      phi: 0.92,
      radius: 10.6,
      targetTheta: 0,
      targetPhi: 0.92,
      targetRadius: 10.6,
      lookAt: new THREE.Vector3(0, 0.15, 0),
      targetLookAt: new THREE.Vector3(0, 0.15, 0),
    };

    this.cameraShake = 0;
    this.cinematicFocusTimer = 0;
    this.idleOrbitActive = true;
    this.cinematicFlyIn = null;

    this.boardSize = 5;
    this.altarData = null;
    this.inquisitorMesh = null;

    this.piecesRoot = new THREE.Group();
    this.piecesRoot.name = 'PiecesRoot';
    this.scene.add(this.piecesRoot);

    this.entitiesRoot = new THREE.Group();
    this.entitiesRoot.name = 'EntitiesRoot';
    this.scene.add(this.entitiesRoot);

    this.beamsRoot = new THREE.Group();
    this.beamsRoot.name = 'SacredGeometryBeams';
    this.scene.add(this.beamsRoot);

    this.pieceMap = new Map(); // "r,c" -> THREE.Group
    this.entityMap = new Map(); // "r,c" -> THREE.Group
    this.activeAnimations = []; // Drop slams, transmutations, swaps, energy beams
    this.hoveredTile = null; // { r, c }
    this.previewCells = []; // [{ r, c, mode: 'score'|'target'|'threat' }]
    this.ghostMesh = null;

    this.shatterPhysics = new StoneShatterPhysics(this.scene);

    this.raycaster = new THREE.Raycaster();
    this.pointerNDC = new THREE.Vector2(-99, -99);
    this.isDraggingOrbit = false;
    this.pointerDownPos = { x: 0, y: 0 };
    this.lastDragPos = { x: 0, y: 0 };

    this.renderer = null;
    this._rafId = null;
    this._lastTime = 0;

    this._setupLighting();
    this.rebuildAltar(5, 'obsidian_nave', null);
    this.applyCameraPreset(this.save?.getState()?.cameraPreset || 'commander_angle', true);
    this._bindBusEvents();

    if (this.canvas && typeof window !== 'undefined' && typeof WebGLRenderingContext !== 'undefined') {
      this._initRenderer();
      this._bindPointerEvents();
      this.startLoop();
    }
  }

  _initRenderer() {
    try {
      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        antialias: true,
        powerPreference: 'high-performance',
        alpha: false,
      });
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.18;
      this.resize();
      window.addEventListener('resize', () => this.resize());
    } catch {
      this.renderer = null;
    }
  }

  _setupLighting() {
    this.ambientLight = new THREE.AmbientLight(0x28203a, 1.35);
    this.scene.add(this.ambientLight);

    // Moonlight / Rose-Window Directional Key Light casting crisp Gothic shadows
    this.dirLight = new THREE.DirectionalLight(0xffe4b5, 2.3);
    this.dirLight.position.set(5.5, 11.5, 6.5);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 1024;
    this.dirLight.shadow.mapSize.height = 1024;
    this.dirLight.shadow.camera.near = 1;
    this.dirLight.shadow.camera.far = 28;
    const d = 6.5;
    this.dirLight.shadow.camera.left = -d;
    this.dirLight.shadow.camera.right = d;
    this.dirLight.shadow.camera.top = d;
    this.dirLight.shadow.camera.bottom = -d;
    this.dirLight.shadow.bias = -0.0015;
    this.scene.add(this.dirLight);

    // 4 Corner Fire Brazier PointLights (flicker dynamically in render loop)
    this.brazierLights = [];
    for (let i = 0; i < 4; i++) {
      const pLight = new THREE.PointLight(0xff7b29, 2.2, 9.5, 1.6);
      pLight.position.set(0, 1.5, 0);
      this.scene.add(pLight);
      this.brazierLights.push(pLight);
    }

    // Rim backlight behind the Inquisitor Automaton
    this.inquisitorRimLight = new THREE.PointLight(0xe11d48, 2.4, 10, 1.5);
    this.inquisitorRimLight.position.set(0, 3.2, -5.2);
    this.scene.add(this.inquisitorRimLight);
  }

  _bindBusEvents() {
    if (!this.bus) return;

    this.bus.on('3d:boardRebuild', (snap) => {
      if (!snap) return;
      this.syncFullBoardSnapshot(snap);
    });

    this.bus.on('3d:piecePlaced', ({ r, c, symbol, snapshot }) => {
      if (snapshot) this._syncEntitiesOnly(snapshot);
      this.animatePieceSlam(r, c, symbol);
      this.lookInquisitorAtTile(r, c);
    });

    this.bus.on('3d:stoneShatter', (payload) => {
      this.triggerStoneShatterEvent(payload);
    });

    this.bus.on('3d:pieceTransmuted', ({ r, c, to, snapshot }) => {
      const worldPos = this.tileToWorld(r, c);
      this.shatterPhysics.spawnStoneShatter(worldPos, {
        shardCount: 18,
        intensity: 1.1,
        primaryColor: 0x3b0d16,
        accentColor: 0xf59e0b,
      });
      if (snapshot) this.syncFullBoardSnapshot(snapshot);
      else this.placePieceImmediate(r, c, to);
      this.addCameraShake(0.22);
    });

    this.bus.on('3d:pieceSwapped', ({ from, to, snapshot }) => {
      const posA = this.tileToWorld(from[0], from[1]);
      const posB = this.tileToWorld(to[0], to[1]);
      this.shatterPhysics.spawnShockwaveRing(posA, 0xc084fc, 1.1);
      this.shatterPhysics.spawnShockwaveRing(posB, 0xc084fc, 1.1);
      if (snapshot) this.syncFullBoardSnapshot(snapshot);
    });

    this.bus.on('3d:patternAligned', ({ patterns }) => {
      this.triggerSacredGeometryBeams(patterns);
    });

    this.bus.on('3d:inquisitorReact', ({ mood, target }) => {
      if (target) this.lookInquisitorAtTile(target[0], target[1]);
      if (mood === 'wrath' || mood === 'cast') {
        this.addCameraShake(0.18);
      }
    });
  }

  /**
   * Rebuild the Cathedral Altar Table & Inquisitor Automaton for a given `boardSize` and `hallId`
   */
  rebuildAltar(boardSize = 5, hallId = 'obsidian_nave', boss = null) {
    this.boardSize = boardSize;
    const hall = CATHEDRAL_HALLS.find((h) => h.id === hallId) || CATHEDRAL_HALLS[0];

    if (this.altarData && this.altarData.root) {
      this.scene.remove(this.altarData.root);
    }
    if (this.inquisitorMesh) {
      this.scene.remove(this.inquisitorMesh);
    }

    this.scene.fog.color.setHex(hall.fogColor);
    this.ambientLight.color.setHex(hall.ambientColor);
    this.dirLight.color.setHex(hall.directionalColor);

    this.altarData = createCathedralAltar3D(boardSize, hall);
    this.scene.add(this.altarData.root);

    const halfWidth = this.altarData.altarWidth * 0.5;
    this.shatterPhysics.setAltarExtent(halfWidth);

    // Position the 4 corner brazier lights above the corner braziers
    for (let i = 0; i < this.altarData.brazierFlames.length; i++) {
      const flame = this.altarData.brazierFlames[i];
      const light = this.brazierLights[i];
      if (light && flame) {
        light.color.setHex(hall.brazierColor);
        light.position.set(flame.position.x, flame.position.y + 0.45, flame.position.z);
      }
    }

    // Place the 3D Inquisitor Automaton at the North edge of the Altar
    this.inquisitorMesh = createInquisitorAutomaton3D(boss);
    this.inquisitorMesh.position.set(0, -0.35, -halfWidth - 1.15);
    this.scene.add(this.inquisitorMesh);
    this.inquisitorRimLight.position.set(0, 2.8, -halfWidth - 1.8);
  }

  tileToWorld(r, c) {
    if (!this.altarData) return { x: 0, y: 0.05, z: 0 };
    const { tileSpacing, offset } = this.altarData;
    return {
      x: c * tileSpacing - offset,
      y: 0.03,
      z: r * tileSpacing - offset,
    };
  }

  getSculptSettings(symbol) {
    const state = this.save?.getState() || {};
    if (symbol === 'X') {
      return {
        sculptId: state.equippedPlayerSculpt || 'seraph_cross',
        materialId: state.equippedPlayerMaterial || 'alabaster_marble',
      };
    }
    if (symbol === 'O') {
      return {
        sculptId: state.equippedEnemySculpt || 'iron_torus',
        materialId: state.equippedEnemyMaterial || 'blood_obsidian',
      };
    }
    return {
      sculptId: 'seraph_cross',
      materialId: 'gilded_reliquary',
    };
  }

  /**
   * Synchronize the full 3D board state from a `BattleEngine` snapshot
   */
  syncFullBoardSnapshot(snapshot) {
    const needNewAltar =
      !this.altarData ||
      this.boardSize !== snapshot.boardSize ||
      this._currentHallId !== snapshot.cathedralHallId;

    if (needNewAltar) {
      this._currentHallId = snapshot.cathedralHallId;
      this.rebuildAltar(snapshot.boardSize, snapshot.cathedralHallId, snapshot.boss);
    }

    // Clear existing pieces & entities
    this.pieceMap.clear();
    while (this.piecesRoot.children.length > 0) {
      this.piecesRoot.remove(this.piecesRoot.children[0]);
    }

    this._syncEntitiesOnly(snapshot);

    for (let r = 0; r < snapshot.boardSize; r++) {
      for (let c = 0; c < snapshot.boardSize; c++) {
        const cell = snapshot.board[r][c];
        if (cell.symbol) {
          this.placePieceImmediate(r, c, cell.symbol, cell.shield);
        }
      }
    }
  }

  _syncEntitiesOnly(snapshot) {
    this.entityMap.clear();
    while (this.entitiesRoot.children.length > 0) {
      this.entitiesRoot.remove(this.entitiesRoot.children[0]);
    }

    for (let r = 0; r < snapshot.boardSize; r++) {
      for (let c = 0; c < snapshot.boardSize; c++) {
        const cell = snapshot.board[r][c];
        const pos = this.tileToWorld(r, c);
        const entityType =
          cell.obstacle || cell.anomaly || (cell.locked > 0 ? 'iron_cage' : null);

        if (entityType) {
          const entMesh = createTileEntity3D(entityType);
          entMesh.position.set(pos.x, pos.y, pos.z);
          this.entitiesRoot.add(entMesh);
          this.entityMap.set(`${r},${c}`, entMesh);
        }

        // Update existing piece shield dome if needed
        const existingPiece = this.pieceMap.get(`${r},${c}`);
        if (existingPiece && Boolean(existingPiece.userData.hasShield) !== Boolean(cell.shield > 0)) {
          this.placePieceImmediate(r, c, cell.symbol, cell.shield);
        }
      }
    }
  }

  placePieceImmediate(r, c, symbol, shield = 0) {
    const key = `${r},${c}`;
    const old = this.pieceMap.get(key);
    if (old) {
      this.piecesRoot.remove(old);
      this.pieceMap.delete(key);
    }
    if (!symbol) return null;

    const { sculptId, materialId } = this.getSculptSettings(symbol);
    const mesh = createPieceSculpture3D(symbol, sculptId, materialId, { shield });
    mesh.userData.hasShield = shield > 0;
    const pos = this.tileToWorld(r, c);
    mesh.position.set(pos.x, pos.y, pos.z);
    this.piecesRoot.add(mesh);
    this.pieceMap.set(key, mesh);
    return mesh;
  }

  /**
   * Animate a Dramatic High-Arc 3D Stone Piece Drop Slam onto `(r, c)`
   */
  animatePieceSlam(r, c, symbol) {
    const mesh = this.placePieceImmediate(r, c, symbol, 0);
    if (!mesh) return;

    const targetPos = this.tileToWorld(r, c);
    const startY = 3.85;
    mesh.position.set(targetPos.x, startY, targetPos.z - (symbol === 'O' ? 1.2 : -1.2));
    mesh.rotation.x = symbol === 'O' ? 0.55 : -0.55;

    this.activeAnimations.push({
      type: 'slam',
      mesh,
      startX: mesh.position.x,
      startY,
      startZ: mesh.position.z,
      targetX: targetPos.x,
      targetY: targetPos.y,
      targetZ: targetPos.z,
      symbol,
      elapsed: 0,
      duration: 0.34,
    });
  }

  /**
   * Handle `3d:stoneShatter` events: spawn physical weapon impact + 28–38 rigid-body polyhedral shards per cell!
   */
  triggerStoneShatterEvent(payload) {
    const { cells = [], weapon = null, target = null, intensity = 1.35 } = payload || {};

    if (weapon && target) {
      const wPos = this.tileToWorld(target[0], target[1]);
      this.shatterPhysics.spawnWeaponImpact(wPos, weapon);
    }

    for (const item of cells) {
      const key = `${item.r},${item.c}`;
      const existingPiece = this.pieceMap.get(key);
      let primaryColor = item.symbol === 'X' ? 0xd9d2c5 : 0x24141c;
      let accentColor = item.symbol === 'X' ? 0xf59e0b : 0xe11d48;

      if (existingPiece) {
        primaryColor = existingPiece.userData.baseColor || primaryColor;
        accentColor = existingPiece.userData.accentColor || accentColor;
        this.piecesRoot.remove(existingPiece);
        this.pieceMap.delete(key);
      }

      if (item.wasObstacle) {
        const ent = this.entityMap.get(key);
        if (ent) {
          this.entitiesRoot.remove(ent);
          this.entityMap.delete(key);
        }
        primaryColor = 0x3b2f2f;
        accentColor = 0xfbbf24;
      }

      const worldPos = this.tileToWorld(item.r, item.c);
      this.shatterPhysics.spawnStoneShatter(worldPos, {
        shardCount: 30,
        intensity,
        primaryColor,
        accentColor,
      });
    }

    this.addCameraShake(Math.min(0.55, 0.24 * intensity));
    if (cells.length > 0 && this.save?.getState()?.cinematicCamera !== false) {
      const first = cells[0];
      this.focusCameraBrieflyOnTile(first.r, first.c, 0.95);
    }
  }

  /**
   * Draw glowing 3D Sacred Geometry Energy Beams connecting all stones in a newly scored pattern
   */
  triggerSacredGeometryBeams(patterns = []) {
    if (!patterns || patterns.length === 0) return;

    for (const pat of patterns) {
      const colorHex = pat.color || (pat.symbol === 'X' ? '#f59e0b' : '#e11d48');
      const beamMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(colorHex),
        transparent: true,
        opacity: 0.92,
      });

      const beamGroup = new THREE.Group();
      const coords = pat.cells.map(([r, c]) => this.tileToWorld(r, c));

      for (let i = 0; i < coords.length; i++) {
        const a = coords[i];
        const b = coords[(i + 1) % coords.length];
        if (pat.type === 'LINE' && i === coords.length - 1) break;

        const dx = b.x - a.x;
        const dz = b.z - a.z;
        const dist = Math.hypot(dx, dz);
        if (dist < 0.01) continue;

        const cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, dist, 8), beamMat);
        cyl.position.set((a.x + b.x) / 2, 0.48, (a.z + b.z) / 2);
        cyl.rotation.z = Math.PI / 2;
        cyl.rotation.y = -Math.atan2(dz, dx);
        beamGroup.add(cyl);

        // Pulse ring on each participating stone
        this.shatterPhysics.spawnShockwaveRing(a, colorHex, 1.15);
      }

      this.beamsRoot.add(beamGroup);
      this.activeAnimations.push({
        type: 'beam',
        mesh: beamGroup,
        material: beamMat,
        elapsed: 0,
        duration: 1.45,
      });
    }

    // Cinematic Camera Focus on Major/Grand Sacred Geometry
    const grand = patterns.find((p) => p.tier === 'grand' || p.tier === 'major') || patterns[0];
    if (grand && grand.cells.length > 0 && this.save?.getState()?.cinematicCamera !== false) {
      const mid = grand.cells[Math.floor(grand.cells.length / 2)];
      this.focusCameraBrieflyOnTile(mid[0], mid[1], 1.15);
    }
  }

  /**
   * Rotate the 3D Inquisitor Automaton's head toward `(r, c)`
   */
  lookInquisitorAtTile(r, c) {
    if (!this.inquisitorMesh || !this.inquisitorMesh.userData.headGroup) return;
    const pos = this.tileToWorld(r, c);
    const head = this.inquisitorMesh.userData.headGroup;
    const dx = pos.x - this.inquisitorMesh.position.x;
    const dz = pos.z - this.inquisitorMesh.position.z;
    head.rotation.y = Math.atan2(dx, dz) * 0.55;
    head.rotation.x = 0.22;
  }

  /**
   * Apply one of the 4 Camera Angle Presets (`commander_angle`, `high_cathedral`, `inquisitor_duel`, `belfry_topdown`)
   */
  applyCameraPreset(presetId, immediate = false) {
    const preset = CAMERA_PRESETS.find((p) => p.id === presetId) || CAMERA_PRESETS[0];
    const scaleFactor = this.boardSize >= 6 ? 1.18 : 1.0;

    this.cinematicFlyIn = null;
    this.camSpherical.targetTheta = preset.theta;
    this.camSpherical.targetPhi = preset.phi;
    this.camSpherical.targetRadius = preset.radius * scaleFactor;
    this.camSpherical.targetLookAt.set(0, preset.targetY || 0.15, 0);

    if (immediate) {
      this.camSpherical.theta = this.camSpherical.targetTheta;
      this.camSpherical.phi = this.camSpherical.targetPhi;
      this.camSpherical.radius = this.camSpherical.targetRadius;
      this.camSpherical.lookAt.copy(this.camSpherical.targetLookAt);
      this._updateCameraTransform(0, 0);
    }
  }

  /**
   * AAA Cinematic Camera Fly-In toward the 3D War-Table (sweeps down from high cathedral rafters to the board)
   */
  playCinematicFlyIn(presetId = 'commander_angle', duration = 2.65) {
    const preset = CAMERA_PRESETS.find((p) => p.id === presetId) || CAMERA_PRESETS[0];
    const scaleFactor = this.boardSize >= 6 ? 1.18 : 1.0;

    const endTheta = preset.theta;
    const endPhi = preset.phi;
    const endRadius = preset.radius * scaleFactor;
    const endLookY = preset.targetY || 0.15;

    // Start high and wide with a dramatic sweeping arc toward the 3D War-Table
    const startTheta = endTheta - 1.25;
    const startPhi = 0.34;
    const startRadius = 22.8 * scaleFactor;
    const startLookY = 2.45;

    this.camSpherical.theta = startTheta;
    this.camSpherical.phi = startPhi;
    this.camSpherical.radius = startRadius;
    this.camSpherical.lookAt.set(0, startLookY, -1.35);

    this.camSpherical.targetTheta = endTheta;
    this.camSpherical.targetPhi = endPhi;
    this.camSpherical.targetRadius = endRadius;
    this.camSpherical.targetLookAt.set(0, endLookY, 0);

    this.cinematicFlyIn = {
      elapsed: 0,
      duration,
      startTheta,
      startPhi,
      startRadius,
      startLookAt: new THREE.Vector3(0, startLookY, -1.35),
      endTheta,
      endPhi,
      endRadius,
      endLookAt: new THREE.Vector3(0, endLookY, 0),
    };
  }

  /**
   * Dramatic Battle-Start Camera Swoop from the Enemy Warlord down to the Commander's perspective
   */
  playBattleZoomIn(presetId = 'commander_angle', duration = 1.85) {
    const preset = CAMERA_PRESETS.find((p) => p.id === presetId) || CAMERA_PRESETS[0];
    const scaleFactor = this.boardSize >= 6 ? 1.18 : 1.0;

    const endTheta = preset.theta;
    const endPhi = preset.phi;
    const endRadius = preset.radius * scaleFactor;
    const endLookY = preset.targetY || 0.15;

    const startTheta = endTheta + 0.72;
    const startPhi = 1.14;
    const startRadius = 15.6 * scaleFactor;

    this.camSpherical.theta = startTheta;
    this.camSpherical.phi = startPhi;
    this.camSpherical.radius = startRadius;
    this.camSpherical.lookAt.set(0, 1.35, -1.6);

    this.camSpherical.targetTheta = endTheta;
    this.camSpherical.targetPhi = endPhi;
    this.camSpherical.targetRadius = endRadius;
    this.camSpherical.targetLookAt.set(0, endLookY, 0);

    this.cinematicFlyIn = {
      elapsed: 0,
      duration,
      startTheta,
      startPhi,
      startRadius,
      startLookAt: new THREE.Vector3(0, 1.35, -1.6),
      endTheta,
      endPhi,
      endRadius,
      endLookAt: new THREE.Vector3(0, endLookY, 0),
    };
  }

  focusCameraBrieflyOnTile(r, c, duration = 1.0) {
    const pos = this.tileToWorld(r, c);
    this.camSpherical.targetLookAt.set(pos.x * 0.38, 0.25, pos.z * 0.38);
    this.cinematicFocusTimer = duration;
  }

  addCameraShake(amount = 0.25) {
    this.cameraShake = Math.min(0.65, this.cameraShake + amount);
  }

  /**
   * Highlight hovered tile, show 3D Ghost Sculpture preview, and highlight scoring / Arcana target cells
   */
  setHoverAndPreview(hoveredCoord, previewCells = [], ghostSymbol = 'X', canPlaceHovered = false) {
    this.hoveredTile = hoveredCoord;
    this.previewCells = previewCells;

    // 1. Update 3D Ghost Sculpture on hovered valid tile
    if (hoveredCoord && canPlaceHovered && ghostSymbol) {
      const { sculptId, materialId } = this.getSculptSettings(ghostSymbol);
      if (
        !this.ghostMesh ||
        this.ghostMesh.userData.symbol !== ghostSymbol ||
        this.ghostMesh.userData.sculptId !== sculptId
      ) {
        if (this.ghostMesh) this.scene.remove(this.ghostMesh);
        this.ghostMesh = createPieceSculpture3D(ghostSymbol, sculptId, materialId, {
          isGhost: true,
        });
        this.scene.add(this.ghostMesh);
      }
      const pos = this.tileToWorld(hoveredCoord.r, hoveredCoord.c);
      this.ghostMesh.position.set(pos.x, pos.y + 0.05, pos.z);
      this.ghostMesh.visible = true;
    } else if (this.ghostMesh) {
      this.ghostMesh.visible = false;
    }

    // 2. Update Tile Emissive Highlights
    if (!this.altarData) return;
    const previewMap = new Map();
    for (const item of previewCells) {
      previewMap.set(`${item.r},${item.c}`, item.mode || 'score');
    }

    for (let r = 0; r < this.boardSize; r++) {
      for (let c = 0; c < this.boardSize; c++) {
        const mesh = this.altarData.tileMeshes[r]?.[c];
        if (!mesh) continue;
        const mat = mesh.material;
        const key = `${r},${c}`;
        const isHovered = hoveredCoord && hoveredCoord.r === r && hoveredCoord.c === c;
        const mode = previewMap.get(key);

        if (mode === 'target') {
          mat.emissive.setHex(0xe11d48);
          mat.emissiveIntensity = isHovered ? 0.85 : 0.5;
        } else if (mode === 'score') {
          mat.emissive.setHex(0xf59e0b);
          mat.emissiveIntensity = 0.65;
        } else if (mode === 'hint') {
          mat.emissive.setHex(0x38bdf8);
          mat.emissiveIntensity = 0.75;
        } else if (mode === 'threat') {
          mat.emissive.setHex(0x991b1b);
          mat.emissiveIntensity = 0.45;
        } else if (isHovered && canPlaceHovered) {
          mat.emissive.setHex(0xd4a853);
          mat.emissiveIntensity = 0.42;
        } else {
          mat.emissive.setHex(0x000000);
          mat.emissiveIntensity = 0;
        }
      }
    }
  }

  _bindPointerEvents() {
    if (!this.canvas) return;

    this.canvas.addEventListener('pointerdown', (e) => {
      this.pointerDownPos = { x: e.clientX, y: e.clientY };
      this.lastDragPos = { x: e.clientX, y: e.clientY };
      this.isDraggingOrbit = false;
    });

    window.addEventListener('pointermove', (e) => {
      if (!this.canvas) return;
      const rect = this.canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      // Check if user is dragging to orbit the 3D camera
      if (e.buttons === 1 || e.buttons === 2) {
        const dx = e.clientX - this.lastDragPos.x;
        const dy = e.clientY - this.lastDragPos.y;
        const totalDist = Math.hypot(
          e.clientX - this.pointerDownPos.x,
          e.clientY - this.pointerDownPos.y
        );

        if (totalDist > 6) {
          this.isDraggingOrbit = true;
          this.cinematicFlyIn = null;
          this.camSpherical.targetTheta -= dx * 0.0075;
          this.camSpherical.targetPhi = Math.max(
            0.28,
            Math.min(1.32, this.camSpherical.targetPhi - dy * 0.0065)
          );
          this.lastDragPos = { x: e.clientX, y: e.clientY };
          return;
        }
      }

      // Raycast against Altar Stone Tiles for hover preview
      this.pointerNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.pointerNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      const hitTile = this._raycastAltarTile();
      this.bus.emit('3d:tileHover', hitTile);
    });

    this.canvas.addEventListener('pointerup', (e) => {
      if (this.isDraggingOrbit) {
        this.isDraggingOrbit = false;
        return;
      }
      const rect = this.canvas.getBoundingClientRect();
      this.pointerNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.pointerNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      const hitTile = this._raycastAltarTile();
      if (hitTile) {
        this.bus.emit('3d:tileClick', hitTile);
      }
    });

    this.canvas.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        this.camSpherical.targetRadius = Math.max(
          6.8,
          Math.min(15.5, this.camSpherical.targetRadius + e.deltaY * 0.004)
        );
      },
      { passive: false }
    );

    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  _raycastAltarTile() {
    if (!this.altarData || !this.altarData.tilesGroup) return null;
    this.raycaster.setFromCamera(this.pointerNDC, this.camera);
    const intersects = this.raycaster.intersectObjects(this.altarData.tilesGroup.children, false);
    if (intersects.length > 0) {
      const hit = intersects[0].object;
      if (hit.userData && hit.userData.isAltarTile) {
        return { r: hit.userData.r, c: hit.userData.c };
      }
    }
    return null;
  }

  resize() {
    if (!this.canvas || !this.renderer) return;
    const width = this.canvas.clientWidth || window.innerWidth || 1280;
    const height = this.canvas.clientHeight || window.innerHeight || 720;
    this.camera.aspect = width / Math.max(1, height);
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  _updateCameraTransform(dt, elapsedSec = 0) {
    const s = this.camSpherical;

    if (this.cinematicFlyIn) {
      this.cinematicFlyIn.elapsed += dt;
      const rawT = Math.min(1, this.cinematicFlyIn.elapsed / this.cinematicFlyIn.duration);
      // Smooth cubic ease-out S-curve toward the 3D War-Table
      const ease = 1 - Math.pow(1 - rawT, 3.2);
      s.theta =
        this.cinematicFlyIn.startTheta +
        (this.cinematicFlyIn.endTheta - this.cinematicFlyIn.startTheta) * ease;
      s.phi =
        this.cinematicFlyIn.startPhi +
        (this.cinematicFlyIn.endPhi - this.cinematicFlyIn.startPhi) * ease;
      s.radius =
        this.cinematicFlyIn.startRadius +
        (this.cinematicFlyIn.endRadius - this.cinematicFlyIn.startRadius) * ease;
      s.lookAt.lerpVectors(this.cinematicFlyIn.startLookAt, this.cinematicFlyIn.endLookAt, ease);
      if (rawT >= 1) {
        this.cinematicFlyIn = null;
      }
    } else {
      const damp = Math.min(1, dt * 7.5);
      const idleOffset =
        this.idleOrbitActive && !this.isDraggingOrbit && elapsedSec > 0
          ? Math.sin(elapsedSec * 0.35) * 0.085
          : 0;
      s.theta += (s.targetTheta + idleOffset - s.theta) * damp;
      s.phi += (s.targetPhi - s.phi) * damp;
      s.radius += (s.targetRadius - s.radius) * damp;
      s.lookAt.lerp(s.targetLookAt, damp);
    }

    if (this.cinematicFocusTimer > 0) {
      this.cinematicFocusTimer -= dt;
      if (this.cinematicFocusTimer <= 0) {
        s.targetLookAt.set(0, 0.15, 0);
      }
    }

    const sinPhi = Math.sin(s.phi);
    let cx = s.lookAt.x + s.radius * sinPhi * Math.sin(s.theta);
    let cy = s.lookAt.y + s.radius * Math.cos(s.phi);
    let cz = s.lookAt.z + s.radius * sinPhi * Math.cos(s.theta);

    if (this.cameraShake > 0.001) {
      cx += (Math.random() - 0.5) * this.cameraShake;
      cy += (Math.random() - 0.5) * this.cameraShake;
      cz += (Math.random() - 0.5) * this.cameraShake;
      this.cameraShake = Math.max(0, this.cameraShake - dt * 1.4);
    }

    this.camera.position.set(cx, cy, cz);
    this.camera.lookAt(s.lookAt);
  }

  /**
   * Step all 3D animations, flickering fire braziers, piece slam arcs, and rigid-body stone shatter physics
   */
  stepFrame(dt, elapsedSec = 0) {
    // 1. Update Camera Orbit, Cinematic Fly-In & Shake
    this._updateCameraTransform(dt, elapsedSec);

    // 2. Step Rigid-Body Stone Shatter Physics
    this.shatterPhysics.step(dt);

    // 3. Step Active Piece Slam & Sacred Geometry Beam Animations
    for (let i = this.activeAnimations.length - 1; i >= 0; i--) {
      const anim = this.activeAnimations[i];
      anim.elapsed += dt;
      const t = Math.min(1, anim.elapsed / anim.duration);

      if (anim.type === 'slam') {
        // Heavy accelerated parabolic drop onto the stone tile
        const easeHoriz = 1 - Math.pow(1 - t, 3);
        const dropCurve = t * t * t;
        anim.mesh.position.x = anim.startX + (anim.targetX - anim.startX) * easeHoriz;
        anim.mesh.position.z = anim.startZ + (anim.targetZ - anim.startZ) * easeHoriz;
        anim.mesh.position.y = anim.startY + (anim.targetY - anim.startY) * dropCurve;
        anim.mesh.rotation.x = (1 - easeHoriz) * (anim.symbol === 'O' ? 0.55 : -0.55);

        if (t >= 1) {
          anim.mesh.position.set(anim.targetX, anim.targetY, anim.targetZ);
          anim.mesh.rotation.x = 0;
          const ringColor = anim.symbol === 'X' ? 0xf59e0b : anim.symbol === 'O' ? 0xe11d48 : 0x38bdf8;
          this.shatterPhysics.spawnShockwaveRing(
            { x: anim.targetX, y: 0.04, z: anim.targetZ },
            ringColor,
            0.95
          );
          this.addCameraShake(0.14);
          this.activeAnimations.splice(i, 1);
        }
      } else if (anim.type === 'beam') {
        anim.material.opacity = (1 - t) * 0.92;
        anim.mesh.position.y = Math.sin(t * Math.PI) * 0.12;
        if (t >= 1) {
          this.beamsRoot.remove(anim.mesh);
          this.activeAnimations.splice(i, 1);
        }
      }
    }

    // 4. Flicker Corner Fire Braziers & Spin Relic Cores
    if (this.altarData && this.altarData.brazierFlames) {
      for (let i = 0; i < this.altarData.brazierFlames.length; i++) {
        const flame = this.altarData.brazierFlames[i];
        const phase = flame.userData.phase || 0;
        const pulse = 0.88 + Math.sin(elapsedSec * 7.5 + phase) * 0.16;
        flame.scale.set(pulse, 0.9 + Math.cos(elapsedSec * 9.2 + phase) * 0.22, pulse);
        flame.rotation.y += dt * 2.2;
        if (this.brazierLights[i]) {
          this.brazierLights[i].intensity = 2.0 + Math.sin(elapsedSec * 8.0 + phase) * 0.45;
        }
      }
    }

    // Gentle idle spin on relic cores & floating Inquisitor halo
    this.piecesRoot.traverse((obj) => {
      if (obj.userData && obj.userData.spinSpeed) {
        obj.rotation.y += dt * obj.userData.spinSpeed;
      }
    });
    if (this.inquisitorMesh && this.inquisitorMesh.userData.halo) {
      this.inquisitorMesh.userData.halo.rotation.z += dt * 0.45;
    }

    if (this.renderer) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  startLoop() {
    if (this._rafId) return;
    this._lastTime = performance.now();
    const tick = (now) => {
      const dt = Math.min(0.05, (now - this._lastTime) / 1000);
      this._lastTime = now;
      this.stepFrame(dt, now / 1000);
      this._rafId = requestAnimationFrame(tick);
    };
    this._rafId = requestAnimationFrame(tick);
  }
}
