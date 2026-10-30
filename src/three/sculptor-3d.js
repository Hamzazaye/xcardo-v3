/**
 * XcardO — 3D Fantasy War-Table Strategy
 * Procedural 3D Fantasy War Character Sculptor, Cathedral War-Table & Warlord Commander Builder
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
    emissiveIntensity: isGhost ? 0.8 : 0.3,
  });

  const trimColor = symbol === 'X' ? 0xd4a853 : symbol === 'O' ? 0xe11d48 : 0xfbbf24;
  const trimMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(matDef.accentColor || trimColor),
    roughness: 0.25,
    metalness: 0.84,
    emissive: new THREE.Color(trimColor),
    emissiveIntensity: isGhost ? 0.9 : 0.45,
    transparent: isGhost,
    opacity: isGhost ? 0.6 : 1.0,
  });

  const coreGlowColor = symbol === 'X' ? 0xfbbf24 : symbol === 'O' ? 0xf43f5e : 0x38bdf8;
  const glowMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(coreGlowColor),
    emissive: new THREE.Color(coreGlowColor),
    emissiveIntensity: 1.45,
    roughness: 0.15,
    metalness: 0.2,
    transparent: isGhost,
    opacity: isGhost ? 0.75 : 1.0,
  });

  // 1. Stepped Octagonal War-Table Plinth Base with Corner Rivets & Faction Aura Ring
  const baseLower = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.46, 0.12, 8), primaryMat);
  baseLower.position.y = 0.06;
  baseLower.castShadow = !isGhost;
  baseLower.receiveShadow = !isGhost;
  group.add(baseLower);

  const baseUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 0.1, 8), primaryMat);
  baseUpper.position.y = 0.16;
  baseUpper.castShadow = !isGhost;
  baseUpper.receiveShadow = !isGhost;
  group.add(baseUpper);

  const baseCollar = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.028, 8, 20), trimMat);
  baseCollar.rotation.x = Math.PI / 2;
  baseCollar.position.y = 0.21;
  group.add(baseCollar);

  const baseAuraRing = new THREE.Mesh(new THREE.TorusGeometry(0.44, 0.015, 6, 24), glowMat);
  baseAuraRing.rotation.x = Math.PI / 2;
  baseAuraRing.position.y = 0.03;
  group.add(baseAuraRing);

  for (let rIdx = 0; rIdx < 4; rIdx++) {
    const rAngle = (rIdx / 4) * Math.PI * 2 + Math.PI / 4;
    const rivet = new THREE.Mesh(new THREE.OctahedronGeometry(0.032, 0), trimMat);
    rivet.position.set(Math.cos(rAngle) * 0.39, 0.13, Math.sin(rAngle) * 0.39);
    group.add(rivet);
  }

  // 2. Sculpted Fantasy War Character Upper Geometry (All 6 Heroes + 3 Enemy Types + Wild Idol)
  if (symbol === 'W') {
    // Wild Joker Idol: Winged Valkyrie Trophy with Levitating Double Sunburst Halo
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.24, 0.36, 8), trimMat);
    stem.position.y = 0.37;
    stem.castShadow = !isGhost;
    group.add(stem);

    for (const dir of [-1, 1]) {
      const wing = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.38, 0.2), trimMat);
      wing.position.set(dir * 0.24, 0.64, -0.02);
      wing.rotation.z = dir * -0.42;
      group.add(wing);
    }

    const haloOuter = new THREE.Mesh(new THREE.TorusGeometry(0.29, 0.036, 10, 24), trimMat);
    haloOuter.position.y = 0.7;
    haloOuter.userData.spinSpeed = 1.1;
    group.add(haloOuter);

    const haloInner = new THREE.Mesh(new THREE.TorusGeometry(0.21, 0.025, 8, 20), glowMat);
    haloInner.rotation.y = Math.PI / 4;
    haloInner.position.y = 0.7;
    haloInner.userData.spinSpeed = -2.0;
    group.add(haloInner);

    const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.15, 0), glowMat);
    crystal.position.y = 0.7;
    crystal.userData = { spinSpeed: 2.6, floatAmplitude: 0.04, baseY: 0.7 };
    group.add(crystal);
  } else if (sculptId === 'templar_knight' && symbol !== 'O') {
    // HERO 2 — Shieldmaiden Freya (Storm Valkyrie): Winged Silver Great-Helm, Valhallan Buckler & Gungnir Sky-Lance
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.29, 0.38, 8), primaryMat);
    torso.position.y = 0.39;
    torso.castShadow = !isGhost;
    group.add(torso);

    const cape = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.42, 0.05), trimMat);
    cape.position.set(0, 0.4, -0.18);
    cape.rotation.x = 0.14;
    group.add(cape);

    // Armored Shoulder Pauldrons & Swept Valkyrie Helm Feather-Wings
    for (const dir of [-1, 1]) {
      const pauldron = new THREE.Mesh(new THREE.DodecahedronGeometry(0.145, 0), primaryMat);
      pauldron.position.set(dir * 0.26, 0.51, 0);
      pauldron.scale.set(1.18, 0.88, 1.2);
      pauldron.castShadow = !isGhost;
      group.add(pauldron);

      const pauldronRim = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.018, 6, 12), trimMat);
      pauldronRim.position.set(dir * 0.26, 0.51, 0);
      pauldronRim.rotation.y = Math.PI / 2;
      group.add(pauldronRim);

      // Multi-feathered Valkyrie Wing on Helm
      const wingPrimary = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.34, 4), trimMat);
      wingPrimary.position.set(dir * 0.21, 0.84, -0.03);
      wingPrimary.rotation.z = dir * -0.48;
      wingPrimary.rotation.x = -0.22;
      group.add(wingPrimary);

      const wingSecondary = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.25, 4), glowMat);
      wingSecondary.position.set(dir * 0.27, 0.76, -0.06);
      wingSecondary.rotation.z = dir * -0.68;
      wingSecondary.rotation.x = -0.25;
      group.add(wingSecondary);
    }

    // Great-Helm & Crowned Visor
    const helm = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.28, 8), primaryMat);
    helm.position.y = 0.69;
    helm.castShadow = !isGhost;
    group.add(helm);

    const helmCrown = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.15, 8), trimMat);
    helmCrown.position.y = 0.9;
    helmCrown.castShadow = !isGhost;
    group.add(helmCrown);

    for (const dir of [-1, 1]) {
      const eyeSlit = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.032, 0.06), glowMat);
      eyeSlit.position.set(dir * 0.06, 0.71, 0.16);
      eyeSlit.rotation.z = dir * -0.22;
      group.add(eyeSlit);
    }
    const browGem = new THREE.Mesh(new THREE.OctahedronGeometry(0.05, 0), glowMat);
    browGem.position.set(0, 0.78, 0.17);
    group.add(browGem);

    // Left-Hand Round Valhallan Sun-Buckler Shield
    const buckler = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.04, 12), trimMat);
    buckler.rotation.z = Math.PI / 2;
    buckler.rotation.y = 0.35;
    buckler.position.set(-0.29, 0.46, 0.12);
    group.add(buckler);

    const bucklerBoss = new THREE.Mesh(new THREE.OctahedronGeometry(0.06, 0), glowMat);
    bucklerBoss.position.set(-0.31, 0.46, 0.15);
    group.add(bucklerBoss);

    // Right-Hand Gungnir Sky-Lance with Storm Ring
    const lanceShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.028, 0.84, 6), trimMat);
    lanceShaft.position.set(0.29, 0.58, 0.1);
    group.add(lanceShaft);

    const lanceTip = new THREE.Mesh(new THREE.ConeGeometry(0.068, 0.25, 4), glowMat);
    lanceTip.position.set(0.29, 1.06, 0.1);
    group.add(lanceTip);

    const stormRing = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.015, 6, 16), glowMat);
    stormRing.position.set(0.29, 0.94, 0.1);
    stormRing.userData.spinSpeed = 3.2;
    group.add(stormRing);
  } else if (sculptId === 'astral_archmage' && symbol !== 'O') {
    // HERO 3 — Arch-Magus Kaelen (Astral Battle-Mage): Arcane Hooded Crown, Orbiting Runestones, Grimoire & Astrolabe Staff
    const robe = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.32, 0.42, 8), primaryMat);
    robe.position.y = 0.41;
    robe.castShadow = !isGhost;
    group.add(robe);

    // High Gold Astral Mantle Collar
    const collar = new THREE.Mesh(
      new THREE.TorusGeometry(0.22, 0.035, 8, 16, Math.PI * 1.2),
      trimMat
    );
    collar.rotation.x = Math.PI / 2 + 0.35;
    collar.rotation.z = -Math.PI * 0.1;
    collar.position.set(0, 0.62, -0.04);
    group.add(collar);

    for (const dir of [-1, 1]) {
      const shoulder = new THREE.Mesh(new THREE.OctahedronGeometry(0.13, 0), trimMat);
      shoulder.position.set(dir * 0.24, 0.53, 0);
      group.add(shoulder);
    }

    // Hooded Arch-Mage Head & Glowing Arcane Eyes
    const hood = new THREE.Mesh(new THREE.ConeGeometry(0.19, 0.32, 7), primaryMat);
    hood.position.set(0, 0.74, 0);
    hood.castShadow = !isGhost;
    group.add(hood);

    const crownCirclet = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.022, 6, 16), trimMat);
    crownCirclet.rotation.x = Math.PI / 2;
    crownCirclet.position.set(0, 0.72, 0.02);
    group.add(crownCirclet);

    for (const dir of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.OctahedronGeometry(0.038, 0), glowMat);
      eye.position.set(dir * 0.055, 0.68, 0.14);
      group.add(eye);
    }

    // Orbiting Astral Runestone Ring (3 floating crystals)
    const runeOrbit = new THREE.Group();
    runeOrbit.position.set(0, 0.68, 0);
    runeOrbit.userData.spinSpeed = 1.9;
    for (let k = 0; k < 3; k++) {
      const a = (k / 3) * Math.PI * 2;
      const rune = new THREE.Mesh(new THREE.OctahedronGeometry(0.055, 0), glowMat);
      rune.position.set(Math.cos(a) * 0.34, Math.sin(a * 2) * 0.05, Math.sin(a) * 0.34);
      runeOrbit.add(rune);
    }
    group.add(runeOrbit);

    // Left-Hand Levitating Open Spellbook Grimoire
    const tome = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.12, 0.04), trimMat);
    tome.position.set(-0.26, 0.54, 0.14);
    tome.rotation.set(0.4, 0.3, -0.2);
    tome.userData = { floatAmplitude: 0.035, baseY: 0.54, floatPhase: 1.2 };
    group.add(tome);

    // Right-Hand Staff of the Dawn-Star with Spinning Astrolabe
    const staffShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.026, 0.84, 6), trimMat);
    staffShaft.position.set(0.28, 0.58, 0.08);
    group.add(staffShaft);

    const astrolabe = new THREE.Mesh(new THREE.TorusGeometry(0.095, 0.016, 6, 16), trimMat);
    astrolabe.position.set(0.28, 1.04, 0.08);
    astrolabe.userData.spinSpeed = -2.4;
    group.add(astrolabe);

    const starCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.055, 0), glowMat);
    starCore.position.set(0.28, 1.04, 0.08);
    starCore.userData.spinSpeed = 3.0;
    group.add(starCore);
  } else if (sculptId === 'gargoyle_warden' && symbol !== 'O') {
    // HERO 4 — Dragon-Lord Draven (Dragon-Knight Warlord): Wyrm-Scale Armor, Swept Dragon Wings, Curved Horns & Ember Halberd
    const pedestal = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.24, 0.38), primaryMat);
    pedestal.position.y = 0.32;
    pedestal.castShadow = !isGhost;
    group.add(pedestal);

    const body = new THREE.Mesh(new THREE.DodecahedronGeometry(0.24, 0), primaryMat);
    body.position.set(0, 0.56, 0.02);
    body.scale.set(1.08, 1.26, 0.96);
    body.castShadow = !isGhost;
    group.add(body);

    const chestDragonHeart = new THREE.Mesh(new THREE.OctahedronGeometry(0.085, 0), glowMat);
    chestDragonHeart.position.set(0, 0.55, 0.22);
    chestDragonHeart.userData.spinSpeed = 2.0;
    group.add(chestDragonHeart);

    const head = new THREE.Mesh(new THREE.OctahedronGeometry(0.17, 0), primaryMat);
    head.position.set(0, 0.8, 0.06);
    head.castShadow = !isGhost;
    group.add(head);

    // Swept Articulated Dragon Wings & Curved Wyrm Horns
    for (const dir of [-1, 1]) {
      const wingUpper = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.48, 0.28), trimMat);
      wingUpper.position.set(dir * 0.27, 0.72, -0.09);
      wingUpper.rotation.z = dir * -0.44;
      wingUpper.rotation.y = dir * 0.28;
      wingUpper.castShadow = !isGhost;
      group.add(wingUpper);

      const wingSpur = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.22, 4), glowMat);
      wingSpur.position.set(dir * 0.36, 0.96, -0.1);
      wingSpur.rotation.z = dir * -0.35;
      group.add(wingSpur);

      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.052, 0.28, 6), trimMat);
      horn.position.set(dir * 0.12, 0.96, 0.02);
      horn.rotation.z = dir * -0.42;
      horn.rotation.x = -0.28;
      group.add(horn);

      const eye = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.03, 0.04), glowMat);
      eye.position.set(dir * 0.06, 0.81, 0.19);
      group.add(eye);
    }

    // Right-Hand Ember-Wyrm Halberd
    const halberdShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.028, 0.86, 6), trimMat);
    halberdShaft.position.set(0.3, 0.58, 0.08);
    group.add(halberdShaft);

    const halberdBlade = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.26, 4), glowMat);
    halberdBlade.position.set(0.3, 1.02, 0.08);
    group.add(halberdBlade);
  } else if (sculptId === 'sylvan_ranger' && symbol !== 'O') {
    // HERO 5 — Sylvan Warden Lyra (Elven War-Ranger): Golden Stag Antlers, Hooded Cloak & Starlight Whisper-Bow
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.28, 0.38, 8), primaryMat);
    torso.position.y = 0.39;
    torso.castShadow = !isGhost;
    group.add(torso);

    const cloak = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.46, 7), primaryMat);
    cloak.position.set(0, 0.44, -0.05);
    group.add(cloak);

    const hood = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.3, 7), primaryMat);
    hood.position.set(0, 0.73, 0.02);
    hood.castShadow = !isGhost;
    group.add(hood);

    // Royal Golden Stag Antlers & Glowing Emerald Eyes
    for (const dir of [-1, 1]) {
      const antlerMain = new THREE.Mesh(new THREE.ConeGeometry(0.038, 0.3, 5), trimMat);
      antlerMain.position.set(dir * 0.15, 0.9, 0.02);
      antlerMain.rotation.z = dir * -0.48;
      group.add(antlerMain);

      const antlerTine = new THREE.Mesh(new THREE.ConeGeometry(0.028, 0.18, 4), trimMat);
      antlerTine.position.set(dir * 0.22, 0.96, 0.04);
      antlerTine.rotation.z = dir * -0.85;
      group.add(antlerTine);

      const eye = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.026, 0.04), glowMat);
      eye.position.set(dir * 0.055, 0.69, 0.15);
      group.add(eye);
    }

    // Curved Starlight Whisper-Bow & Drawn Glowing Arrow
    const bowArc = new THREE.Mesh(
      new THREE.TorusGeometry(0.26, 0.024, 6, 16, Math.PI * 1.15),
      trimMat
    );
    bowArc.rotation.y = Math.PI / 2;
    bowArc.rotation.z = -Math.PI * 0.57;
    bowArc.position.set(0.24, 0.62, 0.12);
    group.add(bowArc);

    const starArrow = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.28, 4), glowMat);
    starArrow.rotation.x = Math.PI / 2;
    starArrow.position.set(0.24, 0.62, 0.24);
    group.add(starArrow);
  } else if (sculptId === 'frost_runeblade' && symbol !== 'O') {
    // HERO 6 — Runeblade Arthos (Glacial Runeblade): Jagged Ice-Crown Helm, Spiked Dread-Plate & Winter-Star Greatsword
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.31, 0.38, 8), primaryMat);
    torso.position.y = 0.39;
    torso.castShadow = !isGhost;
    group.add(torso);

    for (const dir of [-1, 1]) {
      const pauldron = new THREE.Mesh(new THREE.DodecahedronGeometry(0.15, 0), primaryMat);
      pauldron.position.set(dir * 0.27, 0.52, 0);
      pauldron.castShadow = !isGhost;
      group.add(pauldron);

      const iceSpike = new THREE.Mesh(new THREE.ConeGeometry(0.048, 0.22, 4), glowMat);
      iceSpike.position.set(dir * 0.31, 0.66, 0);
      iceSpike.rotation.z = dir * -0.4;
      group.add(iceSpike);
    }

    const helm = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.26, 8), primaryMat);
    helm.position.y = 0.68;
    helm.castShadow = !isGhost;
    group.add(helm);

    // 5-Spire Jagged Glacial Ice-Crown
    for (let s = -2; s <= 2; s++) {
      const crownSpike = new THREE.Mesh(
        new THREE.ConeGeometry(0.036, 0.18 - Math.abs(s) * 0.025, 4),
        s === 0 ? glowMat : trimMat
      );
      crownSpike.position.set(s * 0.06, 0.88 - Math.abs(s) * 0.02, 0.04);
      crownSpike.rotation.z = s * -0.14;
      group.add(crownSpike);
    }

    for (const dir of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.OctahedronGeometry(0.042, 0), glowMat);
      eye.position.set(dir * 0.06, 0.69, 0.16);
      group.add(eye);
    }

    // Two-Handed Winter-Star Runeblade Greatsword
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.72, 0.025), glowMat);
    blade.position.set(0.29, 0.66, 0.1);
    group.add(blade);

    const crossguard = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.04, 0.05), trimMat);
    crossguard.position.set(0.29, 0.36, 0.1);
    group.add(crossguard);
  } else if (sculptId === 'ossuary_skull') {
    // ENEMY 2 — Necromancer Lich Warlord: Ribbed Bone-Armor, Crowned Skull Bust, Orbiting Soul-Orbs & Soul-Fire Eyes
    const column = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.29, 0.28, 8), primaryMat);
    column.position.y = 0.33;
    column.castShadow = !isGhost;
    group.add(column);

    for (const dir of [-1, 1]) {
      const boneHorn = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.24, 5), trimMat);
      boneHorn.position.set(dir * 0.25, 0.52, 0);
      boneHorn.rotation.z = dir * -0.45;
      group.add(boneHorn);
    }

    const cranium = new THREE.Mesh(new THREE.IcosahedronGeometry(0.24, 1), primaryMat);
    cranium.position.set(0, 0.64, 0);
    cranium.scale.set(0.92, 1.08, 1.05);
    cranium.castShadow = !isGhost;
    group.add(cranium);

    const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 0.22), primaryMat);
    jaw.position.set(0, 0.45, 0.06);
    jaw.castShadow = !isGhost;
    group.add(jaw);

    // Spiked Lich Crown
    for (let k = -2; k <= 2; k++) {
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.18, 4), trimMat);
      spike.position.set(k * 0.065, 0.89, 0.02);
      spike.rotation.z = k * -0.15;
      group.add(spike);
    }

    // Glowing Eye Sockets
    for (const dir of [-1, 1]) {
      const socket = new THREE.Mesh(new THREE.OctahedronGeometry(0.06, 0), glowMat);
      socket.position.set(dir * 0.085, 0.63, 0.21);
      group.add(socket);
    }

    // Spiked Necromancer Crown Halo
    const crownHalo = new THREE.Mesh(new THREE.TorusGeometry(0.29, 0.028, 8, 16), trimMat);
    crownHalo.position.set(0, 0.66, -0.05);
    crownHalo.rotation.x = 0.35;
    crownHalo.userData.spinSpeed = -1.5;
    group.add(crownHalo);
  } else if (sculptId === 'abyssal_obelisk') {
    // ENEMY 3 — Abyssal Demon General: Horned Obsidian Monolith + Counter-Rotating Hell-Iron Chains
    const obelisk = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.28, 0.64, 4), primaryMat);
    obelisk.position.y = 0.53;
    obelisk.rotation.y = Math.PI / 4;
    obelisk.castShadow = !isGhost;
    group.add(obelisk);

    for (const dir of [-1, 1]) {
      const demonHorn = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.28, 5), trimMat);
      demonHorn.position.set(dir * 0.2, 0.78, 0);
      demonHorn.rotation.z = dir * -0.52;
      group.add(demonHorn);
    }

    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.24, 4), glowMat);
    cap.position.y = 0.96;
    cap.rotation.y = Math.PI / 4;
    cap.userData.spinSpeed = 1.8;
    group.add(cap);

    const shackle1 = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.026, 6, 16), trimMat);
    shackle1.position.y = 0.58;
    shackle1.rotation.x = Math.PI / 2.4;
    shackle1.userData.spinSpeed = -1.4;
    group.add(shackle1);

    const shackle2 = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.02, 6, 16), glowMat);
    shackle2.position.y = 0.58;
    shackle2.rotation.x = -Math.PI / 2.4;
    shackle2.userData.spinSpeed = 2.1;
    group.add(shackle2);
  } else if (symbol === 'O' || sculptId === 'iron_torus') {
    // ENEMY 1 — Dread-Iron Warlord Juggernaut (`iron_torus`): Armored Torso, Spiked Pauldrons, War-Axe & 8-Spike Iron Crown
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 0.34, 8), primaryMat);
    torso.position.y = 0.36;
    torso.castShadow = !isGhost;
    group.add(torso);

    // Spiked Warlord Pauldrons & Back War-Spikes
    for (const dir of [-1, 1]) {
      const pauldron = new THREE.Mesh(new THREE.DodecahedronGeometry(0.14, 0), primaryMat);
      pauldron.position.set(dir * 0.25, 0.48, 0);
      pauldron.castShadow = !isGhost;
      group.add(pauldron);

      const pSpike = new THREE.Mesh(new THREE.ConeGeometry(0.042, 0.18, 5), trimMat);
      pSpike.position.set(dir * 0.29, 0.6, 0);
      pSpike.rotation.z = dir * -0.38;
      group.add(pSpike);
    }

    const torus = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.072, 12, 24), primaryMat);
    torus.position.y = 0.68;
    torus.rotation.x = 0.26;
    torus.castShadow = !isGhost;
    group.add(torus);

    // 8 Radial Iron Spikes around the Warlord Crown
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.038, 0.15, 5), trimMat);
      spike.position.set(
        Math.cos(angle) * 0.33,
        0.68 + Math.sin(angle) * 0.31,
        Math.sin(angle) * -0.09
      );
      spike.rotation.z = angle - Math.PI / 2;
      group.add(spike);
    }

    const eyeCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.12, 0), glowMat);
    eyeCore.position.y = 0.68;
    eyeCore.userData.spinSpeed = 2.2;
    group.add(eyeCore);
  } else {
    // HERO 1 — High Paladin Aurelius (`seraph_cross`): Sunforged Cuirass, Royal Cape, Lion Pauldrons, Heater Shield, Solar Halo & Dawnbreaker Sun-Spear
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.3, 0.38, 8), primaryMat);
    torso.position.y = 0.39;
    torso.castShadow = !isGhost;
    group.add(torso);

    const royalCape = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.44, 0.05), trimMat);
    royalCape.position.set(0, 0.41, -0.18);
    royalCape.rotation.x = 0.15;
    group.add(royalCape);

    // Royal Lion Pauldrons
    for (const dir of [-1, 1]) {
      const pauldron = new THREE.Mesh(new THREE.DodecahedronGeometry(0.145, 0), trimMat);
      pauldron.position.set(dir * 0.26, 0.51, 0);
      pauldron.castShadow = !isGhost;
      group.add(pauldron);
    }

    // Crowned Solar Great-Helm & Glowing V-Visor
    const helm = new THREE.Mesh(new THREE.CylinderGeometry(0.155, 0.175, 0.26, 8), primaryMat);
    helm.position.y = 0.67;
    helm.castShadow = !isGhost;
    group.add(helm);

    const crown = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.16, 6), trimMat);
    crown.position.y = 0.87;
    group.add(crown);

    for (const dir of [-1, 1]) {
      const visorEye = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.028, 0.05), glowMat);
      visorEye.position.set(dir * 0.055, 0.69, 0.155);
      visorEye.rotation.z = dir * -0.2;
      group.add(visorEye);
    }

    // Sunforged Gold Halo Ring & Star-Crest Gem
    const halo = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.03, 8, 24), trimMat);
    halo.position.set(0, 0.68, -0.07);
    group.add(halo);

    const heart = new THREE.Mesh(new THREE.OctahedronGeometry(0.1, 0), glowMat);
    heart.position.set(0, 0.47, 0.22);
    heart.userData.spinSpeed = 1.8;
    group.add(heart);

    // Left-Hand Sunforged Heater Shield
    const shieldPlate = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.09, 0.3, 6), trimMat);
    shieldPlate.position.set(-0.28, 0.46, 0.12);
    shieldPlate.rotation.y = 0.4;
    shieldPlate.scale.set(1.0, 1.0, 0.35);
    group.add(shieldPlate);

    // Right-Hand Dawnbreaker Sun-Spear
    const spearShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.028, 0.82, 6), trimMat);
    spearShaft.position.set(0.28, 0.58, 0.08);
    group.add(spearShaft);
    const spearTip = new THREE.Mesh(new THREE.OctahedronGeometry(0.085, 0), glowMat);
    spearTip.position.set(0.28, 1.03, 0.08);
    spearTip.userData.spinSpeed = 2.4;
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
    // Indestructible Fortress Stone Pillar with Iron Bands
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
    // Breakable Ornate Fantasy War-Chest (Mystery Box!)
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
    // Glowing Runic War-Seal Medallion inlaid into the tile (+2 bonus VP)
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
    // Ticking Siege Bomb / Volatile Brimstone Keg
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
    // Golden War-Chalice (+3 Gold Coins & +1 Scroll)
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

  // Ornate Brass/Gold War-Table Border Frame
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

  // 2b. Distant War-Sanctum Columns & Glowing Rose-Window Arch behind the Enemy Warlord
  const apseZ = -altarWidth * 0.5 - 3.2;
  for (const colX of [-4.2, -2.2, 2.2, 4.2]) {
    const apseCol = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.44, 6.8, 8), slabMat);
    apseCol.position.set(colX, 2.2, apseZ);
    apseCol.receiveShadow = true;
    root.add(apseCol);
  }
  const roseRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.75, 0.09, 8, 24),
    trimMat
  );
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

    // Ornate Gilded Brazier Cauldron Bowl
    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.22, 0.26, 10), trimMat);
    bowl.position.set(cx, 0.74, cz);
    bowl.castShadow = true;
    root.add(bowl);

    const bowlRim = new THREE.Mesh(new THREE.TorusGeometry(0.41, 0.035, 6, 16), trimMat);
    bowlRim.rotation.x = Math.PI / 2;
    bowlRim.position.set(cx, 0.86, cz);
    root.add(bowlRim);

    // 4 Wrought-Iron Fire Prongs cradling the flame
    for (let p = 0; p < 4; p++) {
      const pAngle = (p / 4) * Math.PI * 2 + Math.PI / 4;
      const prong = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.22, 4), trimMat);
      prong.position.set(
        cx + Math.cos(pAngle) * 0.38,
        0.94,
        cz + Math.sin(pAngle) * 0.38
      );
      prong.rotation.z = -Math.cos(pAngle) * 0.25;
      prong.rotation.x = Math.sin(pAngle) * 0.25;
      root.add(prong);
    }

    // Glowing Bed of Burning Coals inside the cauldron
    const coalBed = new THREE.Mesh(
      new THREE.CylinderGeometry(0.34, 0.26, 0.08, 10),
      emberCoalMat
    );
    coalBed.position.set(cx, 0.85, cz);
    root.add(coalBed);

    // Multi-Layered Sculpted 3D Fire Plume
    const flameGroup = new THREE.Group();
    flameGroup.position.set(cx, 0.88, cz);

    // Layer 1: Tall Sculpted Outer Crimson-Orange Flame Plume
    const outerGeo = new THREE.ConeGeometry(0.28, 0.86, 7, 3);
    outerGeo.translate(0, 0.38, 0);
    const outerFlame = new THREE.Mesh(outerGeo, outerFlameMat.clone());
    flameGroup.add(outerFlame);

    // Layer 2: 3 Dancing Amber-Gold Side Flame Tongues
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

    // Layer 3: White-Hot Golden Inner Flame Core
    const coreGeo = new THREE.ConeGeometry(0.135, 0.52, 6);
    coreGeo.translate(0, 0.22, 0);
    const innerCore = new THREE.Mesh(coreGeo, coreFlameMat.clone());
    flameGroup.add(innerCore);

    // Layer 4: Soft Volumetric Fire Aura Sphere
    const fireGlow = new THREE.Mesh(
      new THREE.SphereGeometry(0.52, 12, 12),
      glowHaloMat.clone()
    );
    fireGlow.position.set(0, 0.32, 0);
    flameGroup.add(fireGlow);

    // Layer 5: 6 Rising & Spiraling Fire Ember Sparks
    const sparks = [];
    for (let s = 0; s < 6; s++) {
      const spark = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.036, 0),
        sparkMat.clone()
      );
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

  // 3. Individual Carved Stone War-Table Tiles (`r`, `c`) — Well-lit with high-contrast bevels
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

      // Subtle engraved inner border on each stone tile
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
 * Build the 3D Enemy Fantasy War Commander across the North edge of the War-Table
 * Features Boss-specific 3D armor, crowns, wings, weapons, and animated double halos for all 6 Warlords
 */
