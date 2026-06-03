import { type Pool } from 'mysql2/promise'
import { IRetentionRepository } from '../interfaces/retention.repository.interface'

/**
 * Repository for handling retention database queries
 * Provides methods for interacting with the main operational database (nisDb)
 */
export class RetentionRepository implements IRetentionRepository {
    constructor(
        private readonly nisDb: Pool
    ) {}

    /**
     * Query churned revenue
     * Aggregates revenue generated from customer services that are now in 'NA' (churn) status
     * 
     * @param {string} branchId - The branch identifier
     * @param {string} startDate - Query start date
     * @param {string} endDate - Query end date
     * @returns {Promise<number>} Total revenue lost to churn
     */
    async churnRevenue(branchId: string, startDate: string, endDate: string): Promise<number> {
        const [rows] = await this.nisDb.query<any[]>(
            `SELECT
                    SUM(gj.Kredit - gj.Debet) total
                FROM GeneralJournal gj
                LEFT JOIN Panjar_Penjualan_Breakdown ppb ON
                    ppb.id = gj.SumberId 
                    AND gj.Sumber = 'pnjr'
                LEFT JOIN NewCustomerInvoice nci ON
                    nci.AI = IFNULL(ppb.invoiceAI, gj.SumberId)
                LEFT JOIN CustomerInvoiceTemp cit ON
                    cit.InvoiceNum = nci.Id
                    AND cit.Urut = nci.No
                LEFT JOIN CustomerServices cs ON
                    cs.CustServId = cit.CustServId
                LEFT JOIN Services s ON
                    s.ServiceId = cit.ServiceId
                WHERE gj.KodeCabang = ?
                AND s.ServiceCategory = 'access_business'
                AND gj.NoPerkiraan LIKE '400%'
                AND gj.TglTransaksi >= ?
                AND gj.TglTransaksi <= ?
                AND cs.CustStatus = 'NA'
                `,
            [branchId, startDate, endDate]
        )
        return Number(rows[0]?.total || 0)
    }

    /**
     * Calculate general churn rate
     * Calculates the ratio of churned customers against the total active customer base
     * 
     * @param {string} branchId - The branch identifier
     * @param {string} startDate - Query start date
     * @param {string} endDate - Query end date
     * @returns {Promise<{rate: number, churn: number, active: number}>} Rate and raw counts
     */
    async churnRate(branchId: string, startDate: string, endDate: string): Promise<{ rate: number, churn: number, active: number }> {
        const [rows] = await this.nisDb.query<any[]>(
            `SELECT
                    *,
                    (na.total_churn / ac.total_active) * 100 churn_rate
                FROM (
                    SELECT
                        COUNT(1) total_active
                    FROM CustomerServices cs
                    LEFT JOIN Customer c ON
                        c.CustId = cs.CustId
                    LEFT JOIN Services s ON
                        s.ServiceId = cs.ServiceId
                    WHERE s.ServiceCategory = 'access_business'
                    AND c.BranchId = ?
                    AND (cs.CustRegDate <= ?)
                    AND (cs.CustUnregDate IS NULL OR cs.CustUnregDate >= ?)
                    AND (cs.CustBlockDate IS NULL OR cs.CustBlockDate >= ?)
                ) ac
                JOIN (
                    SELECT
                        COUNT(1) total_churn
                    FROM CustomerServices cs
                    LEFT JOIN Customer c ON
                        c.CustId = cs.CustId
                    LEFT JOIN Services s ON
                        s.ServiceId = cs.ServiceId
                    WHERE cs.CustStatus IN ('NA', 'BL')
                    AND s.ServiceCategory = 'access_business'
                    AND c.BranchId = ?
                    AND (
                        (cs.CustUnregDate >= ? AND cs.CustUnregDate <= ?)
                        OR (cs.CustBlockDate >= ? AND cs.CustBlockDate <= ?)
                    )
                ) na
                `,
            [branchId, endDate, startDate, startDate, branchId, startDate, endDate, startDate, endDate]
        )
        return {
            rate: Number(rows[0]?.churn_rate || 0),
            churn: Number(rows[0]?.total_churn || 0),
            active: Number(rows[0]?.total_active || 0)
        }
    }

