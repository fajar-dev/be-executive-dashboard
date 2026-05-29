import { Hono } from 'hono'
import type { MiddlewareHandler } from 'hono'
import { nisPool } from '../../config/nis.db'
import { GrowthModule } from './growth/growth.module'
import { RetentionModule } from './retention/retention.module'

export const setupVpAccessBusinessRoutes = (authMid: MiddlewareHandler) => {
    const routes = new Hono()

    // Module dependencies
    const growthModule = new GrowthModule(nisPool)
    const growth = growthModule.controller

    const retentionModule = new RetentionModule(nisPool)
    const retention = retentionModule.controller

    // Growth Routes
    // routes.get('/growth/...', authMid, (c) => growth.method(c))

    // Retention Routes
    // routes.get('/retention/...', authMid, (c) => retention.method(c))

    return routes
}
