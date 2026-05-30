import { type Pool } from 'mysql2/promise'
import { IRetentionRepository } from '../interfaces/retention.repository.interface'

export class RetentionRepository implements IRetentionRepository {
    constructor(
        private readonly nisDb: Pool
    ) {}

    async churnRevenue(branchId: string, startDate: string, endDate: string): Promise<number> {
        const [rows] = await this.nisDb.query<any[]>(
            `SELECT
                    SUM(gj.Kredit - gj.Debet) / COUNT(DISTINCT cit.CustServId) total
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
                GROUP BY s.ServiceGroup
                `,
            [branchId, startDate, endDate, startDate, endDate]
        )
        return rows
    }

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

    async migrationWirelessPercentage(branchId: string, startDate: string, endDate: string): Promise<number> {
        const [rows] = await this.nisDb.query<any[]>(
            `SELECT
                    mg.total / (cr.total + mg.total) * 100 percent
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
}