    /**
     * Query lost customers by service group
     * Groups churned customers by their service type description
     * 
     * @param {string} branchId - The branch identifier
     * @param {string} startDate - Query start date
     * @param {string} endDate - Query end date
     * @returns {Promise<any[]>} Breakdown of lost customers by group
     */
    async customerLose(branchId: string, startDate: string, endDate: string): Promise<any[]> {
        const [rows] = await this.nisDb.query<any[]>(
            `SELECT
                    sg.Description service_group,
                    COUNT(1) total_churn
                FROM CustomerServices cs
                LEFT JOIN Customer c ON
                    c.CustId = cs.CustId
                LEFT JOIN Services s ON
                    s.ServiceId = cs.ServiceId
                LEFT JOIN ServiceGroup sg ON
                    sg.ServiceGroup = s.ServiceGroup
                WHERE cs.CustStatus IN ('NA', 'BL')
                AND s.ServiceCategory = 'access_business'
                AND c.BranchId = ?
                AND (
                    (cs.CustUnregDate >= ? AND cs.CustUnregDate <= ?)
                    OR (cs.CustBlockDate >= ? AND cs.CustBlockDate <= ?)
                )
                GROUP BY s.ServiceGroup, sg.Description
                `,
            [branchId, startDate, endDate, startDate, endDate]
        )
        return rows
    }

    /**
     * Count total active wireless customers
     * Used as a baseline to measure migration progress
     * 
     * @param {string} branchId - The branch identifier
     * @returns {Promise<number>} Total wireless customer count
     */
    async wirelessCustomer(branchId: string): Promise<number> {
        const [rows] = await this.nisDb.query<any[]>(
            `SELECT
                COUNT(1) total
            FROM CustomerServices cs
            LEFT JOIN Customer c ON
                c.CustId = cs.CustId
            LEFT JOIN Services s ON
                s.ServiceId = cs.ServiceId
            LEFT JOIN ServiceGroup sg ON
                sg.ServiceGroup = s.ServiceGroup
            WHERE cs.CustStatus IN ('AC', 'FR')
            AND s.ServiceGroup IN ('VB', 'WL')
            AND c.BranchId = ?`,
            [branchId]
        )
        return Number(rows[0]?.total || 0)
    }

    /**
     * Count customers migrated from wireless to fiber
     * Looks at package change history records
     * 
     * @param {string} branchId - The branch identifier
     * @param {string} startDate - Query start date
     * @param {string} endDate - Query end date
     * @returns {Promise<number>} Number of migrated customers
     */
    async wirelessMigration(branchId: string, startDate: string, endDate: string): Promise<number> {
        const [rows] = await this.nisDb.query<any[]>(
            `SELECT
                    COUNT(1) total
                FROM
                    ChangePackage cp
                LEFT JOIN Services st ON
                    st.ServiceId = cp.ChangePackage
                LEFT JOIN Services sf ON
                    sf.ServiceId = cp.CurrentService
                LEFT JOIN CustomerServices cs ON
                        cs.CustServId = cp.CustServId
                    LEFT JOIN Customer c ON
                        c.CustId = cs.CustId
                WHERE sf.ServiceGroup IN ('VB', 'WL')
                AND st.ServiceGroup IN ('FD')
                AND c.BranchId = ?
                AND DATE(cp.EfectiveFrom) >= ? 
                AND DATE(cp.EfectiveFrom) <= ?`,
            [branchId, startDate, endDate]
        )
        return Number(rows[0]?.total || 0)
    }

    /**
     * Calculate wireless migration rate
     * Calculates the percentage of wireless customers who have migrated to fiber
     * 
     * @param {string} branchId - The branch identifier
     * @param {string} startDate - Query start date
     * @param {string} endDate - Query end date
     * @returns {Promise<number>} Migration percentage rate
     */
    async migrationWirelessPercentage(branchId: string, startDate: string, endDate: string): Promise<number> {
        const [rows] = await this.nisDb.query<any[]>(
            `SELECT
                    IFNULL(mg.total / NULLIF(cr.total + mg.total, 0) * 100, 0) percent
                FROM (
                    SELECT
                        COUNT(1) total
                    FROM
                        ChangePackage cp
                    LEFT JOIN Services st ON
                        st.ServiceId = cp.ChangePackage
                    LEFT JOIN Services sf ON
                        sf.ServiceId = cp.CurrentService
                    LEFT JOIN CustomerServices cs ON
                        cs.CustServId = cp.CustServId
                    LEFT JOIN Customer c ON
                        c.CustId = cs.CustId
                    WHERE sf.ServiceGroup IN ('VB', 'WL')
                    AND c.BranchId = ?
                    AND DATE(cp.EfectiveFrom) >= ?
                    AND DATE(cp.EfectiveFrom) <= ?
                ) mg
                JOIN (
                    SELECT
                        COUNT(1) total
                    FROM CustomerServices cs
                    LEFT JOIN Services s ON
                        s.ServiceId = cs.ServiceId
                    LEFT JOIN Customer c ON
                        c.CustId = cs.CustId
                    WHERE s.ServiceGroup IN ('VB', 'WL')
                    AND cs.CustStatus IN ('AC', 'FR')
                    AND c.BranchId = ?
                ) cr
                `,
            [branchId, startDate, endDate, branchId]
        )
        return Number(rows[0]?.percent || 0)
    }

