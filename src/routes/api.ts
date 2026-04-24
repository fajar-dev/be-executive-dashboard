import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { dashboardPool } from '../config/dashboard.db'
import { isxPool } from '../config/isx.db'
import { nusafiberPool } from '../config/nusafiber.db'
import { UserService } from '../modules/user/user.service'
import { AuthService } from '../modules/auth/auth.service'
import { GeneralService } from '../modules/general/general.service'
import { GeneralController } from '../modules/general/general.controller'
import { AuthController } from '../modules/auth/auth.controller'
import { validationHook } from '../core/helpers/validator'
import { LoginSchema } from '../modules/auth/validators/auth.validator'

const routes = new Hono()

// Dependency Injection Setup
const userService = new UserService(dashboardPool)
const authService = new AuthService(dashboardPool, userService)
const generalService = new GeneralService(isxPool, nusafiberPool)
const general = new GeneralController(generalService)
const auth = new AuthController(authService)

routes.post('/auth/login', zValidator('json', LoginSchema, validationHook), (c) => auth.login(c))

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
