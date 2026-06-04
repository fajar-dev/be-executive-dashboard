import { type Pool } from 'mysql2/promise'
import { IGrowthRepository } from '../interfaces/growth.repository.interface'

/**
 * Repository for handling growth-related database queries
 * Interfaces with multiple databases: nisDb (billing), prospectDb (CRM), and dashboardDb (targets)
 */
export class GrowthRepository implements IGrowthRepository {
    constructor(
        private readonly nisDb: Pool,
        private readonly prospectDb: Pool,
        private readonly dashboardDb: Pool
    ) {}

    /**
     * Query New MRC (Monthly Recurring Charge)
     * Calculates the recurring revenue generated from new customers
     * 
     * @param {string} branchId - The branch identifier
     * @param {string} startDate - Query start date
     * @param {string} endDate - Query end date
     * @returns {Promise<{mrc: number, mrc_unpaid: number, mrc_paid: number}>} MRC breakdown
     */
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

    /**
     * Query actual revenue generated
     * Aggregates revenue from the general journal (accounting)
     * 
     * @param {string} branchId - The branch identifier
     * @param {string} startDate - Query start date
     * @param {string} endDate - Query end date
     * @returns {Promise<number>} Total revenue
     */
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

    /**
     * Query number of new leads
     * Counts leads created in the CRM database (prospectDb)
     * 
     * @param {string} startDate - Query start date
     * @param {string} endDate - Query end date
     * @returns {Promise<number>} Total new leads
     */
    async getLeads(startDate: string, endDate: string): Promise<number> {
        const [rows] = await this.prospectDb.query<any[]>(
            `SELECT
                COUNT(1) total
            FROM prospect_leads pl
            WHERE pl.id IN (
                SELECT object_id
                FROM customer_object_product_services
                WHERE object = 'lead' AND product_service_id IN (12, 36, 34, 28)
            )
            AND pl.conversion_datetime IS NULL
            AND pl.unqualified_reason_id IS NULL
            AND pl.deleted_at IS NULL
            AND DATE(pl.created_at) >= ?
            AND DATE(pl.created_at) <= ?`,
            [startDate, endDate]
        )
        return Number(rows[0]?.total || 0)
    }

    /**
     * Query number of new opportunities
     * Counts opportunities created in the CRM database (prospectDb)
     * 
     * @param {string} startDate - Query start date
     * @param {string} endDate - Query end date
     * @returns {Promise<number>} Total new opportunities
     */
    async getOpportunity(startDate: string, endDate: string): Promise<number> {
        const [rows] = await this.prospectDb.query<any[]>(
            `SELECT
                COUNT(1) total
            FROM prospect_opportunities po
            WHERE po.id IN (
                SELECT object_id
                FROM customer_object_product_services
                WHERE object = 'opportunity' AND product_service_id IN (12, 36, 34, 28)
            )
            AND po.opportunity_stage_id NOT IN (6,7)
            AND po.deleted_at IS NULL
            AND DATE(po.created_at) >= ?
            AND DATE(po.created_at) <= ?`,
            [startDate, endDate]
        )
        return Number(rows[0]?.total || 0)
    }

