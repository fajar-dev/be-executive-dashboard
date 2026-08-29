import { Hono } from 'hono'
import { nisPool } from '../../config/nis.db'
import { dashboardPool } from '../../config/dashboard.db'
import { nusaprospectPool } from '../../config/nusaprospect.db'
import { SalesPerformanceModule } from './sales-performance/sales-performance.module'

/**
 * Setup public Hono endpoints
 * Exposes routes that do not require standard user auth middleware.
 * 
 * @returns {Hono} Configured Hono sub-router.
 */
export const setupPublicRoutes = () => {
    const routes = new Hono()

    // Module dependencies
    const salesPerformanceModule = new SalesPerformanceModule(nisPool, dashboardPool, nusaprospectPool)
    const salesPerformance = salesPerformanceModule.controller

    // Sales Performance Routes
    routes.get('/sales-performance/manager', (c) => salesPerformance.getManagers(c))
    routes.get('/sales-performance/detail', (c) => salesPerformance.getDetail(c))
    routes.get('/sales-performance', (c) => salesPerformance.getSalesPerformance(c))

    return routes
}
