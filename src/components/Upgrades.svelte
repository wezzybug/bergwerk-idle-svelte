<script>
  import { gold, totalGoldAllTime, gems, prestigeMultiplier, clickPower, clickMultiplier, gps, totalUpgradesBought, totalClicks, activeAdBoost } from '../stores/game.js';
  import { GEM_UPGRADES } from '../data/gameData.js';
  import { server } from '../services/server.js';
  import { fmt, cost } from '../utils/format.js';

  let tab = $state('gems');

  // Prestige info for the shop
  let nextPrestigeGems = $derived(Math.floor(Math.sqrt($totalGoldAllTime / 1e6)));

  let adBoostLeft = $derived($activeAdBoost && $activeAdBoost.end > Date.now() ? Math.max(0, ($activeAdBoost.end - Date.now()) / 1000) : 0);
  let adBoostName = $derived($activeAdBoost?.type === 'auto' ? '📺 GPS x2' : '📺 Klick x2');

  import { onMount } from 'svelte';
  onMount(() => {
    const timer = setInterval(() => {
      if ($activeAdBoost && Date.now() >= $activeAdBoost.end) $activeAdBoost = null;
    }, 1000);
    return () => clearInterval(timer);
  });

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

  async function watchAd(type) {
    const r = await server.watchAd(type);
    if (r && r.success) {
      $gold = r.gold ?? $gold;
      $gems = r.gems ?? $gems;
      // Update ad boost state immediately
      if (type === 'click_boost') {
        $activeAdBoost = { type: 'click', end: Date.now() + 5*60*1000 };
      } else if (type === 'gps_boost') {
        $activeAdBoost = { type: 'auto', end: Date.now() + 5*60*1000 };
      }
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
  <button class="tab-btn" class:active={tab==='ad'} onclick={()=>tab='ad'}>📺 Werbe-Boosts</button>
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
{:else if tab === 'ad'}
  <p class="shop-note">Werbung schauen → Boosts freischalten!</p>

  {#if $activeAdBoost && adBoostLeft > 0}
    <div class="active-boost-bar">
      <div class="boost-text">{adBoostName} läuft noch {Math.ceil(adBoostLeft)}s</div>
      <div class="boost-fill" style="width:{adBoostLeft/300*100}%"></div>
    </div>
  {/if}

  <div class="upgrade">
    <div class="upgrade-info">
      <div class="upgrade-name">📺 Klick x2 (5 Min)</div>
      <div class="upgrade-desc">Schau Ad → Klicks 2x so wertvoll</div>
    </div>
    <button class="upgrade-btn ad-btn" onclick={()=>watchAd('click_boost')}>📺 Watch</button>
  </div>

  <div class="upgrade">
    <div class="upgrade-info">
      <div class="upgrade-name">📺 GPS x2 (10 Min)</div>
      <div class="upgrade-desc">Schau Ad → GPS 2x so hoch</div>
    </div>
    <button class="upgrade-btn ad-btn" onclick={()=>watchAd('gps_boost')}>📺 Watch</button>
  </div>

  <div class="upgrade">
    <div class="upgrade-info">
      <div class="upgrade-name">💎 +1 Gem</div>
      <div class="upgrade-desc">5000 Gold → +1 Gem (sofort)</div>
    </div>
    <button class="upgrade-btn gem-btn" disabled={$gold < 5000} onclick={()=>watchAd('gems')}>💎 5000 🪙</button>
  </div>
{/if}