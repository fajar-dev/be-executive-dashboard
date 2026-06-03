import { type Pool } from 'mysql2/promise'
import { IServiceQualityRepository } from '../interfaces/service-quality.repository.interface'

/**
 * Repository for handling service quality database queries
 * Provides methods to query ticketing and NOC incident data from nisDb
 */
export class ServiceQualityRepository implements IServiceQualityRepository {
    constructor(
        private readonly nisDb: Pool
    ) {}

    /**
     * Query total number of tickets created
     * Excludes canceled tickets
     * 
     * @param {string} branchId - The branch identifier
     * @param {string} startDate - Query start date
     * @param {string} endDate - Query end date
     * @returns {Promise<number>} Total tickets
     */
    async ticket(branchId: string, startDate: string, endDate: string): Promise<number> {
        const [rows] = await this.nisDb.query<any[]>(
            `SELECT
                COUNT(DISTINCT t.TtsId) total
            FROM Tts t
            LEFT JOIN CustomerServices cs ON cs.CustServId = t.CustServId
            LEFT JOIN Customer c ON c.CustId = cs.CustId
            LEFT JOIN Services s ON s.ServiceId = cs.ServiceId
            WHERE t.Status != 'Cancel'
            AND s.ServiceCategory = 'access_business'
            AND c.BranchId = ?
            AND DATE(t.PostedTime) >= ? 
            AND DATE(t.PostedTime) <= ?`,
            [branchId, startDate, endDate]
        )
        return Number(rows[0]?.total || 0)
    }

    /**
     * Query total number of complaint tickets
     * Filters tickets specifically marked as complaints (TtsTypeId = 2)
     * 
     * @param {string} branchId - The branch identifier
     * @param {string} startDate - Query start date
     * @param {string} endDate - Query end date
     * @returns {Promise<number>} Total complaints
     */
    async complaint(branchId: string, startDate: string, endDate: string): Promise<number> {
        const [rows] = await this.nisDb.query<any[]>(
            `SELECT
                COUNT(DISTINCT t.TtsId) total
            FROM Tts t
            LEFT JOIN CustomerServices cs ON cs.CustServId = t.CustServId
            LEFT JOIN Customer c ON c.CustId = cs.CustId
            LEFT JOIN Services s ON s.ServiceId = cs.ServiceId
            WHERE t.TtsTypeId = 2
            AND t.Status != 'Cancel'
            AND s.ServiceCategory = 'access_business'
            AND c.BranchId = ?
            AND DATE(t.PostedTime) >= ? 
            AND DATE(t.PostedTime) <= ?`,
            [branchId, startDate, endDate]
        )
        return Number(rows[0]?.total || 0)
    }

    /**
     * Query total number of solved tickets
     * Filters tickets with status 'Call' (indicating closed/solved state)
     * 
     * @param {string} branchId - The branch identifier
     * @param {string} startDate - Query start date
     * @param {string} endDate - Query end date
     * @returns {Promise<number>} Total solved tickets
     */
    async solved(branchId: string, startDate: string, endDate: string): Promise<number> {
        const [rows] = await this.nisDb.query<any[]>(
            `SELECT
                COUNT(DISTINCT t.TtsId) total
            FROM Tts t
            LEFT JOIN CustomerServices cs ON cs.CustServId = t.CustServId
            LEFT JOIN Customer c ON c.CustId = cs.CustId
            LEFT JOIN Services s ON s.ServiceId = cs.ServiceId
            WHERE t.Status = 'Call'
            AND s.ServiceCategory = 'access_business'
            AND c.BranchId = ?
            AND DATE(t.PostedTime) >= ? 
            AND DATE(t.PostedTime) <= ?`,
            [branchId, startDate, endDate]
        )
        return Number(rows[0]?.total || 0)
    }

