import { Pool } from 'mysql2/promise'
import { SalesPerformanceRepository } from './repositories/sales-performance.repository'
import { SalesHomeRepository } from './repositories/sales-home.repository'
import { SalesPerformanceService } from './services/sales-performance.service'
import { SalesPerformanceController } from './controllers/sales-performance.controller'

export class SalesPerformanceModule {
    public readonly controller: SalesPerformanceController
    public readonly service: SalesPerformanceService
    public readonly repository: SalesPerformanceRepository
    public readonly salesHomeRepository: SalesHomeRepository

    constructor(nisPool: Pool, dashboardPool: Pool) {
        this.repository = new SalesPerformanceRepository(nisPool, dashboardPool)
        this.salesHomeRepository = new SalesHomeRepository(dashboardPool)
        this.service = new SalesPerformanceService(this.repository)
        this.controller = new SalesPerformanceController(this.service)
    }
}
