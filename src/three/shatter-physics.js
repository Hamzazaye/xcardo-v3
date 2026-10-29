/**
 * XcardO: Warlords of the Obsidian Altar
 * Real-Time 3D Rigid-Body Stone Shatter & Weapon Impact Physics Engine
 */

import * as THREE from '../vendor/three.module.js';

export class StoneShatterPhysics {
  constructor(sceneGroup, options = {}) {
    this.root = new THREE.Group();
    this.root.name = 'StoneShatterPhysicsGroup';
    if (sceneGroup) {
      sceneGroup.add(this.root);
    }

    this.gravity = options.gravity ?? -32.0;
    this.floorY = options.floorY ?? 0.04;
    this.altarHalfExtent = options.altarHalfExtent ?? 4.2;

    this.shards = [];
    this.shockwaves = [];
    this.projectiles = [];

    // Pre-built shared fracture geometries for zero GC stutter during heavy shatters
    this._shardGeos = [
      new THREE.TetrahedronGeometry(0.13, 0),
      new THREE.DodecahedronGeometry(0.11, 0),
      new THREE.OctahedronGeometry(0.12, 0),
    ];
  }

  setAltarExtent(halfExtent) {
    this.altarHalfExtent = halfExtent;
  }

  /**
   * Spawn a 3D Rigid-Body Stone Shatter Explosion at `worldPos` ({ x, y, z })
   */
  spawnStoneShatter(worldPos, options = {}) {
    const count = options.shardCount || 28;
    const intensity = options.intensity || 1.25;
    const primaryColor = options.primaryColor || 0xd6d1c4;
    const accentColor = options.accentColor || 0xf59e0b;
    const emissiveColor = options.emissiveColor || 0x991b1b;

    const stoneMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(primaryColor),
      roughness: 0.58,
      metalness: 0.25,
      flatShading: true,
      transparent: true,
      opacity: 1.0,
    });

    const veinMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(accentColor),
      emissive: new THREE.Color(emissiveColor),
      emissiveIntensity: 1.2,
      roughness: 0.3,
      metalness: 0.72,
      flatShading: true,
      transparent: true,
      opacity: 1.0,
    });

    for (let i = 0; i < count; i++) {
      const geo = this._shardGeos[i % this._shardGeos.length];
      const isVeinShard = i % 4 === 0;
      const mesh = new THREE.Mesh(geo, isVeinShard ? veinMat.clone() : stoneMat.clone());

      // Non-uniform jagged fracture scaling
      const sx = 0.55 + Math.random() * 1.15;
      const sy = 0.4 + Math.random() * 1.05;
      const sz = 0.5 + Math.random() * 1.1;
      mesh.scale.set(sx, sy, sz);

      const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.45;
      const radialOffset = 0.06 + Math.random() * 0.22;

      mesh.position.set(
        worldPos.x + Math.cos(angle) * radialOffset,
        (worldPos.y ?? 0.38) + Math.random() * 0.35,
        worldPos.z + Math.sin(angle) * radialOffset
      );

      mesh.rotation.set(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
      );
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      const horizontalSpeed = (1.4 + Math.random() * 2.8) * intensity;
      const upwardSpeed = (2.2 + Math.random() * 3.2) * intensity;

      const shard = {
        mesh,
        vx: Math.cos(angle) * horizontalSpeed,
        vy: upwardSpeed,
        vz: Math.sin(angle) * horizontalSpeed,
        avx: (Math.random() - 0.5) * 18 * intensity,
        avy: (Math.random() - 0.5) * 18 * intensity,
        avz: (Math.random() - 0.5) * 18 * intensity,
        restitution: 0.34 + Math.random() * 0.2,
        friction: 0.76 + Math.random() * 0.1,
        bounces: 0,
        age: 0,
        maxLife: 1.9 + Math.random() * 0.9,
        radius: 0.06 * sy,
      };

      this.root.add(mesh);
      this.shards.push(shard);
    }

    // Spawn Expanding 3D Altar Shockwave Ring
    this.spawnShockwaveRing(worldPos, accentColor, intensity);
  }

  /**
   * Spawn an expanding 3D shockwave ring on the altar surface (used for both piece slams & shatters)
   */
  spawnShockwaveRing(worldPos, colorHex = 0xf59e0b, intensity = 1.0) {
    const ringGeo = new THREE.RingGeometry(0.18, 0.32, 24);
    const ringMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(colorHex),
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.88,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = -Math.PI / 2;
    ringMesh.position.set(worldPos.x, 0.035, worldPos.z);

    this.root.add(ringMesh);
    this.shockwaves.push({
      mesh: ringMesh,
      age: 0,
      maxLife: 0.55,
      maxScale: 2.6 * intensity,
    });
  }

  /**
   * Spawn a 3D Descending Weapon Projectile (Warhammer, Guillotine Blade, or Brimstone Meteor)
   */
  spawnWeaponImpact(worldPos, weaponType = 'warhammer') {
    const group = new THREE.Group();
    group.position.set(worldPos.x, 5.2, worldPos.z);

    if (weaponType === 'guillotine_row' || weaponType === 'guillotine_col') {
      const bladeMat = new THREE.MeshStandardMaterial({
        color: 0xd4d4d8,
        roughness: 0.22,
        metalness: 0.92,
        emissive: 0x991b1b,
        emissiveIntensity: 0.5,
      });
      const blade = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.9, 0.08), bladeMat);
      if (weaponType === 'guillotine_col') {
        blade.rotation.y = Math.PI / 2;
      }
      group.add(blade);
    } else if (weaponType === 'brimstone_meteor') {
      const meteorMat = new THREE.MeshStandardMaterial({
        color: 0xf43f5e,
        emissive: 0xe11d48,
        emissiveIntensity: 2.2,
        roughness: 0.35,
        flatShading: true,
      });
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.65, 1), meteorMat);
      group.add(rock);
    } else {
      // Gilded Iron Warhammer of Penance
      const metalMat = new THREE.MeshStandardMaterial({
        color: 0xd4a853,
        roughness: 0.28,
        metalness: 0.85,
        emissive: 0xb45309,
        emissiveIntensity: 0.45,
      });
      const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.8, 8), metalMat);
      handle.position.y = 0.9;
      group.add(handle);

      const head = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.42, 0.42), metalMat);
      head.position.y = 0.2;
      group.add(head);
    }

    this.root.add(group);
    this.projectiles.push({
      mesh: group,
      targetY: 0.25,
      vy: -26.0,
      age: 0,
      maxLife: 0.55,
      impacted: false,
    });
  }

  /**
   * Advance all active rigid-body stone shards, weapon projectiles, and shockwaves by `dt` seconds
   */
  step(dt) {
    const clampedDt = Math.min(dt, 0.05);

    // 1. Step Rigid-Body Stone Shards
    for (let i = this.shards.length - 1; i >= 0; i--) {
      const s = this.shards[i];
      s.age += clampedDt;

      if (s.age >= s.maxLife) {
        this.root.remove(s.mesh);
        if (s.mesh.material) s.mesh.material.dispose();
        this.shards.splice(i, 1);
        continue;
      }

      // Apply gravitational acceleration
      s.vy += this.gravity * clampedDt;

      // Integrate linear position
      s.mesh.position.x += s.vx * clampedDt;
      s.mesh.position.y += s.vy * clampedDt;
      s.mesh.position.z += s.vz * clampedDt;

      // Integrate tumbling angular rotation
      s.mesh.rotation.x += s.avx * clampedDt;
      s.mesh.rotation.y += s.avy * clampedDt;
      s.mesh.rotation.z += s.avz * clampedDt;

      // Check if shard is still over the Cathedral Altar surface
      const onAltarSurface =
        Math.abs(s.mesh.position.x) <= this.altarHalfExtent &&
        Math.abs(s.mesh.position.z) <= this.altarHalfExtent;

      if (onAltarSurface && s.mesh.position.y <= this.floorY + s.radius) {
        s.mesh.position.y = this.floorY + s.radius;
        if (s.vy < 0) {
          s.vy = -s.vy * s.restitution;
          s.vx *= s.friction;
          s.vz *= s.friction;
          s.avx *= 0.68;
          s.avy *= 0.68;
          s.avz *= 0.68;
          s.bounces++;
          if (Math.abs(s.vy) < 0.45) {
            s.vy = 0;
          }
        }
      }

      // Smooth fade-out during the final 30% of life
      const lifeRatio = s.age / s.maxLife;
      if (lifeRatio > 0.7 && s.mesh.material) {
        s.mesh.material.opacity = Math.max(0, 1 - (lifeRatio - 0.7) / 0.3);
      }
    }

    // 2. Step Expanding Shockwave Rings
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.age += clampedDt;
      if (sw.age >= sw.maxLife) {
        this.root.remove(sw.mesh);
        sw.mesh.geometry.dispose();
        sw.mesh.material.dispose();
        this.shockwaves.splice(i, 1);
        continue;
      }
      const p = sw.age / sw.maxLife;
      const scale = 0.4 + (sw.maxScale - 0.4) * (1 - Math.pow(1 - p, 3));
      sw.mesh.scale.set(scale, scale, 1);
      sw.mesh.material.opacity = (1 - p) * 0.85;
    }

    // 3. Step Descending Weapon Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      proj.age += clampedDt;
      if (proj.age >= proj.maxLife) {
        this.root.remove(proj.mesh);
        this.projectiles.splice(i, 1);
        continue;
      }
      if (!proj.impacted) {
        proj.mesh.position.y += proj.vy * clampedDt;
        if (proj.mesh.position.y <= proj.targetY) {
          proj.mesh.position.y = proj.targetY;
          proj.impacted = true;
        }
      } else {
        proj.mesh.position.y += 1.2 * clampedDt;
        const fade = Math.max(0, 1 - (proj.age - 0.2) / 0.35);
        proj.mesh.scale.setScalar(fade);
      }
    }
  }

  clearAll() {
    while (this.shards.length > 0) {
      const s = this.shards.pop();
      this.root.remove(s.mesh);
    }
    while (this.shockwaves.length > 0) {
      const sw = this.shockwaves.pop();
      this.root.remove(sw.mesh);
    }
    while (this.projectiles.length > 0) {
      const p = this.projectiles.pop();
      this.root.remove(p.mesh);
    }
  }
}
