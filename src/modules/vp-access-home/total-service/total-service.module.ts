import { Pool } from 'mysql2/promise'
import { TotalServiceRepository } from './repositories/total-service.repository'
import { TotalServiceService } from './services/total-service.service'
import { TotalServiceController } from './controllers/total-service.controller'

export class TotalServiceModule {
    public readonly controller: TotalServiceController
    public readonly service: TotalServiceService
    public readonly repository: TotalServiceRepository

    constructor(nisPool: Pool) {
        this.repository = new TotalServiceRepository(nisPool)
        this.service = new TotalServiceService(this.repository)
        this.controller = new TotalServiceController(this.service)
    }
}
