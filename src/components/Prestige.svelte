<script>
  import { gold, totalGold, totalGoldAllTime, gems, prestigeMultiplier, gps, clickPower, clickMultiplier, totalClicks, totalUpgradesBought } from '../stores/game.js';
  import { CLICK_UPGRADES, AUTO_UPGRADES, GEM_UPGRADES, JOBS } from '../data/gameData.js';
  import { server } from '../services/server.js';
  import { fmt, cost } from '../utils/format.js';

  let showConfirm = $state(false);

  async function doPrestige() {
    const r = await server.action('prestige');
    if (r && r.success) {
      $gems = r.new_gems;
      $prestigeMultiplier = r.new_prestige_multiplier;
      // Full reset from server
      $gold = 0; $totalGold = 0; $totalGoldAllTime = 0;
      $gps = 0; $clickPower = 1; $clickMultiplier = 1;
      $totalClicks = 0; $totalUpgradesBought = 0;
      CLICK_UPGRADES.forEach(u => u.count = 0);
      AUTO_UPGRADES.forEach(u => u.count = 0);
      JOBS.forEach(j => j.count = 0);
      showConfirm = false;
    }
  }

  let gemEarned = $derived(Math.floor(Math.sqrt($totalGoldAllTime / 1e6)));
</script>

<div class="prestige-box">
  <h3>✨ Prestige</h3>
  <p>Gems: {fmt($gems)} · Multiplikator: x{$prestigeMultiplier.toFixed(1)}</p>
  <p>Gesamt-Gold: {fmt($totalGoldAllTime)}</p>
  <p>Voraussichtlich: +{gemEarned} Gems</p>
  {#if !showConfirm}
    <button class="prestige-btn" onclick={()=>showConfirm=true}>✨ Prestige</button>
  {:else}
    <button class="prestige-btn confirm" onclick={doPrestige}>⚡ WIRKLICH?</button>
    <button class="prestige-btn cancel" onclick={()=>showConfirm=false}>Abbrechen</button>
  {/if}
</div>