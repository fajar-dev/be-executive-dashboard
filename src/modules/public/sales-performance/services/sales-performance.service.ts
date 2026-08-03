import { ISalesPerformanceRepository } from '../interfaces/sales-performance.repository.interface'
import { ISalesPerformanceService } from '../interfaces/sales-performance.service.interface'

export class SalesPerformanceService implements ISalesPerformanceService {
    constructor(private readonly repository: ISalesPerformanceRepository) {}

    /**
     * Retrieve daily sales performance data per staff member.
     * Fetches staff list and daily activation counts, then maps to a per-day array.
     * 
     * @param {number} month - Month number (1-12).
     * @param {number} year - Full year (e.g. 2026).
     * @param {number} [managerId] - Optional manager ID to filter staff.
     * @param {string} [branchId] - Optional branch ID to filter staff.
     * @param {string} [type] - Optional sales type to filter staff.
     * @returns {Promise<Array<{ name: string; photoProfile: string; data: number[] }>>} Daily performance per staff.
     */
    async getSalesPerformance(month: number, year: number, managerId?: number, branchId?: string, type?: string): Promise<Array<{ name: string; photoProfile: string; data: number[] }>> {
        const staffList = await this.repository.getStaffList(managerId, branchId, type)

        if (!staffList.length) return []

        const employeeIds = staffList.map(s => s.employeeId)
        const dailyActivations = await this.repository.getDailyActivations(employeeIds, month, year)

        // Build lookup: salesId -> { day -> count }
        const activationMap = new Map<string, Map<number, number>>()
        for (const row of dailyActivations) {
            if (!activationMap.has(row.salesId)) {
                activationMap.set(row.salesId, new Map())
            }
            activationMap.get(row.salesId)!.set(row.day, row.count)
        }

        const daysInMonth = new Date(year, month, 0).getDate()

        const results = staffList.map(staff => {
            const dayMap = activationMap.get(staff.employeeId) || new Map()
            const data: number[] = []

            for (let d = 1; d <= daysInMonth; d++) {
                data.push(dayMap.get(d) || 0)
            }

            return {
                id: staff.id,
                employeeId: staff.employeeId,
                name: staff.name,
                photoProfile: staff.photoProfile,
                organizationName: staff.organizationName,
                type: staff.type,
                data
            }
        })

        // Sort by total activations descending
        return results.sort((a, b) => {
            const totalA = a.data.reduce((sum, v) => sum + v, 0)
            const totalB = b.data.reduce((sum, v) => sum + v, 0)
            return totalB - totalA
        })
    }

    /**
     * Retrieve list of managers from the sales table, optionally filtered by type.
     *
     * @param {string} [type] - Optional sales type to filter by.
     * @returns {Promise<Array<{ id: number; name: string; employeeId: string; photoProfile: string }>>} Manager list.
     */
    async getManagers(type?: string): Promise<Array<{ id: number; name: string; employeeId: string; photoProfile: string }>> {
        return this.repository.getManagers(type)
    }
}
