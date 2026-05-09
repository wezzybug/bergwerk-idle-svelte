// Bergwerk Idle — Server Service (CLOUD-ONLY)
// All game logic on server. Client only displays and sends actions.
// V2: Retry backoff, online/offline detection, fail tracking
import { writable } from 'svelte/store';

const APIKEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtaXF0ZXJlZ3F5dWZ5aW9kc21qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYyOTY4MjAsImV4cCI6MjA2MTg3MjgyMH0.KFn0VjLQOZ3b0J8pXfC7s5n4Yr2vH6m9qR3wL5kJXcI';
const BASE = 'https://xmiqereagqyufyiodsmj.supabase.co/functions/v1';

export const serverOnline = writable(true);
export const lastSync = writable(0);

// Exponential backoff: 5s → 10s → 30s → 60s
const BACKOFF_SLOTS = [5000, 10000, 30000, 60000];

class Server {
  constructor() {
    this.deviceId = null;
    this.failCount = 0;
    this.backoffTimer = null;

    this._onOnline = () => {
      this.failCount = 0;
      serverOnline.set(true);
      console.log('[Server] browser online');
    };
    this._onOffline = () => {
      serverOnline.set(false);
      // Jump to failCount=2 so immediate retries don't flood
      this.failCount = Math.max(this.failCount, 2);
      console.log('[Server] browser offline');
    };
  }

  init(id) {
    this.deviceId = id;
    console.log('[Server] init', id);

    if (typeof window !== 'undefined') {
      window.addEventListener('online', this._onOnline);
      window.addEventListener('offline', this._onOffline);
      if (!navigator.onLine) this._onOffline();
    }
  }

  /** Call on app teardown to release listeners & timers */
  destroy() {
    if (this.backoffTimer) clearTimeout(this.backoffTimer);
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this._onOnline);
      window.removeEventListener('offline', this._onOffline);
    }
  }

  // ---- internal helpers ----

  _onSuccess() {
    if (this.failCount > 0) {
      this.failCount = 0;
      if (this.backoffTimer) { clearTimeout(this.backoffTimer); this.backoffTimer = null; }
      serverOnline.set(true);
    }
  }

  _onFail(label) {
    if (!navigator.onLine) {
      // Don't increment backoff when we know we're offline
      serverOnline.set(false);
      return;
    }
    this.failCount = Math.min(this.failCount + 1, BACKOFF_SLOTS.length);
    const delay = BACKOFF_SLOTS[this.failCount - 1] || 60000;
    console.warn(`[Server] ${label} fail (#${this.failCount}), backoff ${delay / 1000}s`);
    serverOnline.set(false);
    if (this.backoffTimer) clearTimeout(this.backoffTimer);
    this.backoffTimer = setTimeout(() => {
      console.log('[Server] backoff expired, reset failCount');
      this.failCount = 0;
      serverOnline.set(true);
    }, delay);
  }

  // ---- public API ----

  async action(action, data = {}) {
    if (!navigator.onLine) return null;
    try {
      const res = await fetch(`${BASE}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-device-id': this.deviceId, 'apikey': APIKEY },
        body: JSON.stringify({ action, data })
      });
      if (res.ok) { this._onSuccess(); return await res.json(); }
      this._onFail(`action:${action}`);
      return null;
    } catch (e) { this._onFail(`action:${action}`); return null; }
  }

  async sync() {
    if (!this.deviceId) return null;
    if (!navigator.onLine) { serverOnline.set(false); return null; }
    try {
      const res = await fetch(`${BASE}/sync?device_id=${encodeURIComponent(this.deviceId)}`, {
        headers: { 'apikey': APIKEY }
      });
      if (!res.ok) { this._onFail('sync'); return null; }
      const data = await res.json();
      lastSync.set(Date.now());
      this._onSuccess();
      return data;
    } catch (e) { this._onFail('sync'); return null; }
  }

  async push(state) {
    if (!this.deviceId || !navigator.onLine) return;
    try {
      await fetch(`${BASE}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-device-id': this.deviceId, 'apikey': APIKEY },
        body: JSON.stringify(state)
      });
      this._onSuccess();
    } catch (e) { this._onFail('push'); }
  }

  async leaderboard(type = 'gold', limit = 10) {
    if (!navigator.onLine) return null;
    try {
      const res = await fetch(`${BASE}/leaderboard?type=${type}&limit=${limit}`, { headers: { 'apikey': APIKEY } });
      if (!res.ok) { this._onFail('leaderboard'); return null; }
      this._onSuccess();
      return await res.json();
    } catch (e) { this._onFail('leaderboard'); return null; }
  }

  async watchAd(type) {
    if (!navigator.onLine) return null;
    try {
      const res = await fetch(`${BASE}/watch-ad`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-device-id': this.deviceId, 'apikey': APIKEY },
        body: JSON.stringify({ ad_type: type })
      });
      if (!res.ok) { this._onFail('watchAd'); return null; }
      this._onSuccess();
      return await res.json();
    } catch (e) { this._onFail('watchAd'); return null; }
  }
}

export const server = new Server();