import { type Pool } from 'mysql2/promise'
import { NotFoundException } from '../../core/exceptions/base'

export class UserService {
    private dashboardDb: Pool;

    constructor(dashboardDb: Pool) {
        this.dashboardDb = dashboardDb;
    }

    async getById(id: number) {
        const [[user]] = await this.dashboardDb.query<any[]>(
            'SELECT * FROM users WHERE id = ? LIMIT 1',
            [id]
        )
        if (!user) throw new NotFoundException("User not found")

        return user
    }

    async getByEmId(employeeId: string) {
        const [[user]] = await this.dashboardDb.query<any[]>(
            'SELECT * FROM users WHERE employee_id = ? LIMIT 1',
            [employeeId]
        )
        if (!user) throw new NotFoundException("User not found")

        return user
    }

    async getByEmail(email: string) {
        const [[user]] = await this.dashboardDb.query<any[]>(
            'SELECT * FROM users WHERE email = ? LIMIT 1',
            [email]
        )
        if (!user) throw new NotFoundException("User not found")

        return user
    }
}
