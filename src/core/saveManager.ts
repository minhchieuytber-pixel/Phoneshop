import type { GameState } from './types';

const DB_NAME = 'PhoneStoreSimulator3D_DB';
const DB_VERSION = 1;
const STORE_NAME = 'saves';
const SAVE_KEY = 'primary_slot';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveGameState(state: GameState): Promise<boolean> {
  try {
    const payload = {
      savedAt: Date.now(),
      state,
    };
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const putReq = store.put(payload, SAVE_KEY);
      putReq.onsuccess = () => resolve();
      putReq.onerror = () => reject(putReq.error);
    });
    db.close();
    return true;
  } catch {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({ savedAt: Date.now(), state }));
      return true;
    } catch {
      return false;
    }
  }
}

export async function loadGameState(): Promise<{ savedAt: number; state: GameState } | null> {
  try {
    const db = await openDB();
    const result = await new Promise<{ savedAt: number; state: GameState } | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const getReq = store.get(SAVE_KEY);
      getReq.onsuccess = () => resolve(getReq.result ?? null);
      getReq.onerror = () => reject(getReq.error);
    });
    db.close();
    if (result && result.state) return result;
  } catch {
    // Fallback to localStorage
  }

  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.state) return parsed;
  } catch {
    return null;
  }
  return null;
}

export async function clearSavedGame(): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const delReq = store.delete(SAVE_KEY);
      delReq.onsuccess = () => resolve();
      delReq.onerror = () => reject(delReq.error);
    });
    db.close();
  } catch {
    // ignore
  }
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    // ignore
  }
}
