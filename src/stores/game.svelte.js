// Bergwerk Idle — Game State (Svelte 5 Runes)
// Using Svelte 5 $state and $derived runes

let gold = $state(0);
let totalGold = $state(0);
let totalGoldAllTime = $state(0);
let gps = $state(0);
let clickPower = $state(1);
let clickMultiplier = $state(1);
let gems = $state(0);
let prestigeMultiplier = $state(1);
let easter1M = $state(false);
let easter1B = $state(false);

// Boosts
let activeBoost = $state(null);
let boostEnd = $state(0);

// Events
let currentEvent = $state(null);
let eventEnd = $state(0);
let marketEvent = $state(null);
let marketEventEnd = $state(0);
let activeAdBoost = $state(null);

// Stats
let totalClicks = $state(0);
let totalUpgradesBought = $state(0);
let stats = $state({ offlineEarnings: 0, adsWatched: 0, prestiges: 0 });

// Achievements
let achievementsUnlocked = $state(new Set());

// Derived
let clickValue = $derived(clickPower * clickMultiplier * prestigeMultiplier);
let gpsValue = $derived(gps * prestigeMultiplier);

export {
  gold, totalGold, totalGoldAllTime, gps, clickPower, clickMultiplier,
  gems, prestigeMultiplier, easter1M, easter1B,
  activeBoost, boostEnd,
  currentEvent, eventEnd, marketEvent, marketEventEnd, activeAdBoost,
  totalClicks, totalUpgradesBought, stats, achievementsUnlocked,
  clickValue, gpsValue
};