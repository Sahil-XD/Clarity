/**
 * Clarity SWR In-Memory Cache
 * Provides zero-latency tab switching (0ms) by serving fresh in-memory data
 * while silently revalidating in the background.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<unknown>>();
const listeners = new Map<string, Set<(data: any) => void>>();

// Default TTL: 30 seconds
const DEFAULT_MAX_AGE_MS = 30_000;

export const dataCache = {
  get<T>(key: string, maxAgeMs = DEFAULT_MAX_AGE_MS): T | null {
    const entry = cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > maxAgeMs) {
      // Stale, but caller can still use it for SWR if desired
      return entry.data as T;
    }
    return entry.data as T;
  },

  isStale(key: string, maxAgeMs = DEFAULT_MAX_AGE_MS): boolean {
    const entry = cache.get(key);
    if (!entry) return true;
    return Date.now() - entry.timestamp > maxAgeMs;
  },

  set<T>(key: string, data: T): void {
    cache.set(key, { data, timestamp: Date.now() });
    const callbacks = listeners.get(key);
    if (callbacks) {
      callbacks.forEach((cb) => cb(data));
    }
  },

  invalidate(prefix?: string): void {
    if (!prefix) {
      cache.clear();
      return;
    }
    for (const key of cache.keys()) {
      if (key.startsWith(prefix)) {
        cache.delete(key);
      }
    }
  },

  subscribe<T>(key: string, callback: (data: T) => void): () => void {
    if (!listeners.has(key)) {
      listeners.set(key, new Set());
    }
    listeners.get(key)!.add(callback);
    return () => {
      listeners.get(key)?.delete(callback);
    };
  },
};
