import { Pool } from 'mysql2/promise'
import { ISettingRepository, TargetRevenuePayload } from '../interfaces/setting.repository.interface'
import { BranchHelper } from '../../../../core/helpers/branch'

/**
 * Repository for handling target configuration database queries
 * Interfaces with nisDb for actual revenue and dashboardDb for target data
 */
export class SettingRepository implements ISettingRepository {
    constructor(
        private readonly nisDb: Pool,
        private readonly prospectDb: Pool,
        private readonly dashboardDb: Pool
    ) {}

    /**
     * Query actual revenue broken down by month for a specific year
     * Aggregates general journal entries
     * 
     * @param {string} branchId - The DisplayBranchId selector ('all', 'null', or a branch code)
     * @param {number} year - The target year
     * @returns {Promise<{total: number, details: any[]}>}
     */
    async getRevenue(branchId: string, year: number): Promise<{ total: number, details: { month: number, total: number }[] }> {
        const branch = BranchHelper.displayFilter(branchId)
        const [rows] = await this.nisDb.query<any[]>(
            `SELECT
                MONTH(gj.TglTransaksi) as month,
                SUM(gj.Kredit - gj.Debet) AS total
            FROM GeneralJournal gj
            LEFT JOIN Panjar_Penjualan_Breakdown ppb ON
                ppb.id = gj.SumberId
                AND gj.Sumber = 'pnjr'
            LEFT JOIN NewCustomerInvoice nci ON
                nci.AI = IFNULL(ppb.invoiceAI, gj.SumberId)
            LEFT JOIN CustomerInvoiceTemp cit ON
                cit.InvoiceNum = nci.Id
                AND cit.Urut = nci.No
            LEFT JOIN Customer c ON
                c.CustId = cit.CustId
            LEFT JOIN Services s ON
                s.ServiceId = cit.ServiceId
            WHERE gj.KodeCabang = '020'
            AND c.BranchId = '020'
            AND ${branch.sql}
            AND s.ServiceCategory = 'access_business'
            AND gj.NoPerkiraan LIKE '400%'
            AND YEAR(gj.TglTransaksi) = ?
            GROUP BY MONTH(gj.TglTransaksi)`,
            [...branch.params, year]
        )

        const total = rows.reduce((acc, row) => acc + Number(row.total || 0), 0)
        
        const details = Array.from({ length: 12 }, (_, i) => {
            const month = i + 1
            const row = rows.find(r => Number(r.month) === month)
            return {
                month,
                total: Number(row?.total || 0)
            }
        })

        return { total, details }
    }

