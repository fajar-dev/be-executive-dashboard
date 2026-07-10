import { Pool } from 'mysql2/promise'
import { NewGrowthRepository } from './repositories/new-growth.repository'
import { NewGrowthService } from './services/new-growth.service'
import { NewGrowthController } from './controllers/new-growth.controller'

export class NewGrowthModule {
    public readonly controller: NewGrowthController
    public readonly service: NewGrowthService
    public readonly repository: NewGrowthRepository

    constructor(nisPool: Pool) {
        this.repository = new NewGrowthRepository(nisPool)
        this.service = new NewGrowthService(this.repository)
        this.controller = new NewGrowthController(this.service)
    }
}
