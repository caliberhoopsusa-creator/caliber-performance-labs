const CACHE_PREFIX = "caliber_cache_";
const MUTATION_QUEUE_KEY = "caliber_mutation_queue";
const DEFAULT_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

interface CachedItem<T> {
  data: T;
  timestamp: number;
  expiryMs: number;
}

interface QueuedMutation {
  id: string;
  method: string;
  url: string;
  data?: unknown;
  timestamp: number;
}

export function cacheData<T>(key: string, data: T, expiryMs: number = DEFAULT_EXPIRY_MS): void {
  try {
    const cacheKey = CACHE_PREFIX + key;
    const item: CachedItem<T> = {
      data,
      timestamp: Date.now(),
      expiryMs,
    };
    localStorage.setItem(cacheKey, JSON.stringify(item));
  } catch (error) {
    console.warn("Failed to cache data:", error);
  }
}

export function getCachedData<T>(key: string): { data: T; timestamp: number } | null {
  try {
    const cacheKey = CACHE_PREFIX + key;
    const stored = localStorage.getItem(cacheKey);
    if (!stored) return null;

    const item: CachedItem<T> = JSON.parse(stored);
    const now = Date.now();
    const isExpired = now - item.timestamp > item.expiryMs;

    if (isExpired) {
      localStorage.removeItem(cacheKey);
      return null;
    }

    return { data: item.data, timestamp: item.timestamp };
  } catch (error) {
    console.warn("Failed to get cached data:", error);
    return null;
  }
}

export function getCacheTimestamp(key: string): number | null {
  try {
    const cacheKey = CACHE_PREFIX + key;
    const stored = localStorage.getItem(cacheKey);
    if (!stored) return null;

    const item: CachedItem<unknown> = JSON.parse(stored);
    return item.timestamp;
  } catch {
    return null;
  }
}

export function clearCache(): void {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(CACHE_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch (error) {
    console.warn("Failed to clear cache:", error);
  }
}

export function clearExpiredCache(): void {
  try {
    const now = Date.now();
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(CACHE_PREFIX)) {
        const stored = localStorage.getItem(key);
        if (stored) {
          try {
            const item: CachedItem<unknown> = JSON.parse(stored);
            if (now - item.timestamp > item.expiryMs) {
              keysToRemove.push(key);
            }
          } catch {
            keysToRemove.push(key);
          }
        }
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch (error) {
    console.warn("Failed to clear expired cache:", error);
  }
}

export function queueMutation(method: string, url: string, data?: unknown): void {
  try {
    const queue = getMutationQueue();
    const mutation: QueuedMutation = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
      method,
      url,
      data,
      timestamp: Date.now(),
    };
    queue.push(mutation);
    localStorage.setItem(MUTATION_QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.warn("Failed to queue mutation:", error);
  }
}

export function getMutationQueue(): QueuedMutation[] {
  try {
    const stored = localStorage.getItem(MUTATION_QUEUE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function removeMutationFromQueue(id: string): void {
  try {
    const queue = getMutationQueue();
    const filtered = queue.filter((m) => m.id !== id);
    localStorage.setItem(MUTATION_QUEUE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.warn("Failed to remove mutation from queue:", error);
  }
}

export function clearMutationQueue(): void {
  try {
    localStorage.removeItem(MUTATION_QUEUE_KEY);
  } catch (error) {
    console.warn("Failed to clear mutation queue:", error);
  }
}

export function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
}

export interface SyncResult {
  totalMutations: number;
  successfulMutations: number;
  failedMutations: number;
  failedMutationIds: string[];
}

export async function syncQueuedMutations(): Promise<SyncResult> {
  const queue = getMutationQueue();
  
  const result: SyncResult = {
    totalMutations: queue.length,
    successfulMutations: 0,
    failedMutations: 0,
    failedMutationIds: [],
  };

  if (queue.length === 0) {
    return result;
  }

  for (const mutation of queue) {
    try {
      const response = await fetch(mutation.url, {
        method: mutation.method,
        headers: mutation.data ? { "Content-Type": "application/json" } : {},
        body: mutation.data ? JSON.stringify(mutation.data) : undefined,
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }

      removeMutationFromQueue(mutation.id);
      result.successfulMutations++;
    } catch (error) {
      console.error(`Failed to sync mutation ${mutation.id}:`, error);
      result.failedMutations++;
      result.failedMutationIds.push(mutation.id);
    }
  }

  return result;
}
