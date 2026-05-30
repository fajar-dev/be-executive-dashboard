import { DateHelper } from './src/core/helpers/date'
import { nisPool } from './src/config/nis.db'
import { RetentionRepository } from './src/modules/vp-access-business/retention/repositories/retention.repository'

async function run() {
    const repo = new RetentionRepository(nisPool)
    const currentPeriod = DateHelper.getCurrentPeriod()
    const { startDate, endDate } = DateHelper.getPeriodInfo()
    const prevStartDate = DateHelper.getPreviousMonthStart()
    const prevEndDate = DateHelper.getPreviousMonthEnd()
    
    console.log('Current:', startDate, 'to', endDate)
    console.log('Prev:', prevStartDate, 'to', prevEndDate)

    const revenue = await repo.churnRevenue('020', startDate, endDate)
    const prevRevenue = await repo.churnRevenue('020', prevStartDate, prevEndDate)

    console.log('Revenue:', revenue)
    console.log('Prev Revenue:', prevRevenue)
    process.exit(0)
}
run()
