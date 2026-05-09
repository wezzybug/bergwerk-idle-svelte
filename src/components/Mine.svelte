<script>
  import { gold, totalGold, totalGoldAllTime, gps, clickPower, clickMultiplier, prestigeMultiplier, totalClicks, totalUpgradesBought, gems, activeBoost, boostEnd, activeAdBoost } from '../stores/game.js';
  import { CLICK_UPGRADES, AUTO_UPGRADES } from '../data/gameData.js';
  import { server } from '../services/server.js';
  import { fmt, fmtTime, cost, calcMaxBuyable, calcBatchCost } from '../utils/format.js';

  let shake = $state(false);
  let floatText = $state('');
  let floatVisible = $state(false);
  let clickLocked = $state(false);
  let buyAmount = $state(1); // 1, 10, 100, MAX
  const BUY_OPTIONS = [1, 10, 100, -1]; // -1 = MAX

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

  function getBuyQty(upgrade) {
    if (buyAmount === -1) return calcMaxBuyable(upgrade.base, upgrade.mult, upgrade.count, $gold);
    return buyAmount;
  }

  async function buyClick(i) {
    const u = CLICK_UPGRADES[i];
    const qty = getBuyQty(u);
    if (qty <= 0) return;
    const r = await server.action('buy_click_upgrade', { index: i, quantity: qty });
    if (r && r.success) {
      $gold = r.gold;
      CLICK_UPGRADES[i].count = r.upgrade_count;
      $clickPower = r.click_power;
      $totalUpgradesBought += qty;
    }
  }

  async function buyAuto(i) {
    const u = AUTO_UPGRADES[i];
    const qty = getBuyQty(u);
    if (qty <= 0) return;
    const r = await server.action('buy_auto_upgrade', { index: i, quantity: qty });
    if (r && r.success) {
      $gold = r.gold;
      AUTO_UPGRADES[i].count = r.upgrade_count;
      $totalUpgradesBought += qty;
      if (r.gps !== undefined) $gps = r.gps;
    }
  }

  async function watchAd(type) {
    const r = await server.watchAd(type);
    if (r && r.success) {
      $gold = r.gold ?? $gold;
      $gems = r.gems ?? $gems;
    }
  }

  function amountLabel(a) { return a === -1 ? 'MAX' : a; }
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

  <!-- Buy amount selector -->
  <div class="buy-amount-bar">
    {#each BUY_OPTIONS as a}
      <button class="amt-btn" class:active={buyAmount === a} onclick={() => buyAmount = a}>{amountLabel(a)}</button>
    {/each}
  </div>

  <!-- Ad Boost Buttons -->
  <div class="ad-section">
    <button class="ad-btn" onclick={()=>watchAd('click_boost')}>📺 Klick x2 (5 Min)</button>
    <button class="ad-btn" onclick={()=>watchAd('gps_boost')}>📺 GPS x2 (5 Min)</button>
    <button class="ad-btn gem-ad" onclick={()=>watchAd('gems')}>💎 +1 Gem</button>
  </div>

  <!-- Auto Upgrades -->
  <h3 class="section-title">🤖 Automatische Ernte</h3>
  {#each AUTO_UPGRADES as u, i}
    {@const qty = getBuyQty(u)}
    {@const c = buyAmount === -1 ? calcBatchCost(u.base, u.mult, u.count, qty) : cost(u.base, u.mult, u.count)}
    <div class="upgrade" class:disabled={$gold < c || qty <= 0}>
      <div class="upgrade-info">
        <div class="upgrade-name">{u.name} <span class="count">x{u.count}</span></div>
        <div class="upgrade-desc">{u.desc}</div>
        {#if buyAmount !== 1 && qty > 1}
          <div class="upgrade-desc batch-info">{qty}x → {fmt(calcBatchCost(u.base, u.mult, u.count, qty))} 🪙</div>
        {/if}
      </div>
      <button class="upgrade-btn" disabled={$gold < c || qty <= 0} onclick={()=>buyAuto(i)}>{fmt(c)} 🪙</button>
    </div>
  {/each}

  <!-- Click Upgrades -->
  <h3 class="section-title">⛏️ Spitzhacken-Upgrades</h3>
  {#each CLICK_UPGRADES as u, i}
    {@const qty = getBuyQty(u)}
    {@const c = buyAmount === -1 ? calcBatchCost(u.base, u.mult, u.count, qty) : cost(u.base, u.mult, u.count)}
    <div class="upgrade" class:disabled={$gold < c || qty <= 0}>
      <div class="upgrade-info">
        <div class="upgrade-name">{u.name} <span class="count">x{u.count}</span></div>
        <div class="upgrade-desc">{u.desc}</div>
        {#if buyAmount !== 1 && qty > 1}
          <div class="upgrade-desc batch-info">{qty}x → {fmt(calcBatchCost(u.base, u.mult, u.count, qty))} 🪙</div>
        {/if}
      </div>
      <button class="upgrade-btn" disabled={$gold < c || qty <= 0} onclick={()=>buyClick(i)}>{fmt(c)} 🪙</button>
    </div>
  {/each}
</div>