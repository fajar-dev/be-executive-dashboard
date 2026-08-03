import { Pool } from 'mysql2/promise'
import { SalesPerformanceRepository } from './repositories/sales-performance.repository'
import { SalesRepository } from './repositories/sales.repository'
import { SalesPerformanceService } from './services/sales-performance.service'
import { SalesPerformanceController } from './controllers/sales-performance.controller'

export class SalesPerformanceModule {
    public readonly controller: SalesPerformanceController
    public readonly service: SalesPerformanceService
    public readonly repository: SalesPerformanceRepository
    public readonly salesRepository: SalesRepository

    constructor(nisPool: Pool, dashboardPool: Pool) {
        this.repository = new SalesPerformanceRepository(nisPool, dashboardPool)
        this.salesRepository = new SalesRepository(dashboardPool)
        this.service = new SalesPerformanceService(this.repository)
        this.controller = new SalesPerformanceController(this.service)
    }
}
