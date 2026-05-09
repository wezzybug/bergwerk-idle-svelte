<script>
  import { onMount } from 'svelte';
  import { gold, totalGold, totalGoldAllTime, gps, prestigeMultiplier, clickPower, clickMultiplier, clickValue, gpsValue, totalClicks, totalUpgradesBought, gems, easter1M, easter1B, activeBoost, boostEnd, activeAdBoost, marketEvent, marketEventEnd, stats, achievementsUnlocked, displayName, hasSetName } from './stores/game.js';
  import { CLICK_UPGRADES, AUTO_UPGRADES, GEM_UPGRADES, JOBS, STOCKS, ACHIEVEMENTS } from './data/gameData.js';
  import { server, serverOnline } from './services/server.js';
  import { generateDeviceId, fmt } from './utils/format.js';
  import Mine from './components/Mine.svelte';
  import Upgrades from './components/Upgrades.svelte';
  import Jobs from './components/Jobs.svelte';
  import Stocks from './components/Stocks.svelte';
  import Leaderboard from './components/Leaderboard.svelte';
  import Prestige from './components/Prestige.svelte';

  let tab = $state('mine');
  const tabs = [
    { id:'mine', icon:'⛏️', label:'Mine' },
    { id:'jobs', icon:'🔨', label:'Jobs' },
    { id:'stocks', icon:'📈', label:'Aktien' },
    { id:'shop', icon:'🛒', label:'Shop' },
    { id:'ach', icon:'🏆', label:'Erfolge' },
    { id:'lb', icon:'🏅', label:'Rang' },
    { id:'prestige', icon:'✨', label:'Prestige' },
  ];

  let stocksRef = $state(null);
  let jobsRef = $state(null);

  // Nickname modal state
  let showNicknameModal = $state(false);
  let nicknameInput = $state('');
  let nicknameError = $state('');
  let nicknameSaving = $state(false);

  async function saveNickname() {
    const name = nicknameInput.trim();
    if (!name) { nicknameError = 'Gib einen Namen ein!'; return; }
    if (name.length > 20) { nicknameError = 'Maximal 20 Zeichen'; return; }
    nicknameSaving = true;
    nicknameError = '';
    const r = await server.setName(name);
    if (r && r.success) {
      $displayName = r.display_name;
      $hasSetName = true;
      showNicknameModal = false;
    } else {
      nicknameError = 'Fehler beim Speichern — später über Einstellungen';
    }
    nicknameSaving = false;
  }

  function skipNickname() {
    $hasSetName = true;
    showNicknameModal = false;
  }

  // ====== SERVER SYNC — SOLE SOURCE OF TRUTH ======
  onMount(() => {
    if ('serviceWorker' in navigator) {
      const swPath = (import.meta.env.BASE_URL || '/') + 'sw.js';
      navigator.serviceWorker.register(swPath).catch(() => {});
    }

    const deviceId = generateDeviceId();
    server.init(deviceId);

    const syncInterval = setInterval(doSync, 2000);
    doSync();

    let lastTick = Date.now();
    const goldTick = setInterval(() => {
      if (!$serverOnline && $gpsValue > 0) {
        const now = Date.now();
        const dt = (now - lastTick) / 1000;
        $gold += $gpsValue * dt;
        $totalGold += $gpsValue * dt;
        $totalGoldAllTime += $gpsValue * dt;
      }
      lastTick = Date.now();
    }, 1000);

    return () => { clearInterval(syncInterval); clearInterval(goldTick); server.destroy(); };
  });

  async function doSync() {
    const data = await server.sync();
    if (!data || !data.success || !data.state) return;

    // Nickname from server
    if (data.display_name) {
      $displayName = data.display_name;
      $hasSetName = true;
    } else {
      // No name set yet — show modal
      showNicknameModal = true;
    }

    // SERVER STATE — always authoritative
    const s = data.state;
    $gold = s.gold;
    $totalGold = s.total_gold;
    $totalGoldAllTime = s.total_gold_all_time;
    $gems = s.gems || 0;
    $prestigeMultiplier = s.prestige_multiplier || 1;
    $clickPower = s.click_power || 1;
    $clickMultiplier = s.click_multiplier || 1;
    $gps = s.gps || 0;
    $totalClicks = s.total_clicks || 0;
    $totalUpgradesBought = s.total_upgrades_bought || 0;
    if (s.easter_1m) $easter1M = true;
    if (s.easter_1b) $easter1B = true;

    if (s.active_boost) { $activeBoost = s.active_boost; $boostEnd = s.boost_end || 0; }
    else { $activeBoost = null; $boostEnd = 0; }
    // Parse ad_boosts array from server
    if (data.ad_boosts && data.ad_boosts.length > 0) {
      const latest = data.ad_boosts[data.ad_boosts.length - 1];
      const type = latest.ad_type === 'click_boost' ? 'click' : latest.ad_type === 'gps_boost' ? 'auto' : 'gold';
      $activeAdBoost = { type, end: new Date(latest.expires_at).getTime() };
    } else { $activeAdBoost = null; }
    if (s.market_event) { $marketEvent = s.market_event; $marketEventEnd = s.market_event_end || 0; }
    else { $marketEvent = null; $marketEventEnd = 0; }

    if (s.stats) $stats = s.stats;

    if (data.upgrades) {
      CLICK_UPGRADES.forEach(u => u.count = 0);
      AUTO_UPGRADES.forEach(u => u.count = 0);
      GEM_UPGRADES.forEach(u => u.count = 0);
      data.upgrades.forEach(u => {
        const lists = { click: CLICK_UPGRADES, auto: AUTO_UPGRADES, gem: GEM_UPGRADES };
        const list = lists[u.upgrade_type];
        if (list && list[u.upgrade_index] !== undefined) list[u.upgrade_index].count = u.count;
      });
    }

    if (data.jobs) {
      JOBS.forEach(j => j.count = 0);
      data.jobs.forEach(j => { if (JOBS[j.job_index]) JOBS[j.job_index].count = j.count; });
    }

    if (jobsRef && data.jobs) {
      jobsRef.syncJobs(data.jobs);
    }

    if (stocksRef) {
      stocksRef.loadServerHoldings(data.stocks);
      stocksRef.loadServerPrices(data.stock_prices);
    }

    if (data.achievements) {
      const set = new Set();
      data.achievements.forEach(a => set.add(a.achievement_id));
      $achievementsUnlocked = set;
    }
  }
