<script>
  import { server } from '../services/server.js';
  import { fmt } from '../utils/format.js';

  let type = 'gold';
  let leaderboard = [];
  let loading = false;

  const labels = { gold: '💰 Gesamt-Gold', prestige: '✨ Prestige', clicks: '⛏️ Klicks' };
  const fmtVal = {
    gold: v => v >= 1e9 ? (v/1e9).toFixed(1)+'B' : v >= 1e6 ? (v/1e6).toFixed(1)+'M' : v >= 1e3 ? (v/1e3).toFixed(1)+'K' : Math.floor(v).toLocaleString('de'),
    prestige: v => 'x' + v.toFixed(1),
    clicks: v => v.toLocaleString('de')
  };
  const valKey = { gold: 'total_gold', prestige: 'prestige', clicks: 'total_clicks' };

  async function loadLeaderboard() {
    loading = true;
    const data = await server.leaderboard(type);
    if (data && data.leaderboard) {
      leaderboard = data.leaderboard;
    }
    loading = false;
  }

  function setType(t) {
    type = t;
    loadLeaderboard();
  }

  // Auto-load on mount + refresh every 60s
  import { onMount } from 'svelte';
  onMount(() => {
    loadLeaderboard();
    const timer = setInterval(loadLeaderboard, 60000);
    return () => clearInterval(timer);
  });
</script>

<div class="leaderboard-panel">
  <div class="tab-bar">
    <button class="tab-btn" class:active={type==='gold'} on:click={()=>setType('gold')}>💰 Gold</button>
    <button class="tab-btn" class:active={type==='prestige'} on:click={()=>setType('prestige')}>✨ Prestige</button>
    <button class="tab-btn" class:active={type==='clicks'} on:click={()=>setType('clicks')}>⛏️ Klicks</button>
  </div>

  <div class="lb-title">{labels[type]}</div>

  {#if loading}
    <div class="lb-loading">Lade...</div>
  {:else if leaderboard.length === 0}
    <div class="lb-empty">Noch keine Einträge</div>
  {:else}
    {#each leaderboard as p, i}
      {@const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : ''}
      {@const bg = i === 0 ? 'background:linear-gradient(90deg,#1a1a2e,#2a1f0e)' : i < 3 ? 'background:#16213e' : ''}
      <div class="upgrade" style={bg}>
        <div class="upgrade-info">
          <div class="upgrade-name">{medal} #{p.rank} {p.user_id?.substring(0,8)}...</div>
        </div>
        <div class="upgrade-btn" style="cursor:default;border-color:#ffd700;color:#ffd700;background:#0f3460">
          {fmtVal[type](p[valKey[type]])}
        </div>
      </div>
    {/each}
  {/if}
</div>