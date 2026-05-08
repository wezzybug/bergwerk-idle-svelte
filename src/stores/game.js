// Bergwerk Idle — Game State Store
import { writable, derived } from 'svelte/store';

// Core State
export const gold = writable(0);
export const totalGold = writable(0);
export const totalGoldAllTime = writable(0);
export const gps = writable(0);
export const clickPower = writable(1);
export const clickMultiplier = writable(1);
export const gems = writable(0);
export const prestigeMultiplier = writable(1);
export const totalClicks = writable(0);
export const totalUpgradesBought = writable(0);
export const easter1M = writable(false);
export const easter1B = writable(false);

// Boosts & Events
export const activeBoost = writable(null);
export const boostEnd = writable(0);
export const currentEvent = writable(null);
export const eventEnd = writable(0);

// Ad Boost
export const activeAdBoost = writable(null);

// Market Event
export const marketEvent = writable(null);
export const marketEventEnd = writable(0);

// Stats
export const stats = writable({
  eventsSeen: 0, boostsUsed: 0, jobsDone: 0, stocksTraded: 0, marketCrashes: 0
});

// Achievements
export const achievementsUnlocked = writable(new Set());

// Derived
export const clickValue = derived(
  [clickPower, clickMultiplier, prestigeMultiplier, activeBoost, activeAdBoost],
  ([$cp, $cm, $pm, $ab, $aab]) => {
    let v = $cp * $cm * $pm;
    if ($ab === 'click') v *= 2;
    if ($aab?.type === 'click') v *= 2;
    return Math.max(1, Math.floor(v));
  }
);

export const gpsValue = derived(
  [gps, prestigeMultiplier, activeBoost, activeAdBoost],
  ([$g, $pm, $ab, $aab]) => {
    let v = $g * $pm;
    if ($ab === 'auto') v *= 2;
    if ($ab === 'gold') v *= 3;
    if ($aab?.type === 'gps') v *= 2;
    return Math.max(0, v);
  }
);