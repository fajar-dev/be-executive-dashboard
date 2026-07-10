import { type Pool } from 'mysql2/promise'
import { IRevenueRepository } from '../interfaces/revenue.repository.interface'

/**
 * Repository for revenue data queries
 * Handles database operations for access home revenue metrics
 */
export class RevenueRepository implements IRevenueRepository {
    constructor(private readonly nisDb: Pool) {}

    /**
     * Query revenue summary grouped by period and branch
     * Aggregates revenue from general journal entries
     *
     * @param {string} branchId - The branch identifier
     * @param {number} year - The year to query
     * @returns {Promise<Array>} Revenue summary rows
     */
    async getRevenueSummary(branchId: string, year: number): Promise<{ period: string; branch: string; total: number }[]> {
        const [rows] = await this.nisDb.query<any[]>(
            `SELECT
                DATE_FORMAT(gj.TglTransaksi, '%Y-%m') period,
                nb.BranchCity branch,
                SUM(gj.Kredit - gj.Debet) total
            FROM GeneralJournal gj
            LEFT JOIN Panjar_Penjualan_Breakdown ppb ON ppb.id = gj.SumberId AND gj.Sumber = 'pnjr'
            LEFT JOIN NewCustomerInvoice nci ON nci.AI = IFNULL(ppb.invoiceAI, gj.SumberId)
            LEFT JOIN CustomerInvoiceTemp cit ON cit.InvoiceNum = nci.Id AND cit.Urut = nci.No
            LEFT JOIN Services s ON s.ServiceId = cit.ServiceId
            LEFT JOIN NusaBranch nb ON nb.BranchId = SUBSTRING(gj.NoPerkiraan, -6, 3)
            WHERE gj.KodeCabang = ?
            AND s.ServiceCategory = 'access_home'
            AND gj.NoPerkiraan LIKE '400%'
            AND YEAR(gj.TglTransaksi) = ?
            GROUP BY DATE_FORMAT(gj.TglTransaksi, '%Y-%m'), nb.BranchCity`,
            [branchId, year]
        )

        return rows.map((row: Record<string, unknown>) => ({
            period: String(row.period || ''),
            branch: String(row.branch || ''),
            total: Number(row.total || 0)
        }))
    }

    /**
     * Query homepaid (paid invoices) revenue summary grouped by period and branch
     * Filters for invoices that have been paid (receipt exists)
     *
     * @param {string} branchId - The branch identifier
     * @param {number} year - The year to query
     * @returns {Promise<Array>} Homepaid summary rows
     */
    async getHomepaidSummary(branchId: string, year: number): Promise<{ period: string; branch: string; total: number }[]> {
        const [rows] = await this.nisDb.query<any[]>(
            `SELECT
                DATE_FORMAT(gj.TglTransaksi, '%Y-%m') period,
                nb.BranchCity branch,
                SUM(gj.Kredit - gj.Debet) total
            FROM GeneralJournal gj
            LEFT JOIN Panjar_Penjualan_Breakdown ppb ON ppb.id = gj.SumberId AND gj.Sumber = 'pnjr'
            LEFT JOIN NewCustomerInvoice nci ON nci.AI = IFNULL(ppb.invoiceAI, gj.SumberId)
            LEFT JOIN CustomerInvoiceTemp cit ON cit.InvoiceNum = nci.Id AND cit.Urut = nci.No
            LEFT JOIN Services s ON s.ServiceId = cit.ServiceId
            LEFT JOIN NusaBranch nb ON nb.BranchId = SUBSTRING(gj.NoPerkiraan, -6, 3)
            LEFT JOIN NewCustomerInvoiceBatch ncib ON ncib.AI = nci.AI
            LEFT JOIN (
                SELECT 
                    ncib.batchNo,
                    ROW_NUMBER() OVER (PARTITION BY ncib.batchNo ORDER BY nci.Date DESC) AS RowNum
                FROM NewCustomerInvoice nci
                LEFT JOIN NewCustomerInvoiceBatch ncib ON ncib.AI = nci.AI
                WHERE nci.Type LIKE 'RA%'
                AND YEAR(IFNULL(nci.JournalDate, nci.TransDate)) <= ?
                GROUP BY ncib.batchNo
            ) nci2 ON nci2.batchNo = ncib.batchNo
            WHERE gj.KodeCabang = ?
            AND s.ServiceCategory = 'access_home'
            AND gj.NoPerkiraan LIKE '400%'
            AND nci2.batchNo IS NOT NULL
            AND YEAR(gj.TglTransaksi) = ?
            GROUP BY DATE_FORMAT(gj.TglTransaksi, '%Y-%m'), nb.BranchCity`,
            [year, branchId, year]
        )

        return rows.map((row: Record<string, unknown>) => ({
            period: String(row.period || ''),
            branch: String(row.branch || ''),
            total: Number(row.total || 0)
        }))
    }

