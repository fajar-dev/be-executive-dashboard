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
routes.get('/general/revenue', (c) => general.getRevenue(c))
routes.get('/general/isp', (c) => general.getIspStats(c))
routes.get('/general/nusawork', (c) => general.getNusaWorkStats(c))

export default routes
