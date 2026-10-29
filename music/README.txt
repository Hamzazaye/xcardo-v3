How to add Custom Music to Xcardo
==================================

Drop MP3 files into the folders below. The engine picks them up automatically.

Quick Start
-----------
1. Put 9 battle tracks in music/battle/
2. Put 5 boss tracks + 1 secret boss track in music/boss/
3. Put menu/victory/defeat in music/ root
4. Done! Refresh the game.

Folder Structure
----------------
music/
  │
  ├── menu_theme.mp3            ← Main menu loop
  ├── victory_1star.mp3         ← Win 1-star stinger (no loop)
  ├── victory_2star.mp3         ← Win 2-star stinger (no loop)
  ├── victory_3star.mp3         ← Win 3-star stinger (no loop)
  ├── defeat.mp3                ← Loss stinger (no loop)
  │
  ├── battle/                   ← Shared battle tracks (same in every world)
  │   ├── level_1.mp3           ← World opener (levels 1, 11, 21, 31, 41)
  │   ├── level_2.mp3           ← Second level (levels 2, 12, 22, 32, 42)
  │   ├── level_3.mp3           ← (levels 3, 13, 23, 33, 43)
  │   ├── level_4.mp3           ← (levels 4, 14, 24, 34, 44)
  │   ├── level_5.mp3           ← Crazy-mode levels (levels 5, 15, 25, 35, 45)
  │   ├── level_6.mp3           ← (levels 6, 16, 26, 36, 46)
  │   ├── level_7.mp3           ← (levels 7, 17, 27, 37, 47)
  │   ├── level_8.mp3           ← Earthquake levels (levels 8, 18, 28, 38, 48)
  │   └── level_9.mp3           ← Pre-boss tension (levels 9, 19, 29, 39, 49)
  │
  └── boss/                     ← Unique boss tracks (one per world + secret)
      ├── world_1.mp3           ← World 1 boss (level 10) + Chaos Arena W1
      ├── world_2.mp3           ← World 2 boss (level 20) + Chaos Arena W2
      ├── world_3.mp3           ← World 3 boss (level 30) + Chaos Arena W3
      ├── world_4.mp3           ← World 4 boss (level 40) + Chaos Arena W4
      ├── world_5.mp3           ← World 5 boss (level 50) + Chaos Arena W5
      └── confinement.mp3       ← SECRET: Level 51 — Area 51 boss

How Mapping Works
-----------------
The game has 51 campaign levels across 5 worlds (10 levels each) + 1 secret boss.
Level N in each world plays the SAME battle track:

  Level position in world    File
  ───────────────────────    ─────────────────────
  1st  (1, 11, 21, 31, 41)  battle/level_1.mp3
  2nd  (2, 12, 22, 32, 42)  battle/level_2.mp3
  3rd  (3, 13, 23, 33, 43)  battle/level_3.mp3
  4th  (4, 14, 24, 34, 44)  battle/level_4.mp3
  5th  (5, 15, 25, 35, 45)  battle/level_5.mp3
  6th  (6, 16, 26, 36, 46)  battle/level_6.mp3
  7th  (7, 17, 27, 37, 47)  battle/level_7.mp3
  8th  (8, 18, 28, 38, 48)  battle/level_8.mp3
  9th  (9, 19, 29, 39, 49)  battle/level_9.mp3
  10th (10, 20, 30, 40, 50)  boss/world_N.mp3

Special Modes
─────────────
  Chaos Arena challenge     →  boss track of that challenge's world
  Mixed Arena               →  random boss track
  Level 51 (Area 51)        →  boss/confinement.mp3
  Menu screen               →  menu_theme.mp3
  Victory screen            →  victory.mp3 (plays once)
  Defeat screen             →  defeat.mp3 (plays once)

Track Player (Relax Mode)
─────────────────────────
All 9 battle tracks are unlocked by default in the track player.
Boss tracks unlock when you beat that world's boss level.
Confinement track unlocks when you beat Level 51.

Audio Specs
-----------
• Format: MP3 (128–192 kbps for web)
• Looping: All tracks loop EXCEPT victory.mp3 and defeat.mp3
• Size: Target under 20 MB total for all 18 tracks
• Clean loops: No silence at start/end of looping tracks
• Fade handling: The engine handles crossfade automatically
