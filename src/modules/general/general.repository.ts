import { type Pool } from 'mysql2/promise'
import { IGeneralRepository } from './general.repository.interface'

export class GeneralRepository implements IGeneralRepository {
    constructor(private readonly nisDb: Pool) {}

    async countNocOpen(): Promise<number> {
        const [rows] = await this.nisDb.query<any[]>(
            'SELECT COUNT(1) as total FROM noc WHERE status = ?',
            ['Open']
        )
        return Number(rows[0]?.total || 0)
    }

    async sumRevenue(period: string): Promise<number> {
        const [rows] = await this.nisDb.query<any[]>(
            `SELECT -SUM(Debet-Kredit) as total
                FROM GeneralJournal
                WHERE KodeCabang = '020'
                AND DATE_FORMAT(TglTransaksi, '%Y%m') = ?
                AND SUBSTR(NoPerkiraan, 1, 3) IN ('400', '401')`,
            [period]
        )
        return Number(rows[0]?.total || 0)
    }

    async countIspActive(): Promise<number> {
        const [rows] = await this.nisDb.query<any[]>(
            `SELECT COUNT(1) as total
                FROM CustomerServices cs
                LEFT JOIN Customer c ON c.CustId = cs.CustId
                LEFT JOIN Services s ON s.ServiceId = cs.ServiceId
                LEFT JOIN ServiceGroup sg ON sg.ServiceGroup = s.ServiceGroup
                WHERE sg.ServiceGroupTypeId = 1
                AND cs.CustStatus IN ('AC', 'FR')
                AND c.BranchId = '020'`
        )
        return Number(rows[0]?.total || 0)
    }

    async countIspAdded(startDate: string, endDate: string): Promise<number> {
        const [rows] = await this.nisDb.query<any[]>(
            `SELECT COUNT(1) as total
                FROM CustomerServices cs
                LEFT JOIN Customer c ON c.CustId = cs.CustId
                LEFT JOIN Services s ON s.ServiceId = cs.ServiceId
                LEFT JOIN ServiceGroup sg ON sg.ServiceGroup = s.ServiceGroup
                WHERE sg.ServiceGroupTypeId = 1
                AND cs.CustStatus IN ('AC', 'FR')
                AND c.BranchId = '020'
                AND cs.CustActivationDate BETWEEN ? AND ?`,
            [startDate, endDate]
        )
        return Number(rows[0]?.total || 0)
    }

    async countIspChurn(period: string): Promise<number> {
        const [rows] = await this.nisDb.query<any[]>(
            `SELECT COUNT(1) as total
                FROM CustomerServices cs
                LEFT JOIN Customer c ON c.CustId = cs.CustId
                LEFT JOIN Services s ON s.ServiceId = cs.ServiceId
                LEFT JOIN ServiceGroup sg ON sg.ServiceGroup = s.ServiceGroup
                WHERE sg.ServiceGroupTypeId = 1
                AND cs.CustStatus = 'NA'
                AND c.BranchId = '020'
                AND DATE_FORMAT(cs.CustUnregDate, '%Y%m') = ?`,
            [period]
        )
        return Number(rows[0]?.total || 0)
    }

    async countNusaWorkActive(): Promise<number> {
        const [rows] = await this.nisDb.query<any[]>(
            `SELECT COUNT(1) as total
                FROM ServiceSubcriptions ss
                LEFT JOIN CustomerServices cs ON cs.CustServId = ss.CustServId
                LEFT JOIN Customer c ON c.CustId = cs.CustId
                LEFT JOIN Services s ON s.ServiceId = cs.ServiceId
                WHERE ss.Status = 'AC'
                AND s.ServiceGroup = 'NW'
                AND cs.CustStatus != 'NA'
                AND c.BranchId = '020'`
        )
        return Number(rows[0]?.total || 0)
    }

