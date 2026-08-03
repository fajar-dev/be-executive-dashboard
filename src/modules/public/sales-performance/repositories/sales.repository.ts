import { type Pool } from 'mysql2/promise'
import { ISalesRepository, SalesUpsertPayload } from '../interfaces/sales.repository.interface'

export class SalesRepository implements ISalesRepository {
    constructor(private readonly db: Pool) {}

    /**
     * Replace the entire sales table with a fresh crawl (access_home and access_business).
     * Deletes all existing rows, then inserts the provided list, atomically in one
     * transaction so a failed insert never leaves the table empty.
     *
     * @param {SalesUpsertPayload[]} data - The full list of employees to store.
     * @returns {Promise<void>} A promise that resolves when the operation is complete.
     */
    async replaceAll(data: SalesUpsertPayload[]): Promise<void> {
        const connection = await this.db.getConnection()
        try {
            // Disabled so the self-referencing manager_id FK doesn't block delete/insert order.
            await connection.query('SET FOREIGN_KEY_CHECKS = 0')
            await connection.beginTransaction()

            await connection.query('DELETE FROM sales')

            if (!data.length) {
                await connection.commit()
                return
            }

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

            await connection.commit()
        } catch (error) {
            await connection.rollback()
            throw error
        } finally {
            await connection.query('SET FOREIGN_KEY_CHECKS = 1')
            connection.release()
        }
    }
}
