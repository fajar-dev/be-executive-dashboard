import { IRetentionRepository } from '../interfaces/retention.repository.interface'
import { IRetentionService } from '../interfaces/retention.service.interface'
import { DateHelper } from '../../../../core/helpers/date'

export class RetentionService implements IRetentionService {
    constructor(private readonly retentionRepository: IRetentionRepository) {}

    private getDatesForPeriod(periodType: string) {
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

        return { startDate, endDate, prevStartDate, prevEndDate, period }
    }

    async getChurnRevenue(branchId: string, periodType: string): Promise<{
        trend: 'up' | 'down'
        percentage: number
        revenue: number
        period: string
    }> {
        const { startDate, endDate, prevStartDate, prevEndDate, period } = this.getDatesForPeriod(periodType)

        const [revenue, prevRevenue] = await Promise.all([
            this.retentionRepository.churnRevenue(branchId, startDate, endDate),
            this.retentionRepository.churnRevenue(branchId, prevStartDate, prevEndDate)
        ])

        const absRevenue = Math.abs(revenue)
        const absPrevRevenue = Math.abs(prevRevenue)

        let percentage = 0
        if (absPrevRevenue > 0) {
            percentage = ((absRevenue - absPrevRevenue) / absPrevRevenue) * 100
        } else if (absRevenue > 0) {
            percentage = 100
        }

        const trend = absRevenue >= absPrevRevenue ? 'up' : 'down'

        return {
            trend,
            percentage,
            revenue,
            period
        }
    }

    async getCustomerLose(branchId: string, periodType: string): Promise<{
        total: { value: number; trend: 'up' | 'down'; percentage: number; period: string }
        detail: { service_group: string; value: number; trend: 'up' | 'down'; percentage: number }[]
    }> {
        const { startDate, endDate, prevStartDate, prevEndDate, period } = this.getDatesForPeriod(periodType)

        const [currentList, prevList] = await Promise.all([
            this.retentionRepository.customerLose(branchId, startDate, endDate),
            this.retentionRepository.customerLose(branchId, prevStartDate, prevEndDate)
        ])

        const map = new Map<string, { current: number, prev: number }>()
        
        for (const item of currentList) {
            const group = item.service_group || 'Unknown'
            if (!map.has(group)) map.set(group, { current: 0, prev: 0 })
            map.get(group)!.current += Number(item.total_churn)
        }
        
        for (const item of prevList) {
            const group = item.service_group || 'Unknown'
            if (!map.has(group)) map.set(group, { current: 0, prev: 0 })
            map.get(group)!.prev += Number(item.total_churn)
        }

        let totalCurrent = 0
        let totalPrev = 0
        const detail: { service_group: string; value: number; trend: 'up' | 'down'; percentage: number }[] = []

        map.forEach((data, group) => {
            totalCurrent += data.current
            totalPrev += data.prev

            let percentage = 0
            if (data.prev > 0) {
                percentage = ((data.current - data.prev) / data.prev) * 100
            } else if (data.current > 0) {
                percentage = 100
            }
            
            detail.push({
                service_group: group,
                value: data.current,
                trend: data.current >= data.prev ? 'up' : 'down',
                percentage
            })
        })

        let totalPercentage = 0
        if (totalPrev > 0) {
            totalPercentage = ((totalCurrent - totalPrev) / totalPrev) * 100
        } else if (totalCurrent > 0) {
            totalPercentage = 100
        }

        return {
            total: {
                value: totalCurrent,
                trend: totalCurrent >= totalPrev ? 'up' : 'down',
                percentage: totalPercentage,
                period
            },
            detail: detail.sort((a, b) => b.value - a.value)
        }
    }
}