    /**
     * Query won and lost opportunities
     * Aggregates opportunities by their closing stage (6 = win, 7 = lose)
     * 
     * @param {string} startDate - Query start date
     * @param {string} endDate - Query end date
     * @returns {Promise<{win: number, lose: number}>} Counts of won and lost opportunities
     */
    async getWinLose(startDate: string, endDate: string): Promise<{ win: number, lose: number }> {
        const [rows] = await this.prospectDb.query<any[]>(
            `SELECT
                SUM(CASE WHEN po.opportunity_stage_id = 6 THEN 1 ELSE 0 END) AS win_count,
                SUM(CASE WHEN po.opportunity_stage_id = 7 THEN 1 ELSE 0 END) AS lose_count
            FROM prospect_opportunities po
            WHERE po.id IN (
                SELECT object_id
                FROM customer_object_product_services
                WHERE object = 'opportunity' AND product_service_id IN (12, 36, 34, 28)
            )
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

    /**
     * Query sales activities
     * Counts the total number of calls, tasks, and check-ins logged by account managers
     * 
     * @param {string} startDate - Query start date
     * @param {string} endDate - Query end date
     * @returns {Promise<{activity: number, amCount: number}>} Total activities and number of active AMs
     */
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

    /**
     * Query total pipeline value
     * Aggregates the estimated monetary value of all open opportunities
     * 
     * @param {string} startDate - Query start date
     * @param {string} endDate - Query end date
     * @returns {Promise<number>} Total pipeline value
     */
    async getPipelineValue(startDate: string, endDate: string): Promise<number> {
        const [rows] = await this.prospectDb.query<any[]>(
            `SELECT
                SUM(poa.amount) value
            FROM prospect_opportunities po
            LEFT JOIN prospect_opportunity_amounts poa ON
                poa.opportunity_id = po.id
            WHERE po.id IN (
                SELECT object_id
                FROM customer_object_product_services
                WHERE object = 'opportunity' AND product_service_id IN (12, 36, 34, 28)
            )
            AND poa.amount_category_setting_id = 1
            AND po.deleted_at IS NULL
            AND DATE(po.created_at) >= ?
            AND DATE(po.created_at) <= ?`,
            [startDate, endDate]
        )
        return Number(rows[0]?.value || 0)
    }

    /**
     * Query average sales cycle length
     * Calculates the average days between opportunity creation and closure (win)
     * 
     * @param {string} startDate - Query start date
     * @param {string} endDate - Query end date
     * @returns {Promise<number>} Average sales cycle in days
     */
    async getCycle(startDate: string, endDate: string): Promise<number> {
        const [rows] = await this.prospectDb.query<any[]>(
            `SELECT
                AVG(DATEDIFF(posc.closed_date, po.created_at)) avg_days
            FROM prospect_opportunities po
            LEFT JOIN (
                SELECT 
                    opportunity_id,
                    MAX(created_at) closed_date
                FROM prospect_opportunity_stage_changes
                WHERE opportunity_stage_id = 6
                GROUP BY opportunity_id
            ) posc ON
                posc.opportunity_id = po.id
            WHERE po.id IN (
                SELECT object_id
                FROM customer_object_product_services
                WHERE object = 'opportunity' AND product_service_id IN (12, 36, 34, 28)
            )
            AND po.opportunity_stage_id = 6
            AND po.deleted_at IS NULL
            AND DATE(po.created_at) >= ?
            AND DATE(po.created_at) <= ?`,
            [startDate, endDate]
        )
        return Number(rows[0]?.avg_days || 0)
    }
    /**
     * Query pipeline stage distribution
     * Groups open opportunities by their current stage (Qualification, Proposal, Negotiation)
     * 
     * @param {string} startDate - Query start date
     * @param {string} endDate - Query end date
     * @returns {Promise<any>} Breakdown of pipeline value per stage
     */
    async getPipelineStage(startDate: string, endDate: string): Promise<any> {
        const [rows] = await this.prospectDb.query<any[]>(
            `SELECT
                pos.id as stage_id,
                pos.name,
                SUM(poa.amount) AS value
            FROM prospect_opportunities po
            LEFT JOIN prospect_opportunity_amounts poa ON
                poa.opportunity_id = po.id
            LEFT JOIN prospect_opportunity_stages pos ON
                pos.id = po.opportunity_stage_id
            WHERE po.id IN (
                SELECT object_id
                FROM customer_object_product_services
                WHERE object = 'opportunity' AND product_service_id IN (12, 36, 34, 28)
            )
            AND poa.amount_category_setting_id = 1
            AND po.deleted_at IS NULL
            AND DATE(po.created_at) >= ?
            AND DATE(po.created_at) <= ?
            AND po.opportunity_stage_id IN (1, 4, 5)
            GROUP BY po.opportunity_stage_id, pos.name`,
            [startDate, endDate]
        )

        const stages = {
            qualification: { name: 'Qualification', value: 0, percentage: 0 },
            proposal: { name: 'Proposal', value: 0, percentage: 0 },
            negotiation: { name: 'Negotiation', value: 0, percentage: 0 }
        }

        const totalValue = rows.reduce((acc, row) => acc + Number(row.value), 0)

        rows.forEach(row => {
            const val = Number(row.value) || 0
            const percentage = totalValue > 0 ? Number(((val / totalValue) * 100).toFixed(2)) : 0
            
            if (row.stage_id === 1) {
                stages.qualification = { name: row.name || 'Qualification', value: val, percentage }
            } else if (row.stage_id === 4) {
                stages.proposal = { name: row.name || 'Proposal', value: val, percentage }
            } else if (row.stage_id === 5) {
                stages.negotiation = { name: row.name || 'Negotiation', value: val, percentage }
            }
        })

        return stages
    }

    /**
     * Query discount given to customers
     * Aggregates the total discount amount from the billing system
     * 
     * @param {string} branchId - The branch identifier
     * @param {string} startDate - Query start date
     * @param {string} endDate - Query end date
     * @returns {Promise<{serviceGroup: string, discount: number}[]>} Total discount per service group
     */
    async getDiscount(branchId: string, startDate: string, endDate: string): Promise<{ serviceGroup: string, discount: number }[]> {
        const [rows] = await this.nisDb.query<any[]>(
            `SELECT
                sg.Description service_group,
                SUM(cid.Amount) discount
            FROM CustomerInvoiceDiscount cid
            LEFT JOIN CustomerServices cs ON cs.CustServId = cid.CustServId
            LEFT JOIN Customer c ON c.CustId = cs.CustId
            LEFT JOIN Services s on s.ServiceId = cs.ServiceId
            LEFT JOIN ServiceGroup sg ON sg.ServiceGroup = s.ServiceGroup
            WHERE s.ServiceCategory = 'access_business'
            AND c.BranchId = ?
            AND DATE(cid.DateTime) >= ?
            AND DATE(cid.DateTime) <= ?
            GROUP BY s.ServiceGroup`,
            [branchId, startDate, endDate]
        )

        return rows.map(row => ({
            serviceGroup: row.service_group,
            discount: Number(row.discount) || 0
        }))
    }

    /**
     * Aggregates revenue lost from churned customers (NA status)
     * 
     * @param {string} branchId - The branch identifier
     * @param {string} startDate - Query start date
     * @param {string} endDate - Query end date
     * @returns {Promise<number>} Total churn MRC
     */
    async getChurnMrc(branchId: string, startDate: string, endDate: string): Promise<number> {
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
                LEFT JOIN CustomerServices cs ON
                    cs.CustServId = cit.CustServId
                LEFT JOIN Services s ON
                    s.ServiceId = cit.ServiceId
                WHERE gj.KodeCabang = ?
                AND s.ServiceCategory = 'access_business'
                AND gj.NoPerkiraan LIKE '400%'
                AND gj.TglTransaksi >= ?
                AND gj.TglTransaksi <= ?
                AND cs.CustStatus = 'NA'`,
            [branchId, startDate, endDate]
        )
        return Number(rows[0]?.total || 0)
    }

