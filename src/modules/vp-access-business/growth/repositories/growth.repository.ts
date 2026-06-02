import { type Pool } from 'mysql2/promise'
import { IGrowthRepository } from '../interfaces/growth.repository.interface'

export class GrowthRepository implements IGrowthRepository {
    constructor(
        private readonly nisDb: Pool
    ) {}

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
                LEFT JOIN NewCustomerInvoiceBatch ncib 
                    ON ncib.AI = nci.AI
                LEFT JOIN (
                    SELECT 
                        ncib.batchNo,
                        nci.*,
                        ROW_NUMBER() OVER (
                            PARTITION BY ncib.batchNo 
                            ORDER BY nci.Date DESC
                        ) AS RowNum
                    FROM NewCustomerInvoice nci
                    LEFT JOIN NewCustomerInvoiceBatch ncib 
                        ON ncib.AI = nci.AI
                    WHERE nci.Type LIKE 'RA%'
                ) nci2 
                    ON nci2.batchNo = ncib.batchNo
                LEFT JOIN Services s 
                    ON s.ServiceId = cit.ServiceId
                LEFT JOIN Customer c 
                    ON c.CustId = cit.CustId
                WHERE cit.RInvoiceNum = 0
                AND cit.InvProrata = 0
                AND c.BranchId = ?
                AND s.ServiceCategory = 'access_business'
                AND nci.AccCode LIKE '400%'
                AND DATE(nci.InsertDate) >= ?
                AND DATE(nci.InsertDate) <= ?
            ) t
            LEFT JOIN (
                SELECT
                    nci.AI ai,
                    ncid.Debet discount
                FROM CustomerInvoiceDiscount cid
                LEFT JOIN NewCustomerInvoice ncid 
                    ON ncid.Id = cid.Id
                    AND ncid.Type = 'discount'
                LEFT JOIN CustomerInvoiceTemp cit 
                    ON cit.InvoiceNum = cid.InvoiceNum
                    AND cit.Urut = cid.Urut
                LEFT JOIN NewCustomerInvoice nci 
                    ON nci.Id = cid.InvoiceNum
                    AND nci.No = cid.Urut
                WHERE cit.RInvoiceNum = 0
            ) d 
                ON d.ai = t.ai
            WHERE t.rn = 1;`,
            [branchId, startDate, endDate]
        )

        return {
            mrc: Number(rows[0]?.mrc || 0),
            mrc_unpaid: Number(rows[0]?.mrc_unpaid || 0),
            mrc_paid: Number(rows[0]?.mrc_paid || 0)
        }
    }

    async getRevenue(branchId: string, startDate: string, endDate: string): Promise<number> {
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
            LEFT JOIN Services s ON
                s.ServiceId = cit.ServiceId
            WHERE gj.KodeCabang = ?
            AND s.ServiceCategory = 'access_business'
            AND gj.NoPerkiraan LIKE '400%'
            AND gj.TglTransaksi >= ?
            AND gj.TglTransaksi <= ?`,
            [branchId, startDate, endDate]
        )
        return Number(rows[0]?.total || 0)
    }
}
