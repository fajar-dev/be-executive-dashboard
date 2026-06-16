/**
 * Interface defining contract for SalesPerformanceService operations.
 */
export interface ISalesPerformanceService {
    /**
     * Retrieve daily sales performance data per staff member.
     * 
     * @param {number} month - Month number (1-12).
     * @param {number} year - Full year (e.g. 2026).
     * @param {number} [managerId] - Optional manager ID to filter staff.
     * @returns {Promise<Array<{ name: string; photoProfile: string; data: number[] }>>} Daily performance per staff.
     */
    getSalesPerformance(month: number, year: number, managerId?: number): Promise<Array<{ name: string; photoProfile: string; data: number[] }>>

    /**
     * Retrieve list of managers.
     * 
     * @returns {Promise<Array<{ id: number; name: string; employeeId: string; photoProfile: string }>>} Manager list.
     */
    getManagers(): Promise<Array<{ id: number; name: string; employeeId: string; photoProfile: string }>>
}
