import { Context } from 'hono'
import { IRevenueService } from '../interfaces/revenue.service.interface'
import { ApiResponse } from '../../../../core/helpers/response'
import { RevenueSerializer } from '../serializers/revenue.serialize'

/**
 * Controller for handling revenue metrics
 * Provides endpoints for revenue summary, homepaid, detail, billing, and total
 */
export class RevenueController {
    constructor(private readonly service: IRevenueService) {}

    /**
     * Get revenue summary metrics
     *
     * @param {Context} c - Hono request context containing query params (branchId, year)
     * @returns {Promise<Response>} JSON response containing revenue summary data
     */
    async getSummary(c: Context) {
        const branchId = c.req.query('branchId') || '020'
        const year = Number(c.req.query('year')) || new Date().getFullYear()
        const result = await this.service.getSummary(branchId, year)

        return ApiResponse.success(c, RevenueSerializer.summary(result), 'Revenue summary retrieved successfully')
    }

    /**
     * Get homepaid (paid invoices) summary metrics
     *
     * @param {Context} c - Hono request context containing query params (branchId, year)
     * @returns {Promise<Response>} JSON response containing homepaid summary data
     */
    async getHomepaid(c: Context) {
        const branchId = c.req.query('branchId') || '020'
        const year = Number(c.req.query('year')) || new Date().getFullYear()
        const result = await this.service.getHomepaid(branchId, year)

        return ApiResponse.success(c, RevenueSerializer.summary(result), 'Homepaid summary retrieved successfully')
    }

    /**
     * Get detailed revenue data
     *
     * @param {Context} c - Hono request context containing query params (branchId, year, period)
     * @returns {Promise<Response>} JSON response containing revenue detail data
     */
    async getDetail(c: Context) {
        const branchId = c.req.query('branchId') || '020'
        const year = Number(c.req.query('year')) || new Date().getFullYear()
        const period = c.req.query('period') || undefined
        const result = await this.service.getDetail(branchId, year, period)

        return ApiResponse.success(c, RevenueSerializer.detail(result), 'Revenue detail retrieved successfully')
    }

    /**
     * Get billing summary with paid vs total amounts
     *
     * @param {Context} c - Hono request context containing query params (branchId, year)
     * @returns {Promise<Response>} JSON response containing billing summary
     */
    async getBillingSummary(c: Context) {
        const branchId = c.req.query('branchId') || '020'
        const year = Number(c.req.query('year')) || new Date().getFullYear()
        const result = await this.service.getBillingSummary(branchId, year)

        return ApiResponse.success(c, RevenueSerializer.billingSummary(result), 'Billing summary retrieved successfully')
    }

    /**
     * Get total revenue
     *
     * @param {Context} c - Hono request context containing query params (branchId, year)
     * @returns {Promise<Response>} JSON response containing total revenue
     */
    async getTotal(c: Context) {
        const branchId = c.req.query('branchId') || '020'
        const year = Number(c.req.query('year')) || new Date().getFullYear()
        const result = await this.service.getTotal(branchId, year)

        return ApiResponse.success(c, { total: result }, 'Total revenue retrieved successfully')
    }
}