    /**
     * Query sales target configuration for a specific year
     * Includes user metadata for the person who last updated it
     * 
     * @param {string} branch - The branch selector ('all', 'null', or a branch code)
     * @param {number} year - The target year
     * @returns {Promise<TargetRevenuePayload | null>}
     */
    async getTarget(branch: string, year: number): Promise<TargetRevenuePayload | null> {
        if (branch === 'all') {
            const branches = ['null', '025', '062', '027', '029']
            const [rows] = await this.dashboardDb.query<any[]>(
                `SELECT 
                    SUM(t.yearly_target) as yearly_target,
                    SUM(t.jan) as jan, SUM(t.feb) as feb, SUM(t.mar) as mar, SUM(t.apr) as apr,
                    SUM(t.may) as may, SUM(t.jun) as jun, SUM(t.jul) as jul, SUM(t.aug) as aug,
                    SUM(t.sep) as sep, SUM(t.oct) as oct, SUM(t.nov) as nov, SUM(t.\`dec\`) as \`dec\`,
                    MIN(t.is_locked) as min_locked,
                    COUNT(t.branch) as branch_count,
                    MAX(t.updated_at) as max_updated_at
                 FROM vp_access_business_target t
                 WHERE t.year = ? AND t.branch IN (?, ?, ?, ?, ?)`,
                [year, ...branches]
            )
            const row = rows[0]
            if (!row || Number(row.branch_count) === 0) return null

            let updatedBy = null
            if (row.max_updated_at) {
                const [latestUserRows] = await this.dashboardDb.query<any[]>(
                    `SELECT u.id as u_id, u.name as u_name, u.email as u_email, u.photo as u_photo, u.job_position as u_job_position
                     FROM vp_access_business_target t
                     JOIN users u ON t.updated_by = u.id
                     WHERE t.year = ? AND t.branch IN (?, ?, ?, ?, ?) AND t.updated_at = ?
                     LIMIT 1`,
                    [year, ...branches, row.max_updated_at]
                )
                if (latestUserRows.length > 0) {
                    const u = latestUserRows[0]
                    updatedBy = {
                        id: u.u_id,
                        name: u.u_name,
                        email: u.u_email,
                        photo: u.u_photo,
                        jobPosition: u.u_job_position
                    }
                }
            }

            return {
                year: year,
                branch: 'all',
                yearly_target: Number(row.yearly_target || 0),
                jan: Number(row.jan || 0),
                feb: Number(row.feb || 0),
                mar: Number(row.mar || 0),
                apr: Number(row.apr || 0),
                may: Number(row.may || 0),
                jun: Number(row.jun || 0),
                jul: Number(row.jul || 0),
                aug: Number(row.aug || 0),
                sep: Number(row.sep || 0),
                oct: Number(row.oct || 0),
                nov: Number(row.nov || 0),
                dec: Number(row.dec || 0),
                is_locked: Boolean(Number(row.min_locked) === 1 && Number(row.branch_count) === branches.length),
                updated_at: row.max_updated_at,
                updated_by: updatedBy
            }
        }

        const [rows] = await this.dashboardDb.query<any[]>(
            `SELECT t.*,
                 u.id as u_id, u.name as u_name, u.email as u_email, u.photo as u_photo, u.job_position as u_job_position
             FROM vp_access_business_target t
             LEFT JOIN users u ON t.updated_by = u.id
             WHERE t.year = ? AND t.branch = ?`,
            [year, branch]
        )
        if (rows.length === 0) return null

        const row = rows[0]
        return {
            year: row.year,
            branch: row.branch,
            yearly_target: Number(row.yearly_target),
            jan: Number(row.jan),
            feb: Number(row.feb),
            mar: Number(row.mar),
            apr: Number(row.apr),
            may: Number(row.may),
            jun: Number(row.jun),
            jul: Number(row.jul),
            aug: Number(row.aug),
            sep: Number(row.sep),
            oct: Number(row.oct),
            nov: Number(row.nov),
            dec: Number(row.dec),
            is_locked: Boolean(row.is_locked),
            updated_at: row.updated_at,
            updated_by: row.u_id ? {
                id: row.u_id,
                name: row.u_name,
                email: row.u_email,
                photo: row.u_photo,
                jobPosition: row.u_job_position
            } : null
        }
    }

    /**
     * Utility method to extract only target fields from a database record
     * Useful for formatting audit log payloads
     * 
     * @param {any} data - Raw database record
     * @returns {any} Cleaned target object
     */
    private extractTargetLogData(data: any) {
        if (!data) return {};
        return {
            yearly_target: Number(data.yearly_target) || 0,
            jan: Number(data.jan) || 0,
            feb: Number(data.feb) || 0,
            mar: Number(data.mar) || 0,
            apr: Number(data.apr) || 0,
            may: Number(data.may) || 0,
            jun: Number(data.jun) || 0,
            jul: Number(data.jul) || 0,
            aug: Number(data.aug) || 0,
            sep: Number(data.sep) || 0,
            oct: Number(data.oct) || 0,
            nov: Number(data.nov) || 0,
            dec: Number(data.dec) || 0
        };
    }

    /**
     * Query target modification history
     * Fetches logs of when targets were locked, unlocked, or updated
     * 
     * @param {string} [branch] - Optional branch filter ('all', 'null', or a branch code)
     * @param {number} [year] - Optional year filter
     * @returns {Promise<any[]>} Audit logs with user metadata
     */
    async getTargetLog(branch?: string, year?: number): Promise<any[]> {
        const connection = await this.dashboardDb.getConnection()
        try {
            let query = `
                SELECT
                    l.id, l.year, l.branch, l.reason, l.old_value, l.new_value,
                    l.created_at, l.updated_at,
                    c.id as c_id, c.name as c_name, c.email as c_email, c.photo as c_photo, c.job_position as c_job_position,
                    u.id as u_id, u.name as u_name, u.email as u_email, u.photo as u_photo, u.job_position as u_job_position
                FROM vp_access_business_target_log l
                LEFT JOIN users c ON l.created_by = c.id
                LEFT JOIN users u ON l.updated_by = u.id
            `
            const conditions: string[] = []
            const params: any[] = []

            if (branch && branch !== 'all') {
                conditions.push(`l.branch = ?`)
                params.push(branch)
            }

            if (year) {
                conditions.push(`l.year = ?`)
                params.push(year)
            }

            if (conditions.length > 0) {
                query += ` WHERE ${conditions.join(' AND ')}`
            }

            query += ` ORDER BY l.id DESC`

            const [rows] = await connection.query<any[]>(query, params)
            return rows
        } finally {
            connection.release()
        }
    }

