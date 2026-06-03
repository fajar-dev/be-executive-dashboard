import { type Pool } from 'mysql2/promise'
import { IUserRepository, type UserUpsertPayload } from './user.repository.interface'

export class UserRepository implements IUserRepository {
    constructor(private readonly db: Pool) {}

    async findById(id: number): Promise<any | null> {
        const [[user]] = await this.db.query<any[]>(
            'SELECT * FROM users WHERE id = ? LIMIT 1',
            [id]
        )
        return user ?? null
    }

    async findByEmployeeId(employeeId: string): Promise<any | null> {
        const [[user]] = await this.db.query<any[]>(
            'SELECT * FROM users WHERE employee_id = ? LIMIT 1',
            [employeeId]
        )
        return user ?? null
    }

    async findByEmail(email: string): Promise<any | null> {
        const [[user]] = await this.db.query<any[]>(
            'SELECT * FROM users WHERE email = ? LIMIT 1',
            [email]
        )
        return user ?? null
    }

    async upsertByEmployeeId(data: UserUpsertPayload[]): Promise<void> {
        if (!data.length) return

        const values = data.map(d => [d.employeeId, d.name, d.email, d.photo, d.jobPosition])
        await this.db.query(
            `INSERT INTO users (employee_id, name, email, photo, job_position)
             VALUES ?
             ON DUPLICATE KEY UPDATE
             name = VALUES(name),
             email = VALUES(email),
             photo = VALUES(photo),
             job_position = VALUES(job_position),
             updated_at = CURRENT_TIMESTAMP`,
            [values]
        )
    }
}