    /**
     * Query sales target for a specific year
     * Retrieves the yearly and monthly revenue targets from the dashboard database
     * 
     * @param {number} year - The year to query
     * @returns {Promise<any>} Target configuration object
     */
    async getTarget(year: number): Promise<any> {
        const [rows] = await this.dashboardDb.query<any[]>(
            `SELECT * FROM vp_access_business_target WHERE year = ?`,
            [year]
        )
        return rows[0] || null
    }

    /**
     * Query new customer acquisition value
     * Calculates the total value generated from new customers within the period
     * 
     * @param {string} branchId - The branch identifier
     * @param {string} startDate - Query start date
     * @param {string} endDate - Query end date
     * @returns {Promise<number>} Total revenue from new customers
     */
    async getNewCustomer(branchId: string, startDate: string, endDate: string): Promise<number> {
        const [rows] = await this.nisDb.query<any[]>(
            `SELECT
                SUM((t.credit - IFNULL(d.discount, 0)) / 1.11) AS total_dpp
            FROM (
                SELECT
                    nci.AI ai,
                    nci.Credit credit,
                    MAX(IFNULL(nci2.JournalDate, nci2.TransDate)) receipt_date,
                    ROW_NUMBER() OVER (
                        PARTITION BY cit.CustServId
                    ) AS rn
                FROM CustomerInvoiceTemp cit
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
                GROUP BY nci.AI
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
            WHERE t.rn = 1
            AND DATE(t.receipt_date) >= ?
            AND DATE(t.receipt_date) <= ?`,
            [branchId, startDate, endDate]
        )
        return Number(rows[0]?.total_dpp || 0)
    }

