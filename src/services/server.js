// Bergwerk Idle — Server Service (Supabase Edge Functions)
import { writable } from 'svelte/store';

const APIKEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtaXF0ZXJlZ3F5dWZ5aW9kc21qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYyOTY4MjAsImV4cCI6MjA2MTg3MjgyMH0.KFn0VjLQOZ3b0J8pXfC7s5n4Yr2vH6m9qR3wL5kJXcI';
const BASE_URL = 'https://xmiqereagqyufyiodsmj.supabase.co/functions/v1';

export const serverOnline = writable(true);
export const lastSync = writable(0);

class ServerService {
  constructor() {
    this.deviceId = null;
    this.pending = false;
    this.syncTimer = null;
  }

  init(deviceId) {
    this.deviceId = deviceId;
    // Sync alle 30s
    this.syncTimer = setInterval(() => this.sync(), 30000);
    // Erster Sync nach 2s
    setTimeout(() => this.sync(), 2000);
    console.log('[Server] Init, deviceId:', deviceId);
  }

  async action(action, data = {}) {
    try {
      const res = await fetch(`${BASE_URL}/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-device-id': this.deviceId,
          'apikey': APIKEY
        },
        body: JSON.stringify({ action, data })
      });
      if (res.ok) {
        const r = await res.json();
        serverOnline.set(true);
        return r;
      }
      console.warn('[Server] Action failed:', action, res.status);
      return null;
    } catch (e) {
      console.warn('[Server] Action error:', e);
      serverOnline.set(false);
      return null;
    }
  }

  async sync() {
    if (!this.deviceId || this.pending) return;
    this.pending = true;
    try {
      // GET — Server-Daten laden
      const res = await fetch(`${BASE_URL}/sync?device_id=${encodeURIComponent(this.deviceId)}`, {
        headers: { 'apikey': APIKEY }
      });
      if (!res.ok) { this.pending = false; return; }
      const data = await res.json();
      lastSync.set(Date.now());
      serverOnline.set(true);
      return data;
    } catch (e) {
      console.warn('[Server] Sync error:', e);
      serverOnline.set(false);
    }
    this.pending = false;
  }

  async push(payload) {
    if (!this.deviceId) return;
    try {
      const res = await fetch(`${BASE_URL}/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-device-id': this.deviceId,
          'apikey': APIKEY
        },
        body: JSON.stringify(payload)
      });
      return res.ok;
    } catch (e) {
      console.warn('[Server] Push error:', e);
      return false;
    }
  }

  async leaderboard(type = 'gold', limit = 10) {
    try {
      const res = await fetch(`${BASE_URL}/leaderboard?type=${type}&limit=${limit}`, {
        headers: { 'apikey': APIKEY }
      });
      return res.ok ? await res.json() : null;
    } catch (e) { return null; }
  }

  async watchAd(adType) {
    try {
      const res = await fetch(`${BASE_URL}/watch-ad`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-device-id': this.deviceId,
          'apikey': APIKEY
        },
        body: JSON.stringify({ ad_type: adType })
      });
      return res.ok ? await res.json() : null;
    } catch (e) { return null; }
  }

  destroy() {
    if (this.syncTimer) clearInterval(this.syncTimer);
  }
}

export const server = new ServerService();