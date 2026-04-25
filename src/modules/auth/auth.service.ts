import { verify } from "hono/jwt"
import { type Pool } from 'mysql2/promise'
import { config } from '../../config/config'
import { UnauthorizedException } from '../../core/exceptions/base'
import { GoogleLoginValidator, LoginValidator, RefreshTokenValidator } from './validators/auth.validator'
import { UserService } from '../user/user.service'
import { Is5Service } from '../is5/is5.service'
import { AuthHelper } from '../../core/helpers/auth'

export class AuthService {
    private userService: UserService;
    private is5Service: Is5Service;

    constructor(userService: UserService, is5Service: Is5Service) {
        this.userService = userService;
        this.is5Service = is5Service;
    }


    async is5Login(data: LoginValidator) {
        const user = await this.userService.getByEmId(data.employeeId)
        if (!user.is_active) throw new UnauthorizedException('User is not active')

        const is5User = await this.is5Service.auth(data.employeeId, data.password)
        if (!is5User) throw new UnauthorizedException('Invalid credentials')

        const { accessToken, refreshToken } = await AuthHelper.generateTokens(user)
        const { password, resetPasswordToken, resetPasswordExpires, ...userWithoutSensitiveData } = user
        return { user: userWithoutSensitiveData, accessToken, refreshToken }
    }

    async googleLogin(data: GoogleLoginValidator) {
        const payload = await AuthHelper.verifyGoogleCode(data.code)
        const user = await this.userService.getByEmail(payload.email!)
        if (!user.is_active) throw new UnauthorizedException('User is not active')

        const { accessToken, refreshToken } = await AuthHelper.generateTokens(user)
        const { password, resetPasswordToken, resetPasswordExpires, ...userWithoutSensitiveData } = user
        return { user: userWithoutSensitiveData, accessToken, refreshToken }
    }


    async refreshToken(data: RefreshTokenValidator) {
        try {
            const decoded = await verify(data.refreshToken, config.app.jwtRefreshSecret, "HS256") as { sub: string }
            const user = await this.userService.getById(Number(decoded.sub))

            const { accessToken, refreshToken } = await AuthHelper.generateTokens(user)
            const { password, resetPasswordToken, resetPasswordExpires, ...userWithoutSensitiveData } = user

            return { user: userWithoutSensitiveData, accessToken, refreshToken }
        } catch (error) {
            throw new UnauthorizedException("Invalid or expired refresh token")
        }
    }
}
