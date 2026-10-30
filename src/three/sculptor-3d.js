/**
 * XcardO — 3D Fantasy War-Table Strategy
 * Procedural AAA 3D Fantasy War Character Sculptor, Cathedral War-Table & Warlord Commander Builder
 * Uses Vendored Three.js r162 (ES Module) with MeshPhysicalMaterial, CapsuleGeometry & LatheGeometry
 */

import * as THREE from '../vendor/three.module.js';
import { STONE_MATERIALS } from '../data/gothic-config.js';

/**
 * Create a high-craft PBR / Physical Stone & Armor material from `STONE_MATERIALS` config
 */
export function createStoneMaterial(materialId, overrides = {}) {
  const matDef = STONE_MATERIALS.find((m) => m.id === materialId) || STONE_MATERIALS[0];
  const MatClass = THREE.MeshPhysicalMaterial || THREE.MeshStandardMaterial;
  return new MatClass({
    color: new THREE.Color(overrides.color ?? matDef.color),
    roughness: overrides.roughness ?? Math.max(0.16, (matDef.roughness ?? 0.3) * 0.88),
    metalness: overrides.metalness ?? Math.min(0.92, (matDef.metalness ?? 0.35) + 0.12),
    clearcoat: overrides.clearcoat ?? 0.55,
    clearcoatRoughness: overrides.clearcoatRoughness ?? 0.22,
    emissive: new THREE.Color(overrides.emissive ?? matDef.emissive ?? 0x000000),
    emissiveIntensity: overrides.emissiveIntensity ?? 0.38,
    flatShading: overrides.flatShading ?? false,
    transparent: Boolean(overrides.transparent),
    opacity: overrides.opacity ?? 1.0,
  });
}

/**
 * Shared helper: Build a heroic anatomical lower body & torso rig (armored greaves, knee poleyns,
 * waist belt, hip tassets, cloth tabard, V-taper cuirass, pectoral plates & gorget)
 */
function buildHeroicArmorRig3D(group, primaryMat, trimMat, glowMat, darkMat, isGhost, opts = {}) {
  const {
    robeMode = false,
    scaleTorso = 1.0,
    hasTabard = true,
    hasCape = true,
  } = opts;

  if (robeMode) {
    // Sculpted Flared Arcane Robe Skirt via LatheGeometry
    const robePoints = [
      new THREE.Vector2(0.31, 0.2),
      new THREE.Vector2(0.27, 0.32),
      new THREE.Vector2(0.22, 0.44),
      new THREE.Vector2(0.19, 0.54),
    ];
    const robeSkirt = new THREE.Mesh(new THREE.LatheGeometry(robePoints, 12), primaryMat);
    robeSkirt.castShadow = !isGhost;
    robeSkirt.receiveShadow = !isGhost;
    group.add(robeSkirt);

    const robeHem = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.022, 8, 20), trimMat);
    robeHem.rotation.x = Math.PI / 2;
    robeHem.position.y = 0.22;
    group.add(robeHem);
  } else {
    // Left & Right Armored Greaves, Poleyns (Knee Guards) & Sabatons
    for (const dir of [-1, 1]) {
      const sabaton = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.06, 0.16), trimMat);
      sabaton.position.set(dir * 0.12, 0.23, 0.04);
      sabaton.rotation.y = dir * -0.12;
      group.add(sabaton);

      const greave = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.055, 0.2, 8), primaryMat);
      greave.position.set(dir * 0.12, 0.33, 0.01);
      greave.rotation.z = dir * 0.05;
      greave.castShadow = !isGhost;
      group.add(greave);

      const poleyn = new THREE.Mesh(new THREE.OctahedronGeometry(0.055, 0), trimMat);
      poleyn.position.set(dir * 0.125, 0.39, 0.065);
      poleyn.scale.set(1.0, 1.2, 0.7);
      group.add(poleyn);

      // Overlapping Hip Tassets (Faulds)
      const tasset = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.16, 0.14), trimMat);
      tasset.position.set(dir * 0.19, 0.43, 0.01);
      tasset.rotation.z = dir * -0.22;
      tasset.castShadow = !isGhost;
      group.add(tasset);
    }
  }

  // Heavy Gilded War-Belt & Center Buckle
  const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.22, 0.065, 10), trimMat);
  belt.position.y = 0.47;
  group.add(belt);

  const buckle = new THREE.Mesh(new THREE.OctahedronGeometry(0.058, 0), glowMat);
  buckle.position.set(0, 0.47, 0.21);
  buckle.scale.set(1.1, 1.1, 0.55);
  group.add(buckle);

  if (hasTabard) {
    const frontTabard = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.24, 0.025), trimMat);
    frontTabard.position.set(0, 0.35, 0.19);
    frontTabard.rotation.x = -0.08;
    group.add(frontTabard);
  }

  // Sculpted V-Taper Heroic Cuirass / Breastplate
  const upperTorso = new THREE.Mesh(
    new THREE.CylinderGeometry(0.25 * scaleTorso, 0.19 * scaleTorso, 0.26, 10),
    primaryMat
  );
  upperTorso.position.y = 0.61;
  upperTorso.castShadow = !isGhost;
  upperTorso.receiveShadow = !isGhost;
  group.add(upperTorso);

  // Raised Pectoral Armor Plates & Sternum Ridge
  for (const dir of [-1, 1]) {
    const pecPlate = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.13, 0.08), primaryMat);
    pecPlate.position.set(dir * 0.08, 0.63, 0.18);
    pecPlate.rotation.y = dir * 0.22;
    pecPlate.rotation.x = -0.12;
    group.add(pecPlate);
  }

  // Armored Gorget Collar
  const gorget = new THREE.Mesh(new THREE.TorusGeometry(0.165, 0.032, 8, 18), trimMat);
  gorget.rotation.x = Math.PI / 2 + 0.12;
  gorget.position.set(0, 0.74, 0.01);
  group.add(gorget);

  // Flowing Sculpted Heroic Back Cape
  if (hasCape) {
    const capeUpper = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.48, 0.04), trimMat);
    capeUpper.position.set(0, 0.49, -0.19);
    capeUpper.rotation.x = 0.18;
    capeUpper.castShadow = !isGhost;
    group.add(capeUpper);

    const capeInner = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.44, 0.045), darkMat);
    capeInner.position.set(0, 0.48, -0.185);
    capeInner.rotation.x = 0.18;
    group.add(capeInner);
  }

  // Articulated Upper Arms, Elbow Cops & Forearm Vambraces
  for (const dir of [-1, 1]) {
    const upperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.055, 0.18, 8), darkMat);
    upperArm.position.set(dir * 0.27, 0.58, 0.02);
    upperArm.rotation.z = dir * -0.18;
    group.add(upperArm);

    const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.052, 0.18, 8), trimMat);
    forearm.position.set(dir * 0.3, 0.48, 0.1);
    forearm.rotation.x = -0.55;
    forearm.rotation.z = dir * 0.1;
    group.add(forearm);
  }
}

