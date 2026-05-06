import { Context, Next } from 'hono'
import { verify } from 'hono/jwt'
import { config } from '../../config/config'
import { IUserService } from '../../modules/user/user.service.interface'
import { UnauthorizedException } from '../exceptions/base'

export const authMiddleware = (userService: IUserService) => {
    return async (c: Context, next: Next) => {
        const authHeader = c.req.header('Authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedException('Missing or invalid authorization header')
        }

        const token = authHeader.split(' ')[1]

        try {
            const decoded = await verify(token, config.app.jwtSecret, 'HS256') as { sub: number | string }
            const user = await userService.getById(Number(decoded.sub))

            c.set('user', user)
            await next()
        } catch {
            throw new UnauthorizedException('Invalid or expired token')
        }
    }
}