    async countNusaWorkGrowth(startDate: string, endDate: string): Promise<number> {
        const [rows] = await this.nisDb.query<any[]>(
            `SELECT COUNT(1) as total
                FROM ServiceSubcriptions ss
                LEFT JOIN CustomerServices cs ON cs.CustServId = ss.CustServId
                LEFT JOIN Customer c ON c.CustId = cs.CustId
                LEFT JOIN Services s ON s.ServiceId = cs.ServiceId
                WHERE ss.Status = 'AC'
                AND s.ServiceGroup = 'NW'
                AND cs.CustRegDate BETWEEN ? AND ?
                AND c.BranchId = '020'`,
            [startDate, endDate]
        )
        return Number(rows[0]?.total || 0)
    }

    async countNusaWorkCompanies(startDate: string): Promise<number> {
        const [rows] = await this.nisDb.query<any[]>(
            `SELECT COUNT(DISTINCT cs.CustServId) as total
                FROM CustomerServices cs
                LEFT JOIN Customer c ON c.CustId = cs.CustId
                LEFT JOIN Services s ON s.ServiceId = cs.ServiceId
                LEFT JOIN NewCustomerInvoice nci ON nci.CustId = cs.CustId AND nci.Type = 'RA02'
                WHERE s.ServiceGroup = 'NW'
                AND cs.CustStatus IN ('AC', 'FR')
                AND c.BranchId = '020'
                AND nci.TransDate < ?`,
            [startDate]
        )
        return Number(rows[0]?.total || 0)
    }

    async countNusaWorkTotal(): Promise<number> {
        const [rows] = await this.nisDb.query<any[]>(
            `SELECT COUNT(1) as total
                FROM CustomerServices cs
                LEFT JOIN Customer c ON c.CustId = cs.CustId
                LEFT JOIN Services s ON s.ServiceId = cs.ServiceId
                WHERE s.ServiceGroup = 'NW'
                AND cs.CustStatus IN ('AC', 'FR')
                AND c.BranchId = '020'`
        )
        return Number(rows[0]?.total || 0)
    }

    async getHomeConnectCurrent(): Promise<Array<{ status: string; total: number }>> {
        const [rows] = await this.nisDb.query<any[]>(
            `SELECT cs.CustStatus as status, COUNT(cs.CustServId) as total
                FROM CustomerServices cs
                LEFT JOIN Customer c ON c.CustId = cs.CustId
                LEFT JOIN Services s ON s.ServiceId = cs.ServiceId
                WHERE c.BranchId = '020'
                AND cs.CustStatus IN ('FR', 'AC')
                AND s.ServiceGroup IN ('FBP')
                GROUP BY cs.CustStatus`
        )
        return rows
    }

    async getHomeConnectLastMonth(prevPeriodFormatted: string): Promise<Array<{ status: string; total: number }>> {
        const [rows] = await this.nisDb.query<any[]>(
            `SELECT cse.CustStatus as status, COUNT(cse.CustServId) as total
                FROM CustomerServiceExcerpt cse
                LEFT JOIN Customer c ON c.CustId = cse.CustId
                LEFT JOIN Services s ON s.ServiceId = cse.ServiceId
                WHERE c.BranchId = '020'
                AND cse.Period = ?
                AND cse.CustStatus IN ('FR', 'AC')
                AND s.ServiceGroup IN ('FBP')
                GROUP BY cse.CustStatus`,
            [prevPeriodFormatted]
        )
        return rows
    }

    async getHomeConnectConversion(): Promise<{ total_upgrade: number; total_free: number }> {
        const [rows] = await this.nisDb.query<any[]>(
            `SELECT * FROM (
                SELECT COUNT(DISTINCT cp.CustServId) as total_upgrade
                FROM CustomerServices cs
                LEFT JOIN (
                    SELECT cp.CustServId, cp.PrevSubscription, cp.NextSubscription,
                    ROW_NUMBER() OVER (PARTITION BY cp.CustServId ORDER BY cp.EfectiveFrom DESC) as rn
                    FROM ChangePackage cp
                    LEFT JOIN Services s ON s.ServiceId = cp.ChangePackage
                    LEFT JOIN ServiceGroup sg ON sg.ServiceGroup = s.ServiceGroup
                    WHERE sg.ServiceGroupTypeId = 1
                    ORDER BY cp.CustServId DESC, cp.EfectiveFrom DESC
                ) cp ON cp.CustServId = cs.CustServId AND cp.rn = 1
                WHERE cp.PrevSubscription = 0 AND cp.NextSubscription > 0
            ) csup JOIN (
                SELECT COUNT(1) as total_free
                FROM CustomerServices cs
                LEFT JOIN Services s ON s.ServiceId = cs.ServiceId
                LEFT JOIN ServiceGroup sg ON sg.ServiceGroup = s.ServiceGroup
                WHERE cs.CustStatus = 'FR'
                AND sg.ServiceGroupTypeId = 1
            ) csfr`
        )
        return {
            total_upgrade: Number(rows[0]?.total_upgrade || 0),
            total_free: Number(rows[0]?.total_free || 0)
        }
    }

