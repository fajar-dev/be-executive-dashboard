
import { IGrowthRepository } from '../interfaces/growth.repository.interface'
import { IGrowthService } from '../interfaces/growth.service.interface'
import { DateHelper } from '../../../../core/helpers/date'

export class GrowthService implements IGrowthService {
    constructor(private readonly growthRepository: IGrowthRepository) {}

    private getDatesForPeriod(periodType: string) {
        let startDate: string
        let endDate: string
        let prevStartDate: string
        let prevEndDate: string
        let period: string

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
            
            period = 'Bulan Ini'
        }

        return { startDate, endDate, prevStartDate, prevEndDate, period }
    }

    async getNewMrc(branchId: string, periodType: string): Promise<{
        value: number
        trend: 'up' | 'down'
        percentage: number
        period: string
        details: { mrc: number; mrc_unpaid: number; mrc_paid: number }
    }> {
        const { startDate, endDate, prevStartDate, prevEndDate, period } = this.getDatesForPeriod(periodType)

        const [current, prev] = await Promise.all([
            this.growthRepository.getNewMrc(branchId, startDate, endDate),
            this.growthRepository.getNewMrc(branchId, prevStartDate, prevEndDate)
        ])

        const value = current.mrc
        const prevValue = prev.mrc

        let percentage = 0
        if (prevValue > 0) {
            percentage = ((value - prevValue) / prevValue) * 100
        } else if (value > 0) {
            percentage = 100
        }

        const trend = value >= prevValue ? 'up' : 'down'

        return {
            value,
            trend,
            percentage,
            period,
            details: current
        }
    }

    async getRevenue(branchId: string): Promise<any[]> {
        const currentPeriod = DateHelper.getCurrentPeriod()
        const currentYear = Number(currentPeriod.substring(0, 4))
        const currentMonth = Number(currentPeriod.substring(4, 6))

        const promises: Promise<number>[] = []
        
        for (let month = 1; month <= currentMonth; month++) {
            // Current Year
            const startDate = `${currentYear}-${String(month).padStart(2, '0')}-01`
            const endDate = `${currentYear}-${String(month).padStart(2, '0')}-${new Date(currentYear, month, 0).getDate()}`
            promises.push(this.growthRepository.getRevenue(branchId, startDate, endDate))

            // Previous Year
            const prevYear = currentYear - 1
            const prevStartDate = `${prevYear}-${String(month).padStart(2, '0')}-01`
            const prevEndDate = `${prevYear}-${String(month).padStart(2, '0')}-${new Date(prevYear, month, 0).getDate()}`
            promises.push(this.growthRepository.getRevenue(branchId, prevStartDate, prevEndDate))
        }

        const results = await Promise.all(promises)

        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        const data = []

        for (let i = 0; i < currentMonth; i++) {
            const currentYearData = results[i * 2]
            const prevYearData = results[i * 2 + 1]

            data.push({
                period: monthNames[i],
                month: {
                    [currentYear]: {
                        revenue: currentYearData
                    },
                    [currentYear - 1]: {
                        revenue: prevYearData
                    }
                }
            })
        }

        return data
    }

    async getRevenueAchievement(branchId: string, periodType: string): Promise<{ target: number, revenue: number, percentage: number, trendPercentage: number, trend: 'up' | 'down', period: string }> {
        const { startDate, endDate, prevStartDate, prevEndDate, period } = this.getDatesForPeriod(periodType)
        
        const start = new Date(startDate)
        const end = new Date(endDate)
        const year = start.getFullYear()

        const targetData = await this.growthRepository.getTarget(year)
        
        let target = 0
        if (targetData) {
            if (periodType === 'year') {
                target = targetData.yearly_target
            } else {
                const monthKeys = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
                const startMonth = start.getMonth()
                const endMonth = end.getMonth()
                for (let i = startMonth; i <= endMonth; i++) {
                    target += Number(targetData[monthKeys[i]] || 0)
                }
            }
        }

        const [revenue, prevRevenue] = await Promise.all([
            this.growthRepository.getRevenue(branchId, startDate, endDate),
            this.growthRepository.getRevenue(branchId, prevStartDate, prevEndDate)
        ])

        const percentage = target > 0 ? (revenue / target) * 100 : 0
        
        let trendPercentage = 0
        if (prevRevenue > 0) {
            trendPercentage = ((revenue - prevRevenue) / prevRevenue) * 100
        } else if (revenue > 0) {
            trendPercentage = 100
        }
        
        const trend = revenue >= prevRevenue ? 'up' : 'down'

        return {
            target,
            revenue,
            percentage,
            trendPercentage,
            trend,
            period
        }
    }

    async getLeads(periodType: string): Promise<{
        value: number
        trend: 'up' | 'down'
        percentage: number
        period: string
    }> {
        const { startDate, endDate, prevStartDate, prevEndDate, period } = this.getDatesForPeriod(periodType)

        const [value, prevValue] = await Promise.all([
            this.growthRepository.getLeads(startDate, endDate),
            this.growthRepository.getLeads(prevStartDate, prevEndDate)
        ])

        let percentage = 0
        if (prevValue > 0) {
            percentage = ((value - prevValue) / prevValue) * 100
        } else if (value > 0) {
            percentage = 100
        }

        const trend = value >= prevValue ? 'up' : 'down'

        return {
            value,
            trend,
            percentage,
            period
        }
    }

    async getNewCustomer(branchId: string, periodType: string): Promise<{ value: number, trend: 'up' | 'down', percentage: number, period: string }> {
        const { startDate, endDate, prevStartDate, prevEndDate, period } = this.getDatesForPeriod(periodType)

        const [value, prevValue] = await Promise.all([
            this.growthRepository.getNewCustomer(branchId, startDate, endDate),
            this.growthRepository.getNewCustomer(branchId, prevStartDate, prevEndDate)
        ])

        let percentage = 0
        if (prevValue > 0) {
            percentage = ((value - prevValue) / prevValue) * 100
        } else if (value > 0) {
            percentage = 100
        }

        const trend = value >= prevValue ? 'up' : 'down'

        return {
            value,
            trend,
            percentage,
            period
        }
    }

    async getOpportunity(periodType: string): Promise<{
        value: number
        trend: 'up' | 'down'
        percentage: number
        period: string
    }> {
        const { startDate, endDate, prevStartDate, prevEndDate, period } = this.getDatesForPeriod(periodType)

        const [value, prevValue] = await Promise.all([
            this.growthRepository.getOpportunity(startDate, endDate),
            this.growthRepository.getOpportunity(prevStartDate, prevEndDate)
        ])

        let percentage = 0
        if (prevValue > 0) {
            percentage = ((value - prevValue) / prevValue) * 100
        } else if (value > 0) {
            percentage = 100
        }

        const trend = value >= prevValue ? 'up' : 'down'

        return {
            value,
            trend,
            percentage,
            period
        }
    }

    async getWinRate(periodType: string): Promise<{
        value: number
        trend: 'up' | 'down'
        percentage: number
        period: string
        details: {
            win: { value: number; trend: 'up' | 'down'; percentage: number }
            lose: { value: number; trend: 'up' | 'down'; percentage: number }
        }
    }> {
        const { startDate, endDate, prevStartDate, prevEndDate, period } = this.getDatesForPeriod(periodType)

        const [currentStats, prevStats] = await Promise.all([
            this.growthRepository.getWinLose(startDate, endDate),
            this.growthRepository.getWinLose(prevStartDate, prevEndDate)
        ])

        const currentTotal = currentStats.win + currentStats.lose
        const currentRate = currentTotal > 0 ? (currentStats.win / currentTotal) * 100 : 0

        const prevTotal = prevStats.win + prevStats.lose
        const prevRate = prevTotal > 0 ? (prevStats.win / prevTotal) * 100 : 0

        let percentage = 0
        if (prevRate > 0) {
            percentage = ((currentRate - prevRate) / prevRate) * 100
        } else if (currentRate > 0) {
            percentage = 100
        }

        const trend = currentRate >= prevRate ? 'up' : 'down'

        // Win stats
        let winPercentage = 0
        if (prevStats.win > 0) {
            winPercentage = ((currentStats.win - prevStats.win) / prevStats.win) * 100
        } else if (currentStats.win > 0) {
            winPercentage = 100
        }
        const winTrend = currentStats.win >= prevStats.win ? 'up' : 'down'

        // Lose stats
        let losePercentage = 0
        if (prevStats.lose > 0) {
            losePercentage = ((currentStats.lose - prevStats.lose) / prevStats.lose) * 100
        } else if (currentStats.lose > 0) {
            losePercentage = 100
        }
        const loseTrend = currentStats.lose >= prevStats.lose ? 'up' : 'down'

        return {
            value: currentRate,
            trend,
            percentage,
            period,
            details: {
                win: {
                    value: currentStats.win,
                    trend: winTrend,
                    percentage: winPercentage
                },
                lose: {
                    value: currentStats.lose,
                    trend: loseTrend,
                    percentage: losePercentage
                }
            }
        }
    }

    async getActivity(periodType: string): Promise<{
        value: number
        trend: 'up' | 'down'
        percentage: number
        period: string
    }> {
        const { startDate, endDate, prevStartDate, prevEndDate, period } = this.getDatesForPeriod(periodType)

        const [currentStats, prevStats] = await Promise.all([
            this.growthRepository.getActivity(startDate, endDate),
            this.growthRepository.getActivity(prevStartDate, prevEndDate)
        ])

        const currentValue = currentStats.amCount > 0 ? currentStats.activity / currentStats.amCount : 0
        const prevValue = prevStats.amCount > 0 ? prevStats.activity / prevStats.amCount : 0

        let percentage = 0
        if (prevValue > 0) {
            percentage = ((currentValue - prevValue) / prevValue) * 100
        } else if (currentValue > 0) {
            percentage = 100
        }

        const trend = currentValue >= prevValue ? 'up' : 'down'

        return {
            value: currentValue,
            trend,
            percentage,
            period
        }
    }

    async getPipelineValue(periodType: string): Promise<{
        value: number
        trend: 'up' | 'down'
        percentage: number
        period: string
    }> {
        const { startDate, endDate, prevStartDate, prevEndDate, period } = this.getDatesForPeriod(periodType)

        const [value, prevValue] = await Promise.all([
            this.growthRepository.getPipelineValue(startDate, endDate),
            this.growthRepository.getPipelineValue(prevStartDate, prevEndDate)
        ])

        let percentage = 0
        if (prevValue > 0) {
            percentage = ((value - prevValue) / prevValue) * 100
        } else if (value > 0) {
            percentage = 100
        }

        const trend = value >= prevValue ? 'up' : 'down'

        return {
            value,
            trend,
            percentage,
            period
        }
    }

    async getPipelineStage(periodType: string): Promise<any> {
        const { startDate, endDate } = this.getDatesForPeriod(periodType)
        return this.growthRepository.getPipelineStage(startDate, endDate)
    }

    async getCycle(periodType: string): Promise<{
        value: number
        trend: 'up' | 'down'
        percentage: number
        period: string
    }> {
        const { startDate, endDate, prevStartDate, prevEndDate, period } = this.getDatesForPeriod(periodType)

        const [value, prevValue] = await Promise.all([
            this.growthRepository.getCycle(startDate, endDate),
            this.growthRepository.getCycle(prevStartDate, prevEndDate)
        ])

        let percentage = 0
        if (prevValue > 0) {
            percentage = ((value - prevValue) / prevValue) * 100
        } else if (value > 0) {
            percentage = 100
        }

        const trend = value >= prevValue ? 'up' : 'down'

        return {
            value,
            trend,
            percentage,
            period
        }
    }

    async getDiscount(branchId: string, periodType: string): Promise<{
        value: number
        trend: 'up' | 'down'
        percentage: number
        period: string
        details: { serviceGroup: string, discount: number }[]
    }> {
        const { startDate, endDate, prevStartDate, prevEndDate, period } = this.getDatesForPeriod(periodType)

        const [currentDetails, prevDetails] = await Promise.all([
            this.growthRepository.getDiscount(branchId, startDate, endDate),
            this.growthRepository.getDiscount(branchId, prevStartDate, prevEndDate)
        ])

        const currentValue = currentDetails.reduce((sum, item) => sum + item.discount, 0)
        const prevValue = prevDetails.reduce((sum, item) => sum + item.discount, 0)

        let percentage = 0
        if (prevValue > 0) {
            percentage = ((currentValue - prevValue) / prevValue) * 100
        } else if (currentValue > 0) {
            percentage = 100
        }

        const trend = currentValue >= prevValue ? 'up' : 'down'

        return {
            value: currentValue,
            trend,
            percentage,
            period,
            details: currentDetails
        }
    }

    async getArpu(branchId: string, periodType: string): Promise<{
        value: number
        trend: 'up' | 'down'
        percentage: number
        period: string
        details: {
            serviceGroup: string
            jumlahService: number
            totalRevenue: number
            avgPerService: number
        }[]
    }> {
        const { startDate, endDate, prevStartDate, prevEndDate, period } = this.getDatesForPeriod(periodType)
        
        const [currentDetails, prevDetails] = await Promise.all([
            this.growthRepository.getArpu(branchId, startDate, endDate),
            this.growthRepository.getArpu(branchId, prevStartDate, prevEndDate)
        ])

        const currentTotalRevenue = currentDetails.reduce((sum, item) => sum + item.totalRevenue, 0)
        const currentTotalService = currentDetails.reduce((sum, item) => sum + item.jumlahService, 0)
        const currentValue = currentTotalService > 0 ? currentTotalRevenue / currentTotalService : 0

        const prevTotalRevenue = prevDetails.reduce((sum, item) => sum + item.totalRevenue, 0)
        const prevTotalService = prevDetails.reduce((sum, item) => sum + item.jumlahService, 0)
        const prevValue = prevTotalService > 0 ? prevTotalRevenue / prevTotalService : 0

        let percentage = 0
        if (prevValue > 0) {
            percentage = ((currentValue - prevValue) / prevValue) * 100
        } else if (currentValue > 0) {
            percentage = 100
        }

        const trend = currentValue >= prevValue ? 'up' : 'down'

        return {
            value: currentValue,
            trend,
            percentage,
            period,
            details: currentDetails
        }
    }
}
