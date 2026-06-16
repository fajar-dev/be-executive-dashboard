import { dashboardPool } from '../config/dashboard.db'
import { UserRepository } from '../modules/user/user.repository'
import { SalesHomeRepository } from '../modules/public/sales-performance/repositories/sales-home.repository'
import { syncExecutiveJob, syncAdminJob, syncSalesHomeJob } from './sync-executive.job'

;(async () => {
    const userRepository = new UserRepository(dashboardPool)
    const salesHomeRepository = new SalesHomeRepository(dashboardPool)

    await syncExecutiveJob(userRepository)
    await syncAdminJob(userRepository)
    await syncSalesHomeJob(salesHomeRepository)

    await dashboardPool.end()
})()