    async listRevenuePeriod(startPeriod: string, endPeriod: string): Promise<Array<{ period: string; name: string; revenue: number }>> {
        const [rows] = await this.nisDb.query<any[]>(
            `SELECT DATE_FORMAT(gj.TglTransaksi, '%Y-%m') as period, p.NamaPerkiraan as name, -SUM(gj.Debet-gj.Kredit) as revenue
                FROM GeneralJournal gj
                LEFT JOIN Perkiraan p ON p.Perkiraan = SUBSTRING(NoPerkiraan, 1, 7) AND p.KodeCabang = gj.KodeCabang
                WHERE gj.KodeCabang = '020'
                AND DATE_FORMAT(gj.TglTransaksi, '%Y%m') BETWEEN ? AND ?
                AND SUBSTRING(NoPerkiraan, 1, 3) IN ('400', '401')
                GROUP BY DATE_FORMAT(gj.TglTransaksi, '%Y-%m'), SUBSTRING(NoPerkiraan, 1, 7)`,
            [startPeriod, endPeriod]
        )
        return rows.map(row => ({
            period: row.period,
            name: row.name,
            revenue: Number(row.revenue || 0)
        }))
    }

    async listRevenueMonthly(period: string): Promise<Array<{ period: string; name: string; revenue: number }>> {
        const [rows] = await this.nisDb.query<any[]>(
            `SELECT p.NamaPerkiraan as name, -SUM(gj.Debet-gj.Kredit) as revenue
                FROM GeneralJournal gj
                LEFT JOIN Perkiraan p ON p.Perkiraan = SUBSTRING(NoPerkiraan, 1, 7) AND p.KodeCabang = gj.KodeCabang
                WHERE gj.KodeCabang = '020'
                AND DATE_FORMAT(gj.TglTransaksi, '%Y%m') = ?
                AND SUBSTRING(NoPerkiraan, 1, 3) IN ('400', '401')
                GROUP BY DATE_FORMAT(gj.TglTransaksi, '%Y-%m'), SUBSTRING(NoPerkiraan, 1, 7)`,
            [period]
        )
        return rows.map(row => ({
            period: row.period,
            name: row.name,
            revenue: Number(row.revenue || 0)
        }))
    }

    async getAlertIssues(): Promise<any[]> {
        const [rows] = await this.nisDb.query<any[]>(
            `SELECT nb.BranchCity as branch, n.status as status,
                    COUNT(DISTINCT n.id) as total_issues,
                    COUNT(DISTINCT ncs.cs_id) as total_effected_customers,
                    MAX(n.start_time) as last_started_at
                FROM noc n
                LEFT JOIN noc_customer_service ncs ON ncs.noc_id = n.id
                LEFT JOIN NusaBranch nb ON nb.BranchId = n.branchId
                WHERE n.status IN ('Open', 'Under Investigate', 'Scheduled')
                GROUP BY nb.BranchCity, n.status`
        )
        return rows
    }

