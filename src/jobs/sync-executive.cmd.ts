import { dashboardPool } from '../config/dashboard.db'
import { UserRepository } from '../modules/user/user.repository'
import { SalesRepository } from '../modules/public/sales-performance/repositories/sales.repository'
import { syncExecutiveJob, syncAdminJob, syncSalesJob } from './sync-executive.job'

;(async () => {
    const userRepository = new UserRepository(dashboardPool)
    const salesRepository = new SalesRepository(dashboardPool)

    await syncExecutiveJob(userRepository)
    await syncAdminJob(userRepository)
    await syncSalesJob(salesRepository)

    await dashboardPool.end()
})()
