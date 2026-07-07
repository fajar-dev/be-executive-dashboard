import { Context } from 'hono'
import { ITotalServiceService } from '../interfaces/total-service.service.interface'
import { ApiResponse } from '../../../../core/helpers/response'
import { TotalServiceSerializer } from '../serializers/total-service.serialize'

/**
 * Controller for handling total service metrics
 * Provides endpoints for summary and detail views of access home services
 */
export class TotalServiceController {
    constructor(private readonly service: ITotalServiceService) {}

    /**
     * Get total service summary metrics
     * Supports operational and sales point-of-view
     *
     * @param {Context} c - Hono request context containing query params (branchId, year, pov)
     * @returns {Promise<Response>} JSON response containing summary data
     */
    async getSummary(c: Context) {
        const branchId = c.req.query('branchId') || '020'
        const year = Number(c.req.query('year')) || new Date().getFullYear()
        const pov = c.req.query('pov') || 'operational'
        const result = await this.service.getSummary(branchId, year, pov)

        return ApiResponse.success(c, TotalServiceSerializer.summary(result), 'Total service summary retrieved successfully')
    }

    /**
     * Get detailed customer service data for a specific period or all periods of a year
     *
     * @param {Context} c - Hono request context containing query params (branchId, year, period)
     * @returns {Promise<Response>} JSON response containing detail data
     */
    async getDetail(c: Context) {
        const branchId = c.req.query('branchId') || '020'
        const year = Number(c.req.query('year')) || new Date().getFullYear()
        const period = c.req.query('period') || ''
        const result = await this.service.getDetail(branchId, year, period || undefined)

        return ApiResponse.success(c, TotalServiceSerializer.detail(result), 'Total service detail retrieved successfully')
    }
}
