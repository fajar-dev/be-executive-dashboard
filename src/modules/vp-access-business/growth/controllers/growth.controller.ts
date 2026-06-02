import { Context } from 'hono'
import { IGrowthService } from '../interfaces/growth.service.interface'
import { ApiResponse } from '../../../../core/helpers/response'
import { GrowthSerializer } from '../serializers/growth.serialize'

export class GrowthController {
    constructor(private readonly service: IGrowthService) {}

    async getNewMrc(c: Context) {
        const branchId = c.req.query('branchId') || '020'
        const period = c.req.query('period') || 'month'
        const result = await this.service.getNewMrc(branchId, period)
        
        return ApiResponse.success(c, GrowthSerializer.newMrc(result), 'New MRC metrics retrieved successfully')
    }

    async getRevenue(c: Context) {
        const branchId = c.req.query('branchId') || '020'
        const result = await this.service.getRevenue(branchId)
        
        return ApiResponse.success(c, GrowthSerializer.revenue(result), 'Revenue metrics retrieved successfully')
    }
}
