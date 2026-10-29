/**
 * XcardO III: Obsidian Sanctum
 * Procedural 3D Gothic Piece Sculptor, Cathedral Altar & Inquisitor Automaton Builder
 * Uses Vendored Three.js r162 (ES Module)
 */

import * as THREE from '../vendor/three.module.js';
import { STONE_MATERIALS } from '../data/gothic-config.js';

/**
 * Create a PBR Stone / Metal material from `STONE_MATERIALS` config
 */
export function createStoneMaterial(materialId, overrides = {}) {
  const matDef = STONE_MATERIALS.find((m) => m.id === materialId) || STONE_MATERIALS[0];
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(overrides.color ?? matDef.color),
    roughness: overrides.roughness ?? matDef.roughness,
    metalness: overrides.metalness ?? matDef.metalness,
    emissive: new THREE.Color(overrides.emissive ?? matDef.emissive ?? 0x000000),
    emissiveIntensity: overrides.emissiveIntensity ?? 0.35,
    flatShading: overrides.flatShading ?? false,
    transparent: Boolean(overrides.transparent),
    opacity: overrides.opacity ?? 1.0,
  });
}

/**
 * Create a 3D Sculpted Gothic Piece for 'X' (Order), 'O' (Inquisition), or 'W' (Sanctified Wild Relic)
 */
