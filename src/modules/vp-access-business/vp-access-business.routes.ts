import { Hono } from 'hono'
import type { MiddlewareHandler } from 'hono'
import { nisPool } from '../../config/nis.db'
import { nusaprospectPool } from '../../config/nusaprospect.db'
import { dashboardPool } from '../../config/dashboard.db'
import { GrowthModule } from './growth/growth.module'
import { RetentionModule } from './retention/retention.module'
import { ServiceQualityModule } from './service-quality/service-quality.module'
import { SettingModule } from './setting/setting.module'

export const setupVpAccessBusinessRoutes = (authMid: MiddlewareHandler) => {
    const routes = new Hono()

    // Module dependencies
    const growthModule = new GrowthModule(nisPool, nusaprospectPool, dashboardPool)
    const growth = growthModule.controller

    const retentionModule = new RetentionModule(nisPool)
    const retention = retentionModule.controller

    const serviceQualityModule = new ServiceQualityModule(nisPool)
    const serviceQuality = serviceQualityModule.controller

    const settingModule = new SettingModule(nisPool, nusaprospectPool, dashboardPool)
    const setting = settingModule.controller

    // Growth Routes
    routes.get('/growth/new-mrc', (c) => growth.getNewMrc(c))
    routes.get('/growth/revenue', (c) => growth.getRevenue(c))
    routes.get('/growth/revenue-achievement', (c) => growth.getRevenueAchievement(c))
    routes.get('/growth/leads', (c) => growth.getLeads(c))
    routes.get('/growth/opportunity', (c) => growth.getOpportunity(c))
    routes.get('/growth/win-rate', (c) => growth.getWinRate(c))
    routes.get('/growth/activity', (c) => growth.getActivity(c))
    routes.get('/growth/pipeline-value', (c) => growth.getPipelineValue(c))
    routes.get('/growth/pipeline-stage', (c) => growth.getPipelineStage(c))
    routes.get('/growth/cycle', (c) => growth.getCycle(c))
    routes.get('/growth/discount', (c) => growth.getDiscount(c))

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

    // Setting Routes
    routes.get('/setting/revenue', (c) => setting.getRevenue(c))
    routes.get('/setting/target', (c) => setting.getTarget(c))
    routes.get('/setting/target/log', (c) => setting.getTargetLog(c))
    routes.post('/setting/target', authMid, (c) => setting.saveTarget(c))

    return routes
}