    /**
     * Query detailed revenue data with customer and invoice information
     * Returns individual transaction records with optional period filter
     *
     * @param {string} branchId - The branch identifier
     * @param {number} year - The year to query
     * @param {string} [period] - Optional period filter in YYYY-MM format
     * @returns {Promise<Array>} Detail rows with transaction info
     */
    async getDetail(branchId: string, year: number, period?: string): Promise<{ service_id: string; service: string; customer_name: string; address: string; billing_date: string; service_group: string; branch: string; sales_name: string; manager_sales_name: string; inv_desc: string; receipt_id: string | null; total: number }[]> {
        let sql = `SELECT
                cit.ServiceId service_id,
                s.ServiceType service,
                c.CustName customer_name,
                cs.installation_address address,
                gj.TglTransaksi billing_date,
                sg.Description service_group,
                nb.BranchCity branch,
                CONCAT(sls.EmpFName, ' ', sls.EmpLName) sales_name,
                CONCAT(mgr.EmpFName, ' ', mgr.EmpLName) manager_sales_name,
                nci.Description inv_desc,
                nci2.receipt_id,
                gj.Kredit - gj.Debet total
            FROM GeneralJournal gj
            LEFT JOIN Panjar_Penjualan_Breakdown ppb ON ppb.id = gj.SumberId AND gj.Sumber = 'pnjr'
            LEFT JOIN NewCustomerInvoice nci ON nci.AI = IFNULL(ppb.invoiceAI, gj.SumberId)
            LEFT JOIN CustomerInvoiceTemp cit ON cit.InvoiceNum = nci.Id AND cit.Urut = nci.No
            LEFT JOIN Services s ON s.ServiceId = cit.ServiceId
            LEFT JOIN ServiceGroup sg ON sg.ServiceGroup = cit.ServiceGroup
            LEFT JOIN CustomerServices cs ON cs.CustServId = cit.CustServId
            LEFT JOIN Customer c ON c.CustId = cit.CustId
            LEFT JOIN Employee sls ON sls.EmpId = cs.SalesId
            LEFT JOIN Employee mgr ON mgr.EmpId = cs.ManagerSalesId
            LEFT JOIN NusaBranch nb ON nb.BranchId = SUBSTRING(gj.NoPerkiraan, -6, 3)
            LEFT JOIN NewCustomerInvoiceBatch ncib ON ncib.AI = nci.AI
            LEFT JOIN (
                SELECT 
                    ncib.batchNo,
                    GROUP_CONCAT(nci.Id) receipt_id,
                    ROW_NUMBER() OVER (PARTITION BY ncib.batchNo ORDER BY nci.Date DESC) AS RowNum
                FROM NewCustomerInvoice nci
                LEFT JOIN NewCustomerInvoiceBatch ncib ON ncib.AI = nci.AI
                WHERE nci.Type LIKE 'RA%'
                AND YEAR(IFNULL(nci.JournalDate, nci.TransDate)) <= ?
                GROUP BY ncib.batchNo
            ) nci2 ON nci2.batchNo = ncib.batchNo
            WHERE gj.KodeCabang = ?
            AND s.ServiceCategory = 'access_home'
            AND gj.NoPerkiraan LIKE '400%'
            AND YEAR(gj.TglTransaksi) = ?`

        const params: (string | number)[] = [year, branchId, year]

        if (period) {
            sql += ` AND DATE_FORMAT(gj.TglTransaksi, '%Y-%m') = ?`
            params.push(period)
        }

        const [rows] = await this.nisDb.query<any[]>(sql, params)

        return rows.map((row: Record<string, unknown>) => ({
            service_id: String(row.service_id || ''),
            service: String(row.service || ''),
            customer_name: String(row.customer_name || ''),
            address: String(row.address || ''),
            billing_date: row.billing_date ? String(row.billing_date) : '',
            service_group: String(row.service_group || ''),
            branch: String(row.branch || ''),
            sales_name: String(row.sales_name || ''),
            manager_sales_name: String(row.manager_sales_name || ''),
            inv_desc: String(row.inv_desc || ''),
            receipt_id: row.receipt_id ? String(row.receipt_id) : null,
            total: Number(row.total || 0)
        }))
    }

