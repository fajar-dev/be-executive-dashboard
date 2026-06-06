import type { MiddlewareHandler } from 'hono'
import { CacheHelper } from '../helpers/cache'
import { redisClient } from '../../config/redis'

/**
 * Create a Hono cache middleware for Redis-based response caching
 * Intercepts GET responses and caches them with a configurable TTL
 * 
 * @param {string} prefix - Cache namespace prefix (e.g., 'direksi', 'vp-ab')
 * @returns {MiddlewareHandler} Hono middleware handler
 */
export const cacheMiddleware = (prefix: string): MiddlewareHandler => {
    return async (c, next) => {
        // Skip caching if Redis is not connected
        if (redisClient.status !== 'ready') {
            await next()
            return
        }

        // Build query params from request
        const queryParams: Record<string, string> = {}
        const url = new URL(c.req.url)
        url.searchParams.forEach((value, key) => {
            queryParams[key] = value
        })

        const cacheKey = CacheHelper.generateKey(prefix, c.req.path, queryParams)

        // Try to get from cache
        const cached = await CacheHelper.get<any>(cacheKey)
        if (cached !== null) {
            console.log(`[Cache] HIT  ${cacheKey}`)
            return c.json(cached)
        }

        console.log(`[Cache] MISS ${cacheKey}`)

        // Execute the handler
        await next()

        // Cache the response body if it was successful (2xx)
        if (c.res.status >= 200 && c.res.status < 300) {
            try {
                const clonedResponse = c.res.clone()
                const body = await clonedResponse.json()
                await CacheHelper.set(cacheKey, body)
            } catch {
                // Silently ignore if response can't be cloned/parsed
            }
        }
    }
}
