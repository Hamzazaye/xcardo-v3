/**
 * XcardO — Warlords of the Obsidian Altar
 * Application Bootstrapper (3D WebGL Fantasy War-Table + Single-Player AI + Audio + HUD)
 */

import { EventBus } from './core/event-bus.js';
import { SaveManager } from './core/save-manager.js';
import { GothicScene3D } from './three/gothic-scene.js';
import { GothicSoundEngine } from './audio/sound-engine.js';
import { AppController } from './ui/app-controller.js';

export function bootstrapXcardoV3() {
  const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const eventBus = new EventBus();
  const saveManager = new SaveManager();
  const soundEngine = new GothicSoundEngine(saveManager);

  const canvasEl = document.getElementById('gothic-3d-canvas');
  const rootEl = document.getElementById('app-root');

  const scene3d = new GothicScene3D(canvasEl, eventBus, saveManager);
  const app = new AppController({
    rootEl,
    eventBus,
    saveManager,
    scene3d,
    soundEngine,
  });

  if (typeof window !== 'undefined') {
    const t1 = typeof performance !== 'undefined' ? performance.now() : Date.now();
    window.__XCARDO_BOOT_MS__ = Math.max(1, Math.round(t1 - t0));
    window.__XCARDO_V3__ = { eventBus, saveManager, scene3d, soundEngine, app };
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(() => {});
      });
    }
  }

  return { eventBus, saveManager, scene3d, soundEngine, app };
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrapXcardoV3);
  } else {
    bootstrapXcardoV3();
  }
}