    /**
     * Query ticket resolution percentage
     * Calculates the ratio of solved tickets against total complaint tickets
     * 
     * @param {string} branchId - The branch identifier
     * @param {string} startDate - Query start date
     * @param {string} endDate - Query end date
     * @returns {Promise<number>} Solved percentage
     */
    async solvedPercentage(branchId: string, startDate: string, endDate: string): Promise<number> {
        const [rows] = await this.nisDb.query<any[]>(
            `SELECT
                IFNULL(
                    (COUNT(DISTINCT IF(t.Status = 'Call', t.TtsId, NULL)) / 
                    NULLIF(COUNT(DISTINCT IF(t.TtsTypeId = 2 AND t.Status != 'Cancel', t.TtsId, NULL)), 0)) * 100,
                    0
                ) AS percentage
            FROM Tts t
            LEFT JOIN CustomerServices cs ON cs.CustServId = t.CustServId
            LEFT JOIN Customer c ON c.CustId = cs.CustId
            LEFT JOIN Services s ON s.ServiceId = cs.ServiceId
            WHERE s.ServiceCategory = 'access_business'
            AND c.BranchId = ?
            AND DATE(t.PostedTime) >= ? 
            AND DATE(t.PostedTime) <= ?`,
            [branchId, startDate, endDate]
        )
        return Number(rows[0]?.percentage || 0)
    }

    /**
     * Query percentage of customers with recurring NOC issues
     * Calculates the percentage of customers who experienced > 1 incident in the period
     * 
     * @param {string} branchId - The branch identifier
     * @param {string} startDate - Query start date
     * @param {string} endDate - Query end date
     * @returns {Promise<number>} Percentage of customers with multiple issues
     */
    async issue(branchId: string, startDate: string, endDate: string): Promise<number> {
        const [rows] = await this.nisDb.query<any[]>(
            `SELECT
                IFNULL((SUM(
                    CASE
                        WHEN t.total_incident > 1
                        THEN 1
                        ELSE 0
                    END
                ) / NULLIF(COUNT(1), 0) * 100), 0) as percent
            FROM (
                SELECT
                    ncs.cs_id,
                    COUNT(1) total_incident
                FROM noc_customer_service ncs
                LEFT JOIN noc n ON n.id = ncs.noc_id
                LEFT JOIN CustomerServices cs ON cs.CustServId = ncs.cs_id
                LEFT JOIN Customer c ON c.CustId = cs.CustId
                LEFT JOIN Services s ON s.ServiceId = cs.ServiceId
                WHERE n.status != 'Cancel'
                AND s.ServiceCategory = 'access_business'
                AND c.BranchId = ?
                AND DATE(n.datetime) >= ? 
                AND DATE(n.datetime) <= ?
                GROUP BY ncs.cs_id
            ) t`,
            [branchId, startDate, endDate]
        )
        return Number(rows[0]?.percent || 0)
    }

    /**
     * Query total number of NOC incidents
     * Counts unique incidents affecting customer services
     * 
     * @param {string} branchId - The branch identifier
     * @param {string} startDate - Query start date
     * @param {string} endDate - Query end date
     * @returns {Promise<number>} Total incident count
     */
    async incident(branchId: string, startDate: string, endDate: string): Promise<number> {
        const [rows] = await this.nisDb.query<any[]>(
            `SELECT
                COUNT(DISTINCT n.id) total
            FROM noc_customer_service ncs
            LEFT JOIN noc n ON n.id = ncs.noc_id
            LEFT JOIN CustomerServices cs ON cs.CustServId = ncs.cs_id
            LEFT JOIN Customer c ON c.CustId = cs.CustId
            LEFT JOIN Services s ON s.ServiceId = cs.ServiceId
            WHERE n.status != 'Cancel'
            AND s.ServiceCategory = 'access_business'
            AND c.BranchId = ?
            AND DATE(n.datetime) >= ? 
            AND DATE(n.datetime) <= ?`,
            [branchId, startDate, endDate]
        )
        return Number(rows[0]?.total || 0)
    }
}