    /**
     * Query Average Revenue Per User (ARPU) metrics
     * Calculates total services, total revenue, and their ratio grouped by service type
     * 
     * @param {string} branchId - The branch identifier
     * @param {string} startDate - Query start date
     * @param {string} endDate - Query end date
     * @returns {Promise<{serviceGroup: string, jumlahService: number, totalRevenue: number, avgPerService: number}[]>}
     */
    async getArpu(branchId: string, startDate: string, endDate: string): Promise<{ serviceGroup: string, jumlahService: number, totalRevenue: number, avgPerService: number }[]> {
        const [rows] = await this.nisDb.query<any[]>(
            `SELECT
                sg.Description AS service_group,
                COUNT(DISTINCT cit.CustServId) AS jumlah_service,
                SUM(gj.Kredit - gj.Debet) AS total_revenue,
                SUM(gj.Kredit - gj.Debet) / COUNT(DISTINCT cit.CustServId) AS avg_per_service
            FROM GeneralJournal gj
            LEFT JOIN Panjar_Penjualan_Breakdown ppb
                ON ppb.id = gj.SumberId
                AND gj.Sumber = 'pnjr'
            LEFT JOIN NewCustomerInvoice nci
                ON nci.AI = IFNULL(ppb.invoiceAI, gj.SumberId)
            LEFT JOIN CustomerInvoiceTemp cit
                ON cit.InvoiceNum = nci.Id
                AND cit.Urut = nci.No
            LEFT JOIN Services s
                ON s.ServiceId = cit.ServiceId
            LEFT JOIN ServiceGroup sg
                ON sg.ServiceGroup = s.ServiceGroup
            WHERE gj.KodeCabang = ?
              AND s.ServiceCategory = 'access_business'
              AND gj.NoPerkiraan LIKE '400%'
              AND DATE(gj.TglTransaksi) >= ?
              AND DATE(gj.TglTransaksi) <= ?
            GROUP BY s.ServiceGroup, sg.Description`,
            [branchId, startDate, endDate]
        )

        return rows.map(row => ({
            serviceGroup: row.service_group,
            jumlahService: Number(row.jumlah_service) || 0,
            totalRevenue: Number(row.total_revenue) || 0,
            avgPerService: Number(row.avg_per_service) || 0
        }))
    }

    /**
     * Query forecast revenue from opportunities
     * Calculates sum of amount * probability / 100 for opportunities in stage 5
     * 
     * @param {string} startDate - Query start date
     * @param {string} endDate - Query end date
     * @returns {Promise<number>} Forecast revenue value
     */
    async getForecastRevenue(startDate: string, endDate: string): Promise<number> {
        const [rows] = await this.prospectDb.query<any[]>(
            `SELECT
                SUM(poa.amount * po.probability / 100) AS value
            FROM customer_object_product_services cops
            LEFT JOIN prospect_opportunities po ON
                po.id = cops.object_id
                AND cops.object = 'opportunity'
            LEFT JOIN prospect_opportunity_amounts poa ON
                poa.opportunity_id = po.id
            WHERE cops.product_service_id IN (12, 36, 34, 28)
            AND po.opportunity_stage_id = 5
            AND poa.amount_category_setting_id = 1
            AND po.id IS NOT NULL
            AND po.deleted_at IS NULL
            AND DATE(po.created_at) >= ?
            AND DATE(po.created_at) <= ?`,
            [startDate, endDate]
        )
        return Number(rows[0]?.value || 0)
    }

