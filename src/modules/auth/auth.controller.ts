import { Context } from 'hono'
import { AuthService } from './auth.service'
import { ApiResponse } from '../../core/helpers/response'
import { GoogleLoginValidator, LoginValidator, RefreshTokenValidator } from './validators/auth.validator'
import { UserSerializer } from '../user/serializers/user.serialize'

export class AuthController {
    private service: AuthService

    constructor(service: AuthService) {
        this.service = service
    }

    async login(c: Context) {
        const body = await c.req.json() as LoginValidator
        const data = await this.service.is5Login(body)
        return ApiResponse.success(c, {
            user: UserSerializer.single(data.user as any),
            accessToken: data.accessToken,
            refreshToken: data.refreshToken
        }, "Logged in successfully")
    }

    async google(c: Context) {
        const body = await c.req.json() as GoogleLoginValidator
        const data = await this.service.googleLogin(body)
        return ApiResponse.success(c, {
            user: UserSerializer.single(data.user as any),
            accessToken: data.accessToken,
            refreshToken: data.refreshToken
        }, "Logged in successfully")
    }

    async refreshToken(c: Context) {
        const body = await c.req.json() as RefreshTokenValidator
        const tokens = await this.service.refreshToken(body)
        
        return ApiResponse.success(c, tokens, "Token refreshed successfully")
    }

    async me(c: Context) {
        const user = c.get('user')
        return ApiResponse.success(c, UserSerializer.single(user), "User profile retrieved successfully")
    }
}
