import { type Pool } from 'mysql2/promise'
import { INewGrowthRepository } from '../interfaces/new-growth.repository.interface'

/**
 * Repository for new growth data queries
 * Handles database operations for newly activated access home services
 */
export class NewGrowthRepository implements INewGrowthRepository {
    constructor(private readonly nisDb: Pool) {}

    /**
     * Query sales summary for new growth grouped by sales representatives
     * Counts distinct newly activated services per period per sales person
     *
     * @param {string} branchId - The branch identifier
     * @param {number} year - The year to query
     * @returns {Promise<Array>} Sales summary rows
     */
    async getSalesSummary(branchId: string, year: number): Promise<{ period: string; branch: string; manager_sales_name: string; sales_name: string; total_new: number; total_homeconnect: number; total_block: number; total_homepaid: number }[]> {
        const [rows] = await this.nisDb.query<any[]>(
            `SELECT
                DATE_FORMAT(t.activated_at, '%Y-%m') period,
                nb.BranchCity branch,
                CONCAT(mgr.EmpFName, ' ', mgr.EmpLName) manager_sales_name,
                CONCAT(sls.EmpFName, ' ', sls.EmpLName) sales_name,
                COUNT(DISTINCT t.csid) total_new,
                COUNT(DISTINCT CASE WHEN cs.CustStatus IN ('AC', 'FR') THEN t.csid END) total_homeconnect,
                COUNT(DISTINCT CASE WHEN cs.CustStatus IN ('BL', 'NA') THEN t.csid END) total_block,
                COUNT(DISTINCT CASE WHEN paid.CustServId IS NOT NULL THEN t.csid END) total_homepaid
            FROM (
                SELECT 
                    cs.CustServId csid,
                    IFNULL(csact2.activated_at, csact.activation_date) activated_at
                FROM CustomerServices cs
                LEFT JOIN (
                    SELECT 
                        cshn.cust_serv_id csid,
                        MIN(cshn.insert_time) activation_date
                    FROM CustomerServicesHistoryNew cshn
                    WHERE cshn.description LIKE 'Activation%'
                    OR cshn.description LIKE 'Free%'
                    GROUP BY cshn.cust_serv_id
                ) csact ON csact.csid = cs.CustServId
                LEFT JOIN (
                    SELECT
                        cscsl.custServId csid,
                        cscsl.insertTime activated_at,
                        ROW_NUMBER() OVER(PARTITION BY cscsl.custServId ORDER BY cscsl.insertTime ASC) rn
                    FROM CustomerServiceChangeStatusLog cscsl
                    WHERE cscsl.status IN ('AC', 'FR')
                ) csact2 ON csact2.csid = cs.CustServId AND csact2.rn = 1
            ) t
            LEFT JOIN CustomerServices cs ON cs.CustServId = t.csid
            LEFT JOIN Customer c ON c.CustId = cs.CustId
            LEFT JOIN NusaBranch nb ON nb.BranchId = IFNULL(c.DisplayBranchId, c.BranchId)
            LEFT JOIN Services s ON s.ServiceId = cs.ServiceId
            LEFT JOIN Employee sls ON sls.EmpId = cs.SalesId
            LEFT JOIN Employee mgr ON mgr.EmpId = cs.ManagerSalesId
            LEFT JOIN (
                SELECT DISTINCT cit.CustServId
                FROM CustomerInvoiceTemp cit
                JOIN NewCustomerInvoice nci ON cit.InvoiceNum = nci.Id AND cit.Urut = nci.No
                JOIN NewCustomerInvoiceBatch ncib ON ncib.AI = nci.AI
                WHERE EXISTS (
                    SELECT 1 FROM NewCustomerInvoice nci2
                    JOIN NewCustomerInvoiceBatch ncib2 ON ncib2.AI = nci2.AI
                    WHERE ncib2.batchNo = ncib.batchNo AND nci2.Type LIKE 'RA%'
                )
                AND cit.RInvoiceNum = 0
                AND cit.Reverse = 0
            ) paid ON paid.CustServId = t.csid
            WHERE s.ServiceCategory = 'access_home'
            AND c.BranchId = ?
            AND YEAR(t.activated_at) = ?
            GROUP BY DATE_FORMAT(t.activated_at, '%Y-%m'), nb.BranchId, mgr.EmpId, sls.EmpId`,
            [branchId, year]
        )

        return rows.map((row: Record<string, unknown>) => ({
            period: String(row.period || ''),
            branch: String(row.branch || ''),
            manager_sales_name: String(row.manager_sales_name || ''),
            sales_name: String(row.sales_name || ''),
            total_new: Number(row.total_new || 0),
            total_homeconnect: Number(row.total_homeconnect || 0),
            total_block: Number(row.total_block || 0),
            total_homepaid: Number(row.total_homepaid || 0)
        }))
    }

