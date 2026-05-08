<script>
  import { onMount } from 'svelte';
  import { gold, totalGold, totalGoldAllTime, gps, prestigeMultiplier, clickPower, clickMultiplier, clickValue, gpsValue, totalClicks, totalUpgradesBought, gems, easter1M, easter1B, activeBoost, boostEnd, currentEvent, eventEnd, marketEvent, marketEventEnd, activeAdBoost, stats, achievementsUnlocked } from './stores/game.js';
  import { CLICK_UPGRADES, AUTO_UPGRADES, GEM_UPGRADES, JOBS, STOCKS } from './data/gameData.js';
  import { server, serverOnline, lastSync } from './services/server.js';
  import { generateDeviceId, fmt, cost } from './utils/format.js';
  import Mine from './components/Mine.svelte';
  import Upgrades from './components/Upgrades.svelte';
  import Jobs from './components/Jobs.svelte';
  import Stocks from './components/Stocks.svelte';
  import Leaderboard from './components/Leaderboard.svelte';
  import Prestige from './components/Prestige.svelte';

  let tab = 'mine';
  const tabs = [
    { id: 'mine', icon: '⛏️', label: 'Mine' },
    { id: 'jobs', icon: '🔨', label: 'Jobs' },
    { id: 'stocks', icon: '📈', label: 'Aktien' },
    { id: 'shop', icon: '🛒', label: 'Shop' },
    { id: 'ach', icon: '🏆', label: 'Erfolge' },
    { id: 'lb', icon: '🏅', label: 'Rang' },
    { id: 'prestige', icon: '✨', label: 'Prestige' },
  ];

  let stocksRef;

  // Gold tick (GPS income)
  let goldTick;
  function startGoldTick() {
    goldTick = setInterval(() => {
      const earned = $gpsValue * ($prestigeMultiplier >= 1 ? 1 : 1);
      if (earned > 0) {
        $gold += earned;
        $totalGold += earned;
        $totalGoldAllTime += earned;
      }
    }, 1000);
  }

  // Save to localStorage every 10s
  let saveTick;
  function startSave() {
    saveTick = setInterval(() => {
      localStorage.setItem('bergwerk5', JSON.stringify({
        gold: $gold, totalGold: $totalGold, totalGoldAllTime: $totalGoldAllTime,
        gems: $gems, prestigeMultiplier: $prestigeMultiplier,
        clickPower: $clickPower, clickMultiplier: $clickMultiplier,
        totalClicks: $totalClicks, totalUpgradesBought: $totalUpgradesBought,
        easter1M: $easter1M, easter1B: $easter1B,
        clickCounts: CLICK_UPGRADES.map(u => u.count),
        autoCounts: AUTO_UPGRADES.map(u => u.count),
        gemCounts: GEM_UPGRADES.map(u => u.count),
        achievements: [...$achievementsUnlocked],
        stats: $stats,
        jobCounts: JOBS.map(j => j.count),
        lastSave: Date.now()
      }));
    }, 10000);
  }

  // Load from localStorage
  function loadLocal() {
    const d = localStorage.getItem('bergwerk5');
    if (!d) return;
    try {
      const s = JSON.parse(d);
      if (s.gold) $gold = s.gold;
      if (s.totalGold) $totalGold = s.totalGold;
      if (s.totalGoldAllTime) $totalGoldAllTime = s.totalGoldAllTime;
      if (s.gems) $gems = s.gems;
      if (s.prestigeMultiplier > 1) $prestigeMultiplier = s.prestigeMultiplier;
      if (s.clickPower > 1) $clickPower = s.clickPower;
      if (s.clickMultiplier > 1) $clickMultiplier = s.clickMultiplier;
      if (s.totalClicks) $totalClicks = s.totalClicks;
      if (s.totalUpgradesBought) $totalUpgradesBought = s.totalUpgradesBought;
      if (s.easter1M) $easter1M = true;
      if (s.easter1B) $easter1B = true;
      if (s.clickCounts) s.clickCounts.forEach((c, i) => { if (CLICK_UPGRADES[i]) CLICK_UPGRADES[i].count = c; });
      if (s.autoCounts) s.autoCounts.forEach((c, i) => { if (AUTO_UPGRADES[i]) AUTO_UPGRADES[i].count = c; });
      if (s.gemCounts) s.gemCounts.forEach((c, i) => { if (GEM_UPGRADES[i]) GEM_UPGRADES[i].count = c; });
      if (s.achievements) $achievementsUnlocked = new Set(s.achievements);
      if (s.stats) $stats = { ...$stats, ...s.stats };
      if (s.jobCounts) s.jobCounts.forEach((c, i) => { if (JOBS[i]) JOBS[i].count = c; });
    } catch (e) { console.warn('Load error:', e); }
  }

  // Server sync
  function startSync() {
    const deviceId = generateDeviceId();
    server.init(deviceId);

    // Override sync to load server data into stores
    const origSync = server.sync.bind(server);
    server.sync = async function() {
      const data = await origSync();
      if (data && data.success && data.state) {
        // Only take HIGHER values from server (don't overwrite local progress)
        if (data.state.gold > $gold) $gold = data.state.gold;
        if (data.state.total_gold > $totalGold) $totalGold = data.state.total_gold;
        if (data.state.total_gold_all_time > $totalGoldAllTime) $totalGoldAllTime = data.state.total_gold_all_time;
        if (data.state.gems > $gems) $gems = data.state.gems;
        if (data.state.prestige_multiplier > $prestigeMultiplier) $prestigeMultiplier = data.state.prestige_multiplier;
        if (data.state.click_power > $clickPower) $clickPower = data.state.click_power;
        if (data.state.click_multiplier > $clickMultiplier) $clickMultiplier = data.state.click_multiplier;
        if (data.state.gps > $gps) $gps = data.state.gps;
        if (data.state.total_clicks > $totalClicks) $totalClicks = data.state.total_clicks;
        if (data.state.total_upgrades_bought > $totalUpgradesBought) $totalUpgradesBought = data.state.total_upgrades_bought;
        if (data.state.easter_1m) $easter1M = true;
        if (data.state.easter_1b) $easter1B = true;

        // Upgrades (take max)
        if (data.upgrades && data.upgrades.length > 0) {
          data.upgrades.forEach(u => {
            const lists = { click: CLICK_UPGRADES, auto: AUTO_UPGRADES, gem: GEM_UPGRADES };
            const list = lists[u.upgrade_type];
            if (list && list[u.upgrade_index]) {
              list[u.upgrade_index].count = Math.max(list[u.upgrade_index].count, u.count);
            }
          });
        }

        // Jobs (take max)
        if (data.jobs && data.jobs.length > 0) {
          data.jobs.forEach(j => { if (JOBS[j.job_index]) JOBS[j.job_index].count = Math.max(JOBS[j.job_index].count, j.count); });
        }

        // Stock holdings + prices
        if (stocksRef) {
          stocksRef.loadServerHoldings(data.stocks);
          stocksRef.loadServerPrices(data.stock_prices);
        }

        // Achievements
        if (data.achievements && data.achievements.length > 0) {
          data.achievements.forEach(a => $achievementsUnlocked.add(a.achievement_id));
        }

        // Push local state up
        server.push({
          gold: $gold, total_gold: $totalGold, total_gold_all_time: $totalGoldAllTime,
          gems: $gems, prestige_multiplier: $prestigeMultiplier,
          click_power: $clickPower, click_multiplier: $clickMultiplier,
          gps: $gps, total_clicks: $totalClicks, total_upgrades_bought: $totalUpgradesBought,
          easter_1m: $easter1M, easter_1b: $easter1B, gold_actions: 0,
          upgrades: [
            ...CLICK_UPGRADES.map((u, i) => ({ type: 'click', index: i, count: u.count })),
            ...AUTO_UPGRADES.map((u, i) => ({ type: 'auto', index: i, count: u.count })),
          ],
          jobs: JOBS.map((j, i) => ({ index: i, count: j.count })),
          stocks: STOCKS.map((s, i) => ({ index: i, shares: 0, avg_buy: 0 })),
          achievements: [...$achievementsUnlocked]
        });
      }
    };
  }

  // Achievement checker
  function checkAchievements() {
    const state = {
      totalClicks: $totalClicks, totalGoldAllTime: $totalGoldAllTime,
      gps: $gps, prestigeMultiplier: $prestigeMultiplier,
      totalUpgradesBought: $totalUpgradesBought,
      totalShares: 0 // TODO: from stocks
    };
    ACHIEVEMENTS?.forEach(a => {
      if (!$achievementsUnlocked.has(a.id) && a.check(state)) {
        $achievementsUnlocked.add(a.id);
      }
    });
  }

  onMount(() => {
    loadLocal();
    startGoldTick();
    startSave();
    startSync();

    // Achievement check every 5s
    setInterval(checkAchievements, 5000);

    // Offline earnings
    const saved = JSON.parse(localStorage.getItem('bergwerk5') || '{}');
    if (saved.lastSave) {
      const elapsed = (Date.now() - saved.lastSave) / 1000;
      if (elapsed > 30 && $gps > 0) {
        const eff = Math.min(1, 0.5 + GEM_UPGRADES[2].count * 0.2);
        const earned = $gps * $prestigeMultiplier * elapsed * eff;
        $gold += earned;
        $totalGold += earned;
        $totalGoldAllTime += earned;
      }
    }
  });
