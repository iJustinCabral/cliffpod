import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 3600 }); // 1 hour default TTL

export const CacheService = {
  get: (key: string) => cache.get(key),
  set: (key: string, value: any, ttl?: number) => {
    if (ttl !== undefined) {
      return cache.set(key, value, ttl);
    }
    return cache.set(key, value);
  },
  del: (key: string) => cache.del(key),
};