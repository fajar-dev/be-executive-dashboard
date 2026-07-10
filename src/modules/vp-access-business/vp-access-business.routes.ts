import { Hono } from 'hono'
import type { MiddlewareHandler } from 'hono'
import { nisPool } from '../../config/nis.db'
import { nusaprospectPool } from '../../config/nusaprospect.db'
import { dashboardPool } from '../../config/dashboard.db'
import { GrowthModule } from './growth/growth.module'
import { RetentionModule } from './retention/retention.module'
import { ServiceQualityModule } from './service-quality/service-quality.module'
import { SettingModule } from './setting/setting.module'
import { cacheMiddleware } from '../../core/middlewares/cache.middleware'

export const setupVpAccessBusinessRoutes = (authMid: MiddlewareHandler) => {
    const routes = new Hono()

    // Module dependencies
    const growthModule = new GrowthModule(nisPool, nusaprospectPool, dashboardPool)
    const growth = growthModule.controller

    const retentionModule = new RetentionModule(nisPool, dashboardPool, nusaprospectPool)
    const retention = retentionModule.controller

    const serviceQualityModule = new ServiceQualityModule(nisPool)
    const serviceQuality = serviceQualityModule.controller

    const settingModule = new SettingModule(nisPool, nusaprospectPool, dashboardPool)
    const setting = settingModule.controller

    // Cache middleware
    const cacheMid = cacheMiddleware('vp-ab')

    // Growth Routes
    routes.get('/growth/new-mrc', authMid, cacheMid, (c) => growth.getNewMrc(c))
    routes.get('/growth/total-mrc-ytd', authMid, cacheMid, (c) => growth.getTotalMrcYtd(c))
    routes.get('/growth/new-customer', authMid, cacheMid, (c) => growth.getNewCustomer(c))
    routes.get('/growth/revenue', authMid, cacheMid, (c) => growth.getRevenue(c))
    routes.get('/growth/revenue-achievement', authMid, (c) => growth.getRevenueAchievement(c))
    routes.get('/growth/leads', authMid, cacheMid, (c) => growth.getLeads(c))
    routes.get('/growth/opportunity', authMid, cacheMid, (c) => growth.getOpportunity(c))
    routes.get('/growth/win-rate', authMid, cacheMid, (c) => growth.getWinRate(c))
    routes.get('/growth/activity', authMid, cacheMid, (c) => growth.getActivity(c))
    routes.get('/growth/pipeline-value', authMid, cacheMid, (c) => growth.getPipelineValue(c))
    routes.get('/growth/pipeline-stage', authMid, cacheMid, (c) => growth.getPipelineStage(c))
    routes.get('/growth/forecast-revenue', authMid, cacheMid, (c) => growth.getForecastRevenue(c))
    routes.get('/growth/forecast-mrc', authMid, cacheMid, (c) => growth.getForecastMrc(c))
    routes.get('/growth/cycle', authMid, cacheMid, (c) => growth.getCycle(c))
    routes.get('/growth/discount', authMid, cacheMid, (c) => growth.getDiscount(c))
    routes.get('/growth/arpu', authMid, cacheMid, (c) => growth.getArpu(c))
    routes.get('/growth/am-snapshot', authMid, cacheMid, (c) => growth.getAmSnapshot(c))

    // Retention Routes
    routes.get('/retention/net-mrc', authMid, cacheMid, (c) => retention.getNetMrc(c))
    routes.get('/retention/forecast-churn', authMid, cacheMid, (c) => retention.getForecastChurn(c))
    routes.get('/retention/forecast-net-mrc', authMid, cacheMid, (c) => retention.getForecastNetMrc(c))
    routes.get('/retention/contract-expiring', authMid, cacheMid, (c) => retention.getContractExpiring(c))
    routes.get('/retention/ticket', authMid, cacheMid, (c) => retention.getTicket(c))
    routes.get('/retention/usage', authMid, cacheMid, (c) => retention.getUsage(c))
    routes.get('/retention/churn-rate', authMid, cacheMid, (c) => retention.getChurnRate(c))
    routes.get('/retention/churn-revenue', authMid, cacheMid, (c) => retention.getChurnRevenue(c))
    routes.get('/retention/customer-lose', authMid, cacheMid, (c) => retention.getCustomerLose(c))
    routes.get('/retention/wireless-migration', authMid, cacheMid, (c) => retention.getWirelessMigration(c))
    routes.get('/retention/payment', authMid, cacheMid, (c) => retention.getPayment(c))

    // Service Quality Routes
    routes.get('/service-quality/ticket', authMid, cacheMid, (c) => serviceQuality.getTicket(c))
    routes.get('/service-quality/complaint', authMid, cacheMid, (c) => serviceQuality.getComplaint(c))
    routes.get('/service-quality/solved', authMid, cacheMid, (c) => serviceQuality.getSolved(c))
    routes.get('/service-quality/solved-percentage', authMid, cacheMid, (c) => serviceQuality.getSolvedPercentage(c))
    routes.get('/service-quality/issue', authMid, cacheMid, (c) => serviceQuality.getIssue(c))
    routes.get('/service-quality/incident', authMid, cacheMid, (c) => serviceQuality.getIncident(c))

    // Setting Routes (target endpoints are NOT cached)
    routes.get('/setting/revenue', authMid, cacheMid, (c) => setting.getRevenue(c))
    routes.get('/setting/target', authMid, (c) => setting.getTarget(c))
    routes.get('/setting/target/log', authMid, (c) => setting.getTargetLog(c))
    routes.post('/setting/target', authMid, (c) => setting.saveTarget(c))

    return routes
}