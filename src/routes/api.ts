import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { dashboardPool } from '../config/dashboard.db'
import { UserRepository } from '../modules/user/user.repository'
import { UserService } from '../modules/user/user.service'
import { Is5Service } from '../modules/is5/is5.service'
import { AuthService } from '../modules/auth/auth.service'
import { AuthController } from '../modules/auth/auth.controller'
import { GoogleLoginSchema, LoginSchema, RefreshTokenSchema } from '../modules/auth/validators/auth.validator'
import { setupDireksiRoutes } from '../modules/direksi/direksi.routes'
import { setupVpAccessBusinessRoutes } from '../modules/vp-access-business/vp-access-business.routes'
import { setupPublicRoutes } from '../modules/public/public.routes'
import { setupVpAccessHomeRoutes } from '../modules/vp-access-home/vp-access-home.routes'
import { AdditionalController } from '../modules/additional/additional.controller'
import { authMiddleware } from '../core/middlewares/auth.middleware'
import { validationHook } from '../core/helpers/validator'
import { feedbackController } from '../modules/feedback/feedback.module'
import { StoreFeedbackValidator } from '../modules/feedback/validators/feedback.validator'
const routes = new Hono()

// Dependency Injection
const userRepository = new UserRepository(dashboardPool)
const userService = new UserService(userRepository)
const is5Service = new Is5Service()
const authService = new AuthService(userService, is5Service)
const auth = new AuthController(authService)
const additional = new AdditionalController()

// Middleware
const authMid = authMiddleware(userService)

// Auth Routes
routes.post('/auth/login', zValidator('json', LoginSchema, validationHook), (c) => auth.login(c))
routes.post('/auth/google', zValidator('json', GoogleLoginSchema, validationHook), (c) => auth.google(c))
routes.post('/auth/refresh', zValidator('json', RefreshTokenSchema, validationHook), (c) => auth.refreshToken(c))
routes.get('/auth/me', authMid, (c) => auth.me(c))

// Direksi Routes
routes.route('direksi/', setupDireksiRoutes(authMid))

// VP Access Business Routes
routes.route('vp-access-business/', setupVpAccessBusinessRoutes(authMid))

// VP Access Home Routes
routes.route('vp-access-home/', setupVpAccessHomeRoutes())

// Public Routes
routes.route('public/', setupPublicRoutes())

// Additional Routes
routes.get('/additional/period', (c) => additional.getPeriod(c))

// Feedback
routes.get("/feedback", authMid, (c) => feedbackController.index(c))
routes.post("/feedback", authMid, zValidator("form", StoreFeedbackValidator, validationHook), (c) => feedbackController.store(c))

export default routes
