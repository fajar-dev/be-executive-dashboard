import { type Pool } from 'mysql2/promise'
import { ISalesRepository, SalesUpsertPayload } from '../interfaces/sales.repository.interface'

export class SalesRepository implements ISalesRepository {
    constructor(private readonly db: Pool) {}

    /**
     * Upsert a list of sales employees (access_home and access_business).
     *
     * @param {SalesUpsertPayload[]} data - The list of employees to upsert.
     * @returns {Promise<void>} A promise that resolves when the operation is complete.
     */
    async upsert(data: SalesUpsertPayload[]): Promise<void> {
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
                d.status || null,
                d.type
            ])

            await connection.query(
                `INSERT INTO sales (
                    id, employee_id, name, email, photo_profile,
                    job_position, organization_name, job_level,
                    branch_id, manager_id, status, type
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
                    type = VALUES(type),
                    updated_at = CURRENT_TIMESTAMP`,
                [values]
            )
        } finally {
            await connection.query('SET FOREIGN_KEY_CHECKS = 1')
            connection.release()
        }
    }
}
