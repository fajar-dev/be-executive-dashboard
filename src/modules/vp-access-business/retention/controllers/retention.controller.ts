import { Context } from 'hono'
import { IRetentionService } from '../interfaces/retention.service.interface'
import { ApiResponse } from '../../../../core/helpers/response'
import { RetentionSerializer } from '../serializers/retention.serialize'

export class RetentionController {
    constructor(private readonly service: IRetentionService) {}

    async getChurnRevenue(c: Context) {
        const branchId = c.req.query('branchId') || '020'
        const period = c.req.query('period') || 'month'

        if (!['last', 'month', 'quarter', 'year'].includes(period)) {
            return ApiResponse.error(c, 'Invalid period parameter. Use last, month, quarter, or year.', 400)
        }

        const result = await this.service.getChurnRevenue(branchId, period)
        return ApiResponse.success(c, RetentionSerializer.churnRevenue(result), 'Churn revenue retrieved successfully')
    }

    async getCustomerLose(c: Context) {
        const branchId = c.req.query('branchId') || '020'
        const period = c.req.query('period') || 'month'

        if (!['last', 'month', 'quarter', 'year'].includes(period)) {
            return ApiResponse.error(c, 'Invalid period parameter. Use last, month, quarter, or year.', 400)
        }

        const result = await this.service.getCustomerLose(branchId, period)
        return ApiResponse.success(c, RetentionSerializer.customerLose(result), 'Customer lose retrieved successfully')
    }

    async getWirelessMigration(c: Context) {
        const branchId = c.req.query('branchId') || '020'
        const period = c.req.query('period') || 'month'

        if (!['last', 'month', 'quarter', 'year'].includes(period)) {
            return ApiResponse.error(c, 'Invalid period parameter. Use last, month, quarter, or year.', 400)
        }

        const result = await this.service.getWirelessMigration(branchId, period)
        return ApiResponse.success(c, RetentionSerializer.wirelessMigration(result), 'Wireless migration metrics retrieved successfully')
    }

    async getChurnRate(c: Context) {
        const branchId = c.req.query('branchId') || '020'
        const result = await this.service.getChurnRate(branchId)
        
        return ApiResponse.success(c, RetentionSerializer.churnRate(result), 'Churn rate retrieved successfully')
    }

    async getContractExpiring(c: Context) {
        const branchId = c.req.query('branchId') || '020'
        const result = await this.service.getContractExpiring(branchId)
        
        return ApiResponse.success(c, RetentionSerializer.contractExpiring(result), 'Contract expiring metrics retrieved successfully')
    }

    async getTicket(c: Context) {
        const branchId = c.req.query('branchId') || '020'
        const period = c.req.query('period') || 'month'
        const result = await this.service.getTicket(branchId, period)
        
        return ApiResponse.success(c, RetentionSerializer.ticket(result), 'Ticket metrics retrieved successfully')
    }

    async getUsage(c: Context) {
        const branchId = c.req.query('branchId') || '020'
        const period = c.req.query('period') || 'month'
        const result = await this.service.getUsage(branchId, period)
        
        return ApiResponse.success(c, RetentionSerializer.usage(result), 'Usage metrics retrieved successfully')
    }

    async getPayment(c: Context) {
        const branchId = c.req.query('branchId') || '020'
        const result = await this.service.getPayment(branchId)
        
        return ApiResponse.success(c, RetentionSerializer.payment(result), 'Payment metrics retrieved successfully')
    }
}
