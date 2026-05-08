<script>
  import { gold, totalGold, totalGoldAllTime, gems, prestigeMultiplier, gps, clickPower, clickMultiplier, totalClicks, totalUpgradesBought } from '../stores/game.js';
  import { CLICK_UPGRADES, AUTO_UPGRADES, GEM_UPGRADES, JOBS } from '../data/gameData.js';
  import { server } from '../services/server.js';
  import { fmt, cost } from '../utils/format.js';

  let showConfirm = false;

  async function doPrestige() {
    const r = await server.action('prestige');
    if (r && r.success) {
      $gems = r.new_gems;
      $prestigeMultiplier = r.new_prestige_multiplier;
      $gold = 0;
      $totalGold = 0;
      $totalGoldAllTime = 0;
      $gps = 0;
      $clickPower = 1;
      $clickMultiplier = 1;
      $totalClicks = 0;
      $totalUpgradesBought = 0;
      CLICK_UPGRADES.forEach(u => u.count = 0);
      AUTO_UPGRADES.forEach(u => u.count = 0);
      JOBS.forEach(j => j.count = 0);
      showConfirm = false;
    }
  }

  $: gemEarned = Math.floor(Math.sqrt($totalGoldAllTime / 1e6));

  function gemCost(u) {
    return cost(u.base, u.mult, u.count);
  }
</script>

<div class="prestige-panel">
  <div class="prestige-info">
    <div class="prestige-stat">✨ {fmt($gems)} Gems</div>
    <div class="prestige-stat">💫 x{$prestigeMultiplier.toFixed(1)} Prestige</div>
    <div class="prestige-stat">💰 {fmt($totalGoldAllTime)} Gold gesamt</div>
  </div>

  <!-- Gem Upgrades -->
  <div class="gem-upgrades">
    <h3>💎 Gem-Upgrades</h3>
    {#each GEM_UPGRADES as u, i}
      {@const c = gemCost(u)}
      <div class="upgrade" class:disabled={$gems < c || (u.max && u.count >= u.max)}>
        <div class="upgrade-info">
          <div class="upgrade-name">{u.name} <span class="count">x{u.count}</span></div>
          <div class="upgrade-desc">{u.desc}</div>
        </div>
        <button class="upgrade-btn gem-btn" disabled={$gems < c || (u.max && u.count >= u.max)}>
          💎 {c}
        </button>
      </div>
    {/each}
  </div>

  <!-- Prestige Button -->
  <div class="prestige-action">
    <p>Beim Prestige verlierst du alles, aber bekommst Gems!</p>
    <p>Voraussichtlich: +{gemEarned} Gems</p>
    {#if !showConfirm}
      <button class="prestige-btn" on:click={()=>showConfirm=true}>✨ Prestige</button>
    {:else}
      <button class="prestige-btn confirm" on:click={doPrestige}>⚡ WIRKLICH Prestigen?</button>
      <button class="prestige-btn cancel" on:click={()=>showConfirm=false}>Abbrechen</button>
    {/if}
  </div>
</div>