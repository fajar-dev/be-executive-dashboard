import type { Context } from 'hono'
import { IServiceQualityService } from '../interfaces/service-quality.service.interface'
import { ApiResponse } from '../../../../core/helpers/response'
import { ServiceQualitySerializer } from '../serializers/service-quality.serialize'

/**
 * Controller for handling service quality-related metrics and analytics
 * Provides endpoints for tracking tickets, complaints, issue resolutions, and incidents
 */
export class ServiceQualityController {
    constructor(
        private readonly service: IServiceQualityService
    ) {}

    /**
     * Get total tickets metrics
     * Retrieves the count of all tickets created within the specified period
     * 
     * @param {Context} c - Hono request context containing query params (branchId, period)
     * @returns {Promise<Response>} JSON response containing ticket count and trend
     */
    async getTicket(c: Context) {
        const branchId = c.req.query('branchId') || '020'
        const period = c.req.query('period') || 'month'
        const result = await this.service.getTicket(branchId, period)
        
        return ApiResponse.success(c, ServiceQualitySerializer.metric(result), 'Ticket metrics retrieved successfully')
    }

    /**
     * Get complaint metrics
     * Retrieves the count of tickets categorized specifically as complaints
     * 
     * @param {Context} c - Hono request context containing query params (branchId, period)
     * @returns {Promise<Response>} JSON response containing complaint count and trend
     */
    async getComplaint(c: Context) {
        const branchId = c.req.query('branchId') || '020'
        const period = c.req.query('period') || 'month'
        const result = await this.service.getComplaint(branchId, period)
        
        return ApiResponse.success(c, ServiceQualitySerializer.metric(result), 'Complaint metrics retrieved successfully')
    }

    /**
     * Get resolved tickets metrics
     * Retrieves the count of tickets that have been successfully solved or closed
     * 
     * @param {Context} c - Hono request context containing query params (branchId, period)
     * @returns {Promise<Response>} JSON response containing resolved count and trend
     */
    async getSolved(c: Context) {
        const branchId = c.req.query('branchId') || '020'
        const period = c.req.query('period') || 'month'
        const result = await this.service.getSolved(branchId, period)
        
        return ApiResponse.success(c, ServiceQualitySerializer.metric(result), 'Solved metrics retrieved successfully')
    }

    /**
     * Get ticket resolution rate (solved percentage)
     * Calculates the ratio of solved tickets to total created tickets
     * 
     * @param {Context} c - Hono request context containing query params (branchId, period)
     * @returns {Promise<Response>} JSON response containing resolution rate and trend
     */
    async getSolvedPercentage(c: Context) {
        const branchId = c.req.query('branchId') || '020'
        const period = c.req.query('period') || 'month'
        const result = await this.service.getSolvedPercentage(branchId, period)
        
        return ApiResponse.success(c, ServiceQualitySerializer.metric(result), 'Solved percentage metrics retrieved successfully')
    }

    /**
     * Get issue metrics
     * Retrieves the count of tickets categorized as general technical or administrative issues
     * 
     * @param {Context} c - Hono request context containing query params (branchId, period)
     * @returns {Promise<Response>} JSON response containing issue count and trend
     */
    async getIssue(c: Context) {
        const branchId = c.req.query('branchId') || '020'
        const period = c.req.query('period') || 'month'
        const result = await this.service.getIssue(branchId, period)
        
        return ApiResponse.success(c, ServiceQualitySerializer.metric(result), 'Issue metrics retrieved successfully')
    }

    /**
     * Get incident metrics
     * Retrieves the count of tickets categorized as critical incidents or outages
     * 
     * @param {Context} c - Hono request context containing query params (branchId, period)
     * @returns {Promise<Response>} JSON response containing incident count and trend
     */
    async getIncident(c: Context) {
        const branchId = c.req.query('branchId') || '020'
        const period = c.req.query('period') || 'month'
        const result = await this.service.getIncident(branchId, period)
        
        return ApiResponse.success(c, ServiceQualitySerializer.metric(result), 'Incident metrics retrieved successfully')
    }
}
