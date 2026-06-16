import { Context } from 'hono'
import { ISalesPerformanceService } from '../interfaces/sales-performance.service.interface'
import { ApiResponse } from '../../../../core/helpers/response'
import { SalesPerformanceSerializer } from '../serializers/sales-performance.serialize'

export class SalesPerformanceController {
    constructor(private readonly service: ISalesPerformanceService) {}

    /**
     * Get daily sales performance data per staff member.
     * Accepts optional query params: month, year, managerId.
     * Defaults to current month/year if not provided.
     * 
     * @param {Context} c - Hono context object.
     * @returns {Promise<Response>} HTTP Response with daily sales performance array.
     */
    async getSalesPerformance(c: Context) {
        const now = new Date()
        const month = Number(c.req.query('month')) || (now.getMonth() + 1)
        const year = Number(c.req.query('year')) || now.getFullYear()
        const managerIdParam = c.req.query('managerId')
        const managerId = managerIdParam ? Number(managerIdParam) : undefined

        const data = await this.service.getSalesPerformance(month, year, managerId)
        return ApiResponse.success(
            c,
            SalesPerformanceSerializer.salesPerformance(data),
            'Sales performance retrieved'
        )
    }

    /**
     * Get list of manager-level employees.
     * 
     * @param {Context} c - Hono context object.
     * @returns {Promise<Response>} HTTP Response with manager list.
     */
    async getManagers(c: Context) {
        const data = await this.service.getManagers()
        return ApiResponse.success(
            c,
            SalesPerformanceSerializer.managers(data),
            'Managers retrieved'
        )
    }
}