/**
 * Create a 3D Sculpted Fantasy War Character Miniature for 'X' (Hero Order), 'O' (Enemy Warlord), or 'W' (Wild Joker Idol)
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
    emissiveIntensity: isGhost ? 0.8 : 0.32,
  });

  const trimColor = symbol === 'X' ? 0xd4a853 : symbol === 'O' ? 0xe11d48 : 0xfbbf24;
  const trimMat = createStoneMaterial(defaultMatId, {
    color: matDef.accentColor || trimColor,
    roughness: 0.2,
    metalness: 0.88,
    clearcoat: 0.7,
    emissive: trimColor,
    emissiveIntensity: isGhost ? 0.9 : 0.48,
    transparent: isGhost,
    opacity: isGhost ? 0.6 : 1.0,
  });

  const darkMat = createStoneMaterial('blood_obsidian', {
    color: 0x181322,
    roughness: 0.38,
    metalness: 0.65,
    emissiveIntensity: 0.15,
    transparent: isGhost,
    opacity: isGhost ? 0.5 : 1.0,
  });

  const coreGlowColor = symbol === 'X' ? 0xfbbf24 : symbol === 'O' ? 0xf43f5e : 0x38bdf8;
  const glowMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(coreGlowColor),
    emissive: new THREE.Color(coreGlowColor),
    emissiveIntensity: 1.65,
    roughness: 0.12,
    metalness: 0.2,
    transparent: isGhost,
    opacity: isGhost ? 0.75 : 1.0,
  });

  // 1. Masterwork Stepped Octagonal War-Table Plinth Base with Runic Inlay & Corner Rivets
  const baseLower = new THREE.Mesh(new THREE.CylinderGeometry(0.43, 0.47, 0.11, 12), darkMat);
  baseLower.position.y = 0.055;
  baseLower.castShadow = !isGhost;
  baseLower.receiveShadow = !isGhost;
  group.add(baseLower);

  const baseUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.41, 0.1, 12), primaryMat);
  baseUpper.position.y = 0.155;
  baseUpper.castShadow = !isGhost;
  baseUpper.receiveShadow = !isGhost;
  group.add(baseUpper);

  const baseCollar = new THREE.Mesh(new THREE.TorusGeometry(0.365, 0.026, 8, 24), trimMat);
  baseCollar.rotation.x = Math.PI / 2;
  baseCollar.position.y = 0.205;
  group.add(baseCollar);

  const baseAuraRing = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.016, 8, 28), glowMat);
  baseAuraRing.rotation.x = Math.PI / 2;
  baseAuraRing.position.y = 0.03;
  group.add(baseAuraRing);

  for (let rIdx = 0; rIdx < 6; rIdx++) {
    const rAngle = (rIdx / 6) * Math.PI * 2;
    const rivet = new THREE.Mesh(new THREE.OctahedronGeometry(0.03, 0), trimMat);
    rivet.position.set(Math.cos(rAngle) * 0.4, 0.13, Math.sin(rAngle) * 0.4);
    group.add(rivet);
  }

  // 2. Sculpted AAA Fantasy War Character Upper Geometry
  if (symbol === 'W') {
    // Wild Joker Idol: Celestial Winged Sunburst Reliquary with Triple Orbiting Rings
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.25, 0.38, 12), trimMat);
    stem.position.y = 0.38;
    stem.castShadow = !isGhost;
    group.add(stem);

    for (const dir of [-1, 1]) {
      for (let w = 0; w < 3; w++) {
        const wingFeather = new THREE.Mesh(
          new THREE.ConeGeometry(0.048, 0.38 - w * 0.06, 4),
          w % 2 === 0 ? trimMat : glowMat
        );
        wingFeather.position.set(dir * (0.22 + w * 0.06), 0.68 - w * 0.05, -0.02 * w);
        wingFeather.rotation.z = dir * -(0.38 + w * 0.18);
        group.add(wingFeather);
      }
    }

    const haloOuter = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.034, 10, 28), trimMat);
    haloOuter.position.y = 0.74;
    haloOuter.userData.spinSpeed = 1.2;
    group.add(haloOuter);

    const haloInner = new THREE.Mesh(new THREE.TorusGeometry(0.21, 0.024, 8, 24), glowMat);
    haloInner.rotation.y = Math.PI / 4;
    haloInner.position.y = 0.74;
    haloInner.userData.spinSpeed = -2.1;
    group.add(haloInner);

    const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.15, 1), glowMat);
    crystal.position.y = 0.74;
    crystal.userData = { spinSpeed: 2.8, floatAmplitude: 0.045, baseY: 0.74 };
    group.add(crystal);
  } else if (sculptId === 'templar_knight' && symbol !== 'O') {
    // HERO 2 — Shieldmaiden Freya (Storm Valkyrie): Anatomical Armor Rig, Multi-Feather Back & Helm Wings, Valhallan Runic Shield & Gungnir Sky-Lance
    buildHeroicArmorRig3D(group, primaryMat, trimMat, glowMat, darkMat, isGhost, {
      scaleTorso: 0.94,
      hasTabard: true,
      hasCape: true,
    });

    // Multi-Tiered Valkyrie Pauldrons & Swept Back Valkyrie Pinions
    for (const dir of [-1, 1]) {
      const pauldron = new THREE.Mesh(new THREE.SphereGeometry(0.135, 10, 8), primaryMat);
      pauldron.position.set(dir * 0.27, 0.69, 0.01);
      pauldron.scale.set(1.2, 0.85, 1.15);
      pauldron.castShadow = !isGhost;
      group.add(pauldron);

      const pauldronRim = new THREE.Mesh(new THREE.TorusGeometry(0.125, 0.02, 6, 14), trimMat);
      pauldronRim.position.set(dir * 0.27, 0.68, 0.01);
      pauldronRim.rotation.y = Math.PI / 2;
      group.add(pauldronRim);

      // 3-Feather Swept Back Valkyrie Wings
      for (let f = 0; f < 3; f++) {
        const pinion = new THREE.Mesh(
          new THREE.ConeGeometry(0.042, 0.42 - f * 0.06, 4),
          f === 1 ? glowMat : trimMat
        );
        pinion.position.set(dir * (0.2 + f * 0.07), 0.78 - f * 0.06, -0.16);
        pinion.rotation.z = dir * -(0.42 + f * 0.2);
        pinion.rotation.x = -0.25;
        group.add(pinion);
      }

      // 2-Feather Swept Helm Wings
      const helmWing1 = new THREE.Mesh(new THREE.ConeGeometry(0.048, 0.32, 4), trimMat);
      helmWing1.position.set(dir * 0.19, 0.96, -0.02);
      helmWing1.rotation.z = dir * -0.45;
      helmWing1.rotation.x = -0.24;
      group.add(helmWing1);

      const helmWing2 = new THREE.Mesh(new THREE.ConeGeometry(0.036, 0.24, 4), glowMat);
      helmWing2.position.set(dir * 0.24, 0.9, -0.05);
      helmWing2.rotation.z = dir * -0.68;
      helmWing2.rotation.x = -0.28;
      group.add(helmWing2);
    }

    // Sculpted Valkyrie Helm, Cheek Guards & Glowing Cyan Visor
    const helm = new THREE.Mesh(new THREE.CylinderGeometry(0.135, 0.15, 0.24, 12), primaryMat);
    helm.position.y = 0.85;
    helm.castShadow = !isGhost;
    group.add(helm);

    const helmDome = new THREE.Mesh(new THREE.SphereGeometry(0.138, 12, 8), trimMat);
    helmDome.position.y = 0.95;
    group.add(helmDome);

    const browGem = new THREE.Mesh(new THREE.OctahedronGeometry(0.048, 0), glowMat);
    browGem.position.set(0, 0.91, 0.145);
    group.add(browGem);

    for (const dir of [-1, 1]) {
      const eyeSlit = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.026, 0.05), glowMat);
      eyeSlit.position.set(dir * 0.052, 0.86, 0.135);
      eyeSlit.rotation.z = dir * -0.2;
      group.add(eyeSlit);
    }

    // Left-Hand Round Valhallan Runic Shield with Rim Rivets
    const shieldDisc = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.035, 16), primaryMat);
    shieldDisc.rotation.z = Math.PI / 2;
    shieldDisc.rotation.y = 0.38;
    shieldDisc.position.set(-0.34, 0.52, 0.14);
    shieldDisc.castShadow = !isGhost;
    group.add(shieldDisc);

    const shieldRim = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.022, 8, 20), trimMat);
    shieldRim.rotation.y = Math.PI / 2 - 0.38;
    shieldRim.position.set(-0.34, 0.52, 0.14);
    group.add(shieldRim);

    const shieldBoss = new THREE.Mesh(new THREE.OctahedronGeometry(0.065, 0), glowMat);
    shieldBoss.position.set(-0.37, 0.52, 0.16);
    group.add(shieldBoss);

    // Right-Hand Gungnir Sky-Lance with Twin Lightning Prongs & Spinning Storm Ring
    const lanceShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.026, 0.92, 8), trimMat);
    lanceShaft.position.set(0.33, 0.64, 0.12);
    group.add(lanceShaft);

    const lanceTip = new THREE.Mesh(new THREE.ConeGeometry(0.065, 0.28, 4), glowMat);
    lanceTip.position.set(0.33, 1.16, 0.12);
    group.add(lanceTip);

    for (const dir of [-1, 1]) {
      const fork = new THREE.Mesh(new THREE.ConeGeometry(0.028, 0.16, 4), trimMat);
      fork.position.set(0.33 + dir * 0.055, 1.05, 0.12);
      fork.rotation.z = dir * -0.35;
      group.add(fork);
    }

    const stormRing = new THREE.Mesh(new THREE.TorusGeometry(0.095, 0.016, 6, 18), glowMat);
    stormRing.position.set(0.33, 1.02, 0.12);
    stormRing.userData.spinSpeed = 3.4;
    group.add(stormRing);
  } else if (sculptId === 'astral_archmage' && symbol !== 'O') {
    // HERO 3 — Arch-Magus Kaelen (Astral Battle-Mage): Lathe-Sculpted Robes, Levitating Collar, Orbiting Runestones, Open Grimoire & Armillary Staff
    buildHeroicArmorRig3D(group, primaryMat, trimMat, glowMat, darkMat, isGhost, {
      robeMode: true,
      scaleTorso: 0.92,
      hasTabard: true,
      hasCape: true,
    });

    // High Levitating Golden Arcane Collar
    const collar = new THREE.Mesh(
      new THREE.TorusGeometry(0.24, 0.036, 8, 20, Math.PI * 1.3),
      trimMat
    );
    collar.rotation.x = Math.PI / 2 + 0.38;
    collar.rotation.z = -Math.PI * 0.15;
    collar.position.set(0, 0.78, -0.05);
    group.add(collar);

    for (const dir of [-1, 1]) {
      const shoulder = new THREE.Mesh(new THREE.OctahedronGeometry(0.13, 1), trimMat);
      shoulder.position.set(dir * 0.26, 0.69, 0);
      shoulder.scale.set(1.15, 0.75, 1.0);
      group.add(shoulder);
    }

    // Sculpted Arch-Mage Head, Beard, Hood & Crown Circlet
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.125, 10, 10), darkMat);
    head.position.set(0, 0.85, 0.02);
    group.add(head);

    const hood = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.28, 10), primaryMat);
    hood.position.set(0, 0.91, -0.01);
    hood.castShadow = !isGhost;
    group.add(hood);

    const beard = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.16, 6), primaryMat);
    beard.rotation.x = Math.PI;
    beard.position.set(0, 0.76, 0.11);
    group.add(beard);

    const crownCirclet = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.02, 6, 18), trimMat);
    crownCirclet.rotation.x = Math.PI / 2 - 0.12;
    crownCirclet.position.set(0, 0.89, 0.02);
    group.add(crownCirclet);

    for (const dir of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.OctahedronGeometry(0.035, 0), glowMat);
      eye.position.set(dir * 0.048, 0.86, 0.135);
      group.add(eye);
    }

    // 4 Orbiting Astral Runestones
    const runeOrbit = new THREE.Group();
    runeOrbit.position.set(0, 0.82, 0);
    runeOrbit.userData.spinSpeed = 2.0;
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * Math.PI * 2;
      const rune = new THREE.Mesh(new THREE.OctahedronGeometry(0.05, 0), glowMat);
      rune.position.set(Math.cos(a) * 0.36, Math.sin(a * 2) * 0.05, Math.sin(a) * 0.36);
      runeOrbit.add(rune);
    }
    group.add(runeOrbit);

    // Left-Hand Floating Open Spellbook Grimoire with Glowing Pages
    const tomeGroup = new THREE.Group();
    tomeGroup.position.set(-0.31, 0.62, 0.16);
    tomeGroup.rotation.set(0.42, 0.35, -0.2);
    tomeGroup.userData = { floatAmplitude: 0.038, baseY: 0.62, floatPhase: 1.2 };
    const tomeCover = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.13, 0.03), trimMat);
    const tomePages = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.11, 0.036), glowMat);
    tomePages.position.z = 0.01;
    tomeGroup.add(tomeCover, tomePages);
    group.add(tomeGroup);

    // Right-Hand Staff of the Dawn-Star with Dual Interlocking Armillary Rings
    const staffShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.026, 0.9, 8), trimMat);
    staffShaft.position.set(0.32, 0.62, 0.1);
    group.add(staffShaft);

    const astrolabeOuter = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.016, 8, 20), trimMat);
    astrolabeOuter.position.set(0.32, 1.12, 0.1);
    astrolabeOuter.userData.spinSpeed = -2.4;
    group.add(astrolabeOuter);

    const astrolabeInner = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.013, 6, 16), glowMat);
    astrolabeInner.position.set(0.32, 1.12, 0.1);
    astrolabeInner.rotation.x = Math.PI / 3;
    astrolabeInner.userData.spinSpeed = 3.2;
    group.add(astrolabeInner);

    const starCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.052, 0), glowMat);
    starCore.position.set(0.32, 1.12, 0.1);
    starCore.userData.spinSpeed = 3.6;
    group.add(starCore);
  } else if (sculptId === 'gargoyle_warden' && symbol !== 'O') {
    // HERO 4 — Dragon-Lord Draven (Dragon-Knight Warlord): Wyrm-Scale Rig, Ribbed Dragon Wings, Horned Dragon Helm & Ember-Wyrm Halberd
    buildHeroicArmorRig3D(group, primaryMat, trimMat, glowMat, darkMat, isGhost, {
      scaleTorso: 1.08,
      hasTabard: true,
      hasCape: false,
    });

    const chestDragonHeart = new THREE.Mesh(new THREE.OctahedronGeometry(0.08, 0), glowMat);
    chestDragonHeart.position.set(0, 0.63, 0.23);
    chestDragonHeart.userData.spinSpeed = 2.2;
    group.add(chestDragonHeart);

    // Sculpted Dragon-Crest Great-Helm & Dorsal Spines
    const helm = new THREE.Mesh(new THREE.DodecahedronGeometry(0.155, 1), primaryMat);
    helm.position.set(0, 0.86, 0.03);
    helm.scale.set(0.95, 1.12, 1.15);
    helm.castShadow = !isGhost;
    group.add(helm);

    const crestFin = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.22, 4), trimMat);
    crestFin.position.set(0, 1.02, -0.02);
    crestFin.rotation.x = -0.35;
    group.add(crestFin);

    // Swept Articulated Ribbed Dragon Wings, Horned Pauldrons & Curved Wyrm Horns
    for (const dir of [-1, 1]) {
      const pauldron = new THREE.Mesh(new THREE.DodecahedronGeometry(0.15, 0), primaryMat);
      pauldron.position.set(dir * 0.28, 0.7, 0);
      pauldron.castShadow = !isGhost;
      group.add(pauldron);

      const pauldronHorn = new THREE.Mesh(new THREE.ConeGeometry(0.042, 0.2, 5), trimMat);
      pauldronHorn.position.set(dir * 0.34, 0.81, 0);
      pauldronHorn.rotation.z = dir * -0.45;
      group.add(pauldronHorn);

      // Articulated Dragon Wing Frame + 3 Rib Spurs
      const wingArm = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.52, 0.26), trimMat);
      wingArm.position.set(dir * 0.28, 0.78, -0.14);
      wingArm.rotation.z = dir * -0.46;
      wingArm.rotation.y = dir * 0.32;
      wingArm.castShadow = !isGhost;
      group.add(wingArm);

      for (let r = 0; r < 3; r++) {
        const wingRib = new THREE.Mesh(new THREE.ConeGeometry(0.032, 0.34 - r * 0.05, 4), glowMat);
        wingRib.position.set(dir * (0.35 + r * 0.06), 0.94 - r * 0.1, -0.16);
        wingRib.rotation.z = dir * -(0.35 + r * 0.22);
        group.add(wingRib);
      }

      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.048, 0.3, 6), trimMat);
      horn.position.set(dir * 0.13, 0.99, 0.01);
      horn.rotation.z = dir * -0.44;
      horn.rotation.x = -0.3;
      group.add(horn);

      const eye = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.028, 0.04), glowMat);
      eye.position.set(dir * 0.058, 0.87, 0.17);
      eye.rotation.z = dir * -0.18;
      group.add(eye);
    }

    // Colossal Ember-Wyrm Crescent Halberd
    const halberdShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.028, 0.95, 8), trimMat);
    halberdShaft.position.set(0.34, 0.64, 0.1);
    group.add(halberdShaft);

    const halberdSpear = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.24, 4), glowMat);
    halberdSpear.position.set(0.34, 1.18, 0.1);
    group.add(halberdSpear);

    const crescentAxe = new THREE.Mesh(
      new THREE.TorusGeometry(0.13, 0.032, 6, 14, Math.PI * 0.85),
      glowMat
    );
    crescentAxe.position.set(0.36, 1.0, 0.1);
    crescentAxe.rotation.z = -Math.PI * 0.42;
    group.add(crescentAxe);
  } else if (sculptId === 'sylvan_ranger' && symbol !== 'O') {
    // HERO 5 — Sylvan Warden Lyra (Elven War-Ranger): Agile Ranger Armor, 6-Point Golden Stag Antlers, Quiver & Recurve Starlight Bow
    buildHeroicArmorRig3D(group, primaryMat, trimMat, glowMat, darkMat, isGhost, {
      scaleTorso: 0.9,
      hasTabard: true,
      hasCape: true,
    });

    // Back-Mounted Elven Quiver & Feathered Arrows
    const quiver = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.042, 0.34, 8), trimMat);
    quiver.position.set(-0.14, 0.68, -0.18);
    quiver.rotation.z = -0.32;
    group.add(quiver);

    for (let a = 0; a < 3; a++) {
      const fletching = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.12, 4), glowMat);
      fletching.position.set(-0.18 - a * 0.02, 0.86 + a * 0.02, -0.18);
      fletching.rotation.z = -0.32;
      group.add(fletching);
    }

    // Sculpted Elven Hood, Face & 6-Point Golden Stag Antler Crown
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.125, 10, 10), primaryMat);
    head.position.set(0, 0.85, 0.02);
    group.add(head);

    const hood = new THREE.Mesh(new THREE.ConeGeometry(0.175, 0.28, 10), primaryMat);
    hood.position.set(0, 0.9, 0);
    hood.castShadow = !isGhost;
    group.add(hood);

    for (const dir of [-1, 1]) {
      const pauldron = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), trimMat);
      pauldron.position.set(dir * 0.25, 0.68, 0.01);
      pauldron.scale.set(1.2, 0.75, 1.0);
      group.add(pauldron);

      const antlerBeam = new THREE.Mesh(new THREE.ConeGeometry(0.034, 0.34, 6), trimMat);
      antlerBeam.position.set(dir * 0.16, 1.0, 0.02);
      antlerBeam.rotation.z = dir * -0.46;
      group.add(antlerBeam);

      const antlerTine1 = new THREE.Mesh(new THREE.ConeGeometry(0.024, 0.18, 5), trimMat);
      antlerTine1.position.set(dir * 0.23, 1.06, 0.04);
      antlerTine1.rotation.z = dir * -0.82;
      group.add(antlerTine1);

      const antlerTine2 = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.14, 5), glowMat);
      antlerTine2.position.set(dir * 0.14, 1.08, 0.05);
      antlerTine2.rotation.z = dir * -0.2;
      group.add(antlerTine2);

      const eye = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.024, 0.04), glowMat);
      eye.position.set(dir * 0.05, 0.86, 0.14);
      group.add(eye);
    }

    // Recurve Starlight Whisper-Bow, Energy Bowstring & Drawn Emerald Star-Arrow
    const bowArc = new THREE.Mesh(
      new THREE.TorusGeometry(0.28, 0.024, 8, 20, Math.PI * 1.18),
      trimMat
    );
    bowArc.rotation.y = Math.PI / 2;
    bowArc.rotation.z = -Math.PI * 0.59;
    bowArc.position.set(0.26, 0.64, 0.15);
    group.add(bowArc);

    const bowString = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.52, 6), glowMat);
    bowString.position.set(0.26, 0.64, 0.08);
    group.add(bowString);

    const arrowShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.38, 6), glowMat);
    arrowShaft.rotation.x = Math.PI / 2;
    arrowShaft.position.set(0.26, 0.64, 0.22);
    group.add(arrowShaft);

    const arrowHead = new THREE.Mesh(new THREE.ConeGeometry(0.042, 0.14, 4), glowMat);
    arrowHead.rotation.x = Math.PI / 2;
    arrowHead.position.set(0.26, 0.64, 0.42);
    group.add(arrowHead);
  } else if (sculptId === 'frost_runeblade' && symbol !== 'O') {
    // HERO 6 — Runeblade Arthos (Glacial Runeblade): Heavy Dread-Plate Rig, Crystalline Ice Pauldrons, 7-Spire Glacial Crown & Winter-Star Greatsword
    buildHeroicArmorRig3D(group, primaryMat, trimMat, glowMat, darkMat, isGhost, {
      scaleTorso: 1.06,
      hasTabard: true,
      hasCape: true,
    });

    for (const dir of [-1, 1]) {
      const pauldron = new THREE.Mesh(new THREE.DodecahedronGeometry(0.155, 0), primaryMat);
      pauldron.position.set(dir * 0.28, 0.7, 0);
      pauldron.castShadow = !isGhost;
      group.add(pauldron);

      for (let s = 0; s < 2; s++) {
        const iceSpike = new THREE.Mesh(
          new THREE.ConeGeometry(0.042, 0.24 - s * 0.04, 4),
          s === 0 ? glowMat : trimMat
        );
        iceSpike.position.set(dir * (0.31 + s * 0.05), 0.84 - s * 0.04, -s * 0.04);
        iceSpike.rotation.z = dir * -(0.38 + s * 0.18);
        group.add(iceSpike);
      }
    }

    // Glacial Great-Helm & 7-Spire Jagged Ice Crown
    const helm = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.165, 0.25, 10), primaryMat);
    helm.position.y = 0.85;
    helm.castShadow = !isGhost;
    group.add(helm);

    for (let s = -3; s <= 3; s++) {
      const crownSpike = new THREE.Mesh(
        new THREE.ConeGeometry(0.032, 0.21 - Math.abs(s) * 0.024, 4),
        Math.abs(s) % 2 === 0 ? glowMat : trimMat
      );
      crownSpike.position.set(s * 0.046, 1.01 - Math.abs(s) * 0.018, 0.03);
      crownSpike.rotation.z = s * -0.11;
      group.add(crownSpike);
    }

    for (const dir of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.OctahedronGeometry(0.04, 0), glowMat);
      eye.position.set(dir * 0.055, 0.86, 0.155);
      group.add(eye);
    }

    // Monumental Two-Handed Winter-Star Runeblade Greatsword
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.76, 0.026), glowMat);
    blade.position.set(0.33, 0.76, 0.12);
    group.add(blade);

    const bladeTip = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.16, 4), glowMat);
    bladeTip.position.set(0.33, 1.2, 0.12);
    bladeTip.rotation.y = Math.PI / 4;
    group.add(bladeTip);

    const fuller = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.62, 0.032), trimMat);
    fuller.position.set(0.33, 0.72, 0.12);
    group.add(fuller);

    const crossguard = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.045, 0.055), trimMat);
    crossguard.position.set(0.33, 0.4, 0.12);
    group.add(crossguard);
  } else if (sculptId === 'ossuary_skull') {
    // ENEMY 2 — Necromancer Lich Warlord: Lathe-Sculpted Ossuary Robes, Bone Pauldrons, Crowned Skull Visage & Soul-Scythe Staff
    buildHeroicArmorRig3D(group, primaryMat, trimMat, glowMat, darkMat, isGhost, {
      robeMode: true,
      scaleTorso: 0.92,
      hasTabard: true,
      hasCape: true,
    });

    for (const dir of [-1, 1]) {
      const boneHorn = new THREE.Mesh(new THREE.ConeGeometry(0.052, 0.28, 6), trimMat);
      boneHorn.position.set(dir * 0.27, 0.74, 0);
      boneHorn.rotation.z = dir * -0.46;
      group.add(boneHorn);
    }

    const cranium = new THREE.Mesh(new THREE.IcosahedronGeometry(0.18, 1), primaryMat);
    cranium.position.set(0, 0.86, 0.02);
    cranium.scale.set(0.92, 1.08, 1.06);
    cranium.castShadow = !isGhost;
    group.add(cranium);

    const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.1, 0.16), primaryMat);
    jaw.position.set(0, 0.74, 0.06);
    group.add(jaw);

    for (let k = -2; k <= 2; k++) {
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.032, 0.2, 4), trimMat);
      spike.position.set(k * 0.055, 1.04, 0.02);
      spike.rotation.z = k * -0.14;
      group.add(spike);
    }

    for (const dir of [-1, 1]) {
      const socket = new THREE.Mesh(new THREE.OctahedronGeometry(0.05, 0), glowMat);
      socket.position.set(dir * 0.065, 0.86, 0.17);
      group.add(socket);
    }

    const crownHalo = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.026, 8, 20), trimMat);
    crownHalo.position.set(0, 0.86, -0.06);
    crownHalo.rotation.x = 0.32;
    crownHalo.userData.spinSpeed = -1.6;
    group.add(crownHalo);

    // Necromancer Soul-Scythe Staff
    const scytheShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.025, 0.9, 6), trimMat);
    scytheShaft.position.set(0.32, 0.62, 0.1);
    group.add(scytheShaft);

    const scytheBlade = new THREE.Mesh(new THREE.ConeGeometry(0.065, 0.34, 4), glowMat);
    scytheBlade.position.set(0.2, 1.06, 0.12);
    scytheBlade.rotation.z = 1.25;
    group.add(scytheBlade);
  } else if (sculptId === 'abyssal_obelisk') {
    // ENEMY 3 — Abyssal Void Demon General: Armored Void Fiend, 4 Swept Obsidian Wings, Orbiting Shackles & Twin Void Blades
    buildHeroicArmorRig3D(group, primaryMat, trimMat, glowMat, darkMat, isGhost, {
      scaleTorso: 1.08,
      hasTabard: true,
      hasCape: false,
    });

    const helm = new THREE.Mesh(new THREE.OctahedronGeometry(0.16, 1), primaryMat);
    helm.position.set(0, 0.86, 0.02);
    helm.castShadow = !isGhost;
    group.add(helm);

    for (const dir of [-1, 1]) {
      const demonHorn = new THREE.Mesh(new THREE.ConeGeometry(0.052, 0.32, 6), trimMat);
      demonHorn.position.set(dir * 0.16, 1.02, 0);
      demonHorn.rotation.z = dir * -0.5;
      group.add(demonHorn);

      const wingUpper = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.52, 4), trimMat);
      wingUpper.position.set(dir * 0.28, 0.82, -0.14);
      wingUpper.rotation.z = dir * -0.52;
      group.add(wingUpper);

      const voidBlade = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.48, 4), glowMat);
      voidBlade.position.set(dir * 0.34, 0.68, 0.16);
      voidBlade.rotation.x = -0.35;
      group.add(voidBlade);
    }

    const shackle1 = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.024, 6, 20), trimMat);
    shackle1.position.y = 0.68;
    shackle1.rotation.x = Math.PI / 2.4;
    shackle1.userData.spinSpeed = -1.5;
    group.add(shackle1);

    const shackle2 = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.02, 6, 20), glowMat);
    shackle2.position.y = 0.68;
    shackle2.rotation.x = -Math.PI / 2.4;
    shackle2.userData.spinSpeed = 2.2;
    group.add(shackle2);
  } else if (symbol === 'O' || sculptId === 'iron_torus') {
    // ENEMY 1 — Black-Iron Siege Juggernaut (`iron_torus`): Full Juggernaut Rig, Spiked Pauldrons, Furnace Visor, 8-Spike Iron Halo & Siege War-Mace
    buildHeroicArmorRig3D(group, primaryMat, trimMat, glowMat, darkMat, isGhost, {
      scaleTorso: 1.1,
      hasTabard: true,
      hasCape: true,
    });

    for (const dir of [-1, 1]) {
      const pauldron = new THREE.Mesh(new THREE.DodecahedronGeometry(0.155, 0), primaryMat);
      pauldron.position.set(dir * 0.28, 0.69, 0);
      pauldron.castShadow = !isGhost;
      group.add(pauldron);

      const pSpike = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.22, 5), trimMat);
      pSpike.position.set(dir * 0.32, 0.83, 0);
      pSpike.rotation.z = dir * -0.4;
      group.add(pSpike);
    }

    const helm = new THREE.Mesh(new THREE.CylinderGeometry(0.155, 0.17, 0.25, 10), primaryMat);
    helm.position.y = 0.85;
    helm.castShadow = !isGhost;
    group.add(helm);

    const visorSlit = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.036, 0.06), glowMat);
    visorSlit.position.set(0, 0.86, 0.15);
    group.add(visorSlit);

    // 8-Spike Iron Crown Halo behind the Juggernaut
    const torus = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.042, 10, 24), primaryMat);
    torus.position.set(0, 0.84, -0.08);
    torus.castShadow = !isGhost;
    group.add(torus);

    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.036, 0.15, 5), trimMat);
      spike.position.set(
        Math.cos(angle) * 0.33,
        0.84 + Math.sin(angle) * 0.33,
        -0.08
      );
      spike.rotation.z = angle - Math.PI / 2;
      group.add(spike);
    }

    const eyeCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.095, 0), glowMat);
    eyeCore.position.set(0, 0.63, 0.22);
    eyeCore.userData.spinSpeed = 2.2;
    group.add(eyeCore);

    // Right-Hand Spiked Siege War-Mace
    const maceShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.028, 0.84, 8), trimMat);
    maceShaft.position.set(0.33, 0.62, 0.12);
    group.add(maceShaft);

    const maceHead = new THREE.Mesh(new THREE.DodecahedronGeometry(0.11, 0), glowMat);
    maceHead.position.set(0.33, 1.06, 0.12);
    maceHead.userData.spinSpeed = 1.8;
    group.add(maceHead);
  } else {
    // HERO 1 — High Paladin Aurelius (`seraph_cross`): Full Sunforged Paladin Rig, Lion Pauldrons, 12-Ray Solar Halo (No Crosses), Kite Shield & Dawnbreaker Sun-Spear
    buildHeroicArmorRig3D(group, primaryMat, trimMat, glowMat, darkMat, isGhost, {
      scaleTorso: 1.02,
      hasTabard: true,
      hasCape: true,
    });

    // Multi-Layered Royal Lion Pauldrons
    for (const dir of [-1, 1]) {
      const pauldron = new THREE.Mesh(new THREE.DodecahedronGeometry(0.15, 1), trimMat);
      pauldron.position.set(dir * 0.27, 0.69, 0.01);
      pauldron.scale.set(1.18, 0.86, 1.12);
      pauldron.castShadow = !isGhost;
      group.add(pauldron);

      const pauldronCrest = new THREE.Mesh(new THREE.ConeGeometry(0.042, 0.16, 4), glowMat);
      pauldronCrest.position.set(dir * 0.31, 0.8, 0.01);
      pauldronCrest.rotation.z = dir * -0.35;
      group.add(pauldronCrest);
    }

    // Crowned Solar Great-Helm & Glowing Amber Visor
    const helm = new THREE.Mesh(new THREE.CylinderGeometry(0.145, 0.165, 0.25, 12), primaryMat);
    helm.position.y = 0.85;
    helm.castShadow = !isGhost;
    group.add(helm);

    const crown = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.15, 8), trimMat);
    crown.position.y = 1.01;
    group.add(crown);

    for (const dir of [-1, 1]) {
      const visorEye = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.026, 0.05), glowMat);
      visorEye.position.set(dir * 0.052, 0.86, 0.15);
      visorEye.rotation.z = dir * -0.18;
      group.add(visorEye);
    }

    // Radiant 8-Ray Sunburst Halo Ring behind Aurelius
    const halo = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.028, 8, 28), trimMat);
    halo.position.set(0, 0.86, -0.08);
    group.add(halo);

    for (let r = 0; r < 8; r++) {
      const a = (r / 8) * Math.PI * 2;
      const sunRay = new THREE.Mesh(new THREE.ConeGeometry(0.026, 0.12, 4), glowMat);
      sunRay.position.set(Math.cos(a) * 0.34, 0.86 + Math.sin(a) * 0.34, -0.08);
      sunRay.rotation.z = a - Math.PI / 2;
      group.add(sunRay);
    }

    const heart = new THREE.Mesh(new THREE.OctahedronGeometry(0.085, 0), glowMat);
    heart.position.set(0, 0.63, 0.22);
    heart.userData.spinSpeed = 1.9;
    group.add(heart);

    // Left-Hand Sunforged Kite Shield with Solar Boss
    const shieldPlate = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.08, 0.34, 8), trimMat);
    shieldPlate.position.set(-0.33, 0.54, 0.14);
    shieldPlate.rotation.y = 0.42;
    shieldPlate.scale.set(1.0, 1.0, 0.32);
    shieldPlate.castShadow = !isGhost;
    group.add(shieldPlate);

    const shieldSunBoss = new THREE.Mesh(new THREE.OctahedronGeometry(0.06, 0), glowMat);
    shieldSunBoss.position.set(-0.36, 0.56, 0.17);
    group.add(shieldSunBoss);

    // Right-Hand Dawnbreaker Sun-Spear with Winged Guard & Spinning Solar Tip
    const spearShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.028, 0.92, 8), trimMat);
    spearShaft.position.set(0.33, 0.64, 0.1);
    group.add(spearShaft);

    const spearGuard = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.018, 6, 16), trimMat);
    spearGuard.position.set(0.33, 1.02, 0.1);
    group.add(spearGuard);

    const spearTip = new THREE.Mesh(new THREE.OctahedronGeometry(0.09, 0), glowMat);
    spearTip.position.set(0.33, 1.15, 0.1);
    spearTip.scale.set(0.75, 1.45, 0.75);
    spearTip.userData.spinSpeed = 2.5;
    group.add(spearTip);
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
    const dome = new THREE.Mesh(new THREE.IcosahedronGeometry(0.54, 1), shieldMat);
    dome.position.y = 0.54;
    group.add(dome);

    const shieldRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.49, 0.022, 8, 24),
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
    const stoneMat = createStoneMaterial('weathered_basalt');
    const ironMat = createStoneMaterial('verdigris_bronze', { color: 0x52525b });

    const base = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.2, 0.74), stoneMat);
    base.position.y = 0.1;
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 0.78, 8), stoneMat);
    shaft.position.y = 0.54;
    shaft.castShadow = true;
    shaft.receiveShadow = true;
    group.add(shaft);

    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.38, 0.32, 8), ironMat);
    cap.position.y = 1.06;
    cap.castShadow = true;
    group.add(cap);
  } else if (entityType === 'reliquary_coffer') {
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

    const lid = new THREE.Mesh(
      new THREE.CylinderGeometry(0.23, 0.23, 0.64, 10, 1, false, 0, Math.PI),
      goldMat
    );
    lid.rotation.z = Math.PI / 2;
    lid.position.y = 0.36;
    lid.castShadow = true;
    group.add(lid);

    const lockGem = new THREE.Mesh(new THREE.OctahedronGeometry(0.08, 0), glowMat);
    lockGem.position.set(0, 0.3, 0.25);
    group.add(lockGem);
  } else if (entityType === 'sanctified_mosaic') {
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
 * Build the 3D Gothic War-Table Altar, Corner Fire Braziers, and Raycastable Stone Tiles
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

  // 1. Heavy Stepped War-Table Slab
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

  const borderRim = new THREE.Mesh(
    new THREE.BoxGeometry(boardSpan + 0.36, 0.14, boardSpan + 0.36),
    trimMat
  );
  borderRim.position.y = -0.09;
  borderRim.receiveShadow = true;
  root.add(borderRim);

  // 2. Corner Buttress Pillars & Flickering Fire Braziers
  const halfCorner = altarWidth * 0.5 - 0.25;
  const cornerCoords = [
    [-halfCorner, -halfCorner],
    [halfCorner, -halfCorner],
    [-halfCorner, halfCorner],
    [halfCorner, halfCorner],
  ];
  const brazierFlames = [];

  const apseZ = -altarWidth * 0.5 - 3.2;
  for (const colX of [-4.2, -2.2, 2.2, 4.2]) {
    const apseCol = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.44, 6.8, 8), slabMat);
    apseCol.position.set(colX, 2.2, apseZ);
    apseCol.receiveShadow = true;
    root.add(apseCol);
  }
  const roseRing = new THREE.Mesh(new THREE.TorusGeometry(1.75, 0.09, 8, 24), trimMat);
  roseRing.position.set(0, 3.1, apseZ - 0.4);
  root.add(roseRing);

  const emberCoalMat = new THREE.MeshStandardMaterial({
    color: 0xff3b00,
    emissive: 0xff2200,
    emissiveIntensity: 2.6,
    roughness: 0.35,
  });

  const outerFlameMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(hallConfig.brazierColor || 0xff4d00),
    transparent: true,
    opacity: 0.88,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const midTongueMat = new THREE.MeshBasicMaterial({
    color: 0xff9e1b,
    transparent: true,
    opacity: 0.92,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const coreFlameMat = new THREE.MeshBasicMaterial({
    color: 0xfff5bd,
    transparent: true,
    opacity: 0.96,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const glowHaloMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(hallConfig.brazierColor || 0xff6a00),
    transparent: true,
    opacity: 0.24,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const sparkMat = new THREE.MeshBasicMaterial({
    color: 0xffd166,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  for (let i = 0; i < cornerCoords.length; i++) {
    const [cx, cz] = cornerCoords[i];
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.42, 0.75, 8), slabMat);
    pillar.position.set(cx, 0.28, cz);
    pillar.castShadow = true;
    pillar.receiveShadow = true;
    root.add(pillar);

    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.22, 0.26, 10), trimMat);
    bowl.position.set(cx, 0.74, cz);
    bowl.castShadow = true;
    root.add(bowl);

    const bowlRim = new THREE.Mesh(new THREE.TorusGeometry(0.41, 0.035, 6, 16), trimMat);
    bowlRim.rotation.x = Math.PI / 2;
    bowlRim.position.set(cx, 0.86, cz);
    root.add(bowlRim);

    for (let p = 0; p < 4; p++) {
      const pAngle = (p / 4) * Math.PI * 2 + Math.PI / 4;
      const prong = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.22, 4), trimMat);
      prong.position.set(cx + Math.cos(pAngle) * 0.38, 0.94, cz + Math.sin(pAngle) * 0.38);
      prong.rotation.z = -Math.cos(pAngle) * 0.25;
      prong.rotation.x = Math.sin(pAngle) * 0.25;
      root.add(prong);
    }

    const coalBed = new THREE.Mesh(
      new THREE.CylinderGeometry(0.34, 0.26, 0.08, 10),
      emberCoalMat
    );
    coalBed.position.set(cx, 0.85, cz);
    root.add(coalBed);

    const flameGroup = new THREE.Group();
    flameGroup.position.set(cx, 0.88, cz);

    const outerGeo = new THREE.ConeGeometry(0.28, 0.86, 7, 3);
    outerGeo.translate(0, 0.38, 0);
    const outerFlame = new THREE.Mesh(outerGeo, outerFlameMat.clone());
    flameGroup.add(outerFlame);

    const tongues = [];
    for (let t = 0; t < 3; t++) {
      const tAngle = (t / 3) * Math.PI * 2;
      const tGeo = new THREE.ConeGeometry(0.16, 0.62, 6, 2);
      tGeo.translate(0, 0.28, 0);
      const tongue = new THREE.Mesh(tGeo, midTongueMat.clone());
      tongue.position.set(Math.cos(tAngle) * 0.09, 0.02, Math.sin(tAngle) * 0.09);
      tongue.rotation.z = -Math.cos(tAngle) * 0.18;
      tongue.rotation.x = Math.sin(tAngle) * 0.18;
      tongue.userData = {
        baseAngle: tAngle,
        phaseOffset: t * 2.1 + i * 0.9,
      };
      flameGroup.add(tongue);
      tongues.push(tongue);
    }

    const coreGeo = new THREE.ConeGeometry(0.135, 0.52, 6);
    coreGeo.translate(0, 0.22, 0);
    const innerCore = new THREE.Mesh(coreGeo, coreFlameMat.clone());
    flameGroup.add(innerCore);

    const fireGlow = new THREE.Mesh(new THREE.SphereGeometry(0.52, 12, 12), glowHaloMat.clone());
    fireGlow.position.set(0, 0.32, 0);
    flameGroup.add(fireGlow);

    const sparks = [];
    for (let s = 0; s < 6; s++) {
      const spark = new THREE.Mesh(new THREE.OctahedronGeometry(0.036, 0), sparkMat.clone());
      spark.userData = {
        seed: i * 3.7 + s * 1.13,
        speed: 0.75 + (s % 3) * 0.28,
        radius: 0.08 + (s % 2) * 0.09,
      };
      flameGroup.add(spark);
      sparks.push(spark);
    }

    flameGroup.userData = {
      phase: i * 1.57,
      outerFlame,
      tongues,
      innerCore,
      fireGlow,
      sparks,
      coalBed,
    };

    root.add(flameGroup);
    brazierFlames.push(flameGroup);
  }

  // 3. Individual Carved Stone War-Table Tiles (`r`, `c`)
  const tilesGroup = new THREE.Group();
  tilesGroup.name = 'AltarTilesGroup';
  const tileMeshes = [];

  const offset = ((boardSize - 1) * tileSpacing) / 2;

  for (let r = 0; r < boardSize; r++) {
    tileMeshes[r] = [];
    for (let c = 0; c < boardSize; c++) {
      const isDark = (r + c) % 2 === 1;
      const baseTileColor = isDark ? 0x2a2338 : 0x3b314e;
      const tileMat = new THREE.MeshStandardMaterial({
        color: baseTileColor,
        roughness: 0.48,
        metalness: 0.24,
        emissive: new THREE.Color(isDark ? 0x09070f : 0x120e1c),
        emissiveIntensity: 0.35,
      });

      const tileMesh = new THREE.Mesh(new THREE.BoxGeometry(1.04, 0.14, 1.04), tileMat);
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

      const innerRim = new THREE.Mesh(
        new THREE.BoxGeometry(0.92, 0.146, 0.92),
        new THREE.MeshStandardMaterial({
          color: isDark ? 0x221c2e : 0x322944,
          roughness: 0.56,
          metalness: 0.22,
        })
      );
      innerRim.receiveShadow = true;
      innerRim.userData = {
        isAltarTile: true,
        r,
        c,
      };
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
 * Build the Monumental 3D Enemy Fantasy War Commander across the North edge of the War-Table
 * Features Boss-specific 3D armor, articulated limbs, crowns, wings, weapons, and animated double halos for all 6 Warlords
 */