    /**
     * Query forecast MRC from opportunities
     * Calculates sum of amount for opportunities in stage 5
     * 
     * @param {string} startDate - Query start date
     * @param {string} endDate - Query end date
     * @returns {Promise<number>} Forecast MRC value
     */
    async getForecastMrc(startDate: string, endDate: string): Promise<number> {
        const [rows] = await this.prospectDb.query<any[]>(
            `SELECT
                SUM(poa.amount) AS value
            FROM customer_object_product_services cops
            LEFT JOIN prospect_opportunities po ON
                po.id = cops.object_id
                AND cops.object = 'opportunity'
            LEFT JOIN prospect_opportunity_amounts poa ON
                poa.opportunity_id = po.id
            LEFT JOIN prospect_opportunity_stages pos ON
                pos.id = po.opportunity_stage_id
            WHERE cops.product_service_id IN (12, 36, 34, 28)
            AND po.opportunity_stage_id = 5
            AND poa.amount_category_setting_id = 1
            AND po.id IS NOT NULL
            AND po.deleted_at IS NULL
            AND DATE(po.created_at) >= ?
            AND DATE(po.created_at) <= ?`,
            [startDate, endDate]
        )
        return Number(rows[0]?.value || 0)
    }

    async getForecastChurnBlocked(branchId: string, startDate: string, endDate: string): Promise<{ csid: number, mrc: number }[]> {
        const [rows] = await this.nisDb.query<any[]>(
            `SELECT
                cs.CustServId as csid,
                ((cs.Subscription - CAST(cs.Discount AS UNSIGNED)) / IF(
                    cs.InvoiceType != 8,
                    itm.Month,
                    1
                )) as mrc
            FROM CustomerServices cs
            LEFT JOIN Customer c ON
                c.CustId = cs.CustId
            LEFT JOIN InvoiceTypeMonth itm
                ON itm.InvoiceType = cs.InvoiceType
            WHERE cs.CustStatus = 'BL'
            AND c.BranchId = ?
            AND (cs.CustBlockDate + INTERVAL 30 DAY) > ?`,
            [branchId, endDate]
        )
        return rows.map(r => ({ csid: Number(r.csid), mrc: Number(r.mrc || 0) }))
    }

    async getForecastChurnContract(branchId: string, startDate: string, endDate: string): Promise<{ csid: number, mrc: number }[]> {
        const [rows] = await this.nisDb.query<any[]>(
            `SELECT
                t.csid,
                ((t.Subscription - CAST(t.Discount AS UNSIGNED)) / IF(
                    t.InvoiceType != 8,
                    itm.Month,
                    1
                )) as mrc
            FROM (
                SELECT 
                    dc.CustServId csid,
                    dc.Data data,
                    CASE
                        WHEN JSON_UNQUOTE(JSON_EXTRACT(dc.Data, '$.sampaiTanggal')) IS NULL
                            OR JSON_UNQUOTE(JSON_EXTRACT(dc.Data, '$.sampaiTanggal')) = ''
                        THEN LAST_DAY(
                            STR_TO_DATE(
                                CONCAT(
                                    JSON_UNQUOTE(JSON_EXTRACT(dc.Data, '$.sampaiTahun')),
                                    '-',
                                    LPAD(JSON_UNQUOTE(JSON_EXTRACT(dc.Data, '$.sampaiBulan')), 2, '0'),
                                    '-01'
                                ),
                                '%Y-%m-%d'
                            )
                        )
                        ELSE STR_TO_DATE(
                            CONCAT(
                                JSON_UNQUOTE(JSON_EXTRACT(dc.Data, '$.sampaiTahun')),
                                '-',
                                LPAD(JSON_UNQUOTE(JSON_EXTRACT(dc.Data, '$.sampaiBulan')), 2, '0'),
                                '-',
                                LPAD(JSON_UNQUOTE(JSON_EXTRACT(dc.Data, '$.sampaiTanggal')), 2, '0')
                            ),
                            '%Y-%m-%d'
                        )
                    END AS expired_date,
                    cs.*
                FROM document_contract dc
                LEFT JOIN CustomerServices cs 
                    ON cs.CustServId = dc.CustServId
                LEFT JOIN Customer c ON
                    c.CustId = cs.CustId
                LEFT JOIN Services s 
                    ON s.ServiceId = cs.ServiceId
                WHERE s.ServiceCategory = 'access_business'
                AND c.BranchId = ?
            ) t
            LEFT JOIN InvoiceTypeMonth itm
                ON itm.InvoiceType = t.InvoiceType
            WHERE DATE(t.expired_date) >= ?
            AND DATE(t.expired_date) <= ?`,
            [branchId, startDate, endDate]
        )
        return rows.map(r => ({ csid: Number(r.csid), mrc: Number(r.mrc || 0) }))
    }