    async getAlertOverdue(): Promise<any[]> {
        const [rows] = await this.nisDb.query<any[]>(
            `SELECT s.BusinessOperation as type,
                    DATEDIFF(NOW(), IFNULL(citc.InvoiceExpDate, cit.InvoiceExpDate)) as total_exp_days,
                    COUNT(DISTINCT nci.AI) as total_invoices, SUM(nci.Credit) as amount
                FROM NewCustomerInvoice nci
                LEFT JOIN NewCustomerInvoiceBatch ncib ON ncib.AI = nci.AI
                LEFT JOIN CustomerInvoiceTemp cit ON cit.InvoiceNum = nci.Id AND cit.Urut = nci.No AND nci.Type = 'internet'
                LEFT JOIN CustomerInvoiceTemp_Custom citc ON citc.InvoiceNum = cit.InvoiceNum AND citc.Urut = cit.Urut
                LEFT JOIN CustomerServices cs ON cs.CustServId = cit.CustServId
                LEFT JOIN Services s ON s.ServiceId = cs.ServiceId
                LEFT JOIN Customer c ON c.CustId = nci.CustId
                WHERE cit.Reverse = 0 AND cit.RInvoiceNum = 0 AND ncib.batchNo IS NULL
                AND cs.CustStatus = 'AC' AND DATEDIFF(NOW(), IFNULL(citc.InvoiceExpDate, cit.InvoiceExpDate)) > 0
                AND nci.Credit > 0 AND c.BranchId = '020'
                GROUP BY s.BusinessOperation, DATEDIFF(NOW(), IFNULL(citc.InvoiceExpDate, cit.InvoiceExpDate))
                ORDER BY DATEDIFF(NOW(), IFNULL(citc.InvoiceExpDate, cit.InvoiceExpDate)) DESC`
        )
        return rows
    }

    async getAlertRenewals(): Promise<any[]> {
        const [rows] = await this.nisDb.query<any[]>(
            `SELECT sg.Description as service_group, COUNT(DISTINCT t.csid) as total_services,
                    SUM(t.amount) as amount, COUNT(DISTINCT t.ai) as total_invoices,
                    SUM(CASE WHEN t.is_renewal = 1 THEN 1 ELSE 0 END) as total_renewal,
                    SUM(CASE WHEN t.is_renewal = 0 THEN 1 ELSE 0 END) as total_new_subscription
                FROM (
                    SELECT nci.AI as ai, cit.ServiceGroup as service_group, nci.CustId as cid,
                        cit.CustServId as csid, nci.Credit as amount, IF(ncis.InvoiceNum IS NULL, 1, 0) as is_renewal
                    FROM NewCustomerInvoice nci
                    LEFT JOIN NewCustomerInvoiceBatch ncib ON ncib.AI = nci.AI
                    LEFT JOIN CustomerInvoiceTemp cit ON cit.InvoiceNum = nci.Id AND cit.Urut = nci.No
                    LEFT JOIN (
                        SELECT cit.InvoiceNum, cit.Urut, ROW_NUMBER() OVER (PARTITION BY cit.CustServId ORDER BY cit.Date ASC) as rn
                        FROM CustomerInvoiceTemp cit
                        WHERE cit.RInvoiceNum = 0 AND cit.Reverse = 0 AND cit.CustServId IS NOT NULL
                    ) ncis ON ncis.InvoiceNum = cit.InvoiceNum AND ncis.Urut = cit.Urut AND ncis.rn = 1
                    LEFT JOIN Customer c ON c.CustId = nci.CustId
                    LEFT JOIN (
                        SELECT ncib.batchNo
                        FROM NewCustomerInvoice nci
                        LEFT JOIN NewCustomerInvoiceBatch ncib ON ncib.AI = nci.AI
                        WHERE nci.Type LIKE 'RA%' AND ncib.batchNo IS NOT NULL
                        AND DATE_FORMAT(IFNULL(nci.JournalDate, nci.TransDate), '%Y-%m') = DATE_FORMAT(CURDATE(), '%Y-%m')
                        GROUP BY ncib.batchNo
                    ) ncir ON ncir.batchNo = ncib.batchNo
                    WHERE nci.Type = 'internet' AND cit.Reverse = 0 AND cit.RInvoiceNum = 0
                    AND ncir.batchNo IS NOT NULL AND c.BranchId = '020'
                ) t LEFT JOIN ServiceGroup sg ON sg.ServiceGroup = t.service_group
                GROUP BY t.service_group`
        )
        return rows
    }