    /**
     * Save target configuration and generate audit logs
     * Uses a transaction to ensure atomicity. Handles locking/unlocking logic
     * 
     * @param {string} branch - The branch selector ('all', 'null', or a branch code)
     * @param {number} year - The target year
     * @param {TargetRevenuePayload} payload - Target values (yearly and monthly)
     * @param {number} userId - The user performing the action
     * @returns {Promise<void>}
     */
    async saveTarget(branch: string, year: number, payload: TargetRevenuePayload, userId: number): Promise<void> {
        if (branch === 'all') {
            throw new Error("Target untuk pilihan 'All' tidak dapat diubah langsung karena merupakan gabungan dari seluruh cabang. Silakan pilih cabang spesifik.")
        }
        const connection = await this.dashboardDb.getConnection()
        try {
            await connection.beginTransaction()

            // Get old value for logging
            const [oldRows] = await connection.query<any[]>(
                `SELECT * FROM vp_access_business_target WHERE year = ? AND branch = ?`,
                [year, branch]
            )
            const oldValue = oldRows.length > 0 ? oldRows[0] : null

            // Insert or Update Target
            await connection.query(
                `INSERT INTO vp_access_business_target
                (year, branch, yearly_target, jan, feb, mar, apr, may, jun, jul, aug, sep, oct, nov, \`dec\`, is_locked, updated_by)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                yearly_target = VALUES(yearly_target),
                jan = VALUES(jan),
                feb = VALUES(feb),
                mar = VALUES(mar),
                apr = VALUES(apr),
                may = VALUES(may),
                jun = VALUES(jun),
                jul = VALUES(jul),
                aug = VALUES(aug),
                sep = VALUES(sep),
                oct = VALUES(oct),
                nov = VALUES(nov),
                \`dec\` = VALUES(\`dec\`),
                is_locked = VALUES(is_locked),
                updated_by = VALUES(updated_by)`,
                [
                    year, branch, payload.yearly_target, payload.jan, payload.feb, payload.mar,
                    payload.apr, payload.may, payload.jun, payload.jul, payload.aug,
                    payload.sep, payload.oct, payload.nov, payload.dec, payload.is_locked, userId
                ]
            )

            // Handle Logging Logic
            if (!payload.is_locked && payload.reason) {
                // Action: Unlock target
                await connection.query(
                    `INSERT INTO vp_access_business_target_log (year, branch, reason, old_value, new_value, created_by, updated_by, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        year,
                        branch,
                        payload.reason,
                        oldValue ? JSON.stringify(this.extractTargetLogData(oldValue)) : '{}',
                        null,
                        userId,
                        null,
                        null
                    ]
                )
            } else if (payload.is_locked) {
                // Action: Lock target
                const [pendingLogs] = await connection.query<any[]>(
                    `SELECT id FROM vp_access_business_target_log WHERE year = ? AND branch = ? AND new_value IS NULL ORDER BY id DESC LIMIT 1`,
                    [year, branch]
                )

                if (pendingLogs.length > 0) {
                    await connection.query(
                        `UPDATE vp_access_business_target_log 
                        SET new_value = ?, updated_by = ?, updated_at = NOW() 
                        WHERE id = ?`,
                        [JSON.stringify(this.extractTargetLogData(payload)), userId, pendingLogs[0].id]
                    )
                } else {
                    await connection.query(
                        `INSERT INTO vp_access_business_target_log (year, branch, reason, old_value, new_value, created_by, updated_by, updated_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
                        [
                            year,
                            branch,
                            'Initial Lock',
                            oldValue ? JSON.stringify(this.extractTargetLogData(oldValue)) : '{}',
                            JSON.stringify(this.extractTargetLogData(payload)),
                            userId,
                            userId
                        ]
                    )
                }
            }

            await connection.commit()
        } catch (error) {
            await connection.rollback()
            throw error
        } finally {
            connection.release()
        }
    }
}
