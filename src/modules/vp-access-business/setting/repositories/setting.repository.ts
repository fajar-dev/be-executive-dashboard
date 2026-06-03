import { Pool } from 'mysql2/promise'
import { ISettingRepository, TargetRevenuePayload } from '../interfaces/setting.repository.interface'

export class SettingRepository implements ISettingRepository {
    constructor(
        private readonly nisDb: Pool,
        private readonly prospectDb: Pool,
        private readonly dashboardDb: Pool
    ) {}

    async getRevenue(branchId: string, year: number): Promise<{ total: number, details: { month: number, total: number }[] }> {
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
            LEFT JOIN Services s ON
                s.ServiceId = cit.ServiceId
            WHERE gj.KodeCabang = ?
            AND s.ServiceCategory = 'access_business'
            AND gj.NoPerkiraan LIKE '400%'
            AND YEAR(gj.TglTransaksi) = ?
            GROUP BY MONTH(gj.TglTransaksi)`,
            [branchId, year]
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

    async getTarget(year: number): Promise<TargetRevenuePayload | null> {
        const [rows] = await this.dashboardDb.query<any[]>(
            `SELECT t.*, u.name as updated_by_name 
             FROM vp_access_business_target t
             LEFT JOIN users u ON t.updated_by = u.id
             WHERE t.year = ?`,
            [year]
        )
        if (rows.length === 0) return null

        const row = rows[0]
        return {
            year: row.year,
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
            updated_by_name: row.updated_by_name
        }
    }

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

    async getTargetLog(year?: number): Promise<any[]> {
        const connection = await this.dashboardDb.getConnection()
        try {
            let query = `
                SELECT 
                    l.id, l.year, l.reason, l.old_value, l.new_value, 
                    l.created_at, l.updated_at,
                    c.name as created_by_name,
                    u.name as updated_by_name
                FROM vp_access_business_target_log l
                LEFT JOIN users c ON l.created_by = c.id
                LEFT JOIN users u ON l.updated_by = u.id
            `
            const params: any[] = []

            if (year) {
                query += ` WHERE l.year = ?`
                params.push(year)
            }

            query += ` ORDER BY l.id DESC`

            const [rows] = await connection.query<any[]>(query, params)
            return rows
        } finally {
            connection.release()
        }
    }

    async saveTarget(year: number, payload: TargetRevenuePayload, userId: number): Promise<void> {
        const connection = await this.dashboardDb.getConnection()
        try {
            await connection.beginTransaction()

            // Get old value for logging
            const [oldRows] = await connection.query<any[]>(
                `SELECT * FROM vp_access_business_target WHERE year = ?`,
                [year]
            )
            const oldValue = oldRows.length > 0 ? oldRows[0] : null

            // Insert or Update Target
            await connection.query(
                `INSERT INTO vp_access_business_target 
                (year, yearly_target, jan, feb, mar, apr, may, jun, jul, aug, sep, oct, nov, \`dec\`, is_locked, updated_by)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
                    year, payload.yearly_target, payload.jan, payload.feb, payload.mar,
                    payload.apr, payload.may, payload.jun, payload.jul, payload.aug,
                    payload.sep, payload.oct, payload.nov, payload.dec, payload.is_locked, userId
                ]
            )

            // Handle Logging Logic
            if (!payload.is_locked && payload.reason) {
                // Action: Unlock target
                await connection.query(
                    `INSERT INTO vp_access_business_target_log (year, reason, old_value, new_value, created_by, updated_by, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [
                        year,
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
                    `SELECT id FROM vp_access_business_target_log WHERE year = ? AND new_value IS NULL ORDER BY id DESC LIMIT 1`,
                    [year]
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
                        `INSERT INTO vp_access_business_target_log (year, reason, old_value, new_value, created_by, updated_by, updated_at)
                        VALUES (?, ?, ?, ?, ?, ?, NOW())`,
                        [
                            year,
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
