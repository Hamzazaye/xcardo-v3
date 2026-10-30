/**
 * XcardO — 3D Fantasy War-Table Strategy
 * Checksummed Save, Fantasy Hero Roster & War-Scroll Progression Manager
 */

import { computeSaveChecksum } from './rng.js';

const STORAGE_KEY_PREFIX = 'xcardo_v3_sanctum_slot_';

export class SaveManager {
  constructor(slotIndex = 0) {
    this.slotIndex = slotIndex;
    this.state = this._loadOrDefault(slotIndex);
  }

  _defaultState() {
    return {
      version: 4,
      commanderTitle: 'High Paladin',
      selectedHeroId: 'hero_paladin',
      reliquarySigils: 300,
      highestUnlockedLevel: 1,
      completedLevels: {}, // { [levelNum]: stars (1..3) }
      completedCrypts: {}, // { [cryptId]: true }
      unlockedCards: ['warhammer_penance', 'gargoyle_aegis', 'sanguine_conversion'],
      totalStonesShattered: 0,
      totalMatchesWon: 0,
      totalMatchesPlayed: 0,

      // 3D Sculpted Pieces & PBR Stone Materials
      unlockedSculpts: ['seraph_cross', 'iron_torus'],
      equippedPlayerSculpt: 'seraph_cross',
      equippedEnemySculpt: 'iron_torus',

      unlockedMaterials: ['alabaster_marble', 'blood_obsidian'],
      equippedPlayerMaterial: 'alabaster_marble',
      equippedEnemyMaterial: 'blood_obsidian',

      // Cathedral Hall & Camera Preset (Default: Isometric View)
      equippedHall: 'obsidian_nave',
      cameraPreset: 'high_cathedral',
      cinematicCamera: true,

      // Blood Oaths & Penitence Bell
      unlockedOaths: ['oath_blood_chalice'],
      equippedOaths: ['oath_blood_chalice'],
      equippedBell: 'bell_dies_irae',

      // Exalted [+] War-Scroll Cards & Custom Deck
      upgradedCards: [],
      customDeck: [],

      // Audio
      sfxVolume: 0.85,
      musicVolume: 0.45,
    };
  }

  _storageKey(slot = this.slotIndex) {
    return `${STORAGE_KEY_PREFIX}${slot}`;
  }

  _loadOrDefault(slot = 0) {
    const def = this._defaultState();
    if (typeof localStorage === 'undefined') return def;

    try {
      const raw = localStorage.getItem(this._storageKey(slot));
      if (!raw) return def;
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.data) return def;
      const expected = computeSaveChecksum(parsed.data);
      if (parsed.checksum !== expected) return def;
      const merged = { ...def, ...parsed.data };
      if ((parsed.data.version || 0) < 4) {
        merged.version = 4;
        merged.cameraPreset = 'high_cathedral';
      }
      return merged;
    } catch {
      return def;
    }
  }

  save() {
    if (typeof localStorage === 'undefined') return;
    try {
      const checksum = computeSaveChecksum(this.state);
      localStorage.setItem(
        this._storageKey(this.slotIndex),
        JSON.stringify({ data: this.state, checksum, savedAt: Date.now() })
      );
    } catch {
      // Ignore quota errors in headless mode
    }
  }

  getState() {
    return this.state;
  }

  selectHero(heroId) {
    this.state.selectedHeroId = heroId;
    this.save();
  }

  addReliquarySigils(amount) {
    this.state.reliquarySigils = Math.max(0, (this.state.reliquarySigils || 0) + amount);
    this.save();
  }

  recordStonesShattered(count = 1) {
    this.state.totalStonesShattered = (this.state.totalStonesShattered || 0) + count;
    this.save();
  }

  recordCampaignVictory(levelNumber, stars = 3, sigilReward = 120, cardUnlock = null) {
    this.state.totalMatchesPlayed++;
    this.state.totalMatchesWon++;
    this.state.reliquarySigils += sigilReward;
    const prevStars = this.state.completedLevels[levelNumber] || 0;
    this.state.completedLevels[levelNumber] = Math.max(prevStars, stars);
    if (levelNumber >= this.state.highestUnlockedLevel && levelNumber < 36) {
      this.state.highestUnlockedLevel = levelNumber + 1;
    }
    if (cardUnlock && Array.isArray(this.state.unlockedCards) && !this.state.unlockedCards.includes(cardUnlock)) {
      this.state.unlockedCards.push(cardUnlock);
    }
    this.save();
  }

  recordCryptVictory(cryptId, sigilReward = 150) {
    if (!this.state.completedCrypts[cryptId]) {
      this.state.completedCrypts[cryptId] = true;
      this.state.reliquarySigils += sigilReward;
    }
    this.save();
  }

  recordDefeat() {
    this.state.totalMatchesPlayed++;
    this.state.reliquarySigils += 25;
    this.save();
  }

  unlockCosmetic(listKey, itemId, cost = 0) {
    const list = this.state[listKey];
    if (!Array.isArray(list)) return { ok: false, reason: 'Invalid reliquary category.' };
    if (list.includes(itemId)) return { ok: true };
    if (this.state.reliquarySigils < cost) {
      return { ok: false, reason: `Requires ${cost} Reliquary Sigils.` };
    }
    this.state.reliquarySigils -= cost;
    list.push(itemId);
    this.save();
    return { ok: true };
  }

  equipCosmetic(fieldKey, itemId) {
    this.state[fieldKey] = itemId;
    this.save();
  }

  toggleEquippedOath(oathId) {
    const idx = this.state.equippedOaths.indexOf(oathId);
    if (idx >= 0) {
      if (this.state.equippedOaths.length > 1) {
        this.state.equippedOaths.splice(idx, 1);
      }
    } else {
      if (this.state.equippedOaths.length >= 2) {
        this.state.equippedOaths.shift();
      }
      this.state.equippedOaths.push(oathId);
    }
    this.save();
  }

  exaltArcanaCard(cardId, cost = 150) {
    if (this.state.upgradedCards.includes(cardId)) {
      return { ok: false, reason: 'Scroll is already Exalted [+].' };
    }
    if (this.state.reliquarySigils < cost) {
      return { ok: false, reason: `Requires ${cost} Reliquary Sigils to Exalt.` };
    }
    this.state.reliquarySigils -= cost;
    this.state.upgradedCards.push(cardId);
    this.save();
    return { ok: true };
  }
}
