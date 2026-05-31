import { type Pool } from 'mysql2/promise'
import { ServiceQualityRepository } from './repositories/service-quality.repository'
import { ServiceQualityService } from './services/service-quality.service'
import { ServiceQualityController } from './controllers/service-quality.controller'

export class ServiceQualityModule {
    public readonly controller: ServiceQualityController
    public readonly service: ServiceQualityService
    public readonly repository: ServiceQualityRepository

    constructor(dbPool: Pool) {
        this.repository = new ServiceQualityRepository(dbPool)
        this.service = new ServiceQualityService(this.repository)
        this.controller = new ServiceQualityController(this.service)
    }
}