export function createInquisitorAutomaton3D(boss = null) {
  const group = new THREE.Group();
  group.name = 'InquisitorAutomaton3D';

  const bossId = boss?.id || 'boss_malakor';
  const armorColor = boss?.color || '#b91c1c';
  const obsidianMat = createStoneMaterial('blood_obsidian', { color: 0x1a1423 });
  const trimMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(armorColor),
    roughness: 0.24,
    metalness: 0.85,
    emissive: new THREE.Color(armorColor),
    emissiveIntensity: 0.45,
  });
  const goldMat = createStoneMaterial('gilded_reliquary');
  const eyeMat = new THREE.MeshStandardMaterial({
    color: 0xffd166,
    emissive: new THREE.Color(armorColor),
    emissiveIntensity: 2.8,
  });

  // 0. Stepped Warlord Throne Plinth Base
  const throneBase = new THREE.Mesh(new THREE.CylinderGeometry(1.32, 1.52, 0.35, 8), obsidianMat);
  throneBase.position.y = -0.25;
  throneBase.receiveShadow = true;
  group.add(throneBase);

  const throneRim = new THREE.Mesh(new THREE.TorusGeometry(1.36, 0.055, 8, 24), goldMat);
  throneRim.rotation.x = Math.PI / 2;
  throneRim.position.y = -0.08;
  group.add(throneRim);

  // 1. Breathing Armored Warlord Body Group (`bodyGroup`)
  const bodyGroup = new THREE.Group();
  group.add(bodyGroup);

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.84, 1.12, 1.82, 8), obsidianMat);
  torso.position.y = 0.45;
  torso.castShadow = true;
  bodyGroup.add(torso);

  // Ribbed Breastplate & Glowing Warlord Core Gem
  const chestPlate = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.92, 0.38), obsidianMat);
  chestPlate.position.set(0, 0.65, 0.58);
  bodyGroup.add(chestPlate);

  const chestCrest = new THREE.Mesh(new THREE.OctahedronGeometry(0.32, 0), eyeMat);
  chestCrest.position.set(0, 0.72, 0.82);
  bodyGroup.add(chestCrest);

  const chestRing = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.04, 6, 16), goldMat);
  chestRing.position.set(0, 0.72, 0.79);
  bodyGroup.add(chestRing);

  // Flowing Royal Warlord Back Mantle
  const backMantle = new THREE.Mesh(new THREE.BoxGeometry(1.75, 1.85, 0.14), trimMat);
  backMantle.position.set(0, 0.48, -0.68);
  backMantle.rotation.x = 0.12;
  bodyGroup.add(backMantle);

  // Heavy Layered Shoulder Pauldrons, Articulated Arms, Gauntlets & Flanking War-Weapons
  for (const dir of [-1, 1]) {
    const pauldron = new THREE.Mesh(new THREE.DodecahedronGeometry(0.58, 0), obsidianMat);
    pauldron.position.set(dir * 1.04, 1.02, 0);
    pauldron.scale.set(1.12, 0.95, 1.12);
    pauldron.castShadow = true;
    bodyGroup.add(pauldron);

    const pauldronTrim = new THREE.Mesh(new THREE.TorusGeometry(0.49, 0.055, 6, 14), goldMat);
    pauldronTrim.position.set(dir * 1.04, 1.02, 0);
    pauldronTrim.rotation.y = Math.PI / 2;
    bodyGroup.add(pauldronTrim);

    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.58, 5), trimMat);
    spike.position.set(dir * 1.15, 1.5, 0);
    spike.rotation.z = dir * -0.36;
    bodyGroup.add(spike);

    // Sculpted Armored Forearm & Gauntlet
    const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.95, 6), obsidianMat);
    forearm.position.set(dir * 1.28, 0.45, 0.22);
    forearm.rotation.z = dir * 0.18;
    forearm.rotation.x = -0.25;
    bodyGroup.add(forearm);

    // Flanking Signature Boss Weapon
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.065, 3.05, 6), goldMat);
    shaft.position.set(dir * 1.62, 1.02, 0.28);
    bodyGroup.add(shaft);

    if (bossId === 'boss_malakor') {
      // Twin Siege Warhammers
      const hammerHead = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.38, 0.42), trimMat);
      hammerHead.position.set(dir * 1.62, 2.38, 0.28);
      bodyGroup.add(hammerHead);
    } else if (bossId === 'boss_vespera' || bossId === 'boss_thurible') {
      // Twin Necrotic / Brimstone War-Staves with Floating Orbs
      const staffRing = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.04, 6, 16), goldMat);
      staffRing.position.set(dir * 1.62, 2.45, 0.28);
      bodyGroup.add(staffRing);
      const staffOrb = new THREE.Mesh(new THREE.OctahedronGeometry(0.18, 0), eyeMat);
      staffOrb.position.set(dir * 1.62, 2.45, 0.28);
      bodyGroup.add(staffOrb);
    } else {
      // Twin Royal Warlord Halberds
      const axeBlade = new THREE.Mesh(new THREE.ConeGeometry(0.36, 0.72, 4), trimMat);
      axeBlade.position.set(dir * 1.62, 2.38, 0.28);
      bodyGroup.add(axeBlade);
    }
  }

  // 1b. Boss-Specific Swept Wings / Seraph Pinions (`wingGroup`)
  const wingGroup = new THREE.Group();
  wingGroup.position.set(0, 1.15, -0.55);
  if (bossId === 'boss_hollow_seraph') {
    // 6 Majestic Fallen Seraph Wings fanned out behind the Abyssal War-God
    for (const dir of [-1, 1]) {
      for (let w = 0; w < 3; w++) {
        const seraphWing = new THREE.Mesh(
          new THREE.ConeGeometry(0.24, 1.95 - w * 0.22, 4),
          w % 2 === 0 ? goldMat : trimMat
        );
        seraphWing.position.set(dir * (0.95 + w * 0.42), 0.45 - w * 0.32, -0.1 * w);
        seraphWing.rotation.z = dir * -(0.52 + w * 0.28);
        wingGroup.add(seraphWing);
      }
    }
  } else if (bossId === 'boss_vorn' || bossId === 'boss_carmilla') {
    // Swept Wyrm / Vampiric Pinions
    for (const dir of [-1, 1]) {
      const pinion = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.65, 0.62), trimMat);
      pinion.position.set(dir * 1.18, 0.42, 0);
      pinion.rotation.z = dir * -0.46;
      pinion.rotation.y = dir * 0.28;
      wingGroup.add(pinion);
    }
  }
  bodyGroup.add(wingGroup);

  // 2. Articulated Warlord Head, Great-Helm & Boss-Specific Crown (`headGroup`)
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.72, 0.12);

  const skullHelm = new THREE.Mesh(new THREE.IcosahedronGeometry(0.47, 1), obsidianMat);
  skullHelm.scale.set(0.94, 1.22, 1.04);
  skullHelm.castShadow = true;
  headGroup.add(skullHelm);

  const faceplate = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.28, 0.52, 6), obsidianMat);
  faceplate.position.set(0, -0.05, 0.18);
  headGroup.add(faceplate);

  // Boss-Specific Crown / Helm Silhouette
  if (bossId === 'boss_vespera') {
    // 5-Spire Necromancer Empress Crown
    for (let s = -2; s <= 2; s++) {
      const spire = new THREE.Mesh(
        new THREE.ConeGeometry(0.08, 0.58 - Math.abs(s) * 0.08, 5),
        goldMat
      );
      spire.position.set(s * 0.16, 0.62 - Math.abs(s) * 0.04, 0.05);
      spire.rotation.z = s * -0.12;
      headGroup.add(spire);
    }
  } else if (bossId === 'boss_carmilla') {
    // High Crimson Vampiric Collar & Ruby Tiara
    const tiara = new THREE.Mesh(new THREE.OctahedronGeometry(0.24, 0), trimMat);
    tiara.position.set(0, 0.58, 0.18);
    headGroup.add(tiara);
  } else {
    const hoodCowl = new THREE.Mesh(new THREE.ConeGeometry(0.58, 0.72, 6), trimMat);
    hoodCowl.position.set(0, 0.44, -0.04);
    headGroup.add(hoodCowl);
  }

  // Curved Warlord Horns & Blazing Eyes
  for (const dir of [-1, 1]) {
    const horn = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.68, 6), goldMat);
    horn.position.set(dir * 0.44, 0.4, 0.05);
    horn.rotation.z = dir * -0.48;
    horn.rotation.x = 0.22;
    headGroup.add(horn);

    const eye = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.06, 0.09), eyeMat);
    eye.position.set(dir * 0.15, 0.05, 0.42);
    eye.rotation.z = dir * -0.15;
    headGroup.add(eye);
  }

  // Counter-Rotating Outer & Inner Warlord Halos behind the Commander
  const halo = new THREE.Mesh(new THREE.TorusGeometry(0.94, 0.055, 8, 28), trimMat);
  halo.position.set(0, 0.25, -0.4);
  headGroup.add(halo);

  const innerHalo = new THREE.Mesh(new THREE.TorusGeometry(0.68, 0.035, 8, 24), goldMat);
  innerHalo.position.set(0, 0.25, -0.36);
  headGroup.add(innerHalo);

  group.add(headGroup);
  group.userData = { headGroup, bodyGroup, wingGroup, halo, innerHalo, eyeMat };

  return group;
}
