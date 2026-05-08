<script>
  import { gold, totalGold, totalGoldAllTime, gps, clickPower, clickMultiplier, prestigeMultiplier, totalClicks, activeBoost, boostEnd, activeAdBoost } from '../stores/game.js';
  import { server } from '../services/server.js';
  import { fmt, fmtTime } from '../utils/format.js';

  let shake = $state(false);
  let floatText = $state('');
  let floatVisible = $state(false);

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
    const r = await server.action('mine');
    if (r && r.success) {
      $gold = r.gold;
      $totalGold += r.reward;
      $totalGoldAllTime += r.reward;
      $totalClicks = r.total_clicks || $totalClicks + 1;
      floatText = '+' + fmt(r.reward);
      floatVisible = true;
      shake = true;
      setTimeout(() => shake = false, 300);
      setTimeout(() => floatVisible = false, 900);
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
</div>