import { z } from 'zod'

export const LoginSchema = z.object({
    username: z.string().min(1, 'Username is required'),
    password: z.string().min(1, 'Password is required'),
})
export type LoginValidator = z.infer<typeof LoginSchema>

export const RefreshTokenSchema = z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
})
export type RefreshTokenValidator = z.infer<typeof RefreshTokenSchema>