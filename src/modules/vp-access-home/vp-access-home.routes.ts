import { Hono } from 'hono'
import { nisPool } from '../../config/nis.db'
import { TotalServiceModule } from './total-service/total-service.module'
import { NewGrowthModule } from './new-growth/new-growth.module'
import { RevenueModule } from './revenue/revenue.module'
import { cacheMiddleware } from '../../core/middlewares/cache.middleware'

export const setupVpAccessHomeRoutes = () => {
    const routes = new Hono()

    // Module dependencies
    const totalServiceModule = new TotalServiceModule(nisPool)
    const totalService = totalServiceModule.controller

    const newGrowthModule = new NewGrowthModule(nisPool)
    const newGrowth = newGrowthModule.controller

    const revenueModule = new RevenueModule(nisPool)
    const revenue = revenueModule.controller

    // Cache middleware
    const cacheMid = cacheMiddleware('vp-ah')

    // Total Service Routes
    routes.get('/total-service/summary', cacheMid, (c) => totalService.getSummary(c))
    routes.get('/total-service/detail', cacheMid, (c) => totalService.getDetail(c))

    // New Growth Routes
    routes.get('/new-growth/summary', cacheMid, (c) => newGrowth.getSummary(c))
    routes.get('/new-growth/detail', cacheMid, (c) => newGrowth.getDetail(c))

    // Revenue Routes
    routes.get('/revenue/summary', cacheMid, (c) => revenue.getSummary(c))
    routes.get('/revenue/homepaid', cacheMid, (c) => revenue.getHomepaid(c))
    routes.get('/revenue/detail', cacheMid, (c) => revenue.getDetail(c))
    routes.get('/revenue/billing-summary', cacheMid, (c) => revenue.getBillingSummary(c))
    routes.get('/revenue/total', cacheMid, (c) => revenue.getTotal(c))

    return routes
}
