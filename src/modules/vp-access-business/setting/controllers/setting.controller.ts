import { Context } from 'hono'
import { ISettingService } from '../interfaces/setting.service.interface'
import { ApiResponse } from '../../../../core/helpers/response'
import { SettingSerializer } from '../serializers/setting.serialize'

/**
 * Controller for handling target settings and configurations
 * Provides endpoints to get and update yearly/monthly sales targets
 */
export class SettingController {
    constructor(private readonly service: ISettingService) {}

    /**
     * Get actual revenue vs targets for a specific year
     * 
     * @param {Context} c - Hono request context containing query params (branchId, year)
     * @returns {Promise<Response>} JSON response containing revenue and targets per month
     */
    async getRevenue(c: Context) {
        const branchId = c.req.query('branchId') || '020'
        const currentYear = new Date().getFullYear()
        const year = c.req.query('year') ? parseInt(c.req.query('year') as string, 10) : currentYear
        const result = await this.service.getRevenue(branchId, year)
        return ApiResponse.success(c, SettingSerializer.revenue(result), 'Target revenue retrieved successfully')
    }

    /**
     * Get target configuration for a specific year
     * 
     * @param {Context} c - Hono request context containing query param (year)
     * @returns {Promise<Response>} JSON response containing the target settings
     */
    async getTarget(c: Context) {
        const currentYear = new Date().getFullYear()
        const year = c.req.query('year') ? parseInt(c.req.query('year') as string, 10) : currentYear

        const result = await this.service.getTarget(year)
        
        return ApiResponse.success(c, SettingSerializer.target(result), 'Target retrieved successfully')
    }

    /**
     * Get history of target updates (audit log)
     * 
     * @param {Context} c - Hono request context containing query param (year)
     * @returns {Promise<Response>} JSON response containing list of target modification logs
     */
    async getTargetLog(c: Context) {
        const year = c.req.query('year') ? parseInt(c.req.query('year') as string, 10) : undefined

        const result = await this.service.getTargetLog(year)
        const serialized = SettingSerializer.targetLog(result)
        
        return ApiResponse.success(c, serialized, 'Target log retrieved successfully')
    }

    /**
     * Save or update target configuration for a specific year
     * 
     * @param {Context} c - Hono request context containing JSON payload and user session
     * @returns {Promise<Response>} Success confirmation
     */
    async saveTarget(c: Context) {
        const currentYear = new Date().getFullYear()
        const year = c.req.query('year') ? parseInt(c.req.query('year') as string, 10) : currentYear
        const payload = await c.req.json()
        const user = c.get('user')
        const userId = user?.id || 1 // Fallback to 1 if user ID not found in context
        await this.service.saveTarget(year, payload, userId)
        return ApiResponse.success(c, null, 'Target saved successfully')
    }
}
