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
    this.scene.fog = new THREE.FogExp2(0x09070d, 0.015);

    this.camera = new THREE.PerspectiveCamera(42, 16 / 9, 0.1, 120);

    // Spherical Orbit Camera State (Default: Isometric View `high_cathedral`)
    this.camSpherical = {
      theta: 0.62,
      phi: 0.82,
      radius: 11.2,
      targetTheta: 0.62,
      targetPhi: 0.82,
      targetRadius: 11.2,
      lookAt: new THREE.Vector3(0, 0.14, 0),
      targetLookAt: new THREE.Vector3(0, 0.14, 0),
    };

    this.cameraShake = 0;
    this.cinematicFocusTimer = 0;
    this.idleOrbitActive = true;
    this.cinematicFlyIn = null;
    this.orbitVelocity = { theta: 0, phi: 0 };
    this.pointerParallax = { x: 0, y: 0 };
    this.radiusPulse = 0;

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
    this.applyCameraPreset(this.save?.getState()?.cameraPreset || 'high_cathedral', true);
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
      this.renderer.toneMappingExposure = 1.36;
      this.resize();
      window.addEventListener('resize', () => this.resize());
    } catch {
      this.renderer = null;
    }
  }

  _setupLighting() {
    this.ambientLight = new THREE.AmbientLight(0x362b4e, 1.55);
    this.scene.add(this.ambientLight);

    // 360° Warm Sanctuary Zenith / Royal Twilight Ground Bounce Fill Light
    this.hemiLight = new THREE.HemisphereLight(0xffeab5, 0x2d2246, 1.48);
    this.hemiLight.position.set(0, 14, 0);
    this.scene.add(this.hemiLight);

    // Moonlight / Rose-Window Directional Key Light casting crisp Gothic shadows
    this.dirLight = new THREE.DirectionalLight(0xffe8c2, 2.65);
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

    // Dedicated Overhead War-Table Chandelier Key Light for crisp stone & metallic highlights
    this.altarKeyLight = new THREE.PointLight(0xfff1cc, 3.1, 18.5, 1.15);
    this.altarKeyLight.position.set(0, 5.2, 0.65);
    this.scene.add(this.altarKeyLight);

    // 4 Corner Fire Brazier PointLights (flicker dynamically in render loop)
    this.brazierLights = [];
    for (let i = 0; i < 4; i++) {
      const pLight = new THREE.PointLight(0xff7b29, 3.1, 11.5, 1.35);
      pLight.position.set(0, 1.5, 0);
      this.scene.add(pLight);
      this.brazierLights.push(pLight);
    }

    // Rim backlight & front key fill on the 3D Enemy Warlord Commander
    this.inquisitorRimLight = new THREE.PointLight(0xe11d48, 3.0, 12, 1.3);
    this.inquisitorRimLight.position.set(0, 3.2, -5.2);
    this.scene.add(this.inquisitorRimLight);

    this.commanderFillLight = new THREE.PointLight(0xffb480, 1.9, 9.5, 1.35);
    this.commanderFillLight.position.set(0, 2.4, -2.5);
    this.scene.add(this.commanderFillLight);
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
      this.radiusPulse = -0.18;
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
          entMesh.userData = { ...entMesh.userData, isAltarTile: true, r, c };
          entMesh.traverse((child) => {
            child.userData = { ...child.userData, isAltarTile: true, r, c };
          });
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
    mesh.userData = { ...mesh.userData, isAltarTile: true, r, c, hasShield: shield > 0 };
    mesh.traverse((child) => {
      child.userData = { ...child.userData, isAltarTile: true, r, c };
    });
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
   * Apply one of the 4 Camera Angle Presets (`high_cathedral` Isometric default, `commander_angle`, `inquisitor_duel`, `belfry_topdown`)
   */
  applyCameraPreset(presetId = 'high_cathedral', immediate = false) {
    const preset = CAMERA_PRESETS.find((p) => p.id === presetId) || CAMERA_PRESETS[0];
    const scaleFactor = this.boardSize >= 6 ? 1.18 : 1.0;

    const endTheta = preset.theta;
    const endPhi = preset.phi;
    const endRadius = preset.radius * scaleFactor;
    const endLookY = preset.targetY ?? 0.14;

    this.orbitVelocity.theta = 0;
    this.orbitVelocity.phi = 0;
    this.camSpherical.targetTheta = endTheta;
    this.camSpherical.targetPhi = endPhi;
    this.camSpherical.targetRadius = endRadius;
    this.camSpherical.targetLookAt.set(0, endLookY, 0);

    if (immediate) {
      this.cinematicFlyIn = null;
      this.camSpherical.theta = endTheta;
      this.camSpherical.phi = endPhi;
      this.camSpherical.radius = endRadius;
      this.camSpherical.lookAt.set(0, endLookY, 0);
      this._updateCameraTransform(0, 0);
    } else {
      // Smooth S-curve transition when switching camera presets
      this.cinematicFlyIn = {
        elapsed: 0,
        duration: 0.78,
        startTheta: this.camSpherical.theta,
        startPhi: this.camSpherical.phi,
        startRadius: this.camSpherical.radius,
        startLookAt: this.camSpherical.lookAt.clone(),
        endTheta,
        endPhi,
        endRadius,
        endLookAt: new THREE.Vector3(0, endLookY, 0),
      };
    }
  }

  /**
   * AAA Cinematic Isometric Camera Fly-In toward the 3D War-Table
   */
  playCinematicFlyIn(presetId = 'high_cathedral', duration = 2.35) {
    const preset = CAMERA_PRESETS.find((p) => p.id === presetId) || CAMERA_PRESETS[0];
    const scaleFactor = this.boardSize >= 6 ? 1.18 : 1.0;

    const endTheta = preset.theta;
    const endPhi = preset.phi;
    const endRadius = preset.radius * scaleFactor;
    const endLookY = preset.targetY ?? 0.14;

    // Start from an elevated isometric vantage and glide smoothly down into the Isometric board view
    const startTheta = endTheta - 0.72;
    const startPhi = 0.52;
    const startRadius = 17.6 * scaleFactor;
    const startLookY = 1.45;

    this.orbitVelocity.theta = 0;
    this.orbitVelocity.phi = 0;
    this.camSpherical.theta = startTheta;
    this.camSpherical.phi = startPhi;
    this.camSpherical.radius = startRadius;
    this.camSpherical.lookAt.set(0, startLookY, -0.65);

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
      startLookAt: new THREE.Vector3(0, startLookY, -0.65),
      endTheta,
      endPhi,
      endRadius,
      endLookAt: new THREE.Vector3(0, endLookY, 0),
    };
  }

  /**
   * Smooth Battle-Start Isometric Swoop toward the 3D War-Table
   */
  playBattleZoomIn(presetId = 'high_cathedral', duration = 1.65) {
    const preset = CAMERA_PRESETS.find((p) => p.id === presetId) || CAMERA_PRESETS[0];
    const scaleFactor = this.boardSize >= 6 ? 1.18 : 1.0;

    const endTheta = preset.theta;
    const endPhi = preset.phi;
    const endRadius = preset.radius * scaleFactor;
    const endLookY = preset.targetY ?? 0.14;

    const startTheta = endTheta - 0.38;
    const startPhi = 0.62;
    const startRadius = 14.2 * scaleFactor;

    this.orbitVelocity.theta = 0;
    this.orbitVelocity.phi = 0;
    this.camSpherical.theta = startTheta;
    this.camSpherical.phi = startPhi;
    this.camSpherical.radius = startRadius;
    this.camSpherical.lookAt.set(0, 0.85, -0.65);

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
      startLookAt: new THREE.Vector3(0, 0.85, -0.65),
      endTheta,
      endPhi,
      endRadius,
      endLookAt: new THREE.Vector3(0, endLookY, 0),
    };
  }

  focusCameraBrieflyOnTile(r, c, duration = 0.95) {
    const pos = this.tileToWorld(r, c);
    this.camSpherical.targetLookAt.set(pos.x * 0.24, 0.2, pos.z * 0.24);
    this.radiusPulse = -0.36;
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
    this.isPointerDownOnCanvas = false;
    this.pointerDownTime = 0;

    this.canvas.addEventListener('pointerdown', (e) => {
      if (e.button === 2) {
        this.bus.emit('3d:cancelSelection');
      }
      this.isPointerDownOnCanvas = true;
      this.pointerDownTime = performance.now();
      this.pointerDownPos = { x: e.clientX, y: e.clientY };
      this.lastDragPos = { x: e.clientX, y: e.clientY };
      this.isDraggingOrbit = false;
    });

    window.addEventListener('pointermove', (e) => {
      if (!this.canvas) return;
      const rect = this.canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      // Check if user is deliberately dragging on the 3D canvas to orbit the camera
      if (this.isPointerDownOnCanvas && (e.buttons === 1 || e.buttons === 2)) {
        const dx = e.clientX - this.lastDragPos.x;
        const dy = e.clientY - this.lastDragPos.y;
        const totalDist = Math.hypot(
          e.clientX - this.pointerDownPos.x,
          e.clientY - this.pointerDownPos.y
        );

        // Generous 16px threshold so normal hand jitter during a click never swallows the click
        if (totalDist > 16) {
          this.isDraggingOrbit = true;
          this.cinematicFlyIn = null;
          const dTheta = -dx * 0.0068;
          const dPhi = -dy * 0.0058;
          this.camSpherical.targetTheta += dTheta;
          this.camSpherical.targetPhi = Math.max(
            0.26,
            Math.min(1.28, this.camSpherical.targetPhi + dPhi)
          );
          this.orbitVelocity.theta = dTheta * 0.55;
          this.orbitVelocity.phi = dPhi * 0.55;
          this.lastDragPos = { x: e.clientX, y: e.clientY };
          return;
        }
      }

      // Raycast against Altar Stone Tiles & Pieces for hover preview + subtle cursor parallax
      this.pointerNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.pointerNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      this.pointerParallax.x = this.pointerNDC.x * 0.024;
      this.pointerParallax.y = this.pointerNDC.y * 0.016;
      const hitTile = this._raycastAltarTile();
      this.bus.emit('3d:tileHover', hitTile);
    });

    window.addEventListener('pointerup', (e) => {
      if (!this.isPointerDownOnCanvas) return;
      this.isPointerDownOnCanvas = false;

      const clickDuration = performance.now() - this.pointerDownTime;
      const totalDist = Math.hypot(
        e.clientX - this.pointerDownPos.x,
        e.clientY - this.pointerDownPos.y
      );
      const isQuickClick = clickDuration < 260 && totalDist < 24;

      if (this.isDraggingOrbit && !isQuickClick) {
        this.isDraggingOrbit = false;
        return;
      }
      this.isDraggingOrbit = false;

      if (e.button !== 0) return;

      const rect = this.canvas.getBoundingClientRect();
      this.pointerNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.pointerNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      const hitTile = this._raycastAltarTile();
      if (hitTile) {
        this.bus.emit('3d:tileClick', hitTile);
      }
    });

    window.addEventListener('pointercancel', () => {
      this.isPointerDownOnCanvas = false;
      this.isDraggingOrbit = false;
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

    // 1. Raycast against 3D Sculpted Pieces, Board Entities, and Stone Tiles (recursively)
    const targets = [
      this.piecesRoot,
      this.entitiesRoot,
      this.altarData.tilesGroup,
    ].filter(Boolean);
    const intersects = this.raycaster.intersectObjects(targets, true);
    for (const hit of intersects) {
      let cur = hit.object;
      while (cur) {
        if (cur.userData && cur.userData.isAltarTile) {
          return { r: cur.userData.r, c: cur.userData.c };
        }
        cur = cur.parent;
      }
    }

    // 2. Mathematical War-Table Plane Fallback (y = 0.02) so clicking between tile bevels never misses!
    const ray = this.raycaster.ray;
    if (Math.abs(ray.direction.y) > 0.001) {
      const t = (0.02 - ray.origin.y) / ray.direction.y;
      if (t > 0) {
        const wx = ray.origin.x + ray.direction.x * t;
        const wz = ray.origin.z + ray.direction.z * t;
        const { tileSpacing, offset } = this.altarData;
        const c = Math.round((wx + offset) / tileSpacing);
        const r = Math.round((wz + offset) / tileSpacing);
        if (r >= 0 && r < this.boardSize && c >= 0 && c < this.boardSize) {
          const tileX = c * tileSpacing - offset;
          const tileZ = r * tileSpacing - offset;
          if (
            Math.abs(wx - tileX) <= tileSpacing * 0.54 &&
            Math.abs(wz - tileZ) <= tileSpacing * 0.54
          ) {
            return { r, c };
          }
        }
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
      // Silky Quintic S-curve (smoothstep-5) with gentle ease-in and feather-soft landing
      const quint = rawT * rawT * rawT * (rawT * (rawT * 6 - 15) + 10);
      const easeOut = 1 - Math.pow(1 - rawT, 3.0);
      const ease = quint * 0.65 + easeOut * 0.35;

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
      // Apply smooth inertial orbit glide when releasing a camera drag
      if (!this.isDraggingOrbit && (Math.abs(this.orbitVelocity.theta) > 0.0001 || Math.abs(this.orbitVelocity.phi) > 0.0001)) {
        const friction = Math.exp(-dt * 8.5);
        this.camSpherical.targetTheta += this.orbitVelocity.theta;
        this.camSpherical.targetPhi = Math.max(
          0.26,
          Math.min(1.28, this.camSpherical.targetPhi + this.orbitVelocity.phi)
        );
        this.orbitVelocity.theta *= friction;
        this.orbitVelocity.phi *= friction;
      }

      this.radiusPulse += (0 - this.radiusPulse) * Math.min(1, dt * 4.5);

      const damp = Math.min(1, dt * 7.8);
      const idleOffset =
        this.idleOrbitActive && !this.isDraggingOrbit && elapsedSec > 0
          ? Math.sin(elapsedSec * 0.38) * 0.065
          : 0;
      const parallaxTheta = !this.isDraggingOrbit ? this.pointerParallax.x : 0;
      const parallaxPhi = !this.isDraggingOrbit ? -this.pointerParallax.y * 0.5 : 0;

      s.theta += (s.targetTheta + idleOffset + parallaxTheta - s.theta) * damp;
      s.phi += (s.targetPhi + parallaxPhi - s.phi) * damp;
      s.radius += (s.targetRadius + this.radiusPulse - s.radius) * damp;
      s.lookAt.lerp(s.targetLookAt, damp);
    }

    if (this.cinematicFocusTimer > 0) {
      this.cinematicFocusTimer -= dt;
      if (this.cinematicFocusTimer <= 0) {
        s.targetLookAt.set(0, 0.14, 0);
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

    // 4. Animate Multi-Layered Corner Fire Braziers, Sparks & Relic Cores
    if (this.altarData && this.altarData.brazierFlames) {
      for (let i = 0; i < this.altarData.brazierFlames.length; i++) {
        const flameGroup = this.altarData.brazierFlames[i];
        const ud = flameGroup.userData || {};
        const phase = ud.phase || 0;

        if (ud.outerFlame) {
          const sx = 0.92 + Math.sin(elapsedSec * 6.8 + phase) * 0.14;
          const sy = 0.96 + Math.sin(elapsedSec * 9.5 + phase * 1.3) * 0.22;
          const sz = 0.92 + Math.cos(elapsedSec * 7.2 + phase) * 0.14;
          ud.outerFlame.scale.set(sx, sy, sz);
          ud.outerFlame.rotation.y += dt * 1.8;
          ud.outerFlame.rotation.z = Math.sin(elapsedSec * 5.4 + phase) * 0.09;
          ud.outerFlame.rotation.x = Math.cos(elapsedSec * 4.9 + phase) * 0.09;
        }

        if (ud.tongues) {
          for (let t = 0; t < ud.tongues.length; t++) {
            const tongue = ud.tongues[t];
            const tp = tongue.userData.phaseOffset || 0;
            const baseAngle = tongue.userData.baseAngle || 0;
            const tScaleY = 0.88 + Math.sin(elapsedSec * 11.2 + tp) * 0.26;
            const tScaleXZ = 0.86 + Math.cos(elapsedSec * 8.4 + tp) * 0.16;
            tongue.scale.set(tScaleXZ, tScaleY, tScaleXZ);
            tongue.rotation.z =
              -Math.cos(baseAngle) * 0.2 + Math.sin(elapsedSec * 7.8 + tp) * 0.14;
            tongue.rotation.x =
              Math.sin(baseAngle) * 0.2 + Math.cos(elapsedSec * 8.1 + tp) * 0.14;
          }
        }

        if (ud.innerCore) {
          const corePulse = 0.9 + Math.sin(elapsedSec * 14.0 + phase) * 0.18;
          ud.innerCore.scale.set(
            corePulse,
            0.95 + Math.cos(elapsedSec * 16.0 + phase) * 0.2,
            corePulse
          );
          ud.innerCore.rotation.y -= dt * 2.6;
        }

        if (ud.fireGlow) {
          const glowScale = 0.94 + Math.sin(elapsedSec * 6.0 + phase) * 0.12;
          ud.fireGlow.scale.setScalar(glowScale);
        }

        if (ud.sparks) {
          for (let s = 0; s < ud.sparks.length; s++) {
            const spark = ud.sparks[s];
            const sd = spark.userData;
            const cycle = (elapsedSec * sd.speed + sd.seed) % 1;
            const sparkY = 0.14 + cycle * 1.05;
            const angle = elapsedSec * 3.4 + sd.seed * 2.2;
            const rad = sd.radius * (0.4 + cycle * 1.15);
            spark.position.set(
              Math.cos(angle) * rad,
              sparkY,
              Math.sin(angle) * rad
            );
            const lifeScale = Math.sin(cycle * Math.PI);
            spark.scale.setScalar(Math.max(0.05, lifeScale * 1.15));
          }
        }

        if (this.brazierLights[i]) {
          this.brazierLights[i].intensity =
            3.0 +
            Math.sin(elapsedSec * 8.2 + phase) * 0.45 +
            Math.cos(elapsedSec * 13.5 + phase) * 0.2;
        }
      }
    }

    // Gentle idle spin & levitation on character relic cores & floating Warlord Commander
    this.piecesRoot.traverse((obj) => {
      if (obj.userData && obj.userData.spinSpeed) {
        obj.rotation.y += dt * obj.userData.spinSpeed;
      }
      if (obj.userData && obj.userData.floatAmplitude) {
        obj.position.y =
          (obj.userData.baseY || 0.65) +
          Math.sin(elapsedSec * 3.2 + (obj.userData.floatPhase || 0)) *
            obj.userData.floatAmplitude;
      }
    });
    if (this.inquisitorMesh) {
      const iu = this.inquisitorMesh.userData || {};
      if (iu.halo) {
        iu.halo.rotation.z += dt * 0.55;
      }
      if (iu.innerHalo) {
        iu.innerHalo.rotation.z -= dt * 0.85;
      }
      if (iu.bodyGroup) {
        iu.bodyGroup.position.y = Math.sin(elapsedSec * 2.1) * 0.045;
      }
      if (iu.wingGroup) {
        const flap = Math.sin(elapsedSec * 2.6) * 0.06;
        iu.wingGroup.scale.set(1 + flap, 1 + flap * 0.5, 1);
      }
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
