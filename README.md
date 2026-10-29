# XcardO: Warlords of the Obsidian Altar (Interactive 3D Edition)

**XcardO: Warlords of the Obsidian Altar** is an Interactive 3D Dark-Fantasy War-Table & War-Scroll strategy game built with Three.js (r162) and ES Modules, following the classic **v1 Campaign Rules**.

## Key Pillars

1. **Classic v1 Campaign Progression & In-Battle Shop (`src/engine/game-state.js`)**
   - **Levels 1 & 2 — Pure Tactical Combat (`cardsEnabled === false`)**: No Cards, No Shop, and 0 starting Gold Coins. Master pure stone placement and Sacred Geometry alignments first.
   - **Level 3+ — 3-Slot In-Battle War-Scroll Shop (`cardsEnabled === true`)**: Earn Gold Coins (`+1🪙` per scoring alignment, `+1🪙` every 2 own turns) and spend them during battle in the 3-Slot War-Scroll Shop (with Shop Reroll & Slot Lock). Bought scrolls cast from your Hand for **FREE** (`1 Scroll / Turn`).
   - **Mystery War-Chests & Ticking Siege Bombs**: Crack adjacent Mystery War-Chests (`42% Gold`, `24% Wild Joker`, `15% Ticking Siege Bomb (4T)`, `7% Jackpot`, `12% Bonus Star`).

2. **6 Playable Fantasy War Heroes & 6 Enemy Warlord Commanders (`src/data/gothic-config.js`, `src/ui/gothic-svg.js`)**
   - **Playable Fantasy War Heroes**: *High Paladin Aurelius*, *Shieldmaiden Freya*, *Arch-Warlock Kaelen*, *Dragon-Lord Draven*, *Sylvan Warden Lyra*, and *Runeblade Arthos*.
   - **Enemy Warlords**: *Warlord Malakor the Ironclad*, *Lich-Empress Vespera*, *General Vorn the Wyrm-Breaker*, *Pyromancer Morvain*, *Countess Carmilla*, and *The Abyssal War-God*.

3. **Interactive 3D Fantasy War-Table & Sculpted Miniatures (`src/three/gothic-scene.js`, `src/three/sculptor-3d.js`)**
   - Full-screen 3D WebGL viewport with `PCFSoftShadowMap`, `ACESFilmicToneMapping`, exponential fog, 4 flickering corner fire braziers, and a 3D **Warlord Automaton Statue** whose glowing ocular lenses track board actions in real time.
   - Free mouse-drag orbit & scroll zoom + **4 Camera Angle Presets** + automatic **Cinematic Camera Director** focus.

4. **Real-Time 3D Rigid-Body Stone Shatter & Weapon Impact Physics (`src/three/shatter-physics.js`)**
   - When Champions or Mystery War-Chests are shattered, 28–38 polyhedral 3D stone shards explode outward with gravity (`-28 m/s²`), tumbling angular velocity, war-table bounce restitution, and sliding friction.
