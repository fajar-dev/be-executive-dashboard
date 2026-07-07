import { Pool } from 'mysql2/promise'
import { RevenueRepository } from './repositories/revenue.repository'
import { RevenueService } from './services/revenue.service'
import { RevenueController } from './controllers/revenue.controller'

export class RevenueModule {
    public readonly controller: RevenueController
    public readonly service: RevenueService
    public readonly repository: RevenueRepository

    constructor(nisPool: Pool) {
        this.repository = new RevenueRepository(nisPool)
        this.service = new RevenueService(this.repository)
        this.controller = new RevenueController(this.service)
    }
}
