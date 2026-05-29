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

    async churnRate(branchId: string, startDate: string, endDate: string): Promise<{ rate: number, totalChurn: number, totalActive: number }> {
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
                    WHERE cs.CustStatus IN ('AC', 'FR')
                    AND s.ServiceCategory = 'access_business'
                    AND c.BranchId = ?
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
            [branchId, branchId, startDate, endDate, startDate, endDate]
        )
        return {
            rate: Number(rows[0]?.churn_rate || 0),
            totalChurn: Number(rows[0]?.total_churn || 0),
            totalActive: Number(rows[0]?.total_active || 0)
        }
    }

}
