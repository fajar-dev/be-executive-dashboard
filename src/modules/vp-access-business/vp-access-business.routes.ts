import { Hono } from 'hono'
import type { MiddlewareHandler } from 'hono'
import { nisPool } from '../../config/nis.db'
import { GrowthModule } from './growth/growth.module'
import { RetentionModule } from './retention/retention.module'
import { ServiceQualityModule } from './service-quality/service-quality.module'

export const setupVpAccessBusinessRoutes = (authMid: MiddlewareHandler) => {
    const routes = new Hono()

    // Module dependencies
    const growthModule = new GrowthModule(nisPool)
    const growth = growthModule.controller

    const retentionModule = new RetentionModule(nisPool)
    const retention = retentionModule.controller

    const serviceQualityModule = new ServiceQualityModule(nisPool)
    const serviceQuality = serviceQualityModule.controller

    // Growth Routes
    // routes.get('/growth/...', authMid, (c) => growth.method(c))

    // Retention Routes
    routes.get('/retention/contract-expiring', (c) => retention.getContractExpiring(c))
    routes.get('/retention/ticket', (c) => retention.getTicket(c))
    routes.get('/retention/usage', (c) => retention.getUsage(c))
    routes.get('/retention/churn-rate', (c) => retention.getChurnRate(c))
    routes.get('/retention/churn-revenue', (c) => retention.getChurnRevenue(c))
    routes.get('/retention/customer-lose', (c) => retention.getCustomerLose(c))
    routes.get('/retention/wireless-migration', (c) => retention.getWirelessMigration(c))

    // Service Quality Routes
    routes.get('/service-quality/ticket', (c) => serviceQuality.getTicket(c))

    return routes
}
