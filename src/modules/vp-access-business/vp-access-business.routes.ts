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
    routes.get('/growth/new-mrc', (c) => growth.getNewMrc(c))
    routes.get('/growth/revenue', (c) => growth.getRevenue(c))

    // Retention Routes
    routes.get('/retention/contract-expiring', (c) => retention.getContractExpiring(c))
    routes.get('/retention/ticket', (c) => retention.getTicket(c))
    routes.get('/retention/usage', (c) => retention.getUsage(c))
    routes.get('/retention/churn-rate', (c) => retention.getChurnRate(c))
    routes.get('/retention/churn-revenue', (c) => retention.getChurnRevenue(c))
    routes.get('/retention/customer-lose', (c) => retention.getCustomerLose(c))
    routes.get('/retention/wireless-migration', (c) => retention.getWirelessMigration(c))
    routes.get('/retention/payment', (c) => retention.getPayment(c))

    // Service Quality Routes
    routes.get('/service-quality/ticket', (c) => serviceQuality.getTicket(c))
    routes.get('/service-quality/complaint', (c) => serviceQuality.getComplaint(c))
    routes.get('/service-quality/solved', (c) => serviceQuality.getSolved(c))
    routes.get('/service-quality/solved-percentage', (c) => serviceQuality.getSolvedPercentage(c))
    routes.get('/service-quality/issue', (c) => serviceQuality.getIssue(c))
    routes.get('/service-quality/incident', (c) => serviceQuality.getIncident(c))

    return routes
}