export function createPieceSculpture3D(symbol, sculptId, materialId, options = {}) {
  const group = new THREE.Group();
  group.name = `Piece_${symbol}_${sculptId}`;

  const isGhost = Boolean(options.isGhost);
  const hasShield = Boolean(options.shield && options.shield > 0);

  const defaultMatId =
    symbol === 'X'
      ? materialId || 'alabaster_marble'
      : symbol === 'O'
      ? materialId || 'blood_obsidian'
      : 'gilded_reliquary';

  const matDef = STONE_MATERIALS.find((m) => m.id === defaultMatId) || STONE_MATERIALS[0];

  const primaryMat = createStoneMaterial(defaultMatId, {
    transparent: isGhost,
    opacity: isGhost ? 0.52 : 1.0,
    emissiveIntensity: isGhost ? 0.8 : 0.3,
  });

  const trimColor = symbol === 'X' ? 0xd4a853 : symbol === 'O' ? 0xe11d48 : 0xfbbf24;
  const trimMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(matDef.accentColor || trimColor),
    roughness: 0.25,
    metalness: 0.82,
    emissive: new THREE.Color(trimColor),
    emissiveIntensity: isGhost ? 0.9 : 0.45,
    transparent: isGhost,
    opacity: isGhost ? 0.6 : 1.0,
  });

  const coreGlowColor = symbol === 'X' ? 0xfbbf24 : symbol === 'O' ? 0xf43f5e : 0x38bdf8;
  const glowMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(coreGlowColor),
    emissive: new THREE.Color(coreGlowColor),
    emissiveIntensity: 1.4,
    roughness: 0.15,
    metalness: 0.2,
    transparent: isGhost,
    opacity: isGhost ? 0.75 : 1.0,
  });

  // 1. Stepped Octagonal Gothic Plinth Base (shared heritage across all pieces)
  const baseLower = new THREE.Mesh(new THREE.CylinderGeometry(0.41, 0.45, 0.12, 8), primaryMat);
  baseLower.position.y = 0.06;
  baseLower.castShadow = !isGhost;
  baseLower.receiveShadow = !isGhost;
  group.add(baseLower);

  const baseUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.39, 0.1, 8), primaryMat);
  baseUpper.position.y = 0.16;
  baseUpper.castShadow = !isGhost;
  baseUpper.receiveShadow = !isGhost;
  group.add(baseUpper);

  const baseCollar = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.026, 8, 16), trimMat);
  baseCollar.rotation.x = Math.PI / 2;
  baseCollar.position.y = 0.21;
  group.add(baseCollar);

  // 2. Sculpted Archetype Upper Geometry
  if (symbol === 'W') {
    // Sanctified Wild Relic: Levitating Sunburst Reliquary
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.22, 0.32, 8), trimMat);
    stem.position.y = 0.36;
    stem.castShadow = !isGhost;
    group.add(stem);

    const haloOuter = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.035, 10, 24), trimMat);
    haloOuter.position.y = 0.68;
    group.add(haloOuter);

    const haloInner = new THREE.Mesh(new THREE.TorusGeometry(0.21, 0.025, 8, 20), glowMat);
    haloInner.rotation.y = Math.PI / 4;
    haloInner.position.y = 0.68;
    haloInner.userData.spinSpeed = 1.8;
    group.add(haloInner);

    const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.15, 0), glowMat);
    crystal.position.y = 0.68;
    crystal.userData.spinSpeed = -2.4;
    group.add(crystal);
  } else if (sculptId === 'templar_knight') {
    // Crusader Great-Helm + Upright Broadsword Cross
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.3, 0.34, 8), primaryMat);
    torso.position.y = 0.37;
    torso.castShadow = !isGhost;
    group.add(torso);

    // Shoulder Pauldrons
    for (const dir of [-1, 1]) {
      const pauldron = new THREE.Mesh(new THREE.DodecahedronGeometry(0.14, 0), primaryMat);
      pauldron.position.set(dir * 0.24, 0.48, 0);
      pauldron.scale.set(1.1, 0.8, 1.2);
      pauldron.castShadow = !isGhost;
      group.add(pauldron);
    }

    // Great-Helm
    const helm = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.19, 0.28, 8), primaryMat);
    helm.position.y = 0.66;
    helm.castShadow = !isGhost;
    group.add(helm);

    const helmCrown = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.14, 8), trimMat);
    helmCrown.position.y = 0.87;
    helmCrown.castShadow = !isGhost;
    group.add(helmCrown);

    // Glowing Visor Cross
    const visorH = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.035, 0.06), glowMat);
    visorH.position.set(0, 0.68, 0.16);
    group.add(visorH);

    const visorV = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.2, 0.06), trimMat);
    visorV.position.set(0, 0.66, 0.16);
    group.add(visorV);
  } else if (sculptId === 'gargoyle_warden') {
    // Winged Gothic Gargoyle Sentinel
    const pedestal = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.26, 0.38), primaryMat);
    pedestal.position.y = 0.33;
    pedestal.castShadow = !isGhost;
    group.add(pedestal);

    const body = new THREE.Mesh(new THREE.DodecahedronGeometry(0.22, 0), primaryMat);
    body.position.set(0, 0.56, 0.03);
    body.scale.set(1.0, 1.25, 0.95);
    body.castShadow = !isGhost;
    group.add(body);

    const head = new THREE.Mesh(new THREE.OctahedronGeometry(0.15, 0), primaryMat);
    head.position.set(0, 0.78, 0.08);
    head.castShadow = !isGhost;
    group.add(head);

    // Swept Stone Wings & Horns
    for (const dir of [-1, 1]) {
      const wing = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.42, 0.26), trimMat);
      wing.position.set(dir * 0.24, 0.68, -0.08);
      wing.rotation.z = dir * -0.38;
      wing.rotation.y = dir * 0.25;
      wing.castShadow = !isGhost;
      group.add(wing);

      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.22, 5), trimMat);
      horn.position.set(dir * 0.1, 0.92, 0.02);
      horn.rotation.z = dir * -0.35;
      horn.rotation.x = -0.3;
      group.add(horn);

      const eye = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.025, 0.04), glowMat);
      eye.position.set(dir * 0.055, 0.79, 0.19);
      group.add(eye);
    }
  } else if (sculptId === 'ossuary_skull') {
    // Memento Mori Cathedral Skull & Iron Halo
    const column = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.28, 0.24, 8), primaryMat);
    column.position.y = 0.32;
    column.castShadow = !isGhost;
    group.add(column);

    const cranium = new THREE.Mesh(new THREE.IcosahedronGeometry(0.24, 1), primaryMat);
    cranium.position.set(0, 0.62, 0);
    cranium.scale.set(0.92, 1.08, 1.05);
    cranium.castShadow = !isGhost;
    group.add(cranium);

    const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 0.22), primaryMat);
    jaw.position.set(0, 0.44, 0.06);
    jaw.castShadow = !isGhost;
    group.add(jaw);

    // Glowing Crimson Eye Sockets
    for (const dir of [-1, 1]) {
      const socket = new THREE.Mesh(new THREE.OctahedronGeometry(0.055, 0), glowMat);
      socket.position.set(dir * 0.085, 0.61, 0.21);
      group.add(socket);
    }

    // Spiked Iron Crown Halo behind skull
    const crownHalo = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.028, 8, 16), trimMat);
    crownHalo.position.set(0, 0.65, -0.05);
    crownHalo.rotation.x = 0.35;
    group.add(crownHalo);
  } else if (sculptId === 'abyssal_obelisk') {
    // Twisted Monolith Spire + Floating Inverted Pyramid
    const obelisk = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.27, 0.62, 4), primaryMat);
    obelisk.position.y = 0.52;
    obelisk.rotation.y = Math.PI / 4;
    obelisk.castShadow = !isGhost;
    group.add(obelisk);

    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.22, 4), glowMat);
    cap.position.y = 0.94;
    cap.rotation.y = Math.PI / 4;
    cap.userData.spinSpeed = 1.6;
    group.add(cap);

    const shackle = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.025, 6, 16), trimMat);
    shackle.position.y = 0.58;
    shackle.rotation.x = Math.PI / 2.4;
    shackle.userData.spinSpeed = -1.2;
    group.add(shackle);
  } else if (symbol === 'O' || sculptId === 'iron_torus') {
    // Default Inquisition 'O': Spiked Iron Crown Torus + Abyssal Eye Core
    const chalicePedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.28, 0.26, 8), primaryMat);
    chalicePedestal.position.y = 0.32;
    chalicePedestal.castShadow = !isGhost;
    group.add(chalicePedestal);

    const torus = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.075, 12, 24), primaryMat);
    torus.position.y = 0.64;
    torus.rotation.x = 0.28;
    torus.castShadow = !isGhost;
    group.add(torus);

    // 8 Radial Iron Spikes around the Torus
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.036, 0.14, 5), trimMat);
      spike.position.set(
        Math.cos(angle) * 0.34,
        0.64 + Math.sin(angle) * 0.32,
        Math.sin(angle) * -0.09
      );
      spike.rotation.z = angle - Math.PI / 2;
      group.add(spike);
    }

    const eyeCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.11, 0), glowMat);
    eyeCore.position.y = 0.64;
    eyeCore.userData.spinSpeed = 2.0;
    group.add(eyeCore);
  } else {
    // Default Order 'X' (`seraph_cross`): Crossed Cathedral Blades + Levitating Halo
    const altarBlock = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.18, 0.32), primaryMat);
    altarBlock.position.y = 0.28;
    altarBlock.castShadow = !isGhost;
    group.add(altarBlock);

    const bladeGeo = new THREE.BoxGeometry(0.68, 0.14, 0.16);
    const blade1 = new THREE.Mesh(bladeGeo, primaryMat);
    blade1.position.y = 0.58;
    blade1.rotation.z = Math.PI / 4;
    blade1.castShadow = !isGhost;
    group.add(blade1);

    const blade2 = new THREE.Mesh(bladeGeo, primaryMat);
    blade2.position.y = 0.58;
    blade2.rotation.z = -Math.PI / 4;
    blade2.castShadow = !isGhost;
    group.add(blade2);

    // Gold Reliquary Halo around the X intersection
    const halo = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.026, 8, 24), trimMat);
    halo.position.y = 0.58;
    group.add(halo);

    // Radiant Diamond Heart
    const heart = new THREE.Mesh(new THREE.OctahedronGeometry(0.11, 0), glowMat);
    heart.position.y = 0.58;
    heart.userData.spinSpeed = 1.6;
    group.add(heart);
  }

  // 3. Optional Gargoyle Aegis Shield Dome
  if (hasShield && !isGhost) {
    const shieldMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      emissive: 0xd97706,
      emissiveIntensity: 0.65,
      roughness: 0.15,
      metalness: 0.3,
      transparent: true,
      opacity: 0.28,
      wireframe: false,
    });
    const dome = new THREE.Mesh(new THREE.IcosahedronGeometry(0.52, 1), shieldMat);
    dome.position.y = 0.5;
    group.add(dome);

    const shieldRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.48, 0.02, 8, 24),
      new THREE.MeshBasicMaterial({ color: 0xfde68a })
    );
    shieldRing.rotation.x = Math.PI / 2;
    shieldRing.position.y = 0.08;
    group.add(shieldRing);
  }

  group.userData = {
    symbol,
    sculptId,
    materialId: defaultMatId,
    isGhost,
    baseColor: matDef.color,
    accentColor: matDef.accentColor || trimColor,
  };

  return group;
}

