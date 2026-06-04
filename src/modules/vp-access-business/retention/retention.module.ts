import { Pool } from 'mysql2/promise'
import { RetentionRepository } from './repositories/retention.repository'
import { RetentionService } from './services/retention.service'
import { RetentionController } from './controllers/retention.controller'

export class RetentionModule {
    public readonly controller: RetentionController
    public readonly service: RetentionService
    public readonly repository: RetentionRepository

    constructor(nisPool: Pool, dashboardPool: Pool, prospectPool: Pool) {
        this.repository = new RetentionRepository(nisPool, dashboardPool, prospectPool)
        this.service = new RetentionService(this.repository)
        this.controller = new RetentionController(this.service)
    }
}
