import { Context } from 'hono'
import { IRetentionService } from '../interfaces/retention.service.interface'
import { ApiResponse } from '../../../../core/helpers/response'
import { ChurnSerializer } from '../serializers/churn.serialize'

export class RetentionController {
    constructor(private readonly service: IRetentionService) {}

    async getChurnMetrics(c: Context) {
        try {
            const branchId = c.req.query('branchId') || '020'
            const period = c.req.query('period') || 'month'

            // Validasi period
            if (!['last', 'month', 'quarter', 'year'].includes(period)) {
                return ApiResponse.error(c, 'Invalid period parameter. Use last, month, quarter, or year.', 400)
            }

            const result = await this.service.getChurnMetrics(branchId, period)
            return ApiResponse.success(c, ChurnSerializer.single(result), 'Churn metrics retrieved successfully')
        } catch (error) {
            console.error('Error fetching churn metrics:', error)
            return ApiResponse.error(c, 'Failed to fetch churn metrics', 500)
        }
    }
}