/**
 * Create a 3D Altar Tile Hazard / Obstacle / Anomaly Mesh
 */
export function createTileEntity3D(entityType) {
  const group = new THREE.Group();
  group.name = `TileEntity_${entityType}`;

  if (entityType === 'gargoyle_bastion') {
    // Indestructible Gothic Stone Pillar with Iron Bands
    const stoneMat = createStoneMaterial('weathered_basalt');
    const ironMat = createStoneMaterial('verdigris_bronze', { color: 0x52525b });

    const base = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.2, 0.74), stoneMat);
    base.position.y = 0.1;
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 0.78, 6), stoneMat);
    shaft.position.y = 0.54;
    shaft.castShadow = true;
    shaft.receiveShadow = true;
    group.add(shaft);

    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.38, 0.32, 6), ironMat);
    cap.position.y = 1.06;
    cap.castShadow = true;
    group.add(cap);
  } else if (entityType === 'reliquary_coffer') {
    // Breakable Ornate Stone & Gilded-Iron Reliquary Chest
    const chestMat = createStoneMaterial('weathered_basalt', { color: 0x3b2f2f });
    const goldMat = createStoneMaterial('gilded_reliquary');
    const glowMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      emissive: 0xf59e0b,
      emissiveIntensity: 1.5,
    });

    const box = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.36, 0.46), chestMat);
    box.position.y = 0.18;
    box.castShadow = true;
    box.receiveShadow = true;
    group.add(box);

    const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.23, 0.64, 8, 1, false, 0, Math.PI), goldMat);
    lid.rotation.z = Math.PI / 2;
    lid.position.y = 0.36;
    lid.castShadow = true;
    group.add(lid);

    const lockGem = new THREE.Mesh(new THREE.OctahedronGeometry(0.08, 0), glowMat);
    lockGem.position.set(0, 0.3, 0.25);
    group.add(lockGem);
  } else if (entityType === 'sanctified_mosaic') {
    // Glowing Stained-Glass Rose Window Medallion inlaid into the tile
    const ringMat = createStoneMaterial('gilded_reliquary');
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 1.1,
      roughness: 0.15,
      metalness: 0.1,
      transparent: true,
      opacity: 0.85,
    });

    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.03, 16), glassMat);
    disc.position.y = 0.02;
    group.add(disc);

    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.03, 8, 24), ringMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.03;
    group.add(rim);
  } else if (entityType === 'cursed_censer') {
    // Volatile Brimstone Incense Burner
    const bronzeMat = createStoneMaterial('verdigris_bronze');
    const emberMat = new THREE.MeshStandardMaterial({
      color: 0xf43f5e,
      emissive: 0xe11d48,
      emissiveIntensity: 1.8,
    });

    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.14, 0.22, 8), bronzeMat);
    bowl.position.y = 0.14;
    bowl.castShadow = true;
    group.add(bowl);

    const core = new THREE.Mesh(new THREE.DodecahedronGeometry(0.16, 0), emberMat);
    core.position.y = 0.28;
    core.userData.spinSpeed = 1.4;
    group.add(core);
  } else if (entityType === 'blood_chalice') {
    // Golden Sanguine Goblet
    const goldMat = createStoneMaterial('gilded_reliquary');
    const bloodMat = new THREE.MeshStandardMaterial({
      color: 0xe11d48,
      emissive: 0xbe123c,
      emissiveIntensity: 1.4,
      roughness: 0.1,
    });

    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.08, 0.28, 10), goldMat);
    cup.position.y = 0.16;
    cup.castShadow = true;
    group.add(cup);

    const drop = new THREE.Mesh(new THREE.OctahedronGeometry(0.1, 0), bloodMat);
    drop.position.y = 0.42;
    drop.userData.spinSpeed = 2.1;
    group.add(drop);
  } else if (entityType === 'iron_cage') {
    // Wrought-Iron Portcullis Bars locking a tile
    const ironMat = new THREE.MeshStandardMaterial({
      color: 0x3f3f46,
      roughness: 0.4,
      metalness: 0.85,
      emissive: 0x7f1d1d,
      emissiveIntensity: 0.35,
    });

    const posts = [
      [-0.36, -0.36],
      [0.36, -0.36],
      [-0.36, 0.36],
      [0.36, 0.36],
    ];
    for (const [px, pz] of posts) {
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.55, 6), ironMat);
      bar.position.set(px, 0.27, pz);
      bar.castShadow = true;
      group.add(bar);
    }
    const topRing = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.03, 6, 16), ironMat);
    topRing.rotation.x = Math.PI / 2;
    topRing.position.y = 0.48;
    group.add(topRing);
  }

  return group;
}

