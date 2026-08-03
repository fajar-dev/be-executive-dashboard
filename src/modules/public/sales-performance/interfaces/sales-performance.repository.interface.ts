/**
 * Interface defining contract for SalesPerformanceRepository operations.
 */
export interface ISalesPerformanceRepository {
    /**
     * Get list of staff-level sales employees, optionally filtered by manager, branch and type.
     *
     * @param {number} [managerId] - Optional manager ID to filter by.
     * @param {string} [branchId] - Optional branch ID to filter by.
     * @param {string} [type] - Optional sales type to filter by.
     * @returns {Promise<Array<{ employeeId: string; name: string; photoProfile: string }>>} Staff list.
     */
    getStaffList(managerId?: number, branchId?: string, type?: string): Promise<Array<{ id: number; employeeId: string; name: string; photoProfile: string; organizationName: string; type: string }>>

    /**
     * Count daily customer activations for a list of sales employee IDs in a given month/year.
     * 
     * @param {string[]} employeeIds - List of sales employee IDs.
     * @param {number} month - Month number (1-12).
     * @param {number} year - Full year (e.g. 2026).
     * @returns {Promise<Array<{ salesId: string; day: number; count: number }>>} Daily activation counts.
     */
    getDailyActivations(employeeIds: string[], month: number, year: number): Promise<Array<{ salesId: string; day: number; count: number }>>

    /**
     * Get list of manager-level employees from the sales table, optionally filtered by type.
     *
     * @param {string} [type] - Optional sales type to filter by.
     * @returns {Promise<Array<{ id: number; name: string; employeeId: string; photoProfile: string }>>} Manager list.
     */
    getManagers(type?: string): Promise<Array<{ id: number; name: string; employeeId: string; photoProfile: string }>>
}
