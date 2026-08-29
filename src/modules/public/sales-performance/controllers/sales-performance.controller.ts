import { Context } from 'hono'
import { ISalesPerformanceService } from '../interfaces/sales-performance.service.interface'
import { ApiResponse } from '../../../../core/helpers/response'
import { SalesPerformanceSerializer } from '../serializers/sales-performance.serialize'

export class SalesPerformanceController {
    constructor(private readonly service: ISalesPerformanceService) {}

    /**
     * Get daily sales performance data per staff member.
     * Accepts optional query params: month, year, managerId, branchId, type.
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
        const branchIdParam = c.req.query('branchId')
        const branchId = branchIdParam && branchIdParam !== 'all' ? branchIdParam : undefined
        const typeParam = c.req.query('type')
        const type = typeParam && typeParam !== 'all' ? typeParam : undefined

        const data = await this.service.getSalesPerformance(month, year, managerId, branchId, type)
        return ApiResponse.success(
            c,
            SalesPerformanceSerializer.salesPerformance(data),
            'Sales performance retrieved'
        )
    }

    /**
     * Get the detail list behind one cell (sales member on a specific day).
     * Query params: salesId (required), day (required), month, year (default current).
     *
     * @param {Context} c - Hono context object.
     * @returns {Promise<Response>} HTTP Response with { type, items }.
     */
    async getDetail(c: Context) {
        const now = new Date()
        const salesId = Number(c.req.query('salesId'))
        const day = Number(c.req.query('day'))
        const month = Number(c.req.query('month')) || (now.getMonth() + 1)
        const year = Number(c.req.query('year')) || now.getFullYear()

        if (!salesId || !day) {
            return ApiResponse.success(c, { type: '', items: [] }, 'Detail retrieved')
        }

        const data = await this.service.getDetail(salesId, month, year, day)
        return ApiResponse.success(c, data, 'Detail retrieved')
    }

    /**
     * Get list of manager-level employees.
     *
     * @param {Context} c - Hono context object.
     * @returns {Promise<Response>} HTTP Response with manager list.
     */
    async getManagers(c: Context) {
        const typeParam = c.req.query('type')
        const type = typeParam && typeParam !== 'all' ? typeParam : undefined

        const data = await this.service.getManagers(type)
        return ApiResponse.success(
            c,
            SalesPerformanceSerializer.managers(data),
            'Managers retrieved'
        )
    }
}