    /**
     * Query operational summary for new growth grouped by service group
     * Counts distinct newly activated services per period per service type
     *
     * @param {string} branchId - The branch identifier
     * @param {number} year - The year to query
     * @returns {Promise<Array>} Operational summary rows
     */
    async getOperationalSummary(branchId: string, year: number): Promise<{ period: string; branch: string; service_group: string; service: string; total_new: number; total_homeconnect: number; total_block: number; total_homepaid: number }[]> {
        const [rows] = await this.nisDb.query<any[]>(
            `SELECT
                DATE_FORMAT(t.activated_at, '%Y-%m') period,
                nb.BranchCity branch,
                sg.Description service_group,
                s.ServiceType service,
                COUNT(DISTINCT t.csid) total_new,
                COUNT(DISTINCT CASE WHEN cs.CustStatus IN ('AC', 'FR') THEN t.csid END) total_homeconnect,
                COUNT(DISTINCT CASE WHEN cs.CustStatus IN ('BL', 'NA') THEN t.csid END) total_block,
                COUNT(DISTINCT CASE WHEN paid.CustServId IS NOT NULL THEN t.csid END) total_homepaid
            FROM (
                SELECT 
                    cs.CustServId csid,
                    IFNULL(csact2.activated_at, csact.activation_date) activated_at
                FROM CustomerServices cs
                LEFT JOIN (
                    SELECT 
                        cshn.cust_serv_id csid,
                        MIN(cshn.insert_time) activation_date
                    FROM CustomerServicesHistoryNew cshn
                    WHERE cshn.description LIKE 'Activation%'
                    OR cshn.description LIKE 'Free%'
                    GROUP BY cshn.cust_serv_id
                ) csact ON csact.csid = cs.CustServId
                LEFT JOIN (
                    SELECT
                        cscsl.custServId csid,
                        cscsl.insertTime activated_at,
                        ROW_NUMBER() OVER(PARTITION BY cscsl.custServId ORDER BY cscsl.insertTime ASC) rn
                    FROM CustomerServiceChangeStatusLog cscsl
                    WHERE cscsl.status IN ('AC', 'FR')
                ) csact2 ON csact2.csid = cs.CustServId AND csact2.rn = 1
            ) t
            LEFT JOIN CustomerServices cs ON cs.CustServId = t.csid
            LEFT JOIN Customer c ON c.CustId = cs.CustId
            LEFT JOIN NusaBranch nb ON nb.BranchId = IFNULL(c.DisplayBranchId, c.BranchId)
            LEFT JOIN Services s ON s.ServiceId = cs.ServiceId
            LEFT JOIN ServiceGroup sg ON sg.ServiceGroup = s.ServiceGroup
            LEFT JOIN Employee sls ON sls.EmpId = cs.SalesId
            LEFT JOIN Employee mgr ON mgr.EmpId = cs.ManagerSalesId
            LEFT JOIN (
                SELECT DISTINCT cit.CustServId
                FROM CustomerInvoiceTemp cit
                JOIN NewCustomerInvoice nci ON cit.InvoiceNum = nci.Id AND cit.Urut = nci.No
                JOIN NewCustomerInvoiceBatch ncib ON ncib.AI = nci.AI
                WHERE EXISTS (
                    SELECT 1 FROM NewCustomerInvoice nci2
                    JOIN NewCustomerInvoiceBatch ncib2 ON ncib2.AI = nci2.AI
                    WHERE ncib2.batchNo = ncib.batchNo AND nci2.Type LIKE 'RA%'
                )
                AND cit.RInvoiceNum = 0
                AND cit.Reverse = 0
            ) paid ON paid.CustServId = t.csid
            WHERE s.ServiceCategory = 'access_home'
            AND c.BranchId = ?
            AND YEAR(t.activated_at) = ?
            GROUP BY DATE_FORMAT(t.activated_at, '%Y-%m'), nb.BranchId, sg.Description, s.ServiceType`,
            [branchId, year]
        )

        return rows.map((row: Record<string, unknown>) => ({
            period: String(row.period || ''),
            branch: String(row.branch || ''),
            service_group: String(row.service_group || ''),
            service: String(row.service || ''),
            total_new: Number(row.total_new || 0),
            total_homeconnect: Number(row.total_homeconnect || 0),
            total_block: Number(row.total_block || 0),
            total_homepaid: Number(row.total_homepaid || 0)
        }))
    }

