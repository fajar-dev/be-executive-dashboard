import { Pool } from 'mysql2/promise'
import { GrowthRepository } from './repositories/growth.repository'
import { GrowthService } from './services/growth.service'
import { GrowthController } from './controllers/growth.controller'

export class GrowthModule {
    public readonly controller: GrowthController
    public readonly service: GrowthService
    public readonly repository: GrowthRepository

    constructor(nisPool: Pool) {
        this.repository = new GrowthRepository(nisPool)
        this.service = new GrowthService(this.repository)
        this.controller = new GrowthController(this.service)
    }
}
