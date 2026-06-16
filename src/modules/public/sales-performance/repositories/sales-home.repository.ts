import { type Pool } from 'mysql2/promise'
import { ISalesHomeRepository, SalesHomeUpsertPayload } from '../interfaces/sales-home.repository.interface'

export class SalesHomeRepository implements ISalesHomeRepository {
    constructor(private readonly db: Pool) {}

    /**
     * Upsert a list of sales home employees.
     * 
     * @param {SalesHomeUpsertPayload[]} data - The list of employees to upsert.
     * @returns {Promise<void>} A promise that resolves when the operation is complete.
     */
    async upsert(data: SalesHomeUpsertPayload[]): Promise<void> {
        if (!data.length) return

        const connection = await this.db.getConnection()
        try {
            await connection.query('SET FOREIGN_KEY_CHECKS = 0')

            const values = data.map(d => [
                d.id,
                d.employeeId,
                d.name,
                d.email,
                d.photoProfile,
                d.jobPosition || null,
                d.organizationName || null,
                d.jobLevel || null,
                d.branchId || null,
                d.managerId || null,
                d.status || null
            ])

            await connection.query(
                `INSERT INTO sales_home (
                    id, employee_id, name, email, photo_profile, 
                    job_position, organization_name, job_level, 
                    branch_id, manager_id, status
                ) VALUES ?
                ON DUPLICATE KEY UPDATE
                    name = VALUES(name),
                    email = VALUES(email),
                    photo_profile = VALUES(photo_profile),
                    job_position = VALUES(job_position),
                    organization_name = VALUES(organization_name),
                    job_level = VALUES(job_level),
                    branch_id = VALUES(branch_id),
                    manager_id = VALUES(manager_id),
                    status = VALUES(status),
                    updated_at = CURRENT_TIMESTAMP`,
                [values]
            )
        } finally {
            await connection.query('SET FOREIGN_KEY_CHECKS = 1')
            connection.release()
        }
    }
}
