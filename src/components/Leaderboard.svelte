<script>
  import { server } from '../services/server.js';
  import { fmt } from '../utils/format.js';

  let type = $state('gold');
  let leaderboard = $state([]);
  let loading = $state(false);

  const labels = { gold: '💰 Gesamt-Gold', prestige: '✨ Prestige', clicks: '⛏️ Klicks' };
  const fmtVal = {
    gold: v => fmt(v),
    prestige: v => 'x' + v.toFixed(1),
    clicks: v => v.toLocaleString('de')
  };
  const valKey = { gold: 'total_gold', prestige: 'prestige', clicks: 'total_clicks' };

  async function loadLeaderboard() {
    loading = true;
    const data = await server.leaderboard(type);
    if (data && data.leaderboard) leaderboard = data.leaderboard;
    loading = false;
  }

  function setType(t) { type = t; loadLeaderboard(); }

  import { onMount } from 'svelte';
  onMount(() => { loadLeaderboard(); const t = setInterval(loadLeaderboard, 60000); return () => clearInterval(t); });
</script>

<h2>🏆 Rangliste</h2>
<div class="tab-bar">
  <button class="tab-btn" class:active={type==='gold'} onclick={()=>setType('gold')}>💰</button>
  <button class="tab-btn" class:active={type==='prestige'} onclick={()=>setType('prestige')}>✨</button>
  <button class="tab-btn" class:active={type==='clicks'} onclick={()=>setType('clicks')}>⛏️</button>
</div>
<div class="lb-title">{labels[type]}</div>
{#if loading}
  <div style="text-align:center;color:#888;padding:20px">Lade...</div>
{:else if leaderboard.length === 0}
  <div style="text-align:center;color:#888;padding:20px">Noch keine Einträge</div>
{:else}
  {#each leaderboard as p, i}
    {@const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : ''}
    <div class="upgrade" style={i === 0 ? 'background:linear-gradient(90deg,#1a1a2e,#2a1f0e)' : i < 3 ? 'background:#16213e' : ''}>
      <div class="upgrade-info"><div class="upgrade-name">{medal} #{p.rank} {p.user_id?.substring(0,8)}...</div></div>
      <div class="upgrade-btn" style="cursor:default;border-color:#ffd700;color:#ffd700;background:#0f3460">{fmtVal[type](p[valKey[type]])}</div>
    </div>
  {/each}
{/if}