    /**
     * Query detailed new growth customer data
     * Returns individual activated customer records with optional period filter
     *
     * @param {string} branchId - The branch identifier
     * @param {number} year - The year to query
     * @param {string} [period] - Optional period filter in YYYY-MM format
     * @returns {Promise<Array>} Detail rows with customer info
     */
    async getDetail(branchId: string, year: number, period?: string): Promise<{ service_id: string; service: string; customer_name: string; address: string; service_group: string; branch: string; sales_name: string; manager_sales_name: string; status: string; activated_at: string | null }[]> {
        let sql = `SELECT
                s.ServiceId service_id,
                s.ServiceType service,
                c.CustName customer_name,
                cs.installation_address address,
                sg.Description service_group,
                nb.BranchCity branch,
                CONCAT(sls.EmpFName, ' ', sls.EmpLName) sales_name,
                CONCAT(mgr.EmpFName, ' ', mgr.EmpLName) manager_sales_name,
                cs.CustStatus status,
                t.activated_at
            FROM (
                SELECT 
                    cs.CustServId csid,
                    IFNULL(csact2.activated_at, csact.activation_date) activated_at
                FROM CustomerServices cs
                LEFT JOIN (
                    SELECT 
                        cshn.cust_serv_id csid,
                        MIN(cshn.insert_time) activation_date
                    FROM CustomerServicesHistoryNew cshn
                    WHERE cshn.description LIKE 'Activation%'
                    OR cshn.description LIKE 'Free%'
                    GROUP BY cshn.cust_serv_id
                ) csact ON csact.csid = cs.CustServId
                LEFT JOIN (
                    SELECT
                        cscsl.custServId csid,
                        cscsl.insertTime activated_at,
                        ROW_NUMBER() OVER(PARTITION BY cscsl.custServId ORDER BY cscsl.insertTime ASC) rn
                    FROM CustomerServiceChangeStatusLog cscsl
                    WHERE cscsl.status IN ('AC', 'FR')
                ) csact2 ON csact2.csid = cs.CustServId AND csact2.rn = 1
            ) t
            LEFT JOIN CustomerServices cs ON cs.CustServId = t.csid
            LEFT JOIN Customer c ON c.CustId = cs.CustId
            LEFT JOIN NusaBranch nb ON nb.BranchId = IFNULL(c.DisplayBranchId, c.BranchId)
            LEFT JOIN Services s ON s.ServiceId = cs.ServiceId
            LEFT JOIN ServiceGroup sg ON sg.ServiceGroup = s.ServiceGroup
            LEFT JOIN Employee sls ON sls.EmpId = cs.SalesId
            LEFT JOIN Employee mgr ON mgr.EmpId = cs.ManagerSalesId
            WHERE s.ServiceCategory = 'access_home'
            AND c.BranchId = ?
            AND YEAR(t.activated_at) = ?`

        const params: (string | number)[] = [branchId, year]

        if (period) {
            sql += ` AND DATE_FORMAT(t.activated_at, '%Y-%m') = ?`
            params.push(period)
        }

        const [rows] = await this.nisDb.query<any[]>(sql, params)

        return rows.map((row: Record<string, unknown>) => ({
            service_id: String(row.service_id || ''),
            service: String(row.service || ''),
            customer_name: String(row.customer_name || ''),
            address: String(row.address || ''),
            service_group: String(row.service_group || ''),
            branch: String(row.branch || ''),
            sales_name: String(row.sales_name || ''),
            manager_sales_name: String(row.manager_sales_name || ''),
            status: String(row.status || ''),
            activated_at: row.activated_at ? String(row.activated_at) : null
        }))
    }
}
