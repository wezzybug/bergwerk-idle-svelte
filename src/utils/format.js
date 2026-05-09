// Bergwerk Idle — Formatting & Utilities

export function fmt(n) {
  if (n < 1e3) return Math.floor(n).toLocaleString('de');
  if (n < 1e6) return (n / 1e3).toFixed(1) + 'K';
  if (n < 1e9) return (n / 1e6).toFixed(1) + 'M';
  if (n < 1e12) return (n / 1e9).toFixed(1) + 'B';
  return (n / 1e12).toFixed(1) + 'T';
}

export function fmtTime(s) {
  const m = Math.floor(s / 60);
  s = Math.floor(s % 60);
  return m > 0 ? m + ':' + (s < 10 ? '0' : '') + s + 's' : Math.floor(s) + 's';
}

export function cost(base, mult, count) {
  return Math.floor(base * Math.pow(mult, count));
}

export function calcMaxBuyable(base, mult, count, gold) {
  let n = 0;
  let total = 0;
  while (n < 10000) {
    const next = Math.floor(base * Math.pow(mult, count + n));
    if (total + next > gold) break;
    total += next;
    n++;
  }
  return n;
}

export function calcBatchCost(base, mult, count, qty) {
  if (qty <= 0) return 0;
  let total = 0;
  for (let i = 0; i < qty; i++) {
    total += Math.floor(base * Math.pow(mult, count + i));
  }
  return total;
}

export function generateDeviceId() {
  let id = localStorage.getItem('bergwerk_device_id');
  if (!id) {
    id = 'dev-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('bergwerk_device_id', id);
  }
  return id;
}