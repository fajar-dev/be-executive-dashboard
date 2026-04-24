import { sign, verify } from "hono/jwt"
import { type Pool } from 'mysql2/promise'
import { config } from '../../config/config'
import { UnauthorizedException } from '../../core/exceptions/base'
import { LoginValidator, RefreshTokenValidator } from './validators/auth.validator'
import { UserService } from '../user/user.service'

export class AuthService {
    private dashboardDb: Pool;
    private userService: UserService;

    constructor(dashboardDb: Pool, userService: UserService) {
        this.dashboardDb = dashboardDb;
        this.userService = userService;
    }

    private async generateTokens(user: any) {
        const accessToken = await sign(
            { 
                sub: user.id, 
                email: user.email, 
                exp: Math.floor(Date.now() / 1000) + 60 * 15 // 15 mins
            }, 
            config.app.jwtSecret,
            "HS256"
        )

        const refreshToken = await sign(
            { 
                sub: user.id, 
                exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 // 7 days
            }, 
            config.app.jwtRefreshSecret,
            "HS256"
        )

        return { accessToken, refreshToken }
    }

    async login(data: LoginValidator) {
        const [[user]] = await this.dashboardDb.query<any[]>(
            'SELECT * FROM users WHERE username = ? LIMIT 1',
            [data.username]
        )

        if (!user) throw new UnauthorizedException('Invalid credentials')

        const valid = await Bun.password.verify(data.password, user.password)
        if (!valid) throw new UnauthorizedException('Invalid credentials')

        const { accessToken, refreshToken } = await this.generateTokens(user)

        const { password, resetPasswordToken, resetPasswordExpires, ...userWithoutSensitiveData } = user

        return { user: userWithoutSensitiveData, accessToken, refreshToken }
    }


    async refreshToken(data: RefreshTokenValidator) {
        try {
            const decoded = await verify(data.refreshToken, config.app.jwtRefreshSecret, "HS256") as { sub: string }
            
            const user = await this.userService.getById(Number(decoded.sub))
            
            if (!user) {
                throw new UnauthorizedException("User not found")
            }

            const { accessToken, refreshToken } = await this.generateTokens(user)

            const { password, resetPasswordToken, resetPasswordExpires, ...userWithoutSensitiveData } = user

            return { user: userWithoutSensitiveData, accessToken, refreshToken }
        } catch (error) {
            throw new UnauthorizedException("Invalid or expired refresh token")
        }
    }
}
