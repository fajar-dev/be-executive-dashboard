import Redis from 'ioredis'
import { config } from './config'

/**
 * Redis client singleton instance
 * Used for caching snapshot data from external databases (NIS, NusaFiber, NusaProspect)
 */
export const redisClient = new Redis({
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password,
    db: config.redis.db,
    maxRetriesPerRequest: 3,
    retryStrategy(times: number) {
        const delay = Math.min(times * 200, 3000)
        return delay
    },
    lazyConnect: true,
})

/**
 * Check Redis connection health
 * Attempts to connect and ping the Redis server
 * 
 * @returns {Promise<boolean>} True if connection is healthy
 */
export async function redisCheckConnection(): Promise<boolean> {
    try {
        await redisClient.connect()
        await redisClient.ping()
        console.log('Redis connection OK')
        return true
    } catch (error) {
        console.error('Redis connection FAILED:', error)
        console.warn('Application will continue without cache')
        return false
    }
}
