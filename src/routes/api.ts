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
import { GoogleLoginSchema, LoginSchema, RefreshTokenSchema } from '../modules/auth/validators/auth.validator'
import { authMiddleware } from '../core/middlewares/auth.middleware'
import { Is5Service } from '../modules/is5/is5.service'

const routes = new Hono()

// Dependency Injection Setup
const userService = new UserService(dashboardPool)
const is5Service = new Is5Service()
const authService = new AuthService(userService, is5Service)
const generalService = new GeneralService(isxPool, nusafiberPool)
const general = new GeneralController(generalService)
const auth = new AuthController(authService)

// Protected Routes
const authMid = authMiddleware(userService)

routes.post('/auth/login', zValidator('json', LoginSchema, validationHook), (c) => auth.login(c))
routes.post('/auth/google', zValidator('json', GoogleLoginSchema, validationHook), (c) => auth.google(c))
routes.post('/auth/refresh', zValidator('json', RefreshTokenSchema, validationHook), (c) => auth.refreshToken(c))
routes.get('/auth/me', authMid, (c) => auth.me(c))

routes.get('/general/noc', authMid, (c) => general.getNocStatus(c))
routes.get('/general/revenue', authMid, (c) => general.getRevenueStats(c))
routes.get('/general/revenue/period', authMid, (c) => general.getRevenuePeriod(c))
routes.get('/general/revenue/monthly', authMid, (c) => general.getRevenueMonthly(c))
routes.get('/general/isp', authMid, (c) => general.getIspStats(c))
routes.get('/general/nusawork', authMid, (c) => general.getNusaWorkStats(c))
routes.get('/general/homeconnect', authMid, (c) => general.getHomeConnectStats(c))
routes.get('/general/alerts', authMid, (c) => general.getAlerts(c))
routes.get('/general/health', authMid, (c) => general.getHealthMetrics(c))

export default routes
