import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'

import { dashboardPool } from '../config/dashboard.db'
import { nisPool } from '../config/nis.db'

import { UserRepository } from '../modules/user/user.repository'
import { UserService } from '../modules/user/user.service'

import { Is5Service } from '../modules/is5/is5.service'

import { AuthService } from '../modules/auth/auth.service'
import { AuthController } from '../modules/auth/auth.controller'
import { GoogleLoginSchema, LoginSchema, RefreshTokenSchema } from '../modules/auth/validators/auth.validator'

import { GeneralRepository } from '../modules/general/general.repository'
import { GeneralService } from '../modules/general/general.service'
import { GeneralController } from '../modules/general/general.controller'

import { AdditionalController } from '../modules/additional/additional.controller'

import { authMiddleware } from '../core/middlewares/auth.middleware'
import { validationHook } from '../core/helpers/validator'

const routes = new Hono()

// Dependency Injection
const userRepository = new UserRepository(dashboardPool)
const userService = new UserService(userRepository)

const is5Service = new Is5Service()

const authService = new AuthService(userService, is5Service)
const auth = new AuthController(authService)

const generalRepository = new GeneralRepository(nisPool)
const generalService = new GeneralService(generalRepository)
const general = new GeneralController(generalService)

const additional = new AdditionalController()

// Middleware
const authMid = authMiddleware(userService)

// Auth Routes
routes.post('/auth/login', zValidator('json', LoginSchema, validationHook), (c) => auth.login(c))
routes.post('/auth/google', zValidator('json', GoogleLoginSchema, validationHook), (c) => auth.google(c))
routes.post('/auth/refresh', zValidator('json', RefreshTokenSchema, validationHook), (c) => auth.refreshToken(c))
routes.get('/auth/me', authMid, (c) => auth.me(c))

// General Routes
routes.get('/general/noc', authMid, (c) => general.getNocStatus(c))
routes.get('/general/revenue', authMid, (c) => general.getRevenueStats(c))
routes.get('/general/revenue/period', authMid, (c) => general.getRevenuePeriod(c))
routes.get('/general/revenue/monthly', authMid, (c) => general.getRevenueMonthly(c))
routes.get('/general/isp', authMid, (c) => general.getIspStats(c))
routes.get('/general/nusawork', authMid, (c) => general.getNusaWorkStats(c))
routes.get('/general/homeconnect', authMid, (c) => general.getHomeConnectStats(c))
routes.get('/general/alerts', (c) => general.getAlerts(c))
routes.get('/general/health', authMid, (c) => general.getHealthMetrics(c))

// Additional Routes
routes.get('/additional/period', (c) => additional.getPeriod(c))

export default routes
