import { CacheHelper } from '../core/helpers/cache'
import { redisClient } from '../config/redis'
import { config } from '../config/config'

/**
 * Daily cache prefill scheduler
 * Invalidates all cache entries and triggers fresh data loading
 * Runs at application startup and every 24 hours thereafter
 */

const PREFILL_INTERVAL_MS = 24 * 60 * 60 * 1000 // 24 hours

/**
 * Execute cache invalidation for all prefixes
 * Clears all cached snapshot data so the next request triggers a fresh DB fetch
 * 
 * @returns {Promise<void>}
 */
export async function invalidateAllCache(): Promise<void> {
    console.log('[CachePrefill] Starting cache invalidation...')

    try {
        await CacheHelper.invalidate('cache:direksi:*')
        await CacheHelper.invalidate('cache:vp-ab:*')
        console.log('[CachePrefill] All cache invalidated successfully')
    } catch (error) {
        console.error('[CachePrefill] Cache invalidation failed:', error)
    }
}

/**
 * Start the daily cache prefill scheduler
 * Invalidates all cache every 24 hours so fresh data is fetched from DB on next request
 * 
 * The scheduler uses a lazy-refresh approach:
 * 1. Invalidate all cache keys at the scheduled interval
 * 2. The next request to each endpoint will trigger a fresh DB query (cache MISS)
 * 3. The fresh result is then cached for another 24 hours via the cache middleware
 */
export function startCacheScheduler(): void {
    if (!config.redis.enabled) {
        console.log('[CachePrefill] Cache disabled via CACHE_ENABLED env, scheduler skipped')
        return
    }

    if (redisClient.status !== 'ready') {
        console.warn('[CachePrefill] Redis not connected, scheduler disabled')
        return
    }

    // Calculate time until next midnight (00:01 WIB / UTC+7)
    const now = new Date()
    const nextMidnight = new Date(now)
    nextMidnight.setHours(24, 1, 0, 0) // Next day 00:01
    const msUntilMidnight = nextMidnight.getTime() - now.getTime()

    console.log(`[CachePrefill] Scheduler started. Next invalidation in ${Math.round(msUntilMidnight / 1000 / 60)} minutes`)

    // First run at next midnight
    setTimeout(() => {
        invalidateAllCache()

        // Then repeat every 24 hours
        setInterval(() => {
            invalidateAllCache()
        }, PREFILL_INTERVAL_MS)
    }, msUntilMidnight)
}