/**
 * Build the 3D Gothic Cathedral Altar Table, Corner Fire Braziers, and Raycastable Stone Tiles
 */
export function createCathedralAltar3D(boardSize = 5, hallConfig = {}) {
  const root = new THREE.Group();
  root.name = 'CathedralAltarRoot';

  const tileSpacing = 1.14;
  const boardSpan = boardSize * tileSpacing;
  const altarWidth = boardSpan + 1.5;

  const slabMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(hallConfig.altarStoneColor || 0x1c1824),
    roughness: 0.72,
    metalness: 0.22,
  });

  const trimMat = new THREE.MeshStandardMaterial({
    color: 0x8a6d3b,
    roughness: 0.38,
    metalness: 0.78,
  });

  // 1. Heavy Stepped Cathedral Altar Slab
  const mainSlab = new THREE.Mesh(new THREE.BoxGeometry(altarWidth, 0.55, altarWidth), slabMat);
  mainSlab.position.y = -0.34;
  mainSlab.receiveShadow = true;
  mainSlab.castShadow = true;
  root.add(mainSlab);

  const lowerPlinth = new THREE.Mesh(
    new THREE.BoxGeometry(altarWidth + 0.9, 0.7, altarWidth + 0.9),
    slabMat
  );
  lowerPlinth.position.y = -0.92;
  lowerPlinth.receiveShadow = true;
  root.add(lowerPlinth);

  // Ornate Brass/Gold Altar Border Frame
  const borderRim = new THREE.Mesh(
    new THREE.BoxGeometry(boardSpan + 0.36, 0.14, boardSpan + 0.36),
    trimMat
  );
  borderRim.position.y = -0.09;
  borderRim.receiveShadow = true;
  root.add(borderRim);

  // 2. Corner Gothic Buttress Pillars & Flickering Fire Braziers
  const halfCorner = altarWidth * 0.5 - 0.25;
  const cornerCoords = [
    [-halfCorner, -halfCorner],
    [halfCorner, -halfCorner],
    [-halfCorner, halfCorner],
    [halfCorner, halfCorner],
  ];
  const brazierFlames = [];

  const emberMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(hallConfig.brazierColor || 0xff7b29),
    emissive: new THREE.Color(hallConfig.brazierColor || 0xff7b29),
    emissiveIntensity: 2.2,
    roughness: 0.2,
  });

  for (let i = 0; i < cornerCoords.length; i++) {
    const [cx, cz] = cornerCoords[i];
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.42, 0.75, 8), slabMat);
    pillar.position.set(cx, 0.28, cz);
    pillar.castShadow = true;
    pillar.receiveShadow = true;
    root.add(pillar);

    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.2, 0.24, 8), trimMat);
    bowl.position.set(cx, 0.74, cz);
    bowl.castShadow = true;
    root.add(bowl);

    const flame = new THREE.Mesh(new THREE.OctahedronGeometry(0.22, 0), emberMat.clone());
    flame.position.set(cx, 0.98, cz);
    flame.userData.phase = i * 1.57;
    root.add(flame);
    brazierFlames.push(flame);
  }

  // 3. Individual Carved Stone Board Tiles (`r`, `c`)
  const tilesGroup = new THREE.Group();
  tilesGroup.name = 'AltarTilesGroup';
  const tileMeshes = [];

  const offset = ((boardSize - 1) * tileSpacing) / 2;

  for (let r = 0; r < boardSize; r++) {
    tileMeshes[r] = [];
    for (let c = 0; c < boardSize; c++) {
      const isDark = (r + c) % 2 === 1;
      const baseTileColor = isDark ? 0x201b29 : 0x2b2437;
      const tileMat = new THREE.MeshStandardMaterial({
        color: baseTileColor,
        roughness: 0.62,
        metalness: 0.18,
        emissive: new THREE.Color(0x000000),
        emissiveIntensity: 0,
      });

      const tileMesh = new THREE.Mesh(new THREE.BoxGeometry(1.02, 0.14, 1.02), tileMat);
      const wx = c * tileSpacing - offset;
      const wz = r * tileSpacing - offset;
      tileMesh.position.set(wx, -0.05, wz);
      tileMesh.receiveShadow = true;
      tileMesh.userData = {
        isAltarTile: true,
        r,
        c,
        wx,
        wz,
        baseColor: baseTileColor,
      };

      // Subtle engraved inner border on each stone tile
      const innerRim = new THREE.Mesh(
        new THREE.BoxGeometry(0.92, 0.146, 0.92),
        new THREE.MeshStandardMaterial({
          color: isDark ? 0x181420 : 0x231d2e,
          roughness: 0.75,
          metalness: 0.12,
        })
      );
      innerRim.receiveShadow = true;
      tileMesh.add(innerRim);

      tilesGroup.add(tileMesh);
      tileMeshes[r][c] = tileMesh;
    }
  }

  root.add(tilesGroup);

  return {
    root,
    tilesGroup,
    tileMeshes,
    brazierFlames,
    tileSpacing,
    offset,
    altarWidth,
  };
}

