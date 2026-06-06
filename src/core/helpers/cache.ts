import { redisClient } from '../../config/redis.db'
import { config } from '../../config/config'

/**
 * Cache helper utility for Redis-based caching
 * Provides a cache-aside pattern for storing and retrieving data
 */
export class CacheHelper {
    private static readonly PREFIX = 'cache'

    /**
     * Generate a consistent cache key from prefix and query parameters
     * 
     * @param {string} prefix - Cache namespace prefix (e.g., 'direksi', 'vp-ab')
     * @param {string} path - Request path (e.g., '/general/revenue')
     * @param {Record<string, string>} params - Query parameters
     * @returns {string} Formatted cache key
     */
    static generateKey(prefix: string, path: string, params: Record<string, string> = {}): string {
        const sortedParams = Object.keys(params)
            .sort()
            .map(key => `${key}=${params[key]}`)
            .join('&')

        return sortedParams
            ? `${this.PREFIX}:${prefix}:${path}:${sortedParams}`
            : `${this.PREFIX}:${prefix}:${path}`
    }

    /**
     * Get cached data from Redis
     * 
     * @param {string} key - Cache key
     * @returns {Promise<T | null>} Parsed cached data or null if miss
     */
    static async get<T>(key: string): Promise<T | null> {
        try {
            const data = await redisClient.get(key)
            if (!data) return null
            return JSON.parse(data) as T
        } catch {
            return null
        }
    }

    /**
     * Store data in Redis with TTL
     * 
     * @param {string} key - Cache key
     * @param {any} data - Data to cache (will be JSON stringified)
     * @param {number} ttl - Time-to-live in seconds (default: from config)
     */
    static async set(key: string, data: any, ttl?: number): Promise<void> {
        try {
            const expiry = ttl || config.redis.ttl
            await redisClient.set(key, JSON.stringify(data), 'EX', expiry)
        } catch (error) {
            console.error(`[Cache] Failed to SET key "${key}":`, error)
        }
    }

    /**
     * Invalidate cache entries matching a pattern
     * Uses Redis SCAN to avoid blocking
     * 
     * @param {string} pattern - Glob pattern for keys to invalidate (e.g., 'cache:direksi:*')
     */
    static async invalidate(pattern: string): Promise<void> {
        try {
            let cursor = '0'
            do {
                const [nextCursor, keys] = await redisClient.scan(cursor, 'MATCH', pattern, 'COUNT', 100)
                cursor = nextCursor
                if (keys.length > 0) {
                    await redisClient.del(...keys)
                }
            } while (cursor !== '0')
        } catch (error) {
            console.error(`[Cache] Failed to INVALIDATE pattern "${pattern}":`, error)
        }
    }

    /**
     * Cache-aside pattern: check cache first, fetch from source on miss
     * 
     * @param {string} key - Cache key
     * @param {() => Promise<T>} fetcher - Function to call on cache miss
     * @param {number} ttl - Time-to-live in seconds
     * @returns {Promise<T>} Cached or freshly-fetched data
     */
    static async wrap<T>(key: string, fetcher: () => Promise<T>, ttl?: number): Promise<T> {
        const cached = await this.get<T>(key)
        if (cached !== null) {
            return cached
        }

        const data = await fetcher()
        await this.set(key, data, ttl)
        return data
    }
}