    /**
     * Query count of contracts expiring soon
     * Uses DATEDIFF to bucket upcoming expirations into 30, 60, and 90 days windows
     * 
     * @param {string} branchId - The branch identifier
     * @returns {Promise<{total: number, total_30: number, total_60: number, total_90: number}>}
     */
    async contractExpiring(branchId: string): Promise<{ total: number; total_30: number; total_60: number; total_90: number }> {
        const [rows] = await this.nisDb.query<any[]>(
            `SELECT
                COUNT(1) total,
                SUM(CASE
                    WHEN DATEDIFF(t.expired_date, NOW()) <= 30
                    THEN 1
                    ELSE 0
                    END
                ) as total_30,
                SUM(CASE
                    WHEN DATEDIFF(t.expired_date, NOW()) BETWEEN 31 AND 60
                    THEN 1
                    ELSE 0
                    END
                ) as total_60,
                SUM(CASE
                    WHEN DATEDIFF(t.expired_date, NOW()) BETWEEN 61 AND 90
                    THEN 1
                    ELSE 0
                    END
                ) as total_90
            FROM (
                SELECT 
                    dc.CustServId csid,
                    dc.Data data,
                    CASE
                        WHEN JSON_UNQUOTE(JSON_EXTRACT(dc.Data, '$.sampaiTanggal')) IS NULL
                            OR JSON_UNQUOTE(JSON_EXTRACT(dc.Data, '$.sampaiTanggal')) = ''
                        THEN LAST_DAY(
                            STR_TO_DATE(
                                CONCAT(
                                    JSON_UNQUOTE(JSON_EXTRACT(dc.Data, '$.sampaiTahun')),
                                    '-',
                                    LPAD(JSON_UNQUOTE(JSON_EXTRACT(dc.Data, '$.sampaiBulan')), 2, '0'),
                                    '-01'
                                ),
                                '%Y-%m-%d'
                            )
                        )
                        ELSE STR_TO_DATE(
                            CONCAT(
                                JSON_UNQUOTE(JSON_EXTRACT(dc.Data, '$.sampaiTahun')),
                                '-',
                                LPAD(JSON_UNQUOTE(JSON_EXTRACT(dc.Data, '$.sampaiBulan')), 2, '0'),
                                '-',
                                LPAD(JSON_UNQUOTE(JSON_EXTRACT(dc.Data, '$.sampaiTanggal')), 2, '0')
                            ),
                            '%Y-%m-%d'
                        )
                    END AS expired_date,
                    cs.*
                FROM document_contract dc
                LEFT JOIN CustomerServices cs 
                    ON cs.CustServId = dc.CustServId
                LEFT JOIN Customer c ON
                    c.CustId = cs.CustId
                LEFT JOIN Services s 
                    ON s.ServiceId = cs.ServiceId
                WHERE s.ServiceCategory = 'access_business'
                AND c.BranchId = ?
            ) t
            WHERE DATEDIFF(t.expired_date, NOW()) BETWEEN 0 AND 90`,
            [branchId]
        )
        return {
            total: Number(rows[0]?.total || 0),
            total_30: Number(rows[0]?.total_30 || 0),
            total_60: Number(rows[0]?.total_60 || 0),
            total_90: Number(rows[0]?.total_90 || 0),
        }
    }