    async getChurnRate(period: string): Promise<number> {
        const [rows] = await this.nisDb.query<any[]>(
            `SELECT csna.total/csac.total as percentage FROM (
                SELECT COUNT(cs.CustServId) as total FROM CustomerServices cs
                WHERE DATE_FORMAT(cs.CustUnregDate, '%Y%m') = ?
                AND cs.CustId IN (SELECT CustId FROM Customer WHERE BranchId = '020') AND cs.CustStatus = 'NA'
            ) csna JOIN (
                SELECT COUNT(cs.CustServId) as total FROM CustomerServices cs
                WHERE cs.CustId IN (SELECT CustId FROM Customer WHERE BranchId = '020') AND cs.CustStatus != 'NA'
            ) csac`,
            [period]
        )
        return Number(rows[0]?.percentage || 0)
    }

    async getSlaPercentage(startDate: string, nextMonthStartDate: string, activeDays: number): Promise<number> {
        const [rows] = await this.nisDb.query<any[]>(
            `SELECT
                csdown.weighted_duration / csup.weighted_duration AS percentage
                FROM (
                    SELECT COALESCE(SUM(TIMESTAMPDIFF(HOUR, n.start_time, n.end_time)), 0) AS weighted_duration
                    FROM noc_customer_service ncs
                    LEFT JOIN noc n ON n.id = ncs.noc_id
                    WHERE n.datetime >= ?
                        AND n.datetime < ?
                        AND n.status IN ('Solved', 'Close')
                        AND n.branchId IN (
                            SELECT BranchId FROM NusaBranch
                            WHERE deleted_at IS NULL
                            AND (BranchId = '020' OR SimilarToBranchId = '020')
                        )
                ) csdown
                JOIN (
                    SELECT COUNT(cs.CustServId) * 24 * ? AS weighted_duration
                    FROM CustomerServices cs
                    WHERE cs.CustId IN (
                        SELECT CustId FROM Customer WHERE BranchId = '020'
                    )
                    AND cs.CustStatus != 'NA'
                ) csup`,
            [startDate, nextMonthStartDate, activeDays]
        )
        return Number(rows[0]?.percentage || 0)
    }

    async getCollectionRate(startDate: string, endDate: string): Promise<number> {
        const [rows] = await this.nisDb.query<any[]>(
            `SELECT SUM(gj.Kredit) / SUM(gj.Debet) as percentage
                FROM GeneralJournal gj
                WHERE gj.NoPerkiraan LIKE '103%' AND gj.KodeCabang = '020'
                AND gj.Sumber IN ('nci', 'mnrp') AND gj.TglTransaksi BETWEEN ? AND ?`,
            [startDate, endDate]
        )
        return Number(rows[0]?.percentage || 0)
    }

    async getTicketsSolved(startDate: string, endDate: string): Promise<number> {
        const [rows] = await this.nisDb.query<any[]>(
            `SELECT SUM(CASE WHEN t.Status IN ('Call', 'Closed') THEN 1 ELSE 0 END) / COUNT(t.TtsId) as percentage
                FROM Tts t WHERE t.Status != 'Cancel' AND t.PostedTime BETWEEN ? AND ?`,
            [startDate, endDate]
        )
        return Number(rows[0]?.percentage || 0)
    }

    async getArpu(): Promise<number> {
        const [rows] = await this.nisDb.query<any[]>(
            `SELECT AVG(t.net_subscription / t.period) as average_mrc
                FROM (
                    SELECT cs.Subscription - IFNULL(CAST(cs.Discount AS UNSIGNED), 0) AS net_subscription,
                    IFNULL(IF(cs.InvoiceType != 8, itm.Month, 1), 1) AS period
                    FROM CustomerServices cs
                    LEFT JOIN InvoiceTypeMonth itm ON itm.InvoiceType = cs.InvoiceType
                    LEFT JOIN Services s ON s.ServiceId = cs.ServiceId
                    LEFT JOIN ServiceGroup sg ON sg.ServiceGroup = s.ServiceGroup
                    WHERE sg.ServiceGroupTypeId = 1 AND cs.CustStatus = 'AC'
                ) t`
        )
        return Number(rows[0]?.average_mrc || 0)
    }
}