</script>

<main>
  <!-- Nickname Modal -->
  {#if showNicknameModal && !$hasSetName}
    <div class="modal-overlay">
      <div class="modal-box">
        <div class="modal-icon">👷</div>
        <h2>Wie heißt du, Bergmann?</h2>
        <p class="modal-desc">Dein Name erscheint in der Rangliste</p>
        <input
          type="text"
          class="modal-input"
          placeholder="Dein Spitzname..."
          maxlength="20"
          bind:value={nicknameInput}
          onkeydown={(e) => e.key === 'Enter' && saveNickname()}
        />
        {#if nicknameError}<div class="modal-error">{nicknameError}</div>{/if}
        <div class="modal-buttons">
          <button class="modal-btn primary" disabled={nicknameSaving} onclick={saveNickname}>
            {nicknameSaving ? 'Speichere...' : '⛏️ Los geht\'s!'}
          </button>
          <button class="modal-btn secondary" onclick={skipNickname}>Überspringen</button>
        </div>
      </div>
    </div>
  {/if}

  <header>
    <h1>⛏️ Bergwerk Idle</h1>
    <div class="header-stats">
      {#if $displayName}<span class="nickname-tag">👷 {$displayName}</span>{/if}
      <span>🪙 {fmt($gold)}</span>
      <span>⚡ {fmt($gpsValue)}/s</span>
      {#if $gems > 0}<span>💎 {fmt($gems)}</span>{/if}
      {#if !$serverOnline}<span class="offline">📵</span>{/if}
    </div>
  </header>

  <div class="content">
    {#if tab === 'mine'}
      <Mine />
    {:else if tab === 'jobs'}
      <Jobs bind:this={jobsRef} />
    {:else if tab === 'stocks'}
      <Stocks bind:this={stocksRef} />
    {:else if tab === 'shop'}
      <Upgrades />
    {:else if tab === 'ach'}
      <div class="achievements-panel">
        {#each ACHIEVEMENTS as a}
          {@const unlocked = $achievementsUnlocked.has(a.id)}
          <div class="achievement" class:done={unlocked}>
            <div class="ach-icon">{unlocked ? a.icon : '🔒'}</div>
            <div class="ach-name">{unlocked ? a.name : '???'}</div>
            <div class="ach-tip">{a.tip}</div>
          </div>
        {/each}
      </div>
    {:else if tab === 'lb'}
      <Leaderboard />
    {:else if tab === 'prestige'}
      <Prestige />
    {/if}
  </div>

  <nav class="tab-bar-bottom">
    {#each tabs as t}
      <button class="tab" class:active={tab===t.id} onclick={()=>tab=t.id}>
        <span class="tab-icon">{t.icon}</span>
        <span class="tab-label">{t.label}</span>
      </button>
    {/each}
  </nav>
</main>