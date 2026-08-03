import { type Pool } from 'mysql2/promise'
import { ISalesPerformanceRepository } from '../interfaces/sales-performance.repository.interface'

export class SalesPerformanceRepository implements ISalesPerformanceRepository {
    constructor(
        private readonly nisDb: Pool,
        private readonly dashboardDb: Pool
    ) {}

    /**
     * Get list of staff-level sales employees from the sales table.
     * If managerId is provided, filters by manager_id as well.
     * If branchId is provided, filters by branch_id as well.
     * If type is provided, filters by type (access_home / access_business) as well.
     *
     * @param {number} [managerId] - Optional manager ID to filter by.
     * @param {string} [branchId] - Optional branch ID to filter by.
     * @param {string} [type] - Optional sales type to filter by.
     * @returns {Promise<Array<{ employeeId: string; name: string; photoProfile: string }>>} Staff list.
     */
    async getStaffList(managerId?: number, branchId?: string, type?: string): Promise<Array<{ id: number; employeeId: string; name: string; photoProfile: string; organizationName: string; type: string }>> {
        let query = `SELECT id, employee_id, name, photo_profile, organization_name, type FROM sales WHERE job_level = 'staff'`
        const params: any[] = []

        if (managerId) {
            query += ` AND manager_id = ?`
            params.push(managerId)
        }

        if (branchId) {
            query += ` AND branch_id = ?`
            params.push(branchId)
        }

        if (type) {
            query += ` AND type = ?`
            params.push(type)
        }

        query += ` ORDER BY name ASC`

        const [rows] = await this.dashboardDb.query<any[]>(query, params)

        return rows.map((row: any) => ({
            id: Number(row.id),
            employeeId: row.employee_id,
            name: row.name,
            photoProfile: row.photo_profile || '',
            organizationName: row.organization_name || '',
            type: row.type || ''
        }))
    }

    /**
     * Count daily customer activations for a list of sales employee IDs in a given month/year.
     * Queries the NIS CustomerServices table for access_home category activations.
     * 
     * @param {string[]} employeeIds - List of sales employee IDs.
     * @param {number} month - Month number (1-12).
     * @param {number} year - Full year (e.g. 2026).
     * @returns {Promise<Array<{ salesId: string; day: number; count: number }>>} Daily activation counts.
     */
    async getDailyActivations(employeeIds: string[], month: number, year: number): Promise<Array<{ salesId: string; day: number; count: number }>> {
        if (!employeeIds.length) return []

        const startDate = `${year}-${String(month).padStart(2, '0')}-01`
        const endDate = `${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()}`

        const [rows] = await this.nisDb.query<any[]>(
            `SELECT
                cs.SalesId AS sales_id,
                DAY(cs.CustActivationDate) AS day_num,
                COUNT(cs.CustServId) AS total
            FROM CustomerServices cs
            LEFT JOIN Services s ON s.ServiceId = cs.ServiceId
            LEFT JOIN (
                SELECT cscsl_inner.custServId, cscsl_inner.prevStatus
                FROM CustomerServiceChangeStatusLog cscsl_inner
                INNER JOIN (
                    SELECT custServId, MIN(ai) AS minAi
                    FROM CustomerServiceChangeStatusLog
                    GROUP BY custServId
                ) oldest ON oldest.custServId = cscsl_inner.custServId AND oldest.minAi = cscsl_inner.ai
            ) cscsl ON cscsl.custServId = cs.CustServId
            WHERE s.ServiceCategory IN ('access_home', 'access_business')
                AND cs.SalesId NOT IN ('0208801', 'CS', 'CRO')
                AND cs.CustStatus = 'AC'
                AND cs.CustActivationDate BETWEEN ? AND ?
                AND cs.SalesId IN (?)
                AND (cscsl.custServId IS NULL OR cscsl.prevStatus != 'AC')
            GROUP BY cs.SalesId, DAY(cs.CustActivationDate)`,
            [startDate, endDate, employeeIds]
        )

        return rows.map((row: any) => ({
            salesId: String(row.sales_id),
            day: Number(row.day_num),
            count: Number(row.total)
        }))
    }

    /**
     * Get list of manager-level employees from the sales table.
     * Filters by job_level IN ('Manager', 'General Manager').
     * If type is provided, filters by type (access_home / access_business) as well.
     *
     * @param {string} [type] - Optional sales type to filter by.
     * @returns {Promise<Array<{ id: number; name: string; employeeId: string; photoProfile: string }>>} Manager list.
     */
    async getManagers(type?: string): Promise<Array<{ id: number; name: string; employeeId: string; photoProfile: string }>> {
        let query = `SELECT id, name, employee_id, photo_profile
             FROM sales
             WHERE job_level IN ('Manager', 'General Manager')`
        const params: any[] = []

        if (type) {
            query += ` AND type = ?`
            params.push(type)
        }

        query += ` ORDER BY name ASC`

        const [rows] = await this.dashboardDb.query<any[]>(query, params)

        return rows.map((row: any) => ({
            id: Number(row.id),
            name: row.name,
            employeeId: row.employee_id,
            photoProfile: row.photo_profile || ''
        }))
    }
}
