import { isxPool } from '../../config/isx.db'
import { DateHelper } from '../../core/helpers/date'

export class GeneralService {
    private defaultBranchId = '020'

    /**
     * NOC Tickets with 'Open' status
     */
    async getNocStatus() {
        const [rows] = await isxPool.query<any[]>('SELECT COUNT(1) as total FROM noc WHERE status = ?', ['Open'])
        return Number(rows[0]?.total || 0)
    }

    /**
     * Revenue based on GeneralJournal
     */
    async getRevenue(period: string) {
        const { currentPeriod } = DateHelper.getPeriodInfo(period)
        const prevPeriod = DateHelper.getPreviousPeriod(period)

        const [rows] = await isxPool.query<any[]>(
            `SELECT -SUM(Debet-Kredit) as total 
             FROM GeneralJournal 
             WHERE KodeCabang = '020'
             AND DATE_FORMAT(TglTransaksi, '%Y%m') = ? 
             AND SUBSTR(NoPerkiraan, 1, 3) IN ('400', '401')`,
            [currentPeriod]
        )

        const [prevRows] = await isxPool.query<any[]>(
            `SELECT -SUM(Debet-Kredit) as total 
             FROM GeneralJournal 
             WHERE KodeCabang = '020'
             AND DATE_FORMAT(TglTransaksi, '%Y%m') = ? 
             AND SUBSTR(NoPerkiraan, 1, 3) IN ('400', '401')`,
            [prevPeriod]
        )

        return {
            currentMonth: Number(rows[0]?.total || 0),
            previousMonth: Number(prevRows[0]?.total || 0)
        }
    }

