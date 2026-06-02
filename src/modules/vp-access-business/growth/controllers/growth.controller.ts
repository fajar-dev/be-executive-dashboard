import { Context } from 'hono'
import { IGrowthService } from '../interfaces/growth.service.interface'
import { ApiResponse } from '../../../../core/helpers/response'

export class GrowthController {
    constructor(private readonly service: IGrowthService) {}

    async getNewMrc(c: Context) {
        try {
            const branchId = c.req.query('branchId') || '020'
            const period = c.req.query('period') || 'month'
            const result = await this.service.getNewMrc(branchId, period)
            
            return ApiResponse.success(c, result, 'New MRC metrics retrieved successfully')
        } catch (error) {
            console.error('Error fetching new MRC metrics:', error)
            return ApiResponse.error(c, 'Failed to fetch new MRC metrics', 500)
        }
    }

    async getRevenue(c: Context) {
        try {
            const branchId = c.req.query('branchId') || '020'
            const result = await this.service.getRevenue(branchId)
            
            return ApiResponse.success(c, result, 'Revenue metrics retrieved successfully')
        } catch (error) {
            console.error('Error fetching revenue metrics:', error)
            return ApiResponse.error(c, 'Failed to fetch revenue metrics', 500)
        }
    }
}
