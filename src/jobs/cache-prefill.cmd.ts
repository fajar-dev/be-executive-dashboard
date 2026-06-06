import { redisClient, redisCheckConnection } from '../config/redis'
import { invalidateAllCache } from './cache-prefill.scheduler'

/**
 * Manual cache invalidation command
 * Run with: bun run cache-prefill
 * 
 * Clears all cached snapshot data from Redis,
 * forcing fresh DB queries on the next API request
 */
;(async () => {
    const connected = await redisCheckConnection()
    if (!connected) {
        console.error('[CachePrefill] Cannot connect to Redis. Aborting.')
        process.exit(1)
    }

    await invalidateAllCache()

    await redisClient.quit()
    console.log('[CachePrefill] Done. Redis connection closed.')
    process.exit(0)
})()
