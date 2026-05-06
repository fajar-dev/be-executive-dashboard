import { type Pool } from 'mysql2/promise'
import { IUserRepository } from './user.repository.interface'

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
}
