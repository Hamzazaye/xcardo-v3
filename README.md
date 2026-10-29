# XcardO III: Obsidian Sanctum (Interactive 3D Gothic Edition)

**XcardO III: Obsidian Sanctum** is a ground-up Interactive 3D Gothic WebGL tabletop & Dark-Tarot card strategy game built with Three.js (r162) and ES Modules.

## Key Pillars

1. **Interactive 3D Gothic Cathedral Altar (`src/three/gothic-scene.js`)**
   - Full-screen 3D WebGL viewport with `PCFSoftShadowMap`, `ACESFilmicToneMapping`, exponential gothic fog, 4 flickering corner fire braziers, and a 3D **Inquisitor Automaton** whose glowing ocular lenses track board actions in real time.
   - Free mouse-drag orbit & scroll zoom + **4 Camera Angle Presets** (`Commander's Vigil`, `High Cathedral Isometric`, `Dramatic Low Altar`, `Belfry Zenith`) + automatic **Cinematic Camera Director** dolly on Sacred Geometry alignments and Arcana blasts.

2. **6 Procedural 3D Sculpted Piece Archetypes & 6 PBR Stone Materials (`src/three/sculptor-3d.js`)**
   - **Order of the Rose (`X`)**: *Seraphic Cross*, *Templar Great-Helm*, *Gargoyle Sentinel*.
   - **Inquisition Automaton (`O`)**: *Spiked Iron Torus*, *Memento Mori Skull*, *Abyssal Obelisk*.
   - **6 PBR Finishes**: *Alabaster Veined Marble*, *Sanguine Obsidian*, *Gilded Reliquary Brass*, *Weathered Crypt Basalt*, *Nocturnal Amethyst*, and *Verdigris Cathedral Bronze*.

3. **Real-Time 3D Rigid-Body Stone Shatter & Weapon Impact Physics (`src/three/shatter-physics.js`)**
   - When pieces or Reliquary Coffers are shattered by *Warhammer of Penance*, *Inquisitor's Guillotine*, *Cruciform Lance*, *Brimstone Cataclysm*, or *Cursed Censers*, 28–38 polyhedral 3D stone shards explode outward with gravity (`-28 m/s²`), tumbling angular velocity, altar table bounce restitution, and sliding friction.

4. **Single-Player Inquisitor AI & 36-Consecration Gothic Campaign (`src/engine/`)**
   - 6-tier Single-Player AI (*Acolyte*, *Deacon*, *Canon*, *Prior*, *Grand Inquisitor*, *Hollow Seraph*).
   - 36 Campaign Consecrations across 6 Cathedral Acts with 6 Arch-Inquisitor Bosses, plus 5 handcrafted 1-turn **Crypt Trials** and 20 **Dark-Tarot Arcana Scripts** with Exalted `[+]` upgrades.
