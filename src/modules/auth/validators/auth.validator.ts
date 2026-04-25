import { z } from 'zod'

export const LoginSchema = z.object({
    employeeId: z.string().min(1, 'Employee ID is required'),
    password: z.string().min(1, 'Password is required'),
})
export type LoginValidator = z.infer<typeof LoginSchema>

export const RefreshTokenSchema = z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
})
export type RefreshTokenValidator = z.infer<typeof RefreshTokenSchema>

export const GoogleLoginSchema = z.object({
    code: z.string().min(1, 'Code is required'),
})
export type GoogleLoginValidator = z.infer<typeof GoogleLoginSchema>