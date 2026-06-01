import { type Pool } from 'mysql2/promise'
import { IServiceQualityRepository } from '../interfaces/service-quality.repository.interface'

export class ServiceQualityRepository implements IServiceQualityRepository {
    constructor(
        private readonly nisDb: Pool
    ) {}

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

    async issue(branchId: string, startDate: string, endDate: string): Promise<number> {
        const [rows] = await this.nisDb.query<any[]>(
            `SELECT
                IFNULL((SUM(
                    CASE
                        WHEN t.total_incident > 1
                        THEN 1
                        ELSE 0
                    END
                ) / NULLIF(SUM(t.total_incident), 0) * 100), 0) as percent
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
}
