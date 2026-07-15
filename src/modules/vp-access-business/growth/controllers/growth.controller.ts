import { Context } from 'hono'
import { IGrowthService } from '../interfaces/growth.service.interface'
import { ApiResponse } from '../../../../core/helpers/response'
import { GrowthSerializer } from '../serializers/growth.serialize'

/**
 * Controller for handling growth-related metrics and analytics
 * Provides endpoints for sales, revenue, pipeline, and ARPU metrics
 */
export class GrowthController {
    constructor(private readonly service: IGrowthService) {}

    /**
     * Get New MRC (Monthly Recurring Charge) metrics
     * Retrieves the new MRC generated within the specified period
     * 
     * @param {Context} c - Hono request context containing query params (branchId, period)
     * @returns {Promise<Response>} JSON response containing trend, percentage, and detailed MRC value
     */
    async getNewMrc(c: Context) {
        const branchId = c.req.query('displayBranchId') || ''
        const period = c.req.query('period') || 'month'
        const result = await this.service.getNewMrc(branchId, period)
        
        return ApiResponse.success(c, GrowthSerializer.newMrc(result), 'New MRC metrics retrieved successfully')
    }

    /**
     * Get Total MRC Year-to-Date (YTD)
     * Retrieves the total MRC accumulated from the start of the current year
     * Includes breakdown by service group, trend data, and historical comparison
     * 
     * @param {Context} c - Hono request context containing query param (branchId)
     * @returns {Promise<Response>} JSON response containing total MRC YTD metrics and breakdown
     */
    async getTotalMrcYtd(c: Context) {
        const branchId = c.req.query('displayBranchId') || ''
        const result = await this.service.getTotalMrcYtd(branchId)
        
        return ApiResponse.success(c, GrowthSerializer.metric(result), 'Total MRC YTD metrics retrieved successfully')
    }

    /**
     * Get historical revenue trend for the current year
     * Retrieves month-by-month revenue comparison against the previous year
     * 
     * @param {Context} c - Hono request context containing query param (branchId)
     * @returns {Promise<Response>} JSON response containing array of monthly revenue data
     */
    async getRevenue(c: Context) {
        const branchId = c.req.query('displayBranchId') || ''
        const result = await this.service.getRevenue(branchId)
        
        return ApiResponse.success(c, GrowthSerializer.revenue(result), 'Revenue metrics retrieved successfully')
    }

    /**
     * Get revenue achievement against target
     * Compares the actual revenue generated versus the set target for the branch
     * 
     * @param {Context} c - Hono request context containing query params (branchId, period)
     * @returns {Promise<Response>} JSON response containing revenue, target, and achievement percentage
     */
    async getRevenueAchievement(c: Context) {
        const branchId = c.req.query('displayBranchId') || ''
        const period = c.req.query('period') || 'month'
        const result = await this.service.getRevenueAchievement(branchId, period)
        
        return ApiResponse.success(c, GrowthSerializer.revenueAchievement(result), 'Revenue achievement retrieved successfully')
    }

    /**
     * Get new customer acquisition metrics
     * Retrieves the count of new customers gained in the specified period
     * 
     * @param {Context} c - Hono request context containing query params (branchId, period)
     * @returns {Promise<Response>} JSON response containing count, trend, and percentage
     */
    async getNewCustomer(c: Context) {
        const branchId = c.req.query('displayBranchId') || ''
        const period = c.req.query('period') || 'month'
        const result = await this.service.getNewCustomer(branchId, period)
        
        return ApiResponse.success(c, GrowthSerializer.metric(result), 'New customer metrics retrieved successfully')
    }

    /**
     * Get generated leads metrics
     * Retrieves the count of new leads created across all branches
     * 
     * @param {Context} c - Hono request context containing query param (period)
     * @returns {Promise<Response>} JSON response containing lead count and trend
     */
    async getLeads(c: Context) {
        const period = c.req.query('period') || 'month'
        const result = await this.service.getLeads(period)
        
        return ApiResponse.success(c, GrowthSerializer.metric(result), 'Leads metrics retrieved successfully')
    }

    /**
     * Get generated opportunity metrics
     * Retrieves the count of new opportunities created across all branches
     * 
     * @param {Context} c - Hono request context containing query param (period)
     * @returns {Promise<Response>} JSON response containing opportunity count and trend
     */
    async getOpportunity(c: Context) {
        const period = c.req.query('period') || 'month'
        const result = await this.service.getOpportunity(period)
        
        return ApiResponse.success(c, GrowthSerializer.metric(result), 'Opportunity metrics retrieved successfully')
    }

    /**
     * Get sales win rate metrics
     * Calculates the percentage of won opportunities versus total closed opportunities
     * 
     * @param {Context} c - Hono request context containing query param (period)
     * @returns {Promise<Response>} JSON response containing win rate, win count, and lose count
     */
    async getWinRate(c: Context) {
        const period = c.req.query('period') || 'month'
        const result = await this.service.getWinRate(period)
        
        return ApiResponse.success(c, GrowthSerializer.winRate(result), 'Win rate metrics retrieved successfully')
    }