    /**
     * Query count of customers with frequent tickets
     * Customers with >= 2 tickets in a month are flagged for retention risk
     * 
     * @param {string} branchId - The branch identifier
     * @param {string} startDate - Query start date
     * @param {string} endDate - Query end date
     * @returns {Promise<number>} Total distinct customers flagged for high tickets
     */
    async ticket(branchId: string, startDate: string, endDate: string): Promise<number> {
        const [rows] = await this.nisDb.query<any[]>(
            `SELECT
                COUNT(1) AS total_service
            FROM (
                SELECT
                    t.CustServId AS csid,
                    YEAR(t.PostedTime) AS yr,
                    MONTH(t.PostedTime) AS mo,
                    COUNT(t.TtsId) AS total_ticket
                FROM Tts t
                LEFT JOIN CustomerServices cs 
                    ON cs.CustServId = t.CustServId
                LEFT JOIN Customer c 
                    ON c.CustId = cs.CustId
                LEFT JOIN Services s 
                    ON s.ServiceId = cs.ServiceId
                WHERE t.TtsTypeId = 2
                AND t.Status != 'Cancel'
                AND s.ServiceCategory = 'access_business'
                AND c.BranchId = ?
                AND DATE(t.PostedTime) >= ? 
                AND DATE(t.PostedTime) <= ?
                GROUP BY t.CustServId, YEAR(t.PostedTime), MONTH(t.PostedTime)
            ) t
            WHERE t.total_ticket >= 2`,
            [branchId, startDate, endDate]
        )
        return Number(rows[0]?.total_service || 0)
    }

    /**
     * Query count of customers with low usage
     * Customers with usage < 500MB are flagged for low utilization risk
     * 
     * @param {string} branchId - The branch identifier
     * @param {string} startDate - Query start date
     * @param {string} endDate - Query end date
     * @returns {Promise<number>} Total distinct customers flagged for low usage
     */
    async usage(branchId: string, startDate: string, endDate: string): Promise<number> {
        const [rows] = await this.nisDb.query<any[]>(
            `SELECT
                COUNT(1) AS total_service
            FROM (
                SELECT 
                    td.csid,
                    YEAR(td.date) AS yr,
                    MONTH(td.date) AS mo,
                    (SUM(td.total) / 1024 / 1024) AS total_usage
                FROM traff_data td
                WHERE DATE(td.date) >= ? 
                  AND DATE(td.date) <= ?
                GROUP BY td.csid, YEAR(td.date), MONTH(td.date)
            ) t
            LEFT JOIN CustomerServices cs 
                ON cs.CustServId = t.csid
            LEFT JOIN Customer c 
                ON c.CustId = cs.CustId
            LEFT JOIN InvoiceTypeMonth itm
                ON itm.InvoiceType = cs.InvoiceType
            LEFT JOIN Services s 
                ON s.ServiceId = cs.ServiceId
            WHERE t.total_usage < 500
              AND s.ServiceCategory = 'access_business'
              AND c.BranchId = ?`,
            [startDate, endDate, branchId]
        )
        return Number(rows[0]?.total_service || 0)
    }

    /**
     * Query percentage of customers on monthly billing cycle
     * Compares active customers on a 1-month invoice type vs the overall active customer base
     * 
     * @param {string} branchId - The branch identifier
     * @returns {Promise<number | null>} Percentage of monthly payers
     */
    async payment(branchId: string): Promise<number | null> {
        const [rows] = await this.nisDb.query<any[]>(
            `SELECT
                IFNULL((csm.total / NULLIF(cst.total, 0)) * 100, 0) as percent
            FROM (
                SELECT
                    COUNT(1) total
                FROM CustomerServices cs
                LEFT JOIN Customer c ON
                    c.CustId = cs.CustId 
                LEFT JOIN Services s ON
                    s.ServiceId = cs.ServiceId
                LEFT JOIN InvoiceTypeMonth itm
                    ON itm.InvoiceType = cs.InvoiceType
                WHERE s.ServiceCategory = 'access_business'
                AND c.BranchId = ?
                AND cs.CustStatus = 'AC'
                AND IF(	
                        cs.InvoiceType != 8,
                            itm.Month,
                            1
                        ) = 1
            ) csm
            JOIN (
                    SELECT
                    COUNT(1) total
                FROM CustomerServices cs
                LEFT JOIN Customer c ON
                    c.CustId = cs.CustId 
                LEFT JOIN Services s ON
                    s.ServiceId = cs.ServiceId
                LEFT JOIN InvoiceTypeMonth itm
                    ON itm.InvoiceType = cs.InvoiceType
                WHERE s.ServiceCategory = 'access_business'
                AND c.BranchId = ?
                AND cs.CustStatus = 'AC'
            ) cst`,
            [branchId, branchId]
        )
        
        if (rows[0]?.percent === null || rows[0]?.percent === undefined) {
            return null
        }
        
        return Number(rows[0].percent)
    }
}
