import type { Context } from 'hono'
import { IServiceQualityService } from '../interfaces/service-quality.service.interface'
import { ApiResponse } from '../../../../core/helpers/response'
import { ServiceQualitySerializer } from '../serializers/service-quality.serialize'

export class ServiceQualityController {
    constructor(
        private readonly service: IServiceQualityService
    ) {}

    async getTicket(c: Context) {
        const branchId = c.req.query('branchId') || '020'
        const period = c.req.query('period') || 'month'
        const result = await this.service.getTicket(branchId, period)
        
        return ApiResponse.success(c, ServiceQualitySerializer.metric(result), 'Ticket metrics retrieved successfully')
    }

    async getComplaint(c: Context) {
        const branchId = c.req.query('branchId') || '020'
        const period = c.req.query('period') || 'month'
        const result = await this.service.getComplaint(branchId, period)
        
        return ApiResponse.success(c, ServiceQualitySerializer.metric(result), 'Complaint metrics retrieved successfully')
    }

    async getSolved(c: Context) {
        const branchId = c.req.query('branchId') || '020'
        const period = c.req.query('period') || 'month'
        const result = await this.service.getSolved(branchId, period)
        
        return ApiResponse.success(c, ServiceQualitySerializer.metric(result), 'Solved metrics retrieved successfully')
    }

    async getSolvedPercentage(c: Context) {
        const branchId = c.req.query('branchId') || '020'
        const period = c.req.query('period') || 'month'
        const result = await this.service.getSolvedPercentage(branchId, period)
        
        return ApiResponse.success(c, ServiceQualitySerializer.metric(result), 'Solved percentage metrics retrieved successfully')
    }

    async getIssue(c: Context) {
        const branchId = c.req.query('branchId') || '020'
        const period = c.req.query('period') || 'month'
        const result = await this.service.getIssue(branchId, period)
        
        return ApiResponse.success(c, ServiceQualitySerializer.metric(result), 'Issue metrics retrieved successfully')
    }

    async getIncident(c: Context) {
        const branchId = c.req.query('branchId') || '020'
        const period = c.req.query('period') || 'month'
        const result = await this.service.getIncident(branchId, period)
        
        return ApiResponse.success(c, ServiceQualitySerializer.metric(result), 'Incident metrics retrieved successfully')
    }
}
