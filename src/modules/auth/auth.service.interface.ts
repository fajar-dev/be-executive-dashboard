import { GoogleLoginValidator, LoginValidator, RefreshTokenValidator } from '../validators/auth.validator'

export interface IAuthService {
    is5Login(data: LoginValidator): Promise<{ user: any; accessToken: string; refreshToken: string }>
    googleLogin(data: GoogleLoginValidator): Promise<{ user: any; accessToken: string; refreshToken: string }>
    refreshToken(data: RefreshTokenValidator): Promise<{ user: any; accessToken: string; refreshToken: string }>
}
