import type { Context } from 'hono'
import { IServiceQualityService } from '../interfaces/service-quality.service.interface'
import { ApiResponse } from '../../../../core/helpers/response'

export class ServiceQualityController {
    constructor(
        private readonly service: IServiceQualityService
    ) {}

    async getTicket(c: Context) {
        try {
            const branchId = c.req.query('branchId') || '020'
            const period = c.req.query('period') || 'month'
            const result = await this.service.getTicket(branchId, period)
            
            return ApiResponse.success(c, result, 'Ticket metrics retrieved successfully')
        } catch (error) {
            console.error('Error fetching ticket metrics:', error)
            return ApiResponse.error(c, 'Failed to fetch ticket metrics', 500)
        }
    }

    async getComplaint(c: Context) {
        try {
            const branchId = c.req.query('branchId') || '020'
            const period = c.req.query('period') || 'month'
            const result = await this.service.getComplaint(branchId, period)
            
            return ApiResponse.success(c, result, 'Complaint metrics retrieved successfully')
        } catch (error) {
            console.error('Error fetching complaint metrics:', error)
            return ApiResponse.error(c, 'Failed to fetch complaint metrics', 500)
        }
    }

    async getSolved(c: Context) {
        try {
            const branchId = c.req.query('branchId') || '020'
            const period = c.req.query('period') || 'month'
            const result = await this.service.getSolved(branchId, period)
            
            return ApiResponse.success(c, result, 'Solved metrics retrieved successfully')
        } catch (error) {
            console.error('Error fetching solved metrics:', error)
            return ApiResponse.error(c, 'Failed to fetch solved metrics', 500)
        }
    }
}