export function createInquisitorAutomaton3D(boss = null) {
  const group = new THREE.Group();
  group.name = 'InquisitorAutomaton3D';

  const bossId = boss?.id || 'boss_malakor';
  const armorColor = boss?.color || '#b91c1c';
  const obsidianMat = createStoneMaterial('blood_obsidian', {
    color: 0x181220,
    roughness: 0.22,
    metalness: 0.72,
    clearcoat: 0.65,
  });
  const trimMat = createStoneMaterial('gilded_reliquary', {
    color: armorColor,
    roughness: 0.2,
    metalness: 0.88,
    clearcoat: 0.75,
    emissive: armorColor,
    emissiveIntensity: 0.48,
  });
  const goldMat = createStoneMaterial('gilded_reliquary', {
    roughness: 0.18,
    metalness: 0.9,
    clearcoat: 0.7,
  });
  const eyeMat = new THREE.MeshStandardMaterial({
    color: 0xffd166,
    emissive: new THREE.Color(armorColor),
    emissiveIntensity: 3.1,
  });

  // 0. Stepped Warlord Throne Dais with Runic Rim & Corner Spires
  const throneBase = new THREE.Mesh(
    new THREE.CylinderGeometry(1.36, 1.56, 0.36, 12),
    obsidianMat
  );
  throneBase.position.y = -0.25;
  throneBase.receiveShadow = true;
  group.add(throneBase);

  const throneRim = new THREE.Mesh(new THREE.TorusGeometry(1.38, 0.055, 8, 28), goldMat);
  throneRim.rotation.x = Math.PI / 2;
  throneRim.position.y = -0.07;
  group.add(throneRim);

  // 1. Breathing Armored Warlord Body Group (`bodyGroup`)
  const bodyGroup = new THREE.Group();
  group.add(bodyGroup);

  // Sculpted Lower Armor Greaves & Waist Faulds
  const waistColumn = new THREE.Mesh(
    new THREE.CylinderGeometry(0.76, 1.08, 0.85, 10),
    obsidianMat
  );
  waistColumn.position.y = 0.08;
  waistColumn.castShadow = true;
  bodyGroup.add(waistColumn);

  const warBelt = new THREE.Mesh(new THREE.TorusGeometry(0.82, 0.075, 8, 24), goldMat);
  warBelt.rotation.x = Math.PI / 2;
  warBelt.position.y = 0.32;
  bodyGroup.add(warBelt);

  // V-Taper Armored Upper Torso
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.96, 0.74, 1.25, 10), obsidianMat);
  torso.position.y = 0.78;
  torso.castShadow = true;
  bodyGroup.add(torso);

  // Multi-Plate Ribbed Breastplate & Glowing Warlord Core Heart
  for (let r = 0; r < 3; r++) {
    const ribPlate = new THREE.Mesh(
      new THREE.BoxGeometry(0.98 - r * 0.08, 0.22, 0.42),
      r % 2 === 0 ? obsidianMat : trimMat
    );
    ribPlate.position.set(0, 0.92 - r * 0.24, 0.56);
    bodyGroup.add(ribPlate);
  }

  const chestCrest = new THREE.Mesh(new THREE.OctahedronGeometry(0.32, 1), eyeMat);
  chestCrest.position.set(0, 0.76, 0.84);
  bodyGroup.add(chestCrest);

  const chestRing = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.045, 8, 20), goldMat);
  chestRing.position.set(0, 0.76, 0.8);
  bodyGroup.add(chestRing);

  // High Armored Gorget Collar & Flowing Royal Warlord Back Mantle
  const gorget = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.08, 8, 20), goldMat);
  gorget.rotation.x = Math.PI / 2 + 0.15;
  gorget.position.set(0, 1.38, 0.02);
  bodyGroup.add(gorget);

  const backMantle = new THREE.Mesh(new THREE.BoxGeometry(1.82, 1.9, 0.14), trimMat);
  backMantle.position.set(0, 0.52, -0.68);
  backMantle.rotation.x = 0.14;
  bodyGroup.add(backMantle);

  // Heavy Multi-Tiered Shoulder Pauldrons, Articulated Arms, Gauntlets & Signature Boss Weapons
  for (const dir of [-1, 1]) {
    const pauldron = new THREE.Mesh(new THREE.DodecahedronGeometry(0.58, 1), obsidianMat);
    pauldron.position.set(dir * 1.06, 1.12, 0);
    pauldron.scale.set(1.16, 0.92, 1.14);
    pauldron.castShadow = true;
    bodyGroup.add(pauldron);

    const pauldronTrim = new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.055, 8, 18), goldMat);
    pauldronTrim.position.set(dir * 1.06, 1.1, 0);
    pauldronTrim.rotation.y = Math.PI / 2;
    bodyGroup.add(pauldronTrim);

    for (let s = 0; s < 2; s++) {
      const spike = new THREE.Mesh(
        new THREE.ConeGeometry(0.14 - s * 0.03, 0.62 - s * 0.12, 6),
        s === 0 ? trimMat : goldMat
      );
      spike.position.set(dir * (1.14 + s * 0.18), 1.56 - s * 0.1, -s * 0.08);
      spike.rotation.z = dir * -(0.34 + s * 0.18);
      bodyGroup.add(spike);
    }

    // Articulated Upper Arm, Elbow Guard, Forearm & Clawed Gauntlet
    const upperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.22, 0.72, 8), obsidianMat);
    upperArm.position.set(dir * 1.22, 0.78, 0.08);
    upperArm.rotation.z = dir * -0.15;
    bodyGroup.add(upperArm);

    const elbowCop = new THREE.Mesh(new THREE.OctahedronGeometry(0.22, 0), goldMat);
    elbowCop.position.set(dir * 1.3, 0.48, 0.15);
    bodyGroup.add(elbowCop);

    const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.25, 0.85, 8), trimMat);
    forearm.position.set(dir * 1.38, 0.42, 0.36);
    forearm.rotation.z = dir * 0.12;
    forearm.rotation.x = -0.48;
    bodyGroup.add(forearm);

    // Flanking Signature Boss Weapon
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.068, 3.15, 8), goldMat);
    shaft.position.set(dir * 1.65, 1.06, 0.34);
    bodyGroup.add(shaft);

    if (bossId === 'boss_malakor' || bossId === 'boss_vorn') {
      // Twin Colossal Siege Warhammers with Glowing Magma Faces
      const hammerHead = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.42, 0.46), trimMat);
      hammerHead.position.set(dir * 1.65, 2.45, 0.34);
      bodyGroup.add(hammerHead);

      const hammerCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.24, 0), eyeMat);
      hammerCore.position.set(dir * 1.65, 2.45, 0.56);
      bodyGroup.add(hammerCore);
    } else if (bossId === 'boss_vespera' || bossId === 'boss_thurible') {
      // Twin Necrotic / Brimstone War-Staves with Armillary Rings & Floating Orbs
      const staffRing = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.045, 8, 20), goldMat);
      staffRing.position.set(dir * 1.65, 2.52, 0.34);
      bodyGroup.add(staffRing);
      const staffOrb = new THREE.Mesh(new THREE.OctahedronGeometry(0.2, 1), eyeMat);
      staffOrb.position.set(dir * 1.65, 2.52, 0.34);
      bodyGroup.add(staffOrb);
    } else {
      // Twin Royal Warlord Crescent Halberds
      const axeBlade = new THREE.Mesh(new THREE.ConeGeometry(0.38, 0.82, 4), trimMat);
      axeBlade.position.set(dir * 1.65, 2.48, 0.34);
      bodyGroup.add(axeBlade);

      const crescent = new THREE.Mesh(
        new THREE.TorusGeometry(0.34, 0.05, 6, 16, Math.PI * 0.9),
        eyeMat
      );
      crescent.position.set(dir * 1.65, 2.28, 0.34);
      crescent.rotation.z = dir * -1.2;
      bodyGroup.add(crescent);
    }
  }

  // 1b. Boss-Specific Swept Wings / Seraph Pinions (`wingGroup`)
  const wingGroup = new THREE.Group();
  wingGroup.position.set(0, 1.2, -0.58);
  if (bossId === 'boss_hollow_seraph') {
    for (const dir of [-1, 1]) {
      for (let w = 0; w < 3; w++) {
        const seraphWing = new THREE.Mesh(
          new THREE.ConeGeometry(0.26, 2.1 - w * 0.22, 4),
          w % 2 === 0 ? goldMat : trimMat
        );
        seraphWing.position.set(dir * (0.98 + w * 0.44), 0.5 - w * 0.32, -0.1 * w);
        seraphWing.rotation.z = dir * -(0.52 + w * 0.28);
        wingGroup.add(seraphWing);
      }
    }
  } else if (bossId === 'boss_vorn' || bossId === 'boss_carmilla') {
    for (const dir of [-1, 1]) {
      const pinion = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.75, 0.65), trimMat);
      pinion.position.set(dir * 1.2, 0.46, 0);
      pinion.rotation.z = dir * -0.46;
      pinion.rotation.y = dir * 0.28;
      wingGroup.add(pinion);
    }
  }
  bodyGroup.add(wingGroup);

  // 2. Articulated Warlord Head, Great-Helm & Boss-Specific Crown (`headGroup`)
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.76, 0.12);

  const skullHelm = new THREE.Mesh(new THREE.IcosahedronGeometry(0.48, 2), obsidianMat);
  skullHelm.scale.set(0.94, 1.2, 1.05);
  skullHelm.castShadow = true;
  headGroup.add(skullHelm);

  const faceplate = new THREE.Mesh(new THREE.CylinderGeometry(0.37, 0.28, 0.54, 8), obsidianMat);
  faceplate.position.set(0, -0.05, 0.19);
  headGroup.add(faceplate);

  for (const dir of [-1, 1]) {
    const cheekGuard = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.36, 0.28), goldMat);
    cheekGuard.position.set(dir * 0.34, -0.04, 0.22);
    cheekGuard.rotation.y = dir * 0.28;
    headGroup.add(cheekGuard);
  }

  // Boss-Specific Crown / Helm Silhouette
  if (bossId === 'boss_vespera') {
    for (let s = -2; s <= 2; s++) {
      const spire = new THREE.Mesh(
        new THREE.ConeGeometry(0.085, 0.62 - Math.abs(s) * 0.08, 6),
        goldMat
      );
      spire.position.set(s * 0.16, 0.64 - Math.abs(s) * 0.04, 0.05);
      spire.rotation.z = s * -0.12;
      headGroup.add(spire);
    }
  } else if (bossId === 'boss_carmilla') {
    const tiara = new THREE.Mesh(new THREE.OctahedronGeometry(0.25, 0), trimMat);
    tiara.position.set(0, 0.58, 0.18);
    headGroup.add(tiara);
  } else if (bossId === 'boss_hollow_seraph') {
    // Central Void Eclipse Eye on the Seraph Mask
    const voidEye = new THREE.Mesh(new THREE.OctahedronGeometry(0.2, 0), eyeMat);
    voidEye.position.set(0, 0.12, 0.48);
    headGroup.add(voidEye);
  } else {
    const hoodCowl = new THREE.Mesh(new THREE.ConeGeometry(0.58, 0.74, 8), trimMat);
    hoodCowl.position.set(0, 0.46, -0.04);
    headGroup.add(hoodCowl);
  }

  // Curved Warlord Horns & Blazing Eyes
  for (const dir of [-1, 1]) {
    const horn = new THREE.Mesh(new THREE.ConeGeometry(0.125, 0.72, 8), goldMat);
    horn.position.set(dir * 0.45, 0.42, 0.05);
    horn.rotation.z = dir * -0.48;
    horn.rotation.x = 0.22;
    headGroup.add(horn);

    const eye = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.062, 0.09), eyeMat);
    eye.position.set(dir * 0.15, 0.05, 0.44);
    eye.rotation.z = dir * -0.15;
    headGroup.add(eye);
  }

  // Counter-Rotating Outer & Inner Warlord Halos behind the Commander
  const halo = new THREE.Mesh(new THREE.TorusGeometry(0.96, 0.058, 10, 32), trimMat);
  halo.position.set(0, 0.26, -0.42);
  headGroup.add(halo);

  const innerHalo = new THREE.Mesh(new THREE.TorusGeometry(0.68, 0.038, 8, 28), goldMat);
  innerHalo.position.set(0, 0.26, -0.38);
  headGroup.add(innerHalo);

  group.add(headGroup);
  group.userData = { headGroup, bodyGroup, wingGroup, halo, innerHalo, eyeMat };

  return group;
}
