import { type Pool } from 'mysql2/promise'
import { ISalesPerformanceRepository } from '../interfaces/sales-performance.repository.interface'

export class SalesPerformanceRepository implements ISalesPerformanceRepository {
    constructor(
        private readonly nisDb: Pool,
        private readonly dashboardDb: Pool,
        private readonly nusaprospectDb: Pool
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
    async getStaffList(managerId?: number, branchId?: string, type?: string): Promise<Array<{ id: number; employeeId: string; email: string; name: string; photoProfile: string; organizationName: string; type: string }>> {
        let query = `SELECT id, employee_id, email, name, photo_profile, organization_name, type FROM sales WHERE job_level = 'staff'`
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
            email: row.email || '',
            name: row.name,
            photoProfile: row.photo_profile || '',
            organizationName: row.organization_name || '',
            type: row.type || ''
        }))
    }

    /**
     * Count daily access_home customer registrations for a list of sales employee IDs
     * in a given month/year. Queries the NIS CustomerServices table, counted by CustRegDate.
     * Keyed by SalesId (= sales employee_id).
     *
     * @param {string[]} employeeIds - List of sales employee IDs.
     * @param {number} month - Month number (1-12).
     * @param {number} year - Full year (e.g. 2026).
     * @returns {Promise<Array<{ salesId: string; day: number; count: number }>>} Daily counts keyed by employee ID.
     */
    async getHomeDailyRegistration(employeeIds: string[], month: number, year: number): Promise<Array<{ salesId: string; day: number; count: number }>> {
        if (!employeeIds.length) return []

        const startDate = `${year}-${String(month).padStart(2, '0')}-01`
        const endDate = `${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()}`

        const [rows] = await this.nisDb.query<any[]>(
            `SELECT
                cs.SalesId AS sales_id,
                DAY(cs.CustRegDate) AS day_num,
                COUNT(cs.CustServId) AS total
            FROM CustomerServices cs
            INNER JOIN Services s ON s.ServiceId = cs.ServiceId
                AND s.ServiceCategory = 'access_home'
            WHERE cs.SalesId NOT IN ('0208801', 'CS', 'CRO')
                AND cs.CustRegDate BETWEEN ? AND ?
                AND cs.SalesId IN (?)
            GROUP BY cs.SalesId, DAY(cs.CustRegDate)`,
            [startDate, endDate, employeeIds]
        )

        return rows.map((row: any) => ({
            salesId: String(row.sales_id),
            day: Number(row.day_num),
            count: Number(row.total)
        }))
    }

    /**
     * Count daily access_business activity for a list of sales emails in a given month/year.
     * Queries the NusaProspect database: activity = customer_log_calls + prospect_tasks +
     * prospect_check_ins, counted per created_at day. Sales are matched to NusaProspect users
     * via tenant_users.email (= sales.email) -> tenant_users.user_uuid -> activity user id.
     * Keyed by sales email.
     *
     * @param {string[]} emails - List of sales emails.
     * @param {number} month - Month number (1-12).
     * @param {number} year - Full year (e.g. 2026).
     * @returns {Promise<Array<{ email: string; day: number; count: number }>>} Daily counts keyed by email.
     */
    async getBusinessDailyActivity(emails: string[], month: number, year: number): Promise<Array<{ email: string; day: number; count: number }>> {
        if (!emails.length) return []

        const startDate = `${year}-${String(month).padStart(2, '0')}-01`
        const endDate = `${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()}`

        const [rows] = await this.nusaprospectDb.query<any[]>(
            `SELECT
                tu.email AS email,
                a.day_num AS day_num,
                COUNT(*) AS total
            FROM tenant_users tu
            JOIN (
                SELECT IFNULL(clc.assigned_to_id, clc.created_by) AS user_id, DAY(clc.created_at) AS day_num
                FROM customer_log_calls clc
                WHERE DATE(clc.created_at) BETWEEN ? AND ?
                UNION ALL
                SELECT IFNULL(pt.assigned_to_id, pt.created_by) AS user_id, DAY(pt.created_at) AS day_num
                FROM prospect_tasks pt
                WHERE DATE(pt.created_at) BETWEEN ? AND ?
                UNION ALL
                SELECT pci.user_uuid AS user_id, DAY(pci.created_at) AS day_num
                FROM prospect_check_ins pci
                WHERE DATE(pci.created_at) BETWEEN ? AND ?
            ) a ON a.user_id = tu.user_uuid
            WHERE tu.email IN (?)
            GROUP BY tu.email, a.day_num`,
            [startDate, endDate, startDate, endDate, startDate, endDate, emails]
        )

        return rows.map((row: any) => ({
            email: String(row.email),
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
