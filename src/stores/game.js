// Bergwerk Idle — Game State (Svelte Stores — compatible with Svelte 5)
import { writable, derived } from 'svelte/store';

export const gold = writable(0);
export const totalGold = writable(0);
export const totalGoldAllTime = writable(0);
export const gps = writable(0);
export const clickPower = writable(1);
export const clickMultiplier = writable(1);
export const gems = writable(0);
export const prestigeMultiplier = writable(1);
export const easter1M = writable(false);
export const easter1B = writable(false);

export const activeBoost = writable(null);
export const boostEnd = writable(0);

export const currentEvent = writable(null);
export const eventEnd = writable(0);
export const marketEvent = writable(null);
export const marketEventEnd = writable(0);
export const activeAdBoost = writable(null);

export const totalClicks = writable(0);
export const totalUpgradesBought = writable(0);
export const stats = writable({ offlineEarnings: 0, adsWatched: 0, prestiges: 0 });
export const achievementsUnlocked = writable(new Set());

export const clickValue = derived(
  [clickPower, clickMultiplier, prestigeMultiplier],
  ([$cp, $cm, $pm]) => $cp * $cm * $pm
);
export const gpsValue = derived(
  [gps, prestigeMultiplier],
  ([$g, $pm]) => $g * $pm
);