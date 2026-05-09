<script>
  import { gold, totalGold, totalGoldAllTime, gps, clickPower, clickMultiplier, prestigeMultiplier, totalClicks, totalUpgradesBought, gems, activeBoost, boostEnd, activeAdBoost } from '../stores/game.js';
  import { CLICK_UPGRADES } from '../data/gameData.js';
  import { server } from '../services/server.js';
  import { fmt, fmtTime, cost } from '../utils/format.js';

  let shake = $state(false);
  let floatText = $state('');
  let floatVisible = $state(false);
  let clickLocked = $state(false);

  let boostName = $derived(
    $activeBoost === 'click' ? '⚡ Klick x2' :
    $activeBoost === 'auto' ? '🚀 Auto x2' :
    $activeBoost === 'gold' ? '🤑 Gold x3' : ''
  );
  let boostLeft = $derived($activeBoost ? Math.max(0, ($boostEnd - Date.now()) / 1000) : 0);
  let adBoostLeft = $derived($activeAdBoost && $activeAdBoost.end > Date.now() ? Math.max(0, ($activeAdBoost.end - Date.now()) / 1000) : 0);
  let adBoostName = $derived($activeAdBoost?.type === 'gps' ? '📺 GPS x2' : '📺 Klick x2');

  import { onMount } from 'svelte';
  onMount(() => {
    const timer = setInterval(() => {
      if ($activeBoost && Date.now() >= $boostEnd) $activeBoost = null;
      if ($activeAdBoost && Date.now() >= $activeAdBoost.end) $activeAdBoost = null;
    }, 1000);
    return () => clearInterval(timer);
  });

  async function doMine() {
    if (clickLocked) return;
    clickLocked = true;
    setTimeout(() => clickLocked = false, 200);

    const r = await server.action('mine');
    if (r && r.success) {
      $gold = r.gold;
      $totalGold = r.total_gold ?? $totalGold;
      $totalGoldAllTime = r.total_gold_all_time ?? $totalGoldAllTime;
      $totalClicks = r.total_clicks ?? ($totalClicks + 1);
      floatText = '+' + fmt(r.reward);
      floatVisible = true;
      shake = true;
      setTimeout(() => shake = false, 300);
      setTimeout(() => floatVisible = false, 900);
    }
  }

  async function buyClick(i) {
    const r = await server.action('buy_click_upgrade', { index: i });
    if (r && r.success) {
      $gold = r.gold;
      CLICK_UPGRADES[i].count = r.upgrade_count;
      $clickPower = r.click_power;
      $totalUpgradesBought++;
    }
  }

  async function watchAd(type) {
    const r = await server.watchAd(type);
    if (r && r.success) {
      $gold = r.gold ?? $gold;
      $gems = r.gems ?? $gems;
      // Boost will come through next sync
    }
  }
</script>

<div class="mine-area">
  {#if $activeBoost}
    <div class="boost-bar"><div class="boost-text">{boostName} {fmtTime(boostLeft)}</div><div class="boost-fill" style="width:{boostLeft/30*100}%"></div></div>
  {/if}
  {#if $activeAdBoost && adBoostLeft > 0}
    <div class="boost-bar ad-boost"><div class="boost-text">{adBoostName} {fmtTime(adBoostLeft)}</div><div class="boost-fill" style="width:{adBoostLeft/300*100}%"></div></div>
  {/if}
  <div class="mine-stats">
    <div class="counter">🪙 {fmt($gold)}</div>
    <div class="per-sec">⚡ {fmt($gps * $prestigeMultiplier)} Gold/s · ⛏️ {fmt($clickPower * $clickMultiplier * $prestigeMultiplier)} pro Klick</div>
  </div>
  <button class="mine-btn" class:shake class:boosted={$activeBoost === 'click'} onclick={doMine}>⛏️ Minen!</button>
  {#if floatVisible}<div class="float-text">{floatText}</div>{/if}

  <!-- Ad Boost Button -->
  <div class="ad-section">
    <button class="ad-btn" onclick={()=>watchAd('click_boost')}>📺 Werbung: Klick x2 (5 Min)</button>
    <button class="ad-btn" onclick={()=>watchAd('gps_boost')}>📺 Werbung: GPS x2 (5 Min)</button>
    <button class="ad-btn gem-ad" onclick={()=>watchAd('gems')}>💎 Werbung: +1 Gem</button>
  </div>

  <!-- Click Upgrades inline on mine page -->
  <h3 class="section-title">⛏️ Spitzhacken-Upgrades</h3>
  {#each CLICK_UPGRADES as u, i}
    {@const c = cost(u.base, u.mult, u.count)}
    <div class="upgrade" class:disabled={$gold < c}>
      <div class="upgrade-info">
        <div class="upgrade-name">{u.name} <span class="count">x{u.count}</span></div>
        <div class="upgrade-desc">{u.desc}</div>
      </div>
      <button class="upgrade-btn" disabled={$gold < c} onclick={()=>buyClick(i)}>{fmt(c)} 🪙</button>
    </div>
  {/each}
</div>