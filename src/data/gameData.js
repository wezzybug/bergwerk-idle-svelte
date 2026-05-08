// Bergwerk Idle — Upgrade Data
export const CLICK_UPGRADES = [
  { id:'pick', name:'⚒️ Spitzhacke+', desc:'+1 Klick', base:15, mult:1.55, power:1, count:0 },
  { id:'gloves', name:'🧤 Handschuhe', desc:'+3 Klick', base:120, mult:1.55, power:3, count:0 },
  { id:'hammer', name:'🔨 Hammer', desc:'+10 Klick', base:1e3, mult:1.55, power:10, count:0 },
  { id:'dynamite', name:'🧨 Dynamit', desc:'+40 Klick', base:8e3, mult:1.55, power:40, count:0 },
  { id:'magic', name:'🪄 Magie-Pick', desc:'+200 Klick', base:75e3, mult:1.55, power:200, count:0 },
  { id:'titan', name:'⚡ Titan-Schlag', desc:'+1K Klick', base:6e5, mult:1.55, power:1e3, count:0 },
];

export const AUTO_UPGRADES = [
  { id:'miner', name:'⛏️ Bergarbeiter', desc:'+1 Gold/s', base:25, mult:1.45, gps:1, count:0 },
  { id:'cart', name:'🛒 Lore', desc:'+5 Gold/s', base:200, mult:1.45, gps:5, count:0 },
  { id:'drill', name:'🔧 Bohrer', desc:'+20 Gold/s', base:1.2e3, mult:1.45, gps:20, count:0 },
  { id:'dwarf', name:'🧔 Zwerg', desc:'+80 Gold/s', base:8e3, mult:1.45, gps:80, count:0 },
  { id:'dragon', name:'🐉 Drache', desc:'+350 Gold/s', base:6e4, mult:1.45, gps:350, count:0 },
  { id:'portal', name:'🌀 Portal', desc:'+1.5K Gold/s', base:5e5, mult:1.45, gps:1500, count:0 },
  { id:'reactor', name:'⚛️ Reaktor', desc:'+7K Gold/s', base:4e6, mult:1.45, gps:7000, count:0 },
  { id:'factory', name:'🏭 Fabrik', desc:'+30K Gold/s', base:3.5e7, mult:1.45, gps:30000, count:0 },
  { id:'titanium', name:'💠 Titan-Mine', desc:'+150K Gold/s', base:3e8, mult:1.45, gps:150000, count:0 },
];

export const GEM_UPGRADES = [
  { id:'gemClick', name:'💎 Klick-Multi', desc:'+50% Klick', base:1, mult:2, max:10, count:0 },
  { id:'gemGps', name:'💎 GPS-Multi', desc:'+50% GPS', base:1, mult:2, max:10, count:0 },
  { id:'gemOffline', name:'💎 Offline-Eff', desc:'+20% Offline', base:2, mult:2, max:5, count:0 },
  { id:'gemLuck', name:'💎 Glück', desc:'+Events', base:3, mult:2, max:5, count:0 },
];

export const JOBS = [
  { id:'sweep', name:'🧹 Schacht fegen', desc:'10s Schicht', duration:10, reward:30, multReward:true, count:0, cooldown:5 },
  { id:'haul', name:'🛒 Erz transportieren', desc:'30s Schicht', duration:30, reward:150, multReward:true, count:0, cooldown:10 },
  { id:'explore', name:'🔦 Tiefe Erkundung', desc:'60s Schicht', duration:60, reward:600, multReward:true, count:0, cooldown:15 },
  { id:'boss', name:'👑 Boss-Kampf', desc:'120s Schicht', duration:120, reward:2500, multReward:true, count:0, cooldown:20 },
  { id:'blast', name:'🧨 Sprengung', desc:'240s Schicht', duration:240, reward:10000, multReward:true, count:0, cooldown:30 },
  { id:'excavate', name:'⛏️ Ausgrabung', desc:'600s Schicht', duration:600, reward:50000, multReward:true, count:0, cooldown:60 },
];

export const STOCKS = [
  { id:'goldmine', name:'⛏️ Goldmine AG', basePrice:80, volatility:0.08, dividend:0.001 },
  { id:'coalpit', name:'🪨 Kohlewerk GmbH', basePrice:40, volatility:0.06, dividend:0.002 },
  { id:'deepcore', name:'💎 DeepCore Inc.', basePrice:300, volatility:0.12, dividend:0.0008 },
  { id:'irontusk', name:'🔩 Eisenhuf Corp.', basePrice:150, volatility:0.10, dividend:0.0015 },
  { id:'dragon', name:'🐉 DragonSteel', basePrice:1200, volatility:0.18, dividend:0.0005 },
  { id:'portal', name:'🌀 PortalTech', basePrice:5000, volatility:0.25, dividend:0.0003 },
  { id:'void', name:'🕳️ VoidEnergy', basePrice:20000, volatility:0.30, dividend:0.0002 },
  { id:'quantum', name:'⚛️ QuantumMine', basePrice:80000, volatility:0.40, dividend:0.0001 },
];

export const STOCK_FEE = 0.05;

export const ACHIEVEMENTS = [
  { id:'click10', name:'Erste Schritte', icon:'👆', tip:'10 Klicks', check:s=>s.totalClicks>=10 },
  { id:'click100', name:'Fleißig', icon:'💪', tip:'100 Klicks', check:s=>s.totalClicks>=100 },
  { id:'click1k', name:'Klick-Maschine', icon:'🤖', tip:'1K Klicks', check:s=>s.totalClicks>=1e3 },
  { id:'click10k', name:'Klick-Legende', icon:'🖱️', tip:'10K Klicks', check:s=>s.totalClicks>=1e4 },
  { id:'gold1k', name:'Kleines Vermögen', icon:'🪙', tip:'1K Gold gesamt', check:s=>s.totalGoldAllTime>=1e3 },
  { id:'gold1m', name:'Millionär', icon:'💰', tip:'1M Gold gesamt', check:s=>s.totalGoldAllTime>=1e6 },
  { id:'gold10m', name:'Großvermögen', icon:'🏦', tip:'10M Gold gesamt', check:s=>s.totalGoldAllTime>=1e7 },
  { id:'gold1b', name:'Milliardär', icon:'👑', tip:'1B Gold gesamt', check:s=>s.totalGoldAllTime>=1e9 },
  { id:'gold1t', name:'Billionär', icon:'🌍', tip:'1T Gold gesamt', check:s=>s.totalGoldAllTime>=1e12 },
  { id:'gps100', name:'Goldfieber', icon:'⏱️', tip:'100 Gold/s', check:s=>s.gps>=100 },
  { id:'gps1k', name:'Gold-Strom', icon:'⚡', tip:'1K Gold/s', check:s=>s.gps>=1e3 },
  { id:'gps10k', name:'Gold-Wasserfall', icon:'🌊', tip:'10K Gold/s', check:s=>s.gps>=1e4 },
  { id:'prestige1', name:'Wiedergeburt', icon:'✨', tip:'1x Prestige', check:s=>s.prestigeMultiplier>1 },
  { id:'stockDiv', name:'Dividendenkönig', icon:'💸', tip:'100 Aktien', check:s=>s.totalShares>=100 },
  { id:'upgrade50', name:'Upgrader', icon:'🔧', tip:'50 Upgrades', check:s=>s.totalUpgradesBought>=50 },
];