    /**
     * Query billing summary with paid vs total amounts
     * Compares paid invoices against total billed amount
     *
     * @param {string} branchId - The branch identifier
     * @param {number} year - The year to query
     * @returns {Promise<Object>} Billing summary with total_paid and total_all
     */
    async getBillingSummary(branchId: string, year: number): Promise<{ total_paid: number; total_all: number }> {
        const [rows] = await this.nisDb.query<any[]>(
            `SELECT
                SUM(
                    CASE
                        WHEN nci2.batchNo IS NOT NULL THEN cit.CustTotSubsFee
                        ELSE 0
                    END
                ) total_paid,
                SUM(cit.CustTotSubsFee) total_all
            FROM CustomerInvoiceTemp cit
            LEFT JOIN InvoiceTypeMonth itm ON itm.InvoiceType = cit.InvoiceType
            LEFT JOIN NewCustomerInvoice nci ON cit.InvoiceNum = nci.Id AND cit.Urut = nci.No
            LEFT JOIN NewCustomerInvoiceBatch ncib ON ncib.AI = nci.AI
            LEFT JOIN (
                SELECT 
                    ncib.batchNo,
                    MIN(IFNULL(nci.JournalDate, nci.TransDate)) paid_at
                FROM NewCustomerInvoice nci
                LEFT JOIN NewCustomerInvoiceBatch ncib ON ncib.AI = nci.AI
                WHERE nci.Type LIKE 'RA%' OR nci.Type = 'payment'
                GROUP BY ncib.batchNo
            ) nci2 ON nci2.batchNo = ncib.batchNo
            LEFT JOIN Services s ON s.ServiceId = cit.ServiceId
            LEFT JOIN Customer c ON c.CustId = cit.CustId
            WHERE s.ServiceCategory = 'access_home'
            AND c.BranchId = ?
            AND cit.RInvoiceNum = 0
            AND cit.Reverse = 0
            AND YEAR(nci.InsertDate) = ?`,
            [branchId, year]
        )

        return {
            total_paid: Number(rows[0]?.total_paid || 0),
            total_all: Number(rows[0]?.total_all || 0)
        }
    }

    /**
     * Query total revenue from general journal
     * Aggregates all access home revenue for the year
     *
     * @param {string} branchId - The branch identifier
     * @param {number} year - The year to query
     * @returns {Promise<number>} Total revenue
     */
    async getTotal(branchId: string, year: number): Promise<number> {
        const [rows] = await this.nisDb.query<any[]>(
            `SELECT
                SUM(gj.Kredit - gj.Debet) total
            FROM GeneralJournal gj
            LEFT JOIN Panjar_Penjualan_Breakdown ppb ON ppb.id = gj.SumberId AND gj.Sumber = 'pnjr'
            LEFT JOIN NewCustomerInvoice nci ON nci.AI = IFNULL(ppb.invoiceAI, gj.SumberId)
            LEFT JOIN CustomerInvoiceTemp cit ON cit.InvoiceNum = nci.Id AND cit.Urut = nci.No
            LEFT JOIN Services s ON s.ServiceId = cit.ServiceId
            WHERE gj.KodeCabang = ?
            AND s.ServiceCategory = 'access_home'
            AND gj.NoPerkiraan LIKE '400%'
            AND YEAR(gj.TglTransaksi) = ?`,
            [branchId, year]
        )

        return Number(rows[0]?.total || 0)
    }
}
