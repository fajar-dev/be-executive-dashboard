import { Context } from 'hono'
import { IRetentionService } from '../interfaces/retention.service.interface'
import { ApiResponse } from '../../../../core/helpers/response'
import { RetentionSerializer } from '../serializers/retention.serialize'

/**
 * Controller for handling retention-related metrics and analytics
 * Provides endpoints for churn, customer loss, migration, and other retention KPIs
 */
export class RetentionController {
    constructor(private readonly service: IRetentionService) {}

    /**
     * Get churn revenue metrics for a specific branch and period
     * Calculates the total revenue lost from churned customers compared to previous period
     * 
     * @param {Context} c - Hono request context containing query params (branchId, period)
     * @returns {Promise<Response>} JSON response containing trend, percentage, and revenue value
     */
    async getChurnRevenue(c: Context) {
        const branchId = c.req.query('branchId') || '020'
        const period = c.req.query('period') || 'month'

        const result = await this.service.getChurnRevenue(branchId, period)
        return ApiResponse.success(c, RetentionSerializer.churnRevenue(result), 'Churn revenue retrieved successfully')
    }

    /**
     * Get customer loss metrics for a specific branch and period
     * Retrieves total lost customers and breakdown by service groups
     * 
     * @param {Context} c - Hono request context containing query params (branchId, period)
     * @returns {Promise<Response>} JSON response containing total loss and detailed breakdown
     */
    async getCustomerLose(c: Context) {
        const branchId = c.req.query('branchId') || '020'
        const period = c.req.query('period') || 'month'

        const result = await this.service.getCustomerLose(branchId, period)
        return ApiResponse.success(c, RetentionSerializer.customerLose(result), 'Customer lose retrieved successfully')
    }

    /**
     * Get wireless to fiber migration metrics
     * Tracks the progress of migrating customers from wireless to fiber connections
     * 
     * @param {Context} c - Hono request context containing query params (branchId, period)
     * @returns {Promise<Response>} JSON response containing total customer, migrated count, and migration rate
     */
    async getWirelessMigration(c: Context) {
        const branchId = c.req.query('branchId') || '020'
        const period = c.req.query('period') || 'month'

        const result = await this.service.getWirelessMigration(branchId, period)
        return ApiResponse.success(c, RetentionSerializer.wirelessMigration(result), 'Wireless migration metrics retrieved successfully')
    }

    /**
     * Get historical churn rate trend for the current year
     * Compares monthly churn rates between current year and previous year
     * 
     * @param {Context} c - Hono request context containing query param (branchId)
     * @returns {Promise<Response>} JSON response containing month-by-month churn comparison
     */
    async getChurnRate(c: Context) {
        const branchId = c.req.query('branchId') || '020'
        const result = await this.service.getChurnRate(branchId)
        
        return ApiResponse.success(c, RetentionSerializer.churnRate(result), 'Churn rate retrieved successfully')
    }

    /**
     * Get contract expiration metrics
     * Retrieves the count of customers whose contracts are expiring in 30, 60, and 90 days
     * 
     * @param {Context} c - Hono request context containing query param (branchId)
     * @returns {Promise<Response>} JSON response containing expiration intervals
     */
    async getContractExpiring(c: Context) {
        const branchId = c.req.query('branchId') || '020'
        const result = await this.service.getContractExpiring(branchId)
        
        return ApiResponse.success(c, RetentionSerializer.contractExpiring(result), 'Contract expiring metrics retrieved successfully')
    }

    /**
     * Get ticket metrics related to retention
     * Retrieves the volume of retention/churn-related tickets
     * 
     * @param {Context} c - Hono request context containing query params (branchId, period)
     * @returns {Promise<Response>} JSON response containing ticket count and trend
     */
    async getTicket(c: Context) {
        const branchId = c.req.query('branchId') || '020'
        const period = c.req.query('period') || 'month'
        const result = await this.service.getTicket(branchId, period)
        
        return ApiResponse.success(c, RetentionSerializer.metric(result), 'Ticket metrics retrieved successfully')
    }

    /**
     * Get service usage metrics
     * Retrieves data regarding customer bandwidth/service utilization
     * 
     * @param {Context} c - Hono request context containing query params (branchId, period)
     * @returns {Promise<Response>} JSON response containing usage statistics and trend
     */
    async getUsage(c: Context) {
        const branchId = c.req.query('branchId') || '020'
        const period = c.req.query('period') || 'month'
        const result = await this.service.getUsage(branchId, period)
        
        return ApiResponse.success(c, RetentionSerializer.metric(result), 'Usage metrics retrieved successfully')
    }

    /**
     * Get customer payment preference metrics
     * Calculates the percentage distribution between monthly and annual billing cycles
     * 
     * @param {Context} c - Hono request context containing query param (branchId)
     * @returns {Promise<Response>} JSON response containing monthly vs annual percentages
     */
    async getPayment(c: Context) {
        const branchId = c.req.query('branchId') || '020'
        const result = await this.service.getPayment(branchId)
        
        return ApiResponse.success(c, RetentionSerializer.payment(result), 'Payment metrics retrieved successfully')
    }
}
