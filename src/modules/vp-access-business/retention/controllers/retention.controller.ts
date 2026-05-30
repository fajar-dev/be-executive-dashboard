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

    async getCustomerLose(c: Context) {
        try {
            const branchId = c.req.query('branchId') || '020'
            const period = c.req.query('period') || 'month'

            if (!['last', 'month', 'quarter', 'year'].includes(period)) {
                return ApiResponse.error(c, 'Invalid period parameter. Use last, month, quarter, or year.', 400)
            }

            const result = await this.service.getCustomerLose(branchId, period)
            // Since it already matches the requested format { total: {}, detail: [] }, we can pass it directly or create a serializer. 
            // We'll just pass it directly for now as the serializer isn't strictly necessary for simple forwarding.
            return ApiResponse.success(c, result, 'Customer lose retrieved successfully')
        } catch (error) {
            console.error('Error fetching customer lose:', error)
            return ApiResponse.error(c, 'Failed to fetch customer lose', 500)
        }
    }
}
