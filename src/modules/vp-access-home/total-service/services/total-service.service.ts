import { ITotalServiceRepository } from '../interfaces/total-service.repository.interface'
import { ITotalServiceService } from '../interfaces/total-service.service.interface'

/**
 * Service class for total service business logic
 * Orchestrates data retrieval from repository based on point-of-view (operational vs sales)
 */
export class TotalServiceService implements ITotalServiceService {
    constructor(private readonly totalServiceRepository: ITotalServiceRepository) {}

    /**
     * Get summary data based on point of view
     * Routes to operational or sales summary based on pov parameter
     *
     * @param {string} branchId - The branch identifier
     * @param {number} year - The year to query
     * @param {string} pov - Point of view: 'operational' or 'sales'
     * @returns {Promise<Array>} Summary rows
     */
    async getSummary(branchId: string, year: number, pov: string): Promise<{ period: string; branch: string; service_group?: string; service?: string; manager_sales_name?: string; sales_name?: string; total_active: number; total_churn: number }[]> {
        if (pov === 'sales') {
            const rows = await this.totalServiceRepository.getSalesSummary(branchId, year)
            return rows.map(row => ({
                period: row.Period,
                branch: row.branch,
                manager_sales_name: row.manager_sales_name,
                sales_name: row.sales_name,
                total_active: row.total_active,
                total_churn: row.total_churn
            }))
        }

        const rows = await this.totalServiceRepository.getOperationalSummary(branchId, year)
        return rows.map(row => ({
            period: row.Period,
            branch: row.branch,
            service_group: row.service_group,
            service: row.service,
            total_active: row.total_active,
            total_churn: row.total_churn
        }))
    }

    /**
     * Get detailed customer service data for a specific period or all periods of a year
     *
     * @param {string} branchId - The branch identifier
     * @param {number} year - The year to query
     * @param {string} [period] - Optional period in MMYY format
     * @returns {Promise<Array>} Detail rows
     */
    async getDetail(branchId: string, year: number, period?: string): Promise<{ service_id: string; service: string; customer_name: string; address: string; service_group: string; branch: string; sales_name: string; manager_sales_name: string; status: string; active_at: string | null; churn_date: string | null; tenure_days: number | null }[]> {
        return this.totalServiceRepository.getDetail(branchId, year, period)
    }
}
