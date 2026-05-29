import { IRetentionRepository } from '../interfaces/retention.repository.interface'
import { IRetentionService } from '../interfaces/retention.service.interface'
import { DateHelper } from '../../../../core/helpers/date'

export class RetentionService implements IRetentionService {
    constructor(private readonly retentionRepository: IRetentionRepository) {}

    async getChurnMetrics(branchId: string, periodType: string): Promise<{
        trend: 'up' | 'down'
        customers: number
        customersPrevious: number
        customersGrowth: number
        churnRate: number
        revenue: number
        period: string
    }> {
        let startDate = ''
        let endDate = ''
        let prevStartDate = ''
        let prevEndDate = ''
        let period = ''

        const currentPeriod = DateHelper.getCurrentPeriod()
        const currentYear = Number(currentPeriod.substring(0, 4))
        const currentMonth = Number(currentPeriod.substring(4, 6))

        if (periodType === 'last') {
            startDate = DateHelper.getPreviousMonthStart()
            endDate = DateHelper.getPreviousMonthEnd()

            const prevPeriodStr = DateHelper.getPreviousPeriod()
            prevStartDate = DateHelper.getPreviousMonthStart(prevPeriodStr)
            prevEndDate = DateHelper.getPreviousMonthEnd(prevPeriodStr)
            
            period = DateHelper.getMonthName(DateHelper.getPreviousPeriod())
        } else if (periodType === 'year') {
            const periodInfo = DateHelper.getActiveYear()
            startDate = periodInfo.startDate
            endDate = periodInfo.endDate

            const prevInfo = DateHelper.getPreviousYearDates()
            prevStartDate = prevInfo.startDate
            prevEndDate = prevInfo.endDate
            
            period = String(currentYear)
        } else if (periodType === 'quarter') {
            const periodInfo = DateHelper.getActiveQuarter()
            startDate = periodInfo.startDate
            endDate = periodInfo.endDate

            const prevInfo = DateHelper.getPreviousQuarterDates()
            prevStartDate = prevInfo.startDate
            prevEndDate = prevInfo.endDate
            
            period = `Q${Math.ceil(currentMonth / 3)}`
        } else {
            // Default to month
            const periodInfo = DateHelper.getPeriodInfo()
            startDate = periodInfo.startDate
            endDate = periodInfo.endDate

            prevStartDate = DateHelper.getPreviousMonthStart()
            prevEndDate = DateHelper.getPreviousMonthEnd()
            
            period = DateHelper.getMonthName(currentPeriod)
        }

        const [currentRateObj, revenue, prevRateObj] = await Promise.all([
            this.retentionRepository.churnRate(branchId, startDate, endDate),
            this.retentionRepository.churnRevenue(branchId, startDate, endDate),
            this.retentionRepository.churnRate(branchId, prevStartDate, prevEndDate)
        ])

        const customers = currentRateObj.totalChurn
        const customersPrevious = prevRateObj.totalChurn
        const customersGrowth = customers - customersPrevious
        const trend = currentRateObj.rate >= prevRateObj.rate ? 'up' : 'down'

        return {
            trend,
            customers,
            customersPrevious,
            customersGrowth,
            churnRate: currentRateObj.rate,
            revenue,
            period
        }
    }
}
