import { Pool } from 'mysql2/promise'
import { ISettingRepository } from '../interfaces/setting.repository.interface'

export class SettingRepository implements ISettingRepository {
    constructor(
        private readonly nisDb: Pool,
        private readonly prospectDb: Pool
    ) {}

    async getRevenue(branchId: string, year: number): Promise<number> {
        const [rows] = await this.nisDb.query<any[]>(
            `SELECT
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
            AND YEAR(gj.TglTransaksi) = ?`,
            [branchId, year]
        )

        return Number(rows[0]?.total || 0)
    }
}
