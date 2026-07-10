import { type Pool } from 'mysql2/promise'
import { ITotalServiceRepository } from '../interfaces/total-service.repository.interface'

/**
 * Repository for total service data queries
 * Handles database operations for access home service metrics
 */
export class TotalServiceRepository implements ITotalServiceRepository {
    constructor(private readonly nisDb: Pool) {}

    /**
     * Query operational summary grouped by service group and service type
     * Aggregates active and churned services per period
     *
     * @param {string} branchId - The branch identifier
     * @param {number} year - The year to query
     * @returns {Promise<Array>} Operational summary rows
     */
    async getOperationalSummary(branchId: string, year: number): Promise<{ Period: string; branch: string; service_group: string; service: string; total_active: number; total_churn: number }[]> {
        const yearSuffix = String(year).slice(-2)
        const periodRegex = `^(0[1-9]|1[0-2])${yearSuffix}$`

        const [rows] = await this.nisDb.query<any[]>(
            `SELECT 
                cse.Period,
                c.BranchCity branch,
                sg.Description service_group,
                s.ServiceType service,
                SUM(CASE WHEN cse.CustStatus IN ('AC', 'FR') THEN 1 ELSE 0 END) total_active,
                SUM(CASE WHEN cse.CustStatus IN ('BL', 'NA') THEN 1 ELSE 0 END) total_churn
            FROM CustomerServiceExcerpt cse
            LEFT JOIN Services s ON s.ServiceId = cse.ServiceId
            LEFT JOIN ServiceGroup sg ON sg.ServiceGroup = s.ServiceGroup
            LEFT JOIN (
                SELECT c.CustId, nb.BranchCity
                FROM Customer c
                LEFT JOIN NusaBranch nb ON nb.BranchId = IFNULL(c.DisplayBranchId, c.BranchId)
            ) c ON c.CustId = cse.CustId
            WHERE cse.CustId IN (SELECT CustId FROM Customer WHERE BranchId = ?)
            AND s.ServiceCategory = 'access_home'
            AND cse.Period REGEXP ?
            GROUP BY cse.Period, c.BranchCity, sg.Description, s.ServiceType`,
            [branchId, periodRegex]
        )

        return rows.map((row: Record<string, unknown>) => ({
            Period: String(row.Period),
            branch: String(row.branch || ''),
            service_group: String(row.service_group || ''),
            service: String(row.service || ''),
            total_active: Number(row.total_active || 0),
            total_churn: Number(row.total_churn || 0)
        }))
    }

    /**
     * Query sales summary grouped by sales representatives
     * Aggregates active and churned services per period per sales person
     *
     * @param {string} branchId - The branch identifier
     * @param {number} year - The year to query
     * @returns {Promise<Array>} Sales summary rows
     */
    async getSalesSummary(branchId: string, year: number): Promise<{ Period: string; branch: string; manager_sales_name: string; sales_name: string; total_active: number; total_churn: number }[]> {
        const yearSuffix = String(year).slice(-2)
        const periodRegex = `^(0[1-9]|1[0-2])${yearSuffix}$`

        const [rows] = await this.nisDb.query<any[]>(
            `SELECT 
                cse.Period,
                c.BranchCity branch,
                c.manager_sales_name,
                c.sales_name,
                SUM(CASE WHEN cse.CustStatus IN ('AC', 'FR') THEN 1 ELSE 0 END) total_active,
                SUM(CASE WHEN cse.CustStatus IN ('BL', 'NA') THEN 1 ELSE 0 END) total_churn
            FROM CustomerServiceExcerpt cse
            LEFT JOIN Services s ON s.ServiceId = cse.ServiceId
            LEFT JOIN (
                SELECT
                    cs.CustServId,
                    c.CustName,
                    nb.BranchCity,
                    cs.installation_address,
                    CONCAT(sls.EmpFName, ' ', sls.EmpLName) sales_name,
                    CONCAT(mgr.EmpFName, ' ', mgr.EmpLName) manager_sales_name
                FROM CustomerServices cs
                LEFT JOIN Customer c ON c.CustId = cs.CustId
                LEFT JOIN Employee sls ON sls.EmpId = cs.SalesId
                LEFT JOIN Employee mgr ON mgr.EmpId = cs.ManagerSalesId
                LEFT JOIN NusaBranch nb ON nb.BranchId = IFNULL(c.DisplayBranchId, c.BranchId)
            ) c ON c.CustServId = cse.CustServId
            WHERE cse.CustId IN (SELECT CustId FROM Customer WHERE BranchId = ?)
            AND s.ServiceCategory = 'access_home'
            AND cse.Period REGEXP ?
            GROUP BY cse.Period, c.BranchCity, c.manager_sales_name, c.sales_name`,
            [branchId, periodRegex]
        )

        return rows.map((row: Record<string, unknown>) => ({
            Period: String(row.Period),
            branch: String(row.branch || ''),
            manager_sales_name: String(row.manager_sales_name || ''),
            sales_name: String(row.sales_name || ''),
            total_active: Number(row.total_active || 0),
            total_churn: Number(row.total_churn || 0)
        }))
    }

