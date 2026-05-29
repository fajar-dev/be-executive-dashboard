import { Hono } from 'hono'
import type { MiddlewareHandler } from 'hono'

import { nisPool } from '../../config/nis.db'
import { nusafiberPool } from '../../config/nusafiber.db'

import { GeneralModule } from './general/general.module'

export const setupDireksiRoutes = (authMid: MiddlewareHandler) => {
    const routes = new Hono()

    // Module dependencies
    const generalModule = new GeneralModule(nisPool, nusafiberPool)
    const general = generalModule.controller

    // General Routes
    routes.get('/general/noc', authMid, (c) => general.getNocStatus(c))
    routes.get('/general/revenue', authMid, (c) => general.getRevenueStats(c))
    routes.get('/general/revenue/period', authMid, (c) => general.getRevenuePeriod(c))
    routes.get('/general/revenue/monthly', authMid, (c) => general.getRevenueMonthly(c))
    routes.get('/general/isp', authMid, (c) => general.getIspStats(c))
    routes.get('/general/nusawork', authMid, (c) => general.getNusaWorkStats(c))
    routes.get('/general/homeconnect', authMid, (c) => general.getHomeConnectStats(c))
    routes.get('/general/alerts', (c) => general.getAlerts(c))
    routes.get('/general/health', authMid, (c) => general.getHealthMetrics(c))

    return routes
}
