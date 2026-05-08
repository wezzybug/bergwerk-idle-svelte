<script>
  import { gold, gems, gps, clickPower, totalUpgradesBought } from '../stores/game.js';
  import { CLICK_UPGRADES, AUTO_UPGRADES, GEM_UPGRADES } from '../data/gameData.js';
  import { server } from '../services/server.js';
  import { fmt, cost } from '../utils/format.js';

  let tab = $state('click');

  // Recalculate GPS from upgrade counts (local mirror of server state)
  function recalcGPS() {
    let total = 0;
    AUTO_UPGRADES.forEach(u => total += u.gps * u.count);
    $gps = total;
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

  async function buyAuto(i) {
    const r = await server.action('buy_auto_upgrade', { index: i });
    if (r && r.success) {
      $gold = r.gold;
      AUTO_UPGRADES[i].count = r.upgrade_count;
      $totalUpgradesBought++;
      recalcGPS();
    }
  }

  async function buyGem(i) {
    const u = GEM_UPGRADES[i];
    if (u.count >= u.max) return;
    const r = await server.action('buy_gem_upgrade', { index: i });
    if (r && r.success) {
      $gold = r.gold ?? $gold;
      $gems = r.gems ?? $gems;
      GEM_UPGRADES[i].count = r.upgrade_count;
    }
  }
</script>

<h2>Upgrades</h2>
<div class="tab-bar">
  <button class="tab-btn" class:active={tab==='click'} onclick={()=>tab='click'}>⛏️ Klick</button>
  <button class="tab-btn" class:active={tab==='auto'} onclick={()=>tab='auto'}>🤖 Auto</button>
  <button class="tab-btn" class:active={tab==='gem'} onclick={()=>tab='gem'}>💎 Gems</button>
</div>

{#if tab === 'click'}
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
{:else if tab === 'auto'}
  {#each AUTO_UPGRADES as u, i}
    {@const c = cost(u.base, u.mult, u.count)}
    <div class="upgrade" class:disabled={$gold < c}>
      <div class="upgrade-info">
        <div class="upgrade-name">{u.name} <span class="count">x{u.count}</span></div>
        <div class="upgrade-desc">{u.desc}</div>
      </div>
      <button class="upgrade-btn" disabled={$gold < c} onclick={()=>buyAuto(i)}>{fmt(c)} 🪙</button>
    </div>
  {/each}
{:else if tab === 'gem'}
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
{/if}