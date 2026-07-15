import { ISettingService } from '../interfaces/setting.service.interface'
import { ISettingRepository, TargetRevenuePayload } from '../interfaces/setting.repository.interface'

/**
 * Service class for handling target configuration business logic
 * Serves as a bridge between the controller and setting repository
 */
export class SettingService implements ISettingService {
    constructor(private readonly settingRepository: ISettingRepository) {}

    /**
     * Retrieve actual revenue for a specific year
     * 
     * @param {string} branchId - The branch identifier
     * @param {number} year - The target year
     * @returns {Promise<{total: number, details: any[]}>} Total revenue and monthly breakdown
     */
    async getRevenue(branchId: string, year: number): Promise<{ total: number, details: { month: number, total: number }[] }> {
        return this.settingRepository.getRevenue(branchId, year)
    }

    /**
     * Retrieve target settings for a specific year
     * 
     * @param {string} branch - The branch selector ('all', 'null', or a branch code)
     * @param {number} year - The target year
     * @returns {Promise<TargetRevenuePayload | null>} Yearly and monthly targets
     */
    async getTarget(branch: string, year: number): Promise<TargetRevenuePayload | null> {
        return this.settingRepository.getTarget(branch, year)
    }

    /**
     * Retrieve target modification history
     * 
     * @param {string} [branch] - Optional branch filter ('all', 'null', or a branch code)
     * @param {number} [year] - Optional year filter
     * @returns {Promise<any[]>} Audit logs of target updates
     */
    async getTargetLog(branch?: string, year?: number): Promise<any[]> {
        return this.settingRepository.getTargetLog(branch, year)
    }

    /**
     * Save or update sales target for a specific year
     * Automatically logs the changes in the audit table
     * 
     * @param {string} branch - The branch selector ('all', 'null', or a branch code)
     * @param {number} year - The target year
     * @param {TargetRevenuePayload} payload - Target values (yearly and monthly)
     * @param {number} userId - The ID of the user performing the update
     * @returns {Promise<void>}
     */
    async saveTarget(branch: string, year: number, payload: TargetRevenuePayload, userId: number): Promise<void> {
        return this.settingRepository.saveTarget(branch, year, payload, userId)
    }
}
