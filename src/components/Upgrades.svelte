<script>
  import { gold, totalGoldAllTime, gems, prestigeMultiplier, clickPower, clickMultiplier, gps, totalUpgradesBought, totalClicks } from '../stores/game.js';
  import { GEM_UPGRADES } from '../data/gameData.js';
  import { server } from '../services/server.js';
  import { fmt, cost } from '../utils/format.js';

  let tab = $state('gems');

  // Prestige info for the shop
  let nextPrestigeGems = $derived(Math.floor(Math.sqrt($totalGoldAllTime / 1e6)));

  async function buyGem(i) {
    const u = GEM_UPGRADES[i];
    if (u.count >= u.max) return;
    const r = await server.action('buy_gem_upgrade', { index: i });
    if (r && r.success) {
      $gold = r.gold ?? $gold;
      $gems = r.gems ?? $gems;
      GEM_UPGRADES[i].count = r.upgrade_count;
      if (r.click_multiplier !== undefined) $clickMultiplier = r.click_multiplier;
      if (r.gps !== undefined) $gps = r.gps;
    }
  }

  // Gold-bought boosts
  async function buyGoldBoost(type) {
    const r = await server.action('buy_boost', { boost_type: type });
    if (r && r.success) {
      $gold = r.gold;
    }
  }
</script>

<h2>🛒 Shop</h2>

<div class="prestige-box">
  <h3>💎 Deine Gems: {fmt($gems)}</h3>
  <p>Prestige-Multiplikator: <span class="prestige-multiplier">x{$prestigeMultiplier.toFixed(1)}</span></p>
  <p>Nächster Prestige: +{nextPrestigeGems} Gems (ab 10M Gesamtgold)</p>
</div>

<div class="tab-bar">
  <button class="tab-btn" class:active={tab==='gems'} onclick={()=>tab='gems'}>💎 Gem-Upgrades</button>
  <button class="tab-btn" class:active={tab==='boosts'} onclick={()=>tab='boosts'}>⚡ Boosts</button>
</div>

{#if tab === 'gems'}
  <p class="shop-note">Gems bekommst du durch Prestige. Investiere sie weise!</p>
  {#each GEM_UPGRADES as u, i}
    {@const c = cost(u.base, u.mult, u.count)}
    {@const maxed = u.count >= u.max}
    <div class="upgrade" class:disabled={maxed || $gems < c}>
      <div class="upgrade-info">
        <div class="upgrade-name">{u.name} <span class="count">x{u.count}/{u.max}</span></div>
        <div class="upgrade-desc">{u.desc}</div>
      </div>
      <button class="upgrade-btn gem-btn" disabled={maxed || $gems < c} onclick={()=>buyGem(i)}>💎 {maxed ? 'MAX' : c}</button>
    </div>
  {/each}
{:else if tab === 'boosts'}
  <p class="shop-note">Einmal-Boosts für Gold — sofort aktiv!</p>

  <div class="upgrade">
    <div class="upgrade-info">
      <div class="upgrade-name">🔨 Produktivitätsschub</div>
      <div class="upgrade-desc">GPS x2 für 2 Stunden</div>
    </div>
    <button class="upgrade-btn" disabled={$gold < 100000} onclick={()=>buyGoldBoost('gps_2h')}>{fmt(100000)} 🪙</button>
  </div>

  <div class="upgrade">
    <div class="upgrade-info">
      <div class="upgrade-name">💪 Klick-Rausch</div>
      <div class="upgrade-desc">Klick x2 für 1 Stunde</div>
    </div>
    <button class="upgrade-btn" disabled={$gold < 50000} onclick={()=>buyGoldBoost('click_1h')}>{fmt(50000)} 🪙</button>
  </div>

  <div class="upgrade">
    <div class="upgrade-info">
      <div class="upgrade-name">🎰 Glücksfund</div>
      <div class="upgrade-desc">Zufälliger Goldbonus (500-50.000)</div>
    </div>
    <button class="upgrade-btn" disabled={$gold < 1000} onclick={()=>buyGoldBoost('lucky')}>{fmt(1000)} 🪙</button>
  </div>
{/if}