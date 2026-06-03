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
    routes.get('/growth/new-mrc', authMid, (c) => growth.getNewMrc(c))
    routes.get('/growth/total-mrc-ytd', authMid, (c) => growth.getTotalMrcYtd(c))
    routes.get('/growth/new-customer', authMid, (c) => growth.getNewCustomer(c))
    routes.get('/growth/revenue', authMid, (c) => growth.getRevenue(c))
    routes.get('/growth/revenue-achievement', authMid, (c) => growth.getRevenueAchievement(c))
    routes.get('/growth/leads', authMid, (c) => growth.getLeads(c))
    routes.get('/growth/opportunity', authMid, (c) => growth.getOpportunity(c))
    routes.get('/growth/win-rate', authMid, (c) => growth.getWinRate(c))
    routes.get('/growth/activity', authMid, (c) => growth.getActivity(c))
    routes.get('/growth/pipeline-value', authMid, (c) => growth.getPipelineValue(c))
    routes.get('/growth/pipeline-stage', authMid, (c) => growth.getPipelineStage(c))
    routes.get('/growth/forecast-revenue', authMid, (c) => growth.getForecastRevenue(c))
    routes.get('/growth/cycle', authMid, (c) => growth.getCycle(c))
    routes.get('/growth/discount', authMid, (c) => growth.getDiscount(c))
    routes.get('/growth/arpu', authMid, (c) => growth.getArpu(c))

    // Retention Routes
    routes.get('/retention/contract-expiring', authMid, (c) => retention.getContractExpiring(c))
    routes.get('/retention/ticket', authMid, (c) => retention.getTicket(c))
    routes.get('/retention/usage', authMid, (c) => retention.getUsage(c))
    routes.get('/retention/churn-rate', authMid, (c) => retention.getChurnRate(c))
    routes.get('/retention/churn-revenue', authMid, (c) => retention.getChurnRevenue(c))
    routes.get('/retention/customer-lose', authMid, (c) => retention.getCustomerLose(c))
    routes.get('/retention/wireless-migration', authMid, (c) => retention.getWirelessMigration(c))
    routes.get('/retention/payment', authMid, (c) => retention.getPayment(c))

    // Service Quality Routes
    routes.get('/service-quality/ticket', authMid, (c) => serviceQuality.getTicket(c))
    routes.get('/service-quality/complaint', authMid, (c) => serviceQuality.getComplaint(c))
    routes.get('/service-quality/solved', authMid, (c) => serviceQuality.getSolved(c))
    routes.get('/service-quality/solved-percentage', authMid, (c) => serviceQuality.getSolvedPercentage(c))
    routes.get('/service-quality/issue', authMid, (c) => serviceQuality.getIssue(c))
    routes.get('/service-quality/incident', authMid, (c) => serviceQuality.getIncident(c))

    // Setting Routes
    routes.get('/setting/revenue', authMid, (c) => setting.getRevenue(c))
    routes.get('/setting/target', authMid, (c) => setting.getTarget(c))
    routes.get('/setting/target/log', authMid, (c) => setting.getTargetLog(c))
    routes.post('/setting/target', authMid, (c) => setting.saveTarget(c))

    return routes
}