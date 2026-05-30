import { Context } from 'hono'
import { IRetentionService } from '../interfaces/retention.service.interface'
import { ApiResponse } from '../../../../core/helpers/response'
import { ChurnRevenueSerializer } from '../serializers/churn.serialize'

export class RetentionController {
    constructor(private readonly service: IRetentionService) {}

    async getChurnRevenue(c: Context) {
        try {
            const branchId = c.req.query('branchId') || '020'
            const period = c.req.query('period') || 'month'

            // Validasi period
            if (!['last', 'month', 'quarter', 'year'].includes(period)) {
                return ApiResponse.error(c, 'Invalid period parameter. Use last, month, quarter, or year.', 400)
            }

            const result = await this.service.getChurnRevenue(branchId, period)
            return ApiResponse.success(c, ChurnRevenueSerializer.single(result), 'Churn revenue retrieved successfully')
        } catch (error) {
            console.error('Error fetching churn revenue:', error)
            return ApiResponse.error(c, 'Failed to fetch churn revenue', 500)
        }
    }
}
