import { type Pool } from 'mysql2/promise'
import { IRetentionRepository } from '../interfaces/retention.repository.interface'

/**
 * Repository for handling retention database queries
 * Provides methods for interacting with the main operational database (nisDb)
 */
export class RetentionRepository implements IRetentionRepository {
    constructor(
        private readonly nisDb: Pool,
        private readonly dashboardDb: Pool,
        private readonly prospectDb: Pool
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

    async getForecastChurnBlocked(branchId: string, startDate: string, endDate: string): Promise<{ csid: number, mrc: number }[]> {
        const [rows] = await this.nisDb.query<any[]>(
            `SELECT
                cs.CustServId as csid,
                ((cs.Subscription - CAST(cs.Discount AS UNSIGNED)) / IF(
                    cs.InvoiceType != 8,
                    itm.Month,
                    1
                )) as mrc
            FROM CustomerServices cs
            LEFT JOIN Customer c ON
                c.CustId = cs.CustId
            LEFT JOIN InvoiceTypeMonth itm
                ON itm.InvoiceType = cs.InvoiceType
            WHERE cs.CustStatus = 'BL'
            AND c.BranchId = ?
            AND (cs.CustBlockDate + INTERVAL 30 DAY) >= ?
            AND (cs.CustBlockDate + INTERVAL 30 DAY) <= ?`,
            [branchId, startDate, endDate]
        )
        return rows.map(r => ({ csid: Number(r.csid), mrc: Number(r.mrc || 0) }))
    }

    async getForecastChurnContract(branchId: string, startDate: string, endDate: string): Promise<{ csid: number, mrc: number }[]> {
        const [rows] = await this.nisDb.query<any[]>(
            `SELECT
                t.csid,
                ((t.Subscription - CAST(t.Discount AS UNSIGNED)) / IF(
                    t.InvoiceType != 8,
                    itm.Month,
                    1
                )) as mrc
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
            LEFT JOIN InvoiceTypeMonth itm
                ON itm.InvoiceType = t.InvoiceType
            WHERE DATE(t.expired_date) >= ?
            AND DATE(t.expired_date) <= ?`,
            [branchId, startDate, endDate]
        )
        return rows.map(r => ({ csid: Number(r.csid), mrc: Number(r.mrc || 0) }))
    }

    async getForecastChurnTicket(branchId: string, startDate: string, endDate: string): Promise<{ csid: number, mrc: number }[]> {
        const [rows] = await this.nisDb.query<any[]>(
            `SELECT
                t.csid,
                t.mrc
            FROM (
                SELECT
                    t.CustServId as csid,
                    COUNT(t.TtsId) total_ticket,
                    ((cs.Subscription - CAST(cs.Discount AS UNSIGNED)) / IF(
                        cs.InvoiceType != 8,
                        itm.Month,
                        1
                    )) as mrc
                FROM Tts t
                LEFT JOIN CustomerServices cs ON cs.CustServId = t.CustServId
                LEFT JOIN Customer c ON c.CustId = cs.CustId
                LEFT JOIN InvoiceTypeMonth itm
                    ON itm.InvoiceType = cs.InvoiceType
                LEFT JOIN Services s ON s.ServiceId = cs.ServiceId
                WHERE t.TtsTypeId = 2
                AND t.Status != 'Cancel'
                AND s.ServiceCategory = 'access_business'
                AND c.BranchId = ?
                AND DATE(t.PostedTime) >= ?
                AND DATE(t.PostedTime) <= ?
                GROUP BY t.CustServId
            ) t
            WHERE t.total_ticket >= 2`,
            [branchId, startDate, endDate]
        )
        return rows.map(r => ({ csid: Number(r.csid), mrc: Number(r.mrc || 0) }))
    }

    async getForecastChurnUsage(branchId: string, startDate: string, endDate: string): Promise<{ csid: number, mrc: number }[]> {
        const [rows] = await this.nisDb.query<any[]>(
            `SELECT
                t.csid,
                ((cs.Subscription - CAST(cs.Discount AS UNSIGNED)) / IF(
                    cs.InvoiceType != 8,
                    itm.Month,
                    1
                )) as mrc
            FROM (
                SELECT 
                    td.csid,
                    (SUM(td.total) / 1024 / 1024) total_usage
                FROM traff_data td
                WHERE DATE(td.date) >= ?
                AND DATE(td.date) <= ?
                GROUP BY td.csid
            ) t
            LEFT JOIN CustomerServices cs ON
                cs.CustServId = t.csid
            LEFT JOIN Customer c ON
                c.CustId = cs.CustId
            LEFT JOIN InvoiceTypeMonth itm
                ON itm.InvoiceType = cs.InvoiceType
            LEFT JOIN Services s ON s.ServiceId = cs.ServiceId
            WHERE t.total_usage < 500
            AND s.ServiceCategory = 'access_business'
            AND c.BranchId = ?`,
            [startDate, endDate, branchId]
        )
        return rows.map(r => ({ csid: Number(r.csid), mrc: Number(r.mrc || 0) }))
    }

    async getNewMrc(branchId: string, startDate: string, endDate: string): Promise<{ mrc: number; mrc_unpaid: number; mrc_paid: number }> {
        const [rows] = await this.nisDb.query<any[]>(
            `SELECT
                COALESCE(SUM(((t.credit - IFNULL(d.discount, 0)) / 1.11) / t.inv_period), 0) AS mrc,
                COALESCE(SUM(
                    CASE
                        WHEN t.batch_no IS NULL
                        THEN ((t.credit - IFNULL(d.discount, 0)) / 1.11) / t.inv_period
                        ELSE 0
                    END
                ), 0) AS mrc_unpaid,
                COALESCE(SUM(
                    CASE
                        WHEN t.batch_no IS NOT NULL
                        THEN ((t.credit - IFNULL(d.discount, 0)) / 1.11) / t.inv_period
                        ELSE 0
                    END
                ), 0) AS mrc_paid
            FROM (
                SELECT
                    nci.AI ai,
                    nci.Credit credit,
                    IF(
                        cit.InvoiceType != 8,
                        itm.Month,
                        1
                    ) inv_period,
                    nci2.batchNo batch_no,
                    ROW_NUMBER() OVER (
                        PARTITION BY cit.CustServId
                    ) AS rn
                FROM CustomerInvoiceTemp cit
                LEFT JOIN InvoiceTypeMonth itm
                    ON itm.InvoiceType = cit.InvoiceType
                LEFT JOIN NewCustomerInvoice nci 
                    ON cit.InvoiceNum = nci.Id 
                    AND cit.Urut = nci.No
                LEFT JOIN Services s 
                    ON s.ServiceId = cit.ServiceId
                LEFT JOIN CustomerServices cs 
                    ON cs.CustServId = cit.CustServId
                LEFT JOIN Customer c 
                    ON c.CustId = cs.CustId
                LEFT JOIN NewCustomerInvoice nci2
                    ON nci2.Id = nci.Id
                    AND nci2.No = nci.No
                WHERE c.BranchId = ?
                AND s.ServiceCategory = 'access_business'
                AND DATE(nci.PayDate) >= ?
                AND DATE(nci.PayDate) <= ?
            ) t
            LEFT JOIN (
                SELECT 
                    nci3.AI, 
                    SUM(COALESCE(dd.Amount, 0)) AS discount
                FROM NewCustomerInvoice nci3
                LEFT JOIN Discount_Detail dd 
                    ON nci3.AI = dd.invoiceAI
                LEFT JOIN Discount d 
                    ON dd.DiscountId = d.id 
                    AND d.status = 2
                WHERE DATE(nci3.PayDate) >= ?
                AND DATE(nci3.PayDate) <= ?
                GROUP BY nci3.AI
            ) d ON t.ai = d.AI
            WHERE t.rn = 1`,
            [branchId, startDate, endDate, startDate, endDate]
        )
        return {
            mrc: Number(rows[0]?.mrc || 0),
            mrc_unpaid: Number(rows[0]?.mrc_unpaid || 0),
            mrc_paid: Number(rows[0]?.mrc_paid || 0)
        }
    }

    async getForecastMrc(startDate: string, endDate: string): Promise<number> {
        const [rows] = await this.prospectDb.query<any[]>(
            `SELECT
                SUM(poa.amount) value
            FROM customer_object_product_services cops
            LEFT JOIN prospect_opportunities po ON
                po.id = cops.object_id
                AND cops.object = 'opportunity'
            LEFT JOIN prospect_opportunity_amounts poa ON
                poa.opportunity_id = po.id
            LEFT JOIN prospect_opportunity_stages pos ON
                pos.id = po.opportunity_stage_id
            WHERE cops.product_service_id IN (12, 36, 34, 28)
            AND poa.amount_category_setting_id = 1
            AND po.id IS NOT NULL
            AND po.deleted_at IS NULL
            AND po.opportunity_stage_id = 5
            AND DATE(po.created_at) >= ?
            AND DATE(po.created_at) <= ?`,
            [startDate, endDate]
        )
        return Number(rows[0]?.value || 0)
    }
}
