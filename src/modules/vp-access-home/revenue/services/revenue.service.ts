import { IRevenueRepository } from '../interfaces/revenue.repository.interface'
import { IRevenueService } from '../interfaces/revenue.service.interface'

/**
 * Service class for revenue business logic
 * Orchestrates data retrieval for access home revenue metrics
 */
export class RevenueService implements IRevenueService {
    constructor(private readonly revenueRepository: IRevenueRepository) {}

    /**
     * Get revenue summary data
     *
     * @param {string} branchId - The branch identifier
     * @param {number} year - The year to query
     * @returns {Promise<Array>} Revenue summary rows
     */
    async getSummary(branchId: string, year: number): Promise<{ period: string; branch: string; total: number }[]> {
        return this.revenueRepository.getRevenueSummary(branchId, year)
    }

    /**
     * Get homepaid (paid invoices) summary data
     *
     * @param {string} branchId - The branch identifier
     * @param {number} year - The year to query
     * @returns {Promise<Array>} Homepaid summary rows
     */
    async getHomepaid(branchId: string, year: number): Promise<{ period: string; branch: string; total: number }[]> {
        return this.revenueRepository.getHomepaidSummary(branchId, year)
    }

    /**
     * Get detailed revenue data
     *
     * @param {string} branchId - The branch identifier
     * @param {number} year - The year to query
     * @param {string} [period] - Optional period filter in YYYY-MM format
     * @returns {Promise<Array>} Detail rows
     */
    async getDetail(branchId: string, year: number, period?: string): Promise<{ service_id: string; service: string; customer_name: string; address: string; billing_date: string; service_group: string; branch: string; sales_name: string; manager_sales_name: string; inv_desc: string; receipt_id: string | null; total: number }[]> {
        return this.revenueRepository.getDetail(branchId, year, period)
    }

    /**
     * Get billing summary with paid vs total amounts
     *
     * @param {string} branchId - The branch identifier
     * @param {number} year - The year to query
     * @returns {Promise<Object>} Billing summary
     */
    async getBillingSummary(branchId: string, year: number): Promise<{ total_paid: number; total_all: number }> {
        return this.revenueRepository.getBillingSummary(branchId, year)
    }

    /**
     * Get total revenue
     *
     * @param {string} branchId - The branch identifier
     * @param {number} year - The year to query
     * @returns {Promise<number>} Total revenue
     */
    async getTotal(branchId: string, year: number): Promise<number> {
        return this.revenueRepository.getTotal(branchId, year)
    }
}