    async getForecastChurnTicket(branchId: string, startDate: string, endDate: string): Promise<{ csid: number, mrc: number }[]> {
        const [rows] = await this.nisDb.query<any[]>(
            `SELECT
                t.csid,
                t.mrc
            FROM (
                SELECT
                    t.CustServId as csid,
                    COUNT(t.TtsId) total_ticket,
                    ((cs.Subscription - CAST(cs.Discount AS UNSIGNED)) / IF(
                        cs.InvoiceType != 8,
                        itm.Month,
                        1
                    )) as mrc
                FROM Tts t
                LEFT JOIN CustomerServices cs ON cs.CustServId = t.CustServId
                LEFT JOIN Customer c ON c.CustId = cs.CustId
                LEFT JOIN InvoiceTypeMonth itm
                    ON itm.InvoiceType = cs.InvoiceType
                LEFT JOIN Services s ON s.ServiceId = cs.ServiceId
                WHERE t.TtsTypeId = 2
                AND t.Status != 'Cancel'
                AND s.ServiceCategory = 'access_business'
                AND c.BranchId = ?
                AND DATE(t.PostedTime) >= ?
                AND DATE(t.PostedTime) <= ?
                GROUP BY t.CustServId
            ) t
            WHERE t.total_ticket >= 2`,
            [branchId, startDate, endDate]
        )
        return rows.map(r => ({ csid: Number(r.csid), mrc: Number(r.mrc || 0) }))
    }

    async getForecastChurnUsage(branchId: string, startDate: string, endDate: string): Promise<{ csid: number, mrc: number }[]> {
        const [rows] = await this.nisDb.query<any[]>(
            `SELECT
                t.csid,
                ((cs.Subscription - CAST(cs.Discount AS UNSIGNED)) / IF(
                    cs.InvoiceType != 8,
                    itm.Month,
                    1
                )) as mrc
            FROM (
                SELECT 
                    td.csid,
                    (SUM(td.total) / 1024 / 1024) total_usage
                FROM traff_data td
                WHERE DATE(td.date) >= ?
                AND DATE(td.date) <= ?
                GROUP BY td.csid
            ) t
            LEFT JOIN CustomerServices cs ON
                cs.CustServId = t.csid
            LEFT JOIN Customer c ON
                c.CustId = cs.CustId
            LEFT JOIN InvoiceTypeMonth itm
                ON itm.InvoiceType = cs.InvoiceType
            LEFT JOIN Services s ON s.ServiceId = cs.ServiceId
            WHERE t.total_usage < 500
            AND s.ServiceCategory = 'access_business'
            AND c.BranchId = ?`,
            [startDate, endDate, branchId]
        )
        return rows.map(r => ({ csid: Number(r.csid), mrc: Number(r.mrc || 0) }))
    }

    async getCustomerLoseByServiceGroup(branchId: string, startDate: string, endDate: string): Promise<{ service_group: string, total_churn: number }[]> {
        const [rows] = await this.nisDb.query<any[]>(
            `SELECT
                sg.Description service_group,
                COUNT(1) total_churn
            FROM CustomerServices cs
            LEFT JOIN Customer c ON
                c.CustId = cs.CustId
            LEFT JOIN Services s ON
                s.ServiceId = cs.ServiceId
            LEFT JOIN ServiceGroup sg ON
                sg.ServiceGroup = s.ServiceGroup
            WHERE cs.CustStatus IN ('NA', 'BL')
            AND s.ServiceCategory = 'access_business'
            AND c.BranchId = ?
            AND (
                (DATE(cs.CustUnregDate) >= ? AND DATE(cs.CustUnregDate) <= ?)
                OR (DATE(cs.CustBlockDate) >= ? AND DATE(cs.CustBlockDate) <= ?)
            )
            GROUP BY s.ServiceGroup`,
            [branchId, startDate, endDate, startDate, endDate]
        )
        return rows
    }
}
