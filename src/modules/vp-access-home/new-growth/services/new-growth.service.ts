import { INewGrowthRepository } from '../interfaces/new-growth.repository.interface'
import { INewGrowthService } from '../interfaces/new-growth.service.interface'

/**
 * Service class for new growth business logic
 * Orchestrates data retrieval for newly activated access home services
 */
export class NewGrowthService implements INewGrowthService {
    constructor(private readonly newGrowthRepository: INewGrowthRepository) {}

    /**
     * Get summary data based on point of view
     * Routes to operational or sales summary based on pov parameter
     *
     * @param {string} branchId - The branch identifier
     * @param {number} year - The year to query
     * @param {string} pov - Point of view: 'operational' or 'sales'
     * @returns {Promise<Array>} Summary rows
     */
    async getSummary(branchId: string, year: number, pov: string): Promise<{ period: string; branch: string; service_group?: string; service?: string; manager_sales_name?: string; sales_name?: string; total_new: number; total_homeconnect: number; total_block: number; total_homepaid: number }[]> {
        if (pov === 'sales') {
            const rows = await this.newGrowthRepository.getSalesSummary(branchId, year)
            return rows.map(row => ({
                period: row.period,
                branch: row.branch,
                manager_sales_name: row.manager_sales_name,
                sales_name: row.sales_name,
                total_new: row.total_new,
                total_homeconnect: row.total_homeconnect,
                total_block: row.total_block,
                total_homepaid: row.total_homepaid
            }))
        }

        const rows = await this.newGrowthRepository.getOperationalSummary(branchId, year)
        return rows.map(row => ({
            period: row.period,
            branch: row.branch,
            service_group: row.service_group,
            service: row.service,
            total_new: row.total_new,
            total_homeconnect: row.total_homeconnect,
            total_block: row.total_block,
            total_homepaid: row.total_homepaid
        }))
    }

    /**
     * Get detailed new growth customer data
     *
     * @param {string} branchId - The branch identifier
     * @param {number} year - The year to query
     * @param {string} [period] - Optional period filter in YYYY-MM format
     * @returns {Promise<Array>} Detail rows
     */
    async getDetail(branchId: string, year: number, period?: string): Promise<{ service_id: string; service: string; customer_name: string; address: string; service_group: string; branch: string; sales_name: string; manager_sales_name: string; status: string; activated_at: string | null }[]> {
        return this.newGrowthRepository.getDetail(branchId, year, period)
    }
}
