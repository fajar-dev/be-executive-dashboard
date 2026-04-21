import { ValidatorException } from "../exceptions/base"
/**
 * Standard Zod validation hook for Hono/zValidator.
 * Automatically throws a ValidatorException if validation fails.
 */
export const validationHook = (result: any) => {
    if (!result.success) {
        throw new ValidatorException(result.error)
    }
}