<script>
  import { gold, totalGold, totalGoldAllTime, marketEvent, marketEventEnd } from '../stores/game.js';
  import { STOCKS, STOCK_FEE } from '../data/gameData.js';
  import { server } from '../services/server.js';
  import { fmt, fmtTime } from '../utils/format.js';

  let stockState = $state(STOCKS.map(s => ({
    ...s,
    price: s.basePrice,
    prevPrice: s.basePrice,
    history: Array.from({ length: 20 }, () => s.basePrice),
    shares: 0,
    avgBuy: 0,
    trend: 0
  })));

  import { onMount } from 'svelte';
  onMount(() => {
    const timer = setInterval(() => {
      let eventBias = 0;
      if ($marketEvent) {
        if ($marketEvent === 'bull') eventBias = 0.03;
        if ($marketEvent === 'bear') eventBias = -0.03;
        if ($marketEvent === 'crash') eventBias = -0.08;
        if ($marketEvent === 'boom') eventBias = 0.06;
        if (Date.now() > $marketEventEnd) { $marketEvent = null; }
      }

      stockState.forEach(s => {
        s.prevPrice = s.price;
        if (Math.random() < 0.1) s.trend = (Math.random() - 0.5) * s.volatility * 0.3;
        let change = (Math.random() - 0.48) * s.volatility * 0.5 + s.trend;
        let reversion = (s.basePrice - s.price) / s.basePrice * 0.015;
        s.price = Math.max(s.basePrice * 0.05, s.price * (1 + change + reversion + eventBias));
        s.history.push(s.price);
        if (s.history.length > 20) s.history.shift();
      });

      if (!$marketEvent && Math.random() < 0.033) {
        const events = ['bull', 'bear', 'crash', 'boom'];
        $marketEvent = events[Math.floor(Math.random() * events.length)];
        $marketEventEnd = Date.now() + 30000 + Math.random() * 30000;
      }

      stockState = [...stockState]; // trigger reactivity
    }, 3000);

    const divTimer = setInterval(() => {
      stockState.forEach(s => {
        if (s.shares > 0) {
          const div = Math.floor(s.shares * s.price * s.dividend);
          if (div > 0) { $gold += div; $totalGold += div; $totalGoldAllTime += div; }
        }
      });
    }, 10000);

    return () => { clearInterval(timer); clearInterval(divTimer); };
  });

  export function loadServerPrices(prices) {
    if (!prices) return;
    prices.forEach(sp => {
      if (stockState[sp.stock_index]) {
        stockState[sp.stock_index].price = sp.current_price;
        stockState[sp.stock_index].prevPrice = sp.prev_price || sp.current_price;
        stockState[sp.stock_index].trend = sp.trend || 0;
      }
    });
    stockState = [...stockState];
  }

  export function loadServerHoldings(holdings) {
    if (!holdings) return;
    holdings.forEach(h => {
      if (stockState[h.stock_index]) {
        stockState[h.stock_index].shares = h.shares;
        stockState[h.stock_index].avgBuy = h.avg_buy_price || 0;
      }
    });
    stockState = [...stockState];
  }

  async function buyStock(i, qty) {
    const r = await server.action('buy_stock', { index: i, qty });
    if (r && r.success) {
      $gold = r.gold;
      if (r.shares !== undefined) stockState[i].shares = r.shares;
      if (r.avg_buy_price !== undefined) stockState[i].avgBuy = r.avg_buy_price;
      stockState = [...stockState];
    }
  }

  async function sellStock(i, qty) {
    if (stockState[i].shares < qty) return;
    const r = await server.action('sell_stock', { index: i, qty });
    if (r && r.success) {
      $gold = r.gold;
      if (r.shares !== undefined) stockState[i].shares = r.shares;
      if (r.avg_buy_price !== undefined) stockState[i].avgBuy = r.avg_buy_price;
      stockState = [...stockState];
    }
  }

  function sellAllStock(i) {
    if (stockState[i].shares > 0) sellStock(i, stockState[i].shares);
  }
</script>

<div class="stocks-panel">
  {#if $marketEvent}
    {@const left = Math.max(0, ($marketEventEnd - Date.now()) / 1000)}
    {@const names = { bull:'🐂 Bullenmarkt (+Preise)', bear:'🐻 Bärenmarkt (-Preise)', crash:'💥 Crash!', boom:'🚀 Boom!' }}
    <div class="event-banner">{names[$marketEvent]} — {fmtTime(left)}</div>
  {/if}

  {#each stockState as s, i}
    {@const change = s.price - s.prevPrice}
    {@const changePct = s.prevPrice > 0 ? ((s.price / s.prevPrice - 1) * 100).toFixed(1) : '0.0'}
    {@const dir = change >= 0 ? 'up' : 'down'}
    {@const sign = change >= 0 ? '+' : ''}
    {@const profit = s.shares > 0 && s.avgBuy > 0 ? ((s.price - s.avgBuy) / s.avgBuy * 100).toFixed(1) : 0}
    {@const profitClass = profit >= 0 ? 'up' : 'down'}
    {@const buy1 = Math.floor($gold / (s.price * (1 + STOCK_FEE))) || 0}
    {@const feeAmt = Math.floor(s.price * STOCK_FEE)}

    <div class="stock">
      <div class="stock-top">
        <span class="stock-name">{s.name}</span>
        <span class="stock-price {dir}">{fmt(s.price)} 🪙 ({sign}{changePct}%)</span>
      </div>

      <div class="stock-chart">
        {#each s.history as h, idx}
          {@const h2 = (h / Math.max(...s.history) * 100).toFixed(0)}
          {@const prev = idx > 0 ? s.history[idx - 1] : h}
          {@const d = h >= prev ? 'up' : 'down'}
          <div class="stock-bar {d}" style="height:{h2}%"></div>
        {/each}
      </div>

      <div class="stock-holding">
        📦 {s.shares} Aktien
        {#if s.shares > 0}
          | Ø {fmt(s.avgBuy)} | P/L <span class="{profitClass}">{profit >= 0 ? '+' : ''}{profit}%</span>
        {/if}
      </div>

      <div class="stock-fee">💸 5% Gebühr (Kauf: +{fmt(feeAmt)}, Verkauf: -{fmt(feeAmt)})</div>

      <div class="stock-btns">
        <button class="stock-btn stock-buy" disabled={$gold < s.price * (1 + STOCK_FEE)} onclick={()=>buyStock(i,1)}>
          Kauf 1 ({fmt(Math.ceil(s.price * (1 + STOCK_FEE)))})
        </button>
        <button class="stock-btn stock-buy" disabled={buy1 < 1} onclick={()=>buyStock(i, buy1)}>
          Kauf {buy1}
        </button>
        <button class="stock-btn stock-sell" disabled={s.shares < 1} onclick={()=>sellStock(i,1)}>
          Verkauf 1
        </button>
        <button class="stock-btn stock-sell" disabled={s.shares < 1} onclick={()=>sellAllStock(i)}>
          Alles
        </button>
      </div>
    </div>
  {/each}
</div>