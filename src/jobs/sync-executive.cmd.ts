import { dashboardPool } from '../config/dashboard.db'
import { UserRepository } from '../modules/user/user.repository'
import { syncExecutiveJob } from './sync-executive.job'
import { syncAdminJob } from './sync-executive.job'

;(async () => {
    const userRepository = new UserRepository(dashboardPool)
    await syncExecutiveJob(userRepository)
    await syncAdminJob(userRepository)
    await dashboardPool.end()
})()
