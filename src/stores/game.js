// Bergwerk Idle — Game State (DUMB CLIENT)
// All state comes from SERVER via sync. Client only displays.
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
export const activeAdBoost = writable(null);
export const marketEvent = writable(null);
export const marketEventEnd = writable(0);
export const totalClicks = writable(0);
export const totalUpgradesBought = writable(0);
export const stats = writable({ offlineEarnings: 0, adsWatched: 0, prestiges: 0 });
export const achievementsUnlocked = writable(new Set());
export const displayName = writable(null);
export const hasSetName = writable(false);

export const clickValue = derived(
  [clickPower, clickMultiplier, prestigeMultiplier],
  ([$cp, $cm, $pm]) => $cp * $cm * $pm
);
export const gpsValue = derived(
  [gps, prestigeMultiplier],
  ([$g, $pm]) => $g * $pm
);