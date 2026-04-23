import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'

import { GeneralController } from '../modules/general/general.controller'

const routes = new Hono()
const general = new GeneralController()

routes.get('/', (c) => {
    return c.json({
        message: "Hello World"
    })
})

// General Module Routes
routes.get('/general/noc', (c) => general.getNocStatus(c))
routes.get('/general/revenue', (c) => general.getRevenueStats(c))
routes.get('/general/revenue/period', (c) => general.getRevenuePeriod(c))
routes.get('/general/revenue/monthly', (c) => general.getRevenueMonthly(c))
routes.get('/general/isp', (c) => general.getIspStats(c))
routes.get('/general/nusawork', (c) => general.getNusaWorkStats(c))
routes.get('/general/homeconnect', (c) => general.getHomeConnectStats(c))
routes.get('/general/alerts', (c) => general.getAlerts(c))
routes.get('/general/health', (c) => general.getHealthMetrics(c))

export default routes
