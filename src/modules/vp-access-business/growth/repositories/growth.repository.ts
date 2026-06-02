import { type Pool } from 'mysql2/promise'
import { IGrowthRepository } from '../interfaces/growth.repository.interface'

export class GrowthRepository implements IGrowthRepository {
    constructor(
        private readonly nisDb: Pool,
        private readonly prospectDb: Pool
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

    async getLeads(startDate: string, endDate: string): Promise<number> {
        const [rows] = await this.prospectDb.query<any[]>(
            `SELECT
                COUNT(DISTINCT pl.id) total
            FROM customer_object_product_services cops
            LEFT JOIN prospect_leads pl ON
                pl.id = cops.object_id
                AND cops.object = 'lead'
            WHERE cops.product_service_id IN (12, 36, 34, 28)
            AND pl.id IS NOT NULL
            AND pl.conversion_datetime IS NULL
            AND pl.unqualified_reason_id IS NULL
            AND pl.deleted_at IS NULL
            AND DATE(pl.created_at) >= ?
            AND DATE(pl.created_at) <= ?`,
            [startDate, endDate]
        )
        return Number(rows[0]?.total || 0)
    }

    async getOpportunity(startDate: string, endDate: string): Promise<number> {
        const [rows] = await this.prospectDb.query<any[]>(
            `SELECT
                COUNT(DISTINCT po.id) total
            FROM customer_object_product_services cops
            LEFT JOIN prospect_opportunities po ON
                po.id = cops.object_id
                AND cops.object = 'opportunity'
            WHERE cops.product_service_id IN (12, 36, 34, 28)
            AND po.id IS NOT NULL
            AND po.opportunity_stage_id NOT IN (6,7)
            AND po.deleted_at IS NULL
            AND DATE(po.created_at) >= ?
            AND DATE(po.created_at) <= ?`,
            [startDate, endDate]
        )
        return Number(rows[0]?.total || 0)
    }

    async getWinLose(startDate: string, endDate: string): Promise<{ win: number, lose: number }> {
        const [rows] = await this.prospectDb.query<any[]>(
            `SELECT
                COUNT(DISTINCT CASE WHEN po.opportunity_stage_id = 6 THEN po.id END) AS win_count,
                COUNT(DISTINCT CASE WHEN po.opportunity_stage_id = 7 THEN po.id END) AS lose_count
            FROM customer_object_product_services cops
            LEFT JOIN prospect_opportunities po ON
                po.id = cops.object_id
                AND cops.object = 'opportunity'
            WHERE cops.product_service_id IN (12, 36, 34, 28)
            AND po.id IS NOT NULL
            AND po.deleted_at IS NULL
            AND DATE(po.created_at) >= ?
            AND DATE(po.created_at) <= ?`,
            [startDate, endDate]
        )
        return {
            win: Number(rows[0]?.win_count || 0),
            lose: Number(rows[0]?.lose_count || 0)
        }
    }

    async getActivity(startDate: string, endDate: string): Promise<{ activity: number, amCount: number }> {
        const [amRows] = await this.prospectDb.query<any[]>(
            `SELECT
                COUNT(DISTINCT gu.user_uuid) total
            FROM group_users gu
            LEFT JOIN groups g ON
                g.id = gu.group_id
            WHERE gu.group_id IN (57, 21, 43)
            OR g.group_parent_id IN (57, 21, 43)`
        )

        const [activityRows] = await this.prospectDb.query<any[]>(
            `SELECT
                COUNT(DISTINCT clc.id) + COUNT(DISTINCT pt.id) + COUNT(DISTINCT pci.id) total
            FROM (
                SELECT
                    DISTINCT gu.user_uuid user_id
                FROM group_users gu
                LEFT JOIN groups g ON
                    g.id = gu.group_id
                WHERE gu.group_id IN (57, 21, 43)
                OR g.group_parent_id IN (57, 21, 43)
            ) u
            LEFT JOIN customer_log_calls clc ON
                IFNULL(clc.assigned_to_id, clc.created_by) = u.user_id
                AND DATE(clc.created_at) >= ?
                AND DATE(clc.created_at) <= ?
            LEFT JOIN prospect_tasks pt ON
                IFNULL(pt.assigned_to_id, pt.created_by) = u.user_id
                AND DATE(pt.created_at) >= ?
                AND DATE(pt.created_at) <= ?
            LEFT JOIN prospect_check_ins pci ON
                pci.user_uuid = u.user_id
                AND DATE(pci.created_at) >= ?
                AND DATE(pci.created_at) <= ?`,
            [startDate, endDate, startDate, endDate, startDate, endDate]
        )

        return {
            activity: Number(activityRows[0]?.total || 0),
            amCount: Number(amRows[0]?.total || 0)
        }
    }

    async getPipeline(startDate: string, endDate: string): Promise<number> {
        const [rows] = await this.prospectDb.query<any[]>(
            `SELECT
                SUM(poa.amount) value
            FROM customer_object_product_services cops
            LEFT JOIN prospect_opportunities po ON
                po.id = cops.object_id
                AND cops.object = 'opportunity'
            LEFT JOIN prospect_opportunity_amounts poa ON
                poa.opportunity_id = po.id
            WHERE cops.product_service_id IN (12, 36, 34, 28)
            AND poa.amount_category_setting_id = 1
            AND po.id IS NOT NULL
            AND po.deleted_at IS NULL
            AND DATE(po.created_at) >= ?
            AND DATE(po.created_at) <= ?`,
            [startDate, endDate]
        )
        return Number(rows[0]?.value || 0)
    }
}
