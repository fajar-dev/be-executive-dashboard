import { Hono } from 'hono'
import type { MiddlewareHandler } from 'hono'

import { nisPool } from '../../config/nis.db'
import { nusafiberPool } from '../../config/nusafiber.db'

import { GeneralModule } from './general/general.module'
import { cacheMiddleware } from '../../core/middlewares/cache.middleware'

export const setupDireksiRoutes = (authMid: MiddlewareHandler) => {
    const routes = new Hono()

    // Module dependencies
    const generalModule = new GeneralModule(nisPool, nusafiberPool)
    const general = generalModule.controller

    // Cache middleware
    const cacheMid = cacheMiddleware('direksi')

    // General Routes
    routes.get('/general/noc', authMid, (c) => general.getNocStatus(c))
    routes.get('/general/revenue', authMid, cacheMid, (c) => general.getRevenueStats(c))
    routes.get('/general/revenue/period', authMid, cacheMid, (c) => general.getRevenuePeriod(c))
    routes.get('/general/revenue/monthly', authMid, cacheMid, (c) => general.getRevenueMonthly(c))
    routes.get('/general/isp', authMid, cacheMid, (c) => general.getIspStats(c))
    routes.get('/general/nusawork', authMid, cacheMid, (c) => general.getNusaWorkStats(c))
    routes.get('/general/homeconnect', authMid, cacheMid, (c) => general.getHomeConnectStats(c))
    routes.get('/general/alerts', (c) => general.getAlerts(c))
    routes.get('/general/health', authMid, (c) => general.getHealthMetrics(c))

    return routes
}
