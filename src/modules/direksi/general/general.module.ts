import { Pool } from 'mysql2/promise'
import { GeneralRepository } from './repositories/general.repository'
import { GeneralService } from './services/general.service'
import { GeneralController } from './controllers/general.controller'

export class GeneralModule {
    public readonly controller: GeneralController
    public readonly service: GeneralService
    public readonly repository: GeneralRepository

    constructor(nisPool: Pool, nusafiberPool: Pool) {
        this.repository = new GeneralRepository(nisPool, nusafiberPool)
        this.service = new GeneralService(this.repository)
        this.controller = new GeneralController(this.service)
    }
}