    /**
     * Get sales activity metrics
     * Retrieves the average number of activities performed per account manager
     * 
     * @param {Context} c - Hono request context containing query param (period)
     * @returns {Promise<Response>} JSON response containing average activity count and trend
     */
    async getActivity(c: Context) {
        const period = c.req.query('period') || 'month'
        const result = await this.service.getActivity(period)
        
        return ApiResponse.success(c, GrowthSerializer.metric(result), 'Activity metrics retrieved successfully')
    }

    /**
     * Get total pipeline value metrics
     * Retrieves the estimated monetary value of all open opportunities
     * 
     * @param {Context} c - Hono request context containing query param (period)
     * @returns {Promise<Response>} JSON response containing pipeline value and trend
     */
    async getPipelineValue(c: Context) {
        const period = c.req.query('period') || 'month'
        const result = await this.service.getPipelineValue(period)
        return ApiResponse.success(c, GrowthSerializer.metric(result), 'Pipeline value retrieved successfully')
    }

    /**
     * Get pipeline stage distribution
     * Retrieves the breakdown of opportunities by their current stage
     * 
     * @param {Context} c - Hono request context containing query param (period)
     * @returns {Promise<Response>} JSON response containing counts for each pipeline stage
     */
    async getPipelineStage(c: Context) {
        const period = c.req.query('period') || 'month'
        const result = await this.service.getPipelineStage(period)
        return ApiResponse.success(c, GrowthSerializer.pipelineStage(result), 'Pipeline stage retrieved successfully')
    }

    /**
     * Get forecast revenue metrics
     * Calculates the estimated revenue from pipeline opportunities in stage 5
     * 
     * @param {Context} c - Hono request context containing query param (period)
     * @returns {Promise<Response>} JSON response containing forecast revenue and trend
     */
    async getForecastRevenue(c: Context) {
        const period = c.req.query('period') || 'month'
        const result = await this.service.getForecastRevenue(period)
        
        return ApiResponse.success(c, GrowthSerializer.metric(result), 'Forecast revenue metrics retrieved successfully')
    }

    /**
     * Get forecast MRC metrics
     * Calculates the estimated MRC from pipeline opportunities in stage 5
     * 
     * @param {Context} c - Hono request context containing query param (period)
     * @returns {Promise<Response>} JSON response containing forecast MRC and trend
     */
    async getForecastMrc(c: Context) {
        const period = c.req.query('period') || 'month'
        const result = await this.service.getForecastMrc(period)
        
        return ApiResponse.success(c, GrowthSerializer.metric(result), 'Forecast MRC metrics retrieved successfully')
    }

    /**
     * Get average sales cycle metrics
     * Calculates the average days taken to close won opportunities
     * 
     * @param {Context} c - Hono request context containing query param (period)
     * @returns {Promise<Response>} JSON response containing average cycle days and trend
     */
    async getCycle(c: Context) {
        const period = c.req.query('period') || 'month'
        const result = await this.service.getCycle(period)
        
        return ApiResponse.success(c, GrowthSerializer.metric(result), 'Cycle metrics retrieved successfully')
    }

    /**
     * Get discount value metrics
     * Retrieves the total discount given to customers during the specified period
     * 
     * @param {Context} c - Hono request context containing query params (branchId, period)
     * @returns {Promise<Response>} JSON response containing total discount value and detailed breakdown
     */
    async getDiscount(c: Context) {
        const branchId = c.req.query('displayBranchId') || ''
        const period = c.req.query('period') || 'month'
        const result = await this.service.getDiscount(branchId, period)
        
        return ApiResponse.success(c, GrowthSerializer.discount(result), 'Discount metrics retrieved successfully')
    }

    /**
     * Get Average Revenue Per User (ARPU) metrics
     * Calculates the average revenue generated per active service
     * 
     * @param {Context} c - Hono request context containing query params (branchId, period)
     * @returns {Promise<Response>} JSON response containing ARPU value and breakdown by service group
     */
    async getArpu(c: Context) {
        const branchId = c.req.query('displayBranchId') || ''
        const period = c.req.query('period') || 'month'
        const result = await this.service.getArpu(branchId, period)
        
        return ApiResponse.success(c, GrowthSerializer.arpu(result), 'ARPU metrics retrieved successfully')
    }

    /**
     * Get monthly snapshot of Account Manager counts
     * Retrieves month-by-month count of active AMs for the current year
     * 
     * @param {Context} c - Hono request context
     * @returns {Promise<Response>} JSON response containing array of monthly AM counts
     */
    async getAmSnapshot(c: Context) {
        const period = c.req.query('period') || 'month'
        const result = await this.service.getAmSnapshot(period)
        return ApiResponse.success(c, GrowthSerializer.amSnapshot(result), 'AM snapshot retrieved successfully')
    }
}
