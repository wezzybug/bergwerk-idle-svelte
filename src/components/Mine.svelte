<script>
  import { gold, totalGold, totalGoldAllTime, gps, clickPower, clickMultiplier, prestigeMultiplier, totalClicks, activeBoost, boostEnd, activeAdBoost } from '../stores/game.js';
  import { server } from '../services/server.js';
  import { fmt } from '../utils/format.js';

  let shake = false;
  let floatText = '';
  let floatVisible = false;
  let floatY = 0;
  let floatX = 0;

  let boostName = $activeBoost === 'click' ? '⚡ Klick x2' :
                  $activeBoost === 'auto' ? '🚀 Auto x2' :
                  $activeBoost === 'gold' ? '🤑 Gold x3' : '';

  let boostLeft = 0;
  let adBoostName = '';
  let adBoostLeft = 0;

  // Boost timer
  setInterval(() => {
    if ($activeBoost) {
      boostLeft = Math.max(0, ($boostEnd - Date.now()) / 1000);
      if (boostLeft <= 0) { $activeBoost = null; }
    }
    if ($activeAdBoost && $activeAdBoost.end > Date.now()) {
      adBoostLeft = Math.max(0, ($activeAdBoost.end - Date.now()) / 1000);
      adBoostName = $activeAdBoost.type === 'gps' ? '📺 GPS x2' : '📺 Klick x2';
    } else if ($activeAdBoost) {
      $activeAdBoost = null;
    }
  }, 100);

  async function doMine() {
    const r = await server.action('mine');
    if (r && r.success) {
      $gold = r.gold;
      $totalGold += r.reward;
      $totalGoldAllTime += r.reward;
      $totalClicks = r.total_clicks || $totalClicks + 1;
      showFloat('+' + fmt(r.reward));
      shake = true;
      setTimeout(() => shake = false, 300);

      // Random boost/event chance
      if (!$activeBoost && Math.random() < 0.003) {
        const t = ['click', 'auto', 'gold'][Math.floor(Math.random() * 3)];
        $activeBoost = t;
        $boostEnd = Date.now() + 30000;
      }
    }
  }

  function showFloat(txt) {
    floatText = txt;
    floatVisible = true;
    setTimeout(() => floatVisible = false, 900);
  }
</script>

<div class="mine-area">
  <!-- Boost display -->
  {#if $activeBoost}
    <div class="boost-bar">
      <div class="boost-text">{boostName} {fmtTime(boostLeft)}</div>
      <div class="boost-fill" style="width:{boostLeft/30*100}%"></div>
    </div>
  {/if}

  {#if $activeAdBoost && adBoostLeft > 0}
    <div class="boost-bar ad-boost">
      <div class="boost-text">{adBoostName} {fmtTime(adBoostLeft)}</div>
      <div class="boost-fill" style="width:{adBoostLeft/300*100}%"></div>
    </div>
  {/if}

  <!-- Stats -->
  <div class="mine-stats">
    <div class="gold-display">🪙 {fmt($gold)}</div>
    <div class="gps-display">⚡ {fmt($gps * $prestigeMultiplier)} Gold/s</div>
    <div class="click-display">⛏️ {fmt($clickPower * $clickMultiplier * $prestigeMultiplier)} pro Klick</div>
  </div>

  <!-- Mine Button -->
  <button class="mine-btn" class:shake class:boosted="{$activeBoost === 'click'}" on:click={doMine}>
    ⛏️ Minen!
  </button>

  <!-- Float text -->
  {#if floatVisible}
    <div class="float-text">{floatText}</div>
  {/if}
</div>

<script context="module">
  import { fmtTime } from '../utils/format.js';
</script>