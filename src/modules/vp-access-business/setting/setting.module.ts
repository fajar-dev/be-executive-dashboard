import { Pool } from 'mysql2/promise'
import { SettingRepository } from './repositories/setting.repository'
import { SettingService } from './services/setting.service'
import { SettingController } from './controllers/setting.controller'

export class SettingModule {
    public readonly controller: SettingController
    public readonly service: SettingService
    public readonly repository: SettingRepository

    constructor(nisPool: Pool, nusaprospectPool: Pool, dashboardPool: Pool) {
        this.repository = new SettingRepository(nisPool, nusaprospectPool, dashboardPool)
        this.service = new SettingService(this.repository)
        this.controller = new SettingController(this.service)
    }
}