/**
 * Build the 3D Inquisitor Automaton across the North edge of the Cathedral Altar
 */
export function createInquisitorAutomaton3D(boss = null) {
  const group = new THREE.Group();
  group.name = 'InquisitorAutomaton3D';

  const armorColor = boss?.color || '#b91c1c';
  const obsidianMat = createStoneMaterial('blood_obsidian', { color: 0x18131e });
  const trimMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(armorColor),
    roughness: 0.3,
    metalness: 0.78,
    emissive: new THREE.Color(armorColor),
    emissiveIntensity: 0.35,
  });
  const eyeMat = new THREE.MeshStandardMaterial({
    color: 0xff2a55,
    emissive: 0xff1e42,
    emissiveIntensity: 2.4,
  });

  // 1. Armored Chest & Mantle
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 1.05, 1.7, 8), obsidianMat);
  torso.position.y = 0.4;
  torso.castShadow = true;
  group.add(torso);

  // Shoulder Pauldrons
  for (const dir of [-1, 1]) {
    const pauldron = new THREE.Mesh(new THREE.DodecahedronGeometry(0.52, 0), obsidianMat);
    pauldron.position.set(dir * 0.95, 0.95, 0);
    pauldron.castShadow = true;
    group.add(pauldron);

    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.48, 5), trimMat);
    spike.position.set(dir * 1.05, 1.38, 0);
    spike.rotation.z = dir * -0.35;
    group.add(spike);
  }

  // 2. Articulated Head & Gothic Cowl (rotates to watch board actions)
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.62, 0.1);

  const skullHelm = new THREE.Mesh(new THREE.IcosahedronGeometry(0.44, 0), obsidianMat);
  skullHelm.scale.set(0.9, 1.2, 1.0);
  skullHelm.castShadow = true;
  headGroup.add(skullHelm);

  const hoodCowl = new THREE.Mesh(new THREE.ConeGeometry(0.56, 0.65, 6), trimMat);
  hoodCowl.position.set(0, 0.38, -0.05);
  headGroup.add(hoodCowl);

  // Glowing Ocular Lenses
  for (const dir of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.05, 0.08), eyeMat);
    eye.position.set(dir * 0.14, 0.05, 0.39);
    headGroup.add(eye);
  }

  // Floating Iron Halo behind the Inquisitor
  const halo = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.05, 8, 24), trimMat);
  halo.position.set(0, 0.25, -0.38);
  headGroup.add(halo);

  group.add(headGroup);
  group.userData = { headGroup, halo, eyeMat };

  return group;
}
