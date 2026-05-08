<script>
  import { gold, clickPower, gps, totalUpgradesBought } from '../stores/game.js';
  import { CLICK_UPGRADES, AUTO_UPGRADES, GEM_UPGRADES } from '../data/gameData.js';
  import { server } from '../services/server.js';
  import { fmt, cost } from '../utils/format.js';

  let tab = 'click'; // click | auto | gem

  function recalcGPS() {
    let b = 0;
    AUTO_UPGRADES.forEach(u => b += u.gps * u.count);
    $gps = b;
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

  function buyGem(i) {
    const u = GEM_UPGRADES[i];
    const c = cost(u.base, u.mult, u.count);
    // Gem upgrades are local-only for now
    if ($gold >= c && (!u.max || u.count < u.max)) {
      // Gems werden über prestige earned, nicht gold
    }
  }
</script>

<div class="upgrades-panel">
  <div class="tab-bar">
    <button class="tab-btn" class:active={tab==='click'} on:click={()=>tab='click'}>⛏️ Klick</button>
    <button class="tab-btn" class:active={tab==='auto'} on:click={()=>tab='auto'}>🤖 Auto</button>
    <button class="tab-btn" class:active={tab==='gem'} on:click={()=>tab='gem'}>💎 Gems</button>
  </div>

  {#if tab === 'click'}
    {#each CLICK_UPGRADES as u, i}
      {@const c = cost(u.base, u.mult, u.count)}
      <div class="upgrade" class:disabled={$gold < c}>
        <div class="upgrade-info">
          <div class="upgrade-name">{u.name} <span class="count">x{u.count}</span></div>
          <div class="upgrade-desc">{u.desc}</div>
        </div>
        <button class="upgrade-btn" disabled={$gold < c} on:click={()=>buyClick(i)}>
          {fmt(c)} 🪙
        </button>
      </div>
    {/each}
  {/if}

  {#if tab === 'auto'}
    {#each AUTO_UPGRADES as u, i}
      {@const c = cost(u.base, u.mult, u.count)}
      <div class="upgrade" class:disabled={$gold < c}>
        <div class="upgrade-info">
          <div class="upgrade-name">{u.name} <span class="count">x{u.count}</span></div>
          <div class="upgrade-desc">{u.desc}</div>
        </div>
        <button class="upgrade-btn" disabled={$gold < c} on:click={()=>buyAuto(i)}>
          {fmt(c)} 🪙
        </button>
      </div>
    {/each}
  {/if}

  {#if tab === 'gem'}
    {#each GEM_UPGRADES as u, i}
      {@const c = cost(u.base, u.mult, u.count)}
      <div class="upgrade" class:disabled={true}>
        <div class="upgrade-info">
          <div class="upgrade-name">{u.name} <span class="count">x{u.count}</span></div>
          <div class="upgrade-desc">{u.desc}</div>
        </div>
        <button class="upgrade-btn" disabled={true}>
          💎 {c}
        </button>
      </div>
    {/each}
  {/if}
</div>