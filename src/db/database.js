// Pure Persistence, Encryption, Offline Sync Queue & Service Worker Layer

export const DB_NAME = 'SachNurseryERP_v7_Hybrid';
export const STORE_NAME = 'erp_store';
export const SYNC_QUEUE_KEY = 'offline_sync_queue';

export const encData = (txt = '') => {
  const bytes = new TextEncoder().encode(String(txt));
  let bin = '';
  bytes.forEach((b) => { bin += String.fromCharCode(b); });
  return btoa(bin);
};

export const decData = (cipher = '') => {
  try {
    const bin = atob(cipher);
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return cipher;
  }
};

export function createMemoryAdapter() {
  const store = new Map();
  return {
    async get(key) { return store.has(key) ? structuredClone(store.get(key)) : null; },
    async set(key, value) { store.set(key, structuredClone(value)); return true; }
  };
}

export function createBrowserAdapter() {
  const open = () => new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

  return {
    async get(key) {
      try {
        const db = await open();
        return await new Promise((resolve) => {
          const req = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(key);
          req.onsuccess = () => resolve(req.result ?? null);
          req.onerror = () => resolve(null);
        });
      } catch {
        try {
          const raw = localStorage.getItem('sach7_' + key);
          return raw ? JSON.parse(raw) : null;
        } catch { return null; }
      }
    },
    async set(key, value) {
      try { localStorage.setItem('sach7_' + key, JSON.stringify(value)); } catch {}
      try {
        const db = await open();
        return await new Promise((resolve) => {
          const tx = db.transaction(STORE_NAME, 'readwrite');
          tx.objectStore(STORE_NAME).put(value, key);
          tx.oncomplete = () => resolve(true);
          tx.onerror = () => resolve(false);
        });
      } catch { return false; }
    }
  };
}

export class DatabaseService {
  constructor(adapter) {
    this.adapter = adapter || (typeof indexedDB !== 'undefined' ? createBrowserAdapter() : createMemoryAdapter());
  }

  get(key) { return this.adapter.get(key); }
  set(key, value) { return this.adapter.set(key, value); }

  async seedIfNeeded(seedMap) {
    const initialized = await this.get('init_v7');
    if (initialized) return false;
    for (const [k, v] of Object.entries(seedMap)) {
      await this.set(k, v);
    }
    await this.set('init_v7', true);
    return true;
  }

  async enqueueOfflineSync(entry) {
    const current = (await this.get(SYNC_QUEUE_KEY)) || [];
    const next = [...current, { ...entry, queuedAt: Date.now() }];
    await this.set(SYNC_QUEUE_KEY, next);
    return next;
  }

  async flushOfflineSync() {
    const current = (await this.get(SYNC_QUEUE_KEY)) || [];
    if (!current.length) return [];
    await this.set(SYNC_QUEUE_KEY, []);
    return current;
  }
}

export function registerHybridServiceWorker() {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator) || location.protocol === 'file:') return;
  const swCode = `
    const CACHE = 'sach-hybrid-v7';
    self.addEventListener('install', () => self.skipWaiting());
    self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
    self.addEventListener('fetch', (e) => {
      if (e.request.method !== 'GET') return;
      e.respondWith(
        fetch(e.request).then((res) => {
          const cp = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, cp)).catch(() => {});
          return res;
        }).catch(() => caches.match(e.request))
      );
    });
    self.addEventListener('sync', (e) => {
      if (e.tag === 'nursery-bg-sync') {
        e.waitUntil(self.clients.matchAll().then((cls) => cls.forEach((cl) => cl.postMessage({ type: 'RUN_BG_SYNC' }))));
      }
    });
  `;
  try {
    const url = URL.createObjectURL(new Blob([swCode], { type: 'application/javascript' }));
    navigator.serviceWorker.register(url).catch(() => {});
  } catch {}
}
