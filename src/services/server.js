// Bergwerk Idle — Server Service (CLOUD-ONLY)
// All game logic on server. Client only displays and sends actions.
import { writable } from 'svelte/store';

const APIKEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtaXF0ZXJlZ3F5dWZ5aW9kc21qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYyOTY4MjAsImV4cCI6MjA2MTg3MjgyMH0.KFn0VjLQOZ3b0J8pXfC7s5n4Yr2vH6m9qR3wL5kJXcI';
const BASE = 'https://xmiqereagqyufyiodsmj.supabase.co/functions/v1';

export const serverOnline = writable(true);
export const lastSync = writable(0);

class Server {
  constructor() { this.deviceId = null; }

  init(id) {
    this.deviceId = id;
    console.log('[Server] init', id);
  }

  async action(action, data = {}) {
    try {
      const res = await fetch(`${BASE}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-device-id': this.deviceId, 'apikey': APIKEY },
        body: JSON.stringify({ action, data })
      });
      if (res.ok) { serverOnline.set(true); return await res.json(); }
      console.warn('[Server] action fail:', action, res.status);
      return null;
    } catch (e) { console.warn('[Server] error:', e); serverOnline.set(false); return null; }
  }

  async sync() {
    if (!this.deviceId) return null;
    try {
      const res = await fetch(`${BASE}/sync?device_id=${encodeURIComponent(this.deviceId)}`, {
        headers: { 'apikey': APIKEY }
      });
      if (!res.ok) return null;
      const data = await res.json();
      lastSync.set(Date.now());
      serverOnline.set(true);
      return data;
    } catch (e) { console.warn('[Server] sync error:', e); serverOnline.set(false); return null; }
  }

  async push(state) {
    if (!this.deviceId) return;
    try {
      await fetch(`${BASE}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-device-id': this.deviceId, 'apikey': APIKEY },
        body: JSON.stringify(state)
      });
    } catch (e) { console.warn('[Server] push error:', e); }
  }

  async leaderboard(type = 'gold', limit = 10) {
    try {
      const res = await fetch(`${BASE}/leaderboard?type=${type}&limit=${limit}`, { headers: { 'apikey': APIKEY } });
      return res.ok ? await res.json() : null;
    } catch (e) { return null; }
  }

  async watchAd(type) {
    try {
      const res = await fetch(`${BASE}/watch-ad`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-device-id': this.deviceId, 'apikey': APIKEY },
        body: JSON.stringify({ ad_type: type })
      });
      return res.ok ? await res.json() : null;
    } catch (e) { return null; }
  }
}

export const server = new Server();