import { sign, verify } from "hono/jwt"
import { type Pool } from 'mysql2/promise'
import { config } from '../../config/config'
import { UnauthorizedException } from '../../core/exceptions/base'
import { LoginValidator, RefreshTokenValidator } from './validators/auth.validator'
import { UserService } from '../user/user.service'
import { Is5Service } from '../is5/is5.service'

export class AuthService {
    private dashboardDb: Pool;
    private userService: UserService;
    private is5Service: Is5Service;

    constructor(dashboardDb: Pool, userService: UserService, is5Service: Is5Service) {
        this.dashboardDb = dashboardDb;
        this.userService = userService;
        this.is5Service = is5Service;

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
        const user = await this.userService.getByEmId(data.employeeId)
        if (!user) throw new UnauthorizedException('User not found')

        const is5User = await this.is5Service.auth(data.employeeId, data.password)
        if (!is5User) throw new UnauthorizedException('Invalid credentials')

        const { accessToken, refreshToken } = await this.generateTokens(user)
        const { password, resetPasswordToken, resetPasswordExpires, ...userWithoutSensitiveData } = user
        return { user: userWithoutSensitiveData, accessToken, refreshToken }
    }


    async refreshToken(data: RefreshTokenValidator) {
        try {
            const decoded = await verify(data.refreshToken, config.app.jwtRefreshSecret, "HS256") as { sub: string }
            const user = await this.userService.getById(Number(decoded.sub))
            if (!user) throw new UnauthorizedException("User not found")

            const { accessToken, refreshToken } = await this.generateTokens(user)
            const { password, resetPasswordToken, resetPasswordExpires, ...userWithoutSensitiveData } = user

            return { user: userWithoutSensitiveData, accessToken, refreshToken }
        } catch (error) {
            throw new UnauthorizedException("Invalid or expired refresh token")
        }
    }
}