    /**
     * ISP Customer Metrics (Active, Added, Churned)
     */
    async getIspStats(period: string) {
        const { currentPeriod, startDate, endDate } = DateHelper.getPeriodInfo(period)

        const [active] = await isxPool.query<any[]>(
            `SELECT COUNT(1) as total 
             FROM CustomerServices cs 
             LEFT JOIN Customer c ON c.CustId = cs.CustId 
             LEFT JOIN Services s ON s.ServiceId = cs.ServiceId 
             LEFT JOIN ServiceGroup sg ON sg.ServiceGroup = s.ServiceGroup 
             WHERE sg.ServiceGroupTypeId = 1 
             AND cs.CustStatus IN ('AC', 'FR') 
             AND c.BranchId = '020'`
        )

        const [added] = await isxPool.query<any[]>(
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

        const prevStart = DateHelper.getPreviousMonthStart(period)
        const prevEnd = DateHelper.getPreviousMonthEnd(period)
        const [addedLastMonth] = await isxPool.query<any[]>(
            `SELECT COUNT(1) as total 
             FROM CustomerServices cs 
             LEFT JOIN Customer c ON c.CustId = cs.CustId 
             LEFT JOIN Services s ON s.ServiceId = cs.ServiceId 
             LEFT JOIN ServiceGroup sg ON sg.ServiceGroup = s.ServiceGroup 
             WHERE sg.ServiceGroupTypeId = 1 
             AND cs.CustStatus IN ('AC', 'FR') 
             AND c.BranchId = '020' 
             AND cs.CustActivationDate BETWEEN ? AND ?`,
            [prevStart, prevEnd]
        )

        const [churn] = await isxPool.query<any[]>(
            `SELECT COUNT(1) as total 
             FROM CustomerServices cs 
             LEFT JOIN Customer c ON c.CustId = cs.CustId 
             LEFT JOIN Services s ON s.ServiceId = cs.ServiceId 
             LEFT JOIN ServiceGroup sg ON sg.ServiceGroup = s.ServiceGroup 
             WHERE sg.ServiceGroupTypeId = 1 
             AND cs.CustStatus = 'NA' 
             AND c.BranchId = '020' 
             AND DATE_FORMAT(cs.CustUnregDate, '%Y%m') = ?`,
            [currentPeriod]
        )

        return {
            active: Number(active[0]?.total || 0),
            added: Number(added[0]?.total || 0),
            addedLastMonth: Number(addedLastMonth[0]?.total || 0),
            churn: Number(churn[0]?.total || 0)
        }
    }

    /**
     * NusaWork Metrics (Active, Growth, Companies)
     */
    async getNusaWorkStats(period: string) {
        const {startDate, endDate } = DateHelper.getPeriodInfo(period)

        const [active] = await isxPool.query<any[]>(
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

        const [growth] = await isxPool.query<any[]>(
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

        const [companies] = await isxPool.query<any[]>(
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

        const [total] = await isxPool.query<any[]>(
            `SELECT COUNT(1) as total 
             FROM CustomerServices cs 
             LEFT JOIN Customer c ON c.CustId = cs.CustId 
             LEFT JOIN Services s ON s.ServiceId = cs.ServiceId 
             WHERE s.ServiceGroup = 'NW' 
             AND cs.CustStatus IN ('AC', 'FR') 
             AND c.BranchId = '020'`
        )

        return {
            active: Number(active[0]?.total || 0),
            growth: Number(growth[0]?.total || 0),
            companies: Number(companies[0]?.total || 0),
            total: Number(total[0]?.total || 0)
        }
    }
    /**
     * HomeConnect (FBP) Metrics
     */
    async getHomeConnectStats(period: string) {
        const prevPeriod = DateHelper.getPreviousPeriod(period)
        const prevPeriodFormatted = prevPeriod.substring(4, 6) + prevPeriod.substring(2, 4)

        const [current] = await isxPool.query<any[]>(
            `SELECT cs.CustStatus as status, COUNT(cs.CustServId) as total 
             FROM CustomerServices cs 
             LEFT JOIN Customer c ON c.CustId = cs.CustId 
             LEFT JOIN Services s ON s.ServiceId = cs.ServiceId 
             WHERE c.BranchId = '020' 
             AND cs.CustStatus IN ('FR', 'AC') 
             AND s.ServiceGroup IN ('FBP') 
             GROUP BY cs.CustStatus`
        )

        const [lastMonth] = await isxPool.query<any[]>(
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

        const [conversion] = await isxPool.query<any[]>(
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
            current: current.reduce((acc, row) => ({ ...acc, [row.status]: Number(row.total) }), { AC: 0, FR: 0 }),
            lastMonth: lastMonth.reduce((acc, row) => ({ ...acc, [row.status]: Number(row.total) }), { AC: 0, FR: 0 }),
            conversion: {
                upgrade: Number(conversion[0]?.total_upgrade || 0),
                free: Number(conversion[0]?.total_free || 0)
            }
        }
    }

    /**
     * Revenue Period
     */
    async getRevenuePeriod(startPeriod: string, endPeriod: string) {
        const [rows] = await isxPool.query<any[]>(
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

    /**
     * Revenue Monthly
     */
    async getRevenueMonthly(period: string) {
        const [rows] = await isxPool.query<any[]>(
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

    /**
     * Alerts & Notifications
     */
    async getAlerts() {
        // 1. Issues by branch
        const [issues] = await isxPool.query<any[]>(
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

        // 2. Overdue Invoices
        const [overdue] = await isxPool.query<any[]>(
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

        // 3. Renewals
        const [renewals] = await isxPool.query<any[]>(
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

        return {
            issues,
            overdue,
            renewals
        }
    }

    /**
     * Health Metrics
     */
    async getHealthMetrics(period: string) {
        const { currentPeriod, startDate, endDate } = DateHelper.getPeriodInfo(period)

        // Churn Rate
        const [churnRate] = await isxPool.query<any[]>(
            `SELECT csna.total/csac.total as percentage FROM (
                SELECT COUNT(cs.CustServId) as total FROM CustomerServices cs 
                WHERE DATE_FORMAT(cs.CustUnregDate, '%Y%m') = ? 
                AND cs.CustId IN (SELECT CustId FROM Customer WHERE BranchId = '020') AND cs.CustStatus = 'NA'
            ) csna JOIN (
                SELECT COUNT(cs.CustServId) as total FROM CustomerServices cs 
                WHERE cs.CustId IN (SELECT CustId FROM Customer WHERE BranchId = '020') AND cs.CustStatus != 'NA'
            ) csac`,
            [currentPeriod]
        )

        // SLA Uptime
        const activeDays = DateHelper.getActiveDays(currentPeriod)
        
        const nextMonthDate = new Date(Number(currentPeriod.substring(0, 4)), Number(currentPeriod.substring(4, 6)), 1)
        const nextMonthStartDate = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, '0')}-01`

        const [sla] = await isxPool.query<any[]>(
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

        // Collection Rate
        const [collectionRate] = await isxPool.query<any[]>(
            `SELECT SUM(gj.Kredit) / SUM(gj.Debet) as percentage 
             FROM GeneralJournal gj 
             WHERE gj.NoPerkiraan LIKE '103%' AND gj.KodeCabang = '020' 
             AND gj.Sumber IN ('nci', 'mnrp') AND gj.TglTransaksi BETWEEN ? AND ?`,
            [startDate, endDate]
        )

        // Tickets Solved
        const [tickets] = await isxPool.query<any[]>(
            `SELECT SUM(CASE WHEN t.Status IN ('Call', 'Closed') THEN 1 ELSE 0 END) / COUNT(t.TtsId) as percentage 
             FROM Tts t WHERE t.Status != 'Cancel' AND t.PostedTime BETWEEN ? AND ?`,
            [startDate, endDate]
        )

        // ARPU ISP
        const [arpu] = await isxPool.query<any[]>(
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

        return {
            churnRate: Number(churnRate[0]?.percentage || 0),
            sla: Number(sla[0]?.percentage || 0),
            collectionRate: Number(collectionRate[0]?.percentage || 0),
            tickets: Number(tickets[0]?.percentage || 0),
            arpu: Number(arpu[0]?.average_mrc || 0)
        }
    }
}
