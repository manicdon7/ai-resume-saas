/**
 * Offline Storage Manager
 * Handles caching and offline data management
 */

/**
 * Storage types
 */
export const StorageTypes = {
  MEMORY: 'memory',
  LOCAL_STORAGE: 'localStorage',
  SESSION_STORAGE: 'sessionStorage',
  INDEXED_DB: 'indexedDB'
};

/**
 * Cache strategies
 */
export const CacheStrategies = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  CACHE_ONLY: 'cache-only',
  NETWORK_ONLY: 'network-only',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate'
};

/**
 * Offline Storage Manager Class
 */
class OfflineStorageManager {
  constructor() {
    this.memoryCache = new Map();
    this.cacheConfig = new Map();
    this.defaultTTL = 5 * 60 * 1000; // 5 minutes
    this.maxMemoryCacheSize = 100;
    
    this.initializeIndexedDB();
  }

  /**
   * Initialize IndexedDB for larger data storage
   */
  async initializeIndexedDB() {
    if (typeof window === 'undefined' || !window.indexedDB) {
      console.warn('IndexedDB not available');
      return;
    }

    try {
      this.db = await this.openIndexedDB();
    } catch (error) {
      console.error('Failed to initialize IndexedDB:', error);
    }
  }

  /**
   * Open IndexedDB connection
   */
  openIndexedDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('OfflineCache', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create object stores
        if (!db.objectStoreNames.contains('cache')) {
          const store = db.createObjectStore('cache', { keyPath: 'key' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('ttl', 'ttl', { unique: false });
        }
      };
    });
  }

  /**
   * Set cache configuration for a key pattern
   */
  setCacheConfig(keyPattern, config) {
    this.cacheConfig.set(keyPattern, {
      ttl: this.defaultTTL,
      storageType: StorageTypes.MEMORY,
      strategy: CacheStrategies.CACHE_FIRST,
      ...config
    });
  }

  /**
   * Get cache configuration for a key
   */
  getCacheConfig(key) {
    for (const [pattern, config] of this.cacheConfig.entries()) {
      if (key.match(new RegExp(pattern))) {
        return config;
      }
    }
    
    // Default configuration
    return {
      ttl: this.defaultTTL,
      storageType: StorageTypes.MEMORY,
      strategy: CacheStrategies.CACHE_FIRST
    };
  }

  /**
   * Store data in cache
   */
  async set(key, data, options = {}) {
    const config = this.getCacheConfig(key);
    const ttl = options.ttl || config.ttl;
    const storageType = options.storageType || config.storageType;
    
    const cacheEntry = {
      key,
      data,
      timestamp: Date.now(),
      ttl,
      expiresAt: Date.now() + ttl
    };

    try {
      switch (storageType) {
        case StorageTypes.MEMORY:
          await this.setMemoryCache(key, cacheEntry);
          break;
        case StorageTypes.LOCAL_STORAGE:
          await this.setLocalStorage(key, cacheEntry);
          break;
        case StorageTypes.SESSION_STORAGE:
          await this.setSessionStorage(key, cacheEntry);
          break;
        case StorageTypes.INDEXED_DB:
          await this.setIndexedDB(key, cacheEntry);
          break;
        default:
          await this.setMemoryCache(key, cacheEntry);
      }
    } catch (error) {
      console.error(`Failed to cache data for key ${key}:`, error);
      // Fallback to memory cache
      await this.setMemoryCache(key, cacheEntry);
    }
  }

  /**
   * Get data from cache
   */
  async get(key, options = {}) {
    const config = this.getCacheConfig(key);
    const storageType = options.storageType || config.storageType;

    try {
      let cacheEntry;

      switch (storageType) {
        case StorageTypes.MEMORY:
          cacheEntry = await this.getMemoryCache(key);
          break;
        case StorageTypes.LOCAL_STORAGE:
          cacheEntry = await this.getLocalStorage(key);
          break;
        case StorageTypes.SESSION_STORAGE:
          cacheEntry = await this.getSessionStorage(key);
          break;
        case StorageTypes.INDEXED_DB:
          cacheEntry = await this.getIndexedDB(key);
          break;
        default:
          cacheEntry = await this.getMemoryCache(key);
      }

      if (!cacheEntry) {
        return null;
      }

      // Check if cache entry has expired
      if (cacheEntry.expiresAt && Date.now() > cacheEntry.expiresAt) {
        await this.delete(key, { storageType });
        return null;
      }

      return {
        data: cacheEntry.data,
        timestamp: cacheEntry.timestamp,
        age: Date.now() - cacheEntry.timestamp,
        isStale: options.maxAge ? (Date.now() - cacheEntry.timestamp) > options.maxAge : false
      };
    } catch (error) {
      console.error(`Failed to get cached data for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Delete data from cache
   */
  async delete(key, options = {}) {
    const config = this.getCacheConfig(key);
    const storageType = options.storageType || config.storageType;

    try {
      switch (storageType) {
        case StorageTypes.MEMORY:
          this.memoryCache.delete(key);
          break;
        case StorageTypes.LOCAL_STORAGE:
          if (typeof localStorage !== 'undefined') {
            localStorage.removeItem(`cache_${key}`);
          }
          break;
        case StorageTypes.SESSION_STORAGE:
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.removeItem(`cache_${key}`);
          }
          break;
        case StorageTypes.INDEXED_DB:
          await this.deleteIndexedDB(key);
          break;
      }
    } catch (error) {
      console.error(`Failed to delete cached data for key ${key}:`, error);
    }
  }

  /**
   * Clear all cache data
   */
  async clear(storageType = null) {
    try {
      if (!storageType || storageType === StorageTypes.MEMORY) {
        this.memoryCache.clear();
      }

      if (!storageType || storageType === StorageTypes.LOCAL_STORAGE) {
        if (typeof localStorage !== 'undefined') {
          const keys = Object.keys(localStorage).filter(key => key.startsWith('cache_'));
          keys.forEach(key => localStorage.removeItem(key));
        }
      }

      if (!storageType || storageType === StorageTypes.SESSION_STORAGE) {
        if (typeof sessionStorage !== 'undefined') {
          const keys = Object.keys(sessionStorage).filter(key => key.startsWith('cache_'));
          keys.forEach(key => sessionStorage.removeItem(key));
        }
      }

      if (!storageType || storageType === StorageTypes.INDEXED_DB) {
        await this.clearIndexedDB();
      }
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  /**
   * Memory cache operations
   */
  async setMemoryCache(key, cacheEntry) {
    // Implement LRU eviction if cache is full
    if (this.memoryCache.size >= this.maxMemoryCacheSize) {
      const firstKey = this.memoryCache.keys().next().value;
      this.memoryCache.delete(firstKey);
    }
    
    this.memoryCache.set(key, cacheEntry);
  }

  async getMemoryCache(key) {
    return this.memoryCache.get(key) || null;
  }

  /**
   * LocalStorage operations
   */
  async setLocalStorage(key, cacheEntry) {
    if (typeof localStorage === 'undefined') return;
    
    try {
      localStorage.setItem(`cache_${key}`, JSON.stringify(cacheEntry));
    } catch (error) {
      // Handle quota exceeded error
      if (error.name === 'QuotaExceededError') {
        await this.clearOldEntries(StorageTypes.LOCAL_STORAGE);
        localStorage.setItem(`cache_${key}`, JSON.stringify(cacheEntry));
      } else {
        throw error;
      }
    }
  }

  async getLocalStorage(key) {
    if (typeof localStorage === 'undefined') return null;
    
    try {
      const item = localStorage.getItem(`cache_${key}`);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Failed to parse cached data for key ${key}:`, error);
      return null;
    }
  }

  /**
   * SessionStorage operations
   */
  async setSessionStorage(key, cacheEntry) {
    if (typeof sessionStorage === 'undefined') return;
    
    try {
      sessionStorage.setItem(`cache_${key}`, JSON.stringify(cacheEntry));
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        await this.clearOldEntries(StorageTypes.SESSION_STORAGE);
        sessionStorage.setItem(`cache_${key}`, JSON.stringify(cacheEntry));
      } else {
        throw error;
      }
    }
  }

  async getSessionStorage(key) {
    if (typeof sessionStorage === 'undefined') return null;
    
    try {
      const item = sessionStorage.getItem(`cache_${key}`);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Failed to parse cached data for key ${key}:`, error);
      return null;
    }
  }

  /**
   * IndexedDB operations
   */
  async setIndexedDB(key, cacheEntry) {
    if (!this.db) return;
    
    const transaction = this.db.transaction(['cache'], 'readwrite');
    const store = transaction.objectStore('cache');
    
    return new Promise((resolve, reject) => {
      const request = store.put(cacheEntry);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getIndexedDB(key) {
    if (!this.db) return null;
    
    const transaction = this.db.transaction(['cache'], 'readonly');
    const store = transaction.objectStore('cache');
    
    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteIndexedDB(key) {
    if (!this.db) return;
    
    const transaction = this.db.transaction(['cache'], 'readwrite');
    const store = transaction.objectStore('cache');
    
    return new Promise((resolve, reject) => {
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clearIndexedDB() {
    if (!this.db) return;
    
    const transaction = this.db.transaction(['cache'], 'readwrite');
    const store = transaction.objectStore('cache');
    
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clear old entries to free up space
   */
  async clearOldEntries(storageType) {
    try {
      if (storageType === StorageTypes.LOCAL_STORAGE && typeof localStorage !== 'undefined') {
        const keys = Object.keys(localStorage).filter(key => key.startsWith('cache_'));
        const entries = keys.map(key => {
          try {
            const data = JSON.parse(localStorage.getItem(key));
            return { key, timestamp: data.timestamp };
          } catch {
            return { key, timestamp: 0 };
          }
        });
        
        // Sort by timestamp and remove oldest 25%
        entries.sort((a, b) => a.timestamp - b.timestamp);
        const toRemove = entries.slice(0, Math.floor(entries.length * 0.25));
        toRemove.forEach(entry => localStorage.removeItem(entry.key));
      }

      if (storageType === StorageTypes.SESSION_STORAGE && typeof sessionStorage !== 'undefined') {
        const keys = Object.keys(sessionStorage).filter(key => key.startsWith('cache_'));
        const entries = keys.map(key => {
          try {
            const data = JSON.parse(sessionStorage.getItem(key));
            return { key, timestamp: data.timestamp };
          } catch {
            return { key, timestamp: 0 };
          }
        });
        
        entries.sort((a, b) => a.timestamp - b.timestamp);
        const toRemove = entries.slice(0, Math.floor(entries.length * 0.25));
        toRemove.forEach(entry => sessionStorage.removeItem(entry.key));
      }
    } catch (error) {
      console.error('Failed to clear old cache entries:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getStats() {
    const stats = {
      memory: {
        size: this.memoryCache.size,
        maxSize: this.maxMemoryCacheSize
      },
      localStorage: { size: 0 },
      sessionStorage: { size: 0 },
      indexedDB: { size: 0 }
    };

    try {
      if (typeof localStorage !== 'undefined') {
        const keys = Object.keys(localStorage).filter(key => key.startsWith('cache_'));
        stats.localStorage.size = keys.length;
      }

      if (typeof sessionStorage !== 'undefined') {
        const keys = Object.keys(sessionStorage).filter(key => key.startsWith('cache_'));
        stats.sessionStorage.size = keys.length;
      }

      if (this.db) {
        const transaction = this.db.transaction(['cache'], 'readonly');
        const store = transaction.objectStore('cache');
        
        stats.indexedDB.size = await new Promise((resolve, reject) => {
          const request = store.count();
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
      }
    } catch (error) {
      console.error('Failed to get cache stats:', error);
    }

    return stats;
  }

  /**
   * Check if data exists in cache
   */
  async has(key, options = {}) {
    const cached = await this.get(key, options);
    return cached !== null;
  }

  /**
   * Get multiple cache entries
   */
  async getMultiple(keys, options = {}) {
    const results = {};
    
    await Promise.all(
      keys.map(async (key) => {
        results[key] = await this.get(key, options);
      })
    );
    
    return results;
  }

  /**
   * Set multiple cache entries
   */
  async setMultiple(entries, options = {}) {
    await Promise.all(
      Object.entries(entries).map(([key, data]) => 
        this.set(key, data, options)
      )
    );
  }
}

// Create singleton instance
const offlineStorage = new OfflineStorageManager();

// Export convenience functions
export const setCache = (key, data, options) => offlineStorage.set(key, data, options);
export const getCache = (key, options) => offlineStorage.get(key, options);
export const deleteCache = (key, options) => offlineStorage.delete(key, options);
export const clearCache = (storageType) => offlineStorage.clear(storageType);
export const setCacheConfig = (keyPattern, config) => offlineStorage.setCacheConfig(keyPattern, config);
export const getCacheStats = () => offlineStorage.getStats();

export default offlineStorage;