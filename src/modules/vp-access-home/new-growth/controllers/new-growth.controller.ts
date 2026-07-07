import { Context } from 'hono'
import { INewGrowthService } from '../interfaces/new-growth.service.interface'
import { ApiResponse } from '../../../../core/helpers/response'
import { NewGrowthSerializer } from '../serializers/new-growth.serialize'

/**
 * Controller for handling new growth metrics
 * Provides endpoints for summary and detail views of newly activated access home services
 */
export class NewGrowthController {
    constructor(private readonly service: INewGrowthService) {}

    /**
     * Get new growth summary metrics
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

        return ApiResponse.success(c, NewGrowthSerializer.summary(result), 'New growth summary retrieved successfully')
    }

    /**
     * Get detailed new growth customer data
     *
     * @param {Context} c - Hono request context containing query params (branchId, year, period)
     * @returns {Promise<Response>} JSON response containing detail data
     */
    async getDetail(c: Context) {
        const branchId = c.req.query('branchId') || '020'
        const year = Number(c.req.query('year')) || new Date().getFullYear()
        const period = c.req.query('period') || undefined
        const result = await this.service.getDetail(branchId, year, period)

        return ApiResponse.success(c, NewGrowthSerializer.detail(result), 'New growth detail retrieved successfully')
    }
}
