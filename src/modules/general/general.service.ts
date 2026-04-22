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
    async getRevenue(period?: string, branchId: string = this.defaultBranchId) {
        const { currentPeriod } = DateHelper.getPeriodInfo(period)
        const [rows] = await isxPool.query<any[]>(
            `SELECT -SUM(Debet-Kredit) as total 
             FROM GeneralJournal 
             WHERE KodeCabang = ? 
             AND DATE_FORMAT(TglTransaksi, '%Y%m') = ? 
             AND SUBSTR(NoPerkiraan, 1, 3) IN ('400', '401')`,
            [branchId, currentPeriod]
        )
        return Number(rows[0]?.total || 0)
    }

    /**
     * ISP Customer Metrics (Active, Added, Churned)
     */
    async getIspStats(period?: string, branchId: string = this.defaultBranchId) {
        const { currentPeriod, startDate } = DateHelper.getPeriodInfo(period)

        const [active] = await isxPool.query<any[]>(
            `SELECT COUNT(1) as total 
             FROM CustomerServices cs 
             LEFT JOIN Customer c ON c.CustId = cs.CustId 
             LEFT JOIN Services s ON s.ServiceId = cs.ServiceId 
             LEFT JOIN ServiceGroup sg ON sg.ServiceGroup = s.ServiceGroup 
             WHERE sg.ServiceGroupTypeId = 1 
             AND cs.CustStatus IN ('AC', 'FR') 
             AND c.BranchId = ?`,
            [branchId]
        )

        const [added] = await isxPool.query<any[]>(
            `SELECT COUNT(1) as total 
             FROM CustomerServices cs 
             LEFT JOIN Customer c ON c.CustId = cs.CustId 
             LEFT JOIN Services s ON s.ServiceId = cs.ServiceId 
             LEFT JOIN ServiceGroup sg ON sg.ServiceGroup = s.ServiceGroup 
             WHERE sg.ServiceGroupTypeId = 1 
             AND cs.CustStatus IN ('AC', 'FR') 
             AND c.BranchId = ? 
             AND cs.CustActivationDate >= ?`,
            [branchId, startDate]
        )

        const [churn] = await isxPool.query<any[]>(
            `SELECT COUNT(1) as total 
             FROM CustomerServices cs 
             LEFT JOIN Customer c ON c.CustId = cs.CustId 
             LEFT JOIN Services s ON s.ServiceId = cs.ServiceId 
             LEFT JOIN ServiceGroup sg ON sg.ServiceGroup = s.ServiceGroup 
             WHERE sg.ServiceGroupTypeId = 1 
             AND cs.CustStatus = 'NA' 
             AND c.BranchId = ? 
             AND DATE_FORMAT(cs.CustUnregDate, '%Y%m') = ?`,
            [branchId, currentPeriod]
        )

        return {
            active: Number(active[0]?.total || 0),
            added: Number(added[0]?.total || 0),
            churn: Number(churn[0]?.total || 0)
        }
    }

    /**
     * NusaWork Metrics (Active, Growth, Companies)
     */
    async getNusaWorkStats(period?: string, branchId: string = this.defaultBranchId) {
        const { startDate } = DateHelper.getPeriodInfo(period)

        const [active] = await isxPool.query<any[]>(
            `SELECT COUNT(1) as total 
             FROM ServiceSubcriptions ss 
             LEFT JOIN CustomerServices cs ON cs.CustServId = ss.CustServId 
             LEFT JOIN Customer c ON c.CustId = cs.CustId 
             LEFT JOIN Services s ON s.ServiceId = cs.ServiceId 
             WHERE ss.Status = 'AC' 
             AND s.ServiceGroup = 'NW' 
             AND cs.CustStatus != 'NA'`
        )

        const [growth] = await isxPool.query<any[]>(
            `SELECT COUNT(1) as total 
             FROM ServiceSubcriptions ss 
             LEFT JOIN CustomerServices cs ON cs.CustServId = ss.CustServId 
             LEFT JOIN Customer c ON c.CustId = cs.CustId 
             LEFT JOIN Services s ON s.ServiceId = cs.ServiceId 
             WHERE ss.Status = 'AC' 
             AND s.ServiceGroup = 'NW' 
             AND cs.CustRegDate >= ?`,
            [startDate]
        )

        const [companies] = await isxPool.query<any[]>(
            `SELECT COUNT(DISTINCT cs.CustServId) as total 
             FROM CustomerServices cs 
             LEFT JOIN Customer c ON c.CustId = cs.CustId 
             LEFT JOIN Services s ON s.ServiceId = cs.ServiceId 
             LEFT JOIN NewCustomerInvoice nci ON nci.CustId = cs.CustId AND nci.Type = 'RA02' 
             WHERE s.ServiceGroup = 'NW' 
             AND cs.CustStatus IN ('AC', 'FR') 
             AND c.BranchId = ? 
             AND nci.TransDate < ?`,
            [branchId, startDate]
        )

        return {
            active: Number(active[0]?.total || 0),
            growth: Number(growth[0]?.total || 0),
            companies: Number(companies[0]?.total || 0)
        }
    }
}