    /**
     * Query detailed customer service data for a specific period or all periods of a year
     * Returns individual customer records with service and sales information
     *
     * @param {string} branchId - The branch identifier
     * @param {number} year - The year to query (used as fallback when period is not provided)
     * @param {string} [period] - Optional period in MMYY format (e.g., '0125')
     * @returns {Promise<Array>} Detail rows with customer info
     */
    async getDetail(branchId: string, year: number, period?: string): Promise<{ service_id: string; service: string; customer_name: string; address: string; service_group: string; branch: string; sales_name: string; manager_sales_name: string; status: string; active_at: string | null; churn_date: string | null; tenure_days: number | null }[]> {
        let periodClause: string
        let periodParam: string

        if (period && period.trim() !== '') {
            periodClause = 'AND cse.Period = ?'
            periodParam = period
        } else {
            const yearSuffix = String(year).slice(-2)
            periodClause = 'AND cse.Period REGEXP ?'
            periodParam = `^(0[1-9]|1[0-2])${yearSuffix}$`
        }

        const [rows] = await this.nisDb.query<any[]>(
            `SELECT 
                s.ServiceId service_id,
                s.ServiceType service,
                c.CustName customer_name,
                c.installation_address address,
                sg.Description service_group,
                c.BranchCity branch,
                c.sales_name,
                c.manager_sales_name,
                cse.CustStatus status,
                csact.insertTime active_at,
                cschurn.churn_date,
                CASE 
                    WHEN csact.insertTime IS NOT NULL AND cschurn.churn_date IS NOT NULL 
                    THEN DATEDIFF(cschurn.churn_date, csact.insertTime)
                    ELSE NULL 
                END tenure_days
            FROM CustomerServiceExcerpt cse
            LEFT JOIN Services s ON s.ServiceId = cse.ServiceId
            LEFT JOIN ServiceGroup sg ON sg.ServiceGroup = s.ServiceGroup
            LEFT JOIN (
                SELECT
                    cs.CustServId,
                    c.CustName,
                    nb.BranchCity,
                    cs.installation_address,
                    CONCAT(sls.EmpFName, ' ', sls.EmpLName) sales_name,
                    CONCAT(mgr.EmpFName, ' ', mgr.EmpLName) manager_sales_name
                FROM CustomerServices cs
                LEFT JOIN Customer c ON c.CustId = cs.CustId
                LEFT JOIN Employee sls ON sls.EmpId = cs.SalesId
                LEFT JOIN Employee mgr ON mgr.EmpId = cs.ManagerSalesId
                LEFT JOIN NusaBranch nb ON nb.BranchId = IFNULL(c.DisplayBranchId, c.BranchId)
            ) c ON c.CustServId = cse.CustServId
            LEFT JOIN (
                SELECT
                    cscsl.custServId,
                    cscsl.insertTime,
                    ROW_NUMBER() OVER(PARTITION BY cscsl.custServId ORDER BY cscsl.insertTime ASC) rn
                FROM CustomerServiceChangeStatusLog cscsl
                WHERE cscsl.status IN ('AC', 'FR')
            ) csact ON csact.custServId = cse.CustServId AND csact.rn = 1
            LEFT JOIN (
                SELECT
                    cscsl.custServId,
                    cscsl.insertTime churn_date,
                    ROW_NUMBER() OVER(PARTITION BY cscsl.custServId ORDER BY cscsl.insertTime ASC) rn
                FROM CustomerServiceChangeStatusLog cscsl
                WHERE cscsl.status IN ('BL', 'NA')
            ) cschurn ON cschurn.custServId = cse.CustServId AND cschurn.rn = 1
            WHERE cse.CustId IN (SELECT CustId FROM Customer WHERE BranchId = ?)
            AND s.ServiceCategory = 'access_home'
            ${periodClause}`,
            [branchId, periodParam]
        )

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
            active_at: row.active_at ? String(row.active_at) : null,
            churn_date: row.churn_date ? String(row.churn_date) : null,
            tenure_days: row.tenure_days !== null && row.tenure_days !== undefined ? Number(row.tenure_days) : null
        }))
    }
}
