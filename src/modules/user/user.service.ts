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
}
