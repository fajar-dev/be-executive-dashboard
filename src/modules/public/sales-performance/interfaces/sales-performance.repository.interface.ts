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
    getStaffList(managerId?: number, branchId?: string, type?: string): Promise<Array<{ id: number; employeeId: string; email: string; name: string; photoProfile: string; organizationName: string; type: string }>>

    /**
     * Count daily access_home registrations (NIS) for a list of sales employee IDs.
     *
     * @param {string[]} employeeIds - List of sales employee IDs.
     * @param {number} month - Month number (1-12).
     * @param {number} year - Full year (e.g. 2026).
     * @returns {Promise<Array<{ salesId: string; day: number; count: number }>>} Daily counts keyed by employee ID.
     */
    getHomeDailyRegistration(employeeIds: string[], month: number, year: number): Promise<Array<{ salesId: string; day: number; count: number }>>

    /**
     * Count daily access_business activity (NusaProspect) for a list of sales emails.
     *
     * @param {string[]} emails - List of sales emails.
     * @param {number} month - Month number (1-12).
     * @param {number} year - Full year (e.g. 2026).
     * @returns {Promise<Array<{ email: string; day: number; count: number }>>} Daily counts keyed by email.
     */
    getBusinessDailyActivity(emails: string[], month: number, year: number): Promise<Array<{ email: string; day: number; count: number }>>

    /**
     * Look up a single sales row (dashboard) by id.
     */
    getSalesById(id: number): Promise<{ employeeId: string; email: string; type: string } | null>

    /**
     * Detail of access_home registrations for a sales employee on a specific date (NIS).
     */
    getHomeRegistrationDetail(employeeId: string, date: string): Promise<Array<{ custServId: string; customerId: string; customerName: string; accountName: string; serviceType: string; date: string }>>

    /**
     * Detail of access_business activity for a sales email on a specific date (NusaProspect).
     */
    getBusinessActivityDetail(email: string, date: string): Promise<Array<{ type: string; at: string }>>

    /**
     * Get list of manager-level employees from the sales table, optionally filtered by type.
     *
     * @param {string} [type] - Optional sales type to filter by.
     * @returns {Promise<Array<{ id: number; name: string; employeeId: string; photoProfile: string }>>} Manager list.
     */
    getManagers(type?: string): Promise<Array<{ id: number; name: string; employeeId: string; photoProfile: string }>>
}