</script>

<main>
  <header>
    <h1>⛏️ Bergwerk Idle</h1>
    <div class="header-stats">
      <span>🪙 {fmt($gold)}</span>
      <span>⚡ {fmt($gpsValue)}/s</span>
      {#if !$serverOnline}<span class="offline">📵</span>{/if}
    </div>
  </header>

  <!-- Tab Content -->
  <div class="content">
    {#if tab === 'mine'}
      <Mine />
    {:else if tab === 'jobs'}
      <Jobs />
    {:else if tab === 'stocks'}
      <Stocks bind:this={stocksRef} />
    {:else if tab === 'shop'}
      <Upgrades />
    {:else if tab === 'ach'}
      <div class="achievements-panel">
        {#each ACHIEVEMENTS as a}
          {@const unlocked = $achievementsUnlocked.has(a.id)}
          <div class="achievement" class:locked={!unlocked}>
            <span class="ach-icon">{unlocked ? a.icon : '🔒'}</span>
            <div class="ach-info">
              <div class="ach-name">{unlocked ? a.name : '???'}</div>
              <div class="ach-tip">{a.tip}</div>
            </div>
          </div>
        {/each}
      </div>
    {:else if tab === 'lb'}
      <Leaderboard />
    {:else if tab === 'prestige'}
      <Prestige />
    {/if}
  </div>

  <!-- Tab Bar -->
  <nav class="tab-bar-bottom">
    {#each tabs as t}
      <button class="tab" class:active={tab===t.id} on:click={()=>tab=t.id}>
        <span class="tab-icon">{t.icon}</span>
        <span class="tab-label">{t.label}</span>
      </button>
    {/each}
  </nav>
</main>