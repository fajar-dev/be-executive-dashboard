
import { IGrowthRepository } from '../interfaces/growth.repository.interface'
import { IGrowthService } from '../interfaces/growth.service.interface'
import { DateHelper } from '../../../../core/helpers/date'
import { TrendHelper } from '../../../../core/helpers/trend'

/**
 * Service class for handling growth business logic
 * Responsible for orchestrating data retrieval from repositories and calculating trends/percentages for sales and revenue
 */
export class GrowthService implements IGrowthService {
    constructor(private readonly growthRepository: IGrowthRepository) {}

    /**
     * Calculate New MRC metrics
     * Retrieves the new MRC and its breakdown (paid vs unpaid) for a specific period
     * 
     * @param {string} branchId - The branch identifier (e.g., '020')
     * @param {string} periodType - The period to query ('month', 'quarter', 'year', 'last')
     * @returns {Promise<any>} Object containing MRC value, trend, and detailed breakdown
     */
    async getNewMrc(branchId: string, periodType: string): Promise<{
        value: number
        trend: 'up' | 'down'
        percentage: number
        period: string
        details: { mrc: number; mrc_unpaid: number; mrc_paid: number }
    }> {
        const { startDate, endDate, prevStartDate, prevEndDate, period } = DateHelper.getDatesForPeriod(periodType)

        const [current, prev] = await Promise.all([
            this.growthRepository.getNewMrc(branchId, startDate, endDate),
            this.growthRepository.getNewMrc(branchId, prevStartDate, prevEndDate)
        ])

        const value = current.mrc
        const prevValue = prev.mrc

        const { trend, percentage } = TrendHelper.calculate(value, prevValue)

        return {
            value,
            trend,
            percentage,
            period,
            details: current
        }
    }

    /**
     * Get Total MRC Year-to-Date (YTD)
     * Calculates the total MRC accumulated from the start of the current year up to the current date
     * Compares with the same period in the previous year to determine trend and percentage growth
     * 
     * @param {string} branchId - The branch identifier (e.g., '020')
     * @returns {Promise<any>} Object containing MRC value, trend, and detailed breakdown
     */
    async getTotalMrcYtd(branchId: string): Promise<{
        value: number
        trend: 'up' | 'down'
        percentage: number
        period: string
    }> {
        const now = new Date()
        const currentYear = now.getFullYear()
        const month = String(now.getMonth() + 1).padStart(2, '0')
        const day = String(now.getDate()).padStart(2, '0')
        
        const startDate = `${currentYear}-01-01`
        const endDate = `${currentYear}-${month}-${day}`
        
        const prevStartDate = `${currentYear - 1}-01-01`
        const prevEndDate = `${currentYear - 1}-${month}-${day}`

        const [current, prev] = await Promise.all([
            this.growthRepository.getNewMrc(branchId, startDate, endDate),
            this.growthRepository.getNewMrc(branchId, prevStartDate, prevEndDate)
        ])

        const value = current.mrc
        const prevValue = prev.mrc

        const { trend, percentage } = TrendHelper.calculate(value, prevValue)
        
        const currentPeriod = DateHelper.getCurrentPeriod()
        const formattedDate = `${now.getDate()} ${DateHelper.getMonthName(currentPeriod)} ${currentYear}`
        const period = `Year to Date sampai ${formattedDate}`

        return {
            value,
            trend,
            percentage,
            period
        }
    }

    /**
     * Build month-by-month revenue comparison for the current year vs previous year
     * Iterates from January up to the current month to construct the historical data array
     * 
     * @param {string} branchId - The branch identifier
     * @returns {Promise<any[]>} Array of monthly revenue data points
     */
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

    /**
     * Calculate revenue achievement against the sales target
     * Automatically adjusts the target proportionally if the period is not a full year
     * 
     * @param {string} branchId - The branch identifier
     * @param {string} periodType - The period to query
     * @returns {Promise<any>} Object containing actual revenue, target, and achievement percentage
     */
    async getRevenueAchievement(branchId: string, periodType: string): Promise<{ target: number, revenue: number, percentage: number, trendPercentage: number, trend: 'up' | 'down', period: string }> {
        const { startDate, endDate, prevStartDate, prevEndDate, period } = DateHelper.getDatesForPeriod(periodType)
        
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
        
        const { trend, percentage: trendPercentage } = TrendHelper.calculate(revenue, prevRevenue)

        return {
            target,
            revenue,
            percentage,
            trendPercentage,
            trend,
            period
        }
    }

    /**
     * Calculate lead generation metrics
     * 
     * @param {string} periodType - The period to query
     * @returns {Promise<any>} Object containing lead count, trend, and percentage
     */
    async getLeads(periodType: string): Promise<{
        value: number
        trend: 'up' | 'down'
        percentage: number
        period: string
    }> {
        const { startDate, endDate, prevStartDate, prevEndDate, period } = DateHelper.getDatesForPeriod(periodType)

        const [value, prevValue] = await Promise.all([
            this.growthRepository.getLeads(startDate, endDate),
            this.growthRepository.getLeads(prevStartDate, prevEndDate)
        ])

        const { trend, percentage } = TrendHelper.calculate(value, prevValue)

        return {
            value,
            trend,
            percentage,
            period
        }
    }

    /**
     * Calculate new customer acquisition metrics
     * 
     * @param {string} branchId - The branch identifier
     * @param {string} periodType - The period to query
     * @returns {Promise<any>} Object containing new customer count, trend, and percentage
     */
    async getNewCustomer(branchId: string, periodType: string): Promise<{ value: number, trend: 'up' | 'down', percentage: number, period: string }> {
        const { startDate, endDate, prevStartDate, prevEndDate, period } = DateHelper.getDatesForPeriod(periodType)

        const [value, prevValue] = await Promise.all([
            this.growthRepository.getNewCustomer(branchId, startDate, endDate),
            this.growthRepository.getNewCustomer(branchId, prevStartDate, prevEndDate)
        ])

        const { trend, percentage } = TrendHelper.calculate(value, prevValue)

        return {
            value,
            trend,
            percentage,
            period
        }
    }

    /**
     * Calculate opportunity generation metrics
     * 
     * @param {string} periodType - The period to query
     * @returns {Promise<any>} Object containing opportunity count, trend, and percentage
     */
    async getOpportunity(periodType: string): Promise<{
        value: number
        trend: 'up' | 'down'
        percentage: number
        period: string
    }> {
        const { startDate, endDate, prevStartDate, prevEndDate, period } = DateHelper.getDatesForPeriod(periodType)

        const [value, prevValue] = await Promise.all([
            this.growthRepository.getOpportunity(startDate, endDate),
            this.growthRepository.getOpportunity(prevStartDate, prevEndDate)
        ])

        const { trend, percentage } = TrendHelper.calculate(value, prevValue)

        return {
            value,
            trend,
            percentage,
            period
        }
    }

    /**
     * Calculate sales win rate metrics
     * Includes the overall win rate percentage as well as counts for won and lost opportunities
     * 
     * @param {string} periodType - The period to query
     * @returns {Promise<any>} Object containing win rate, win count, lose count, and their trends
     */
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
        const { startDate, endDate, prevStartDate, prevEndDate, period } = DateHelper.getDatesForPeriod(periodType)

        const [currentStats, prevStats] = await Promise.all([
            this.growthRepository.getWinLose(startDate, endDate),
            this.growthRepository.getWinLose(prevStartDate, prevEndDate)
        ])

        const currentTotal = currentStats.win + currentStats.lose
        const currentRate = currentTotal > 0 ? (currentStats.win / currentTotal) * 100 : 0

        const prevTotal = prevStats.win + prevStats.lose
        const prevRate = prevTotal > 0 ? (prevStats.win / prevTotal) * 100 : 0

        const { trend, percentage } = TrendHelper.calculate(currentRate, prevRate)

        const { trend: winTrend, percentage: winPercentage } = TrendHelper.calculate(currentStats.win, prevStats.win)

        const { trend: loseTrend, percentage: losePercentage } = TrendHelper.calculate(currentStats.lose, prevStats.lose)

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

    /**
     * Calculate average sales activities per account manager
     * 
     * @param {string} periodType - The period to query
     * @returns {Promise<any>} Object containing average activity count, trend, and percentage
     */
    async getActivity(periodType: string): Promise<{
        value: number
        trend: 'up' | 'down'
        percentage: number
        period: string
    }> {
        const { startDate, endDate, prevStartDate, prevEndDate, period } = DateHelper.getDatesForPeriod(periodType)

        const [currentStats, prevStats] = await Promise.all([
            this.growthRepository.getActivity(startDate, endDate),
            this.growthRepository.getActivity(prevStartDate, prevEndDate)
        ])

        const currentValue = currentStats.amCount > 0 ? currentStats.activity / currentStats.amCount : 0
        const prevValue = prevStats.amCount > 0 ? prevStats.activity / prevStats.amCount : 0

        const { trend, percentage } = TrendHelper.calculate(currentValue, prevValue)

        return {
            value: currentValue,
            trend,
            percentage,
            period
        }
    }

    /**
     * Calculate total pipeline value metrics
     * 
     * @param {string} periodType - The period to query
     * @returns {Promise<any>} Object containing pipeline value, trend, and percentage
     */
    async getPipelineValue(periodType: string): Promise<{
        value: number
        trend: 'up' | 'down'
        percentage: number
        period: string
    }> {
        const { startDate, endDate, prevStartDate, prevEndDate, period } = DateHelper.getDatesForPeriod(periodType)

        const [value, prevValue] = await Promise.all([
            this.growthRepository.getPipelineValue(startDate, endDate),
            this.growthRepository.getPipelineValue(prevStartDate, prevEndDate)
        ])

        const { trend, percentage } = TrendHelper.calculate(value, prevValue)

        return {
            value,
            trend,
            percentage,
            period
        }
    }

    /**
     * Retrieve current distribution of pipeline stages
     * 
     * @param {string} periodType - The period to query
     * @returns {Promise<any>} Array or Object containing counts per pipeline stage
     */
    async getPipelineStage(periodType: string): Promise<any> {
        const { startDate, endDate } = DateHelper.getDatesForPeriod(periodType)
        return this.growthRepository.getPipelineStage(startDate, endDate)
    }

    /**
     * Calculate average sales cycle length
     * Returns the average number of days it takes to close a won opportunity
     * 
     * @param {string} periodType - The period to query
     * @returns {Promise<any>} Object containing average cycle days, trend, and percentage
     */
    async getCycle(periodType: string): Promise<{
        value: number
        trend: 'up' | 'down'
        percentage: number
        period: string
    }> {
        const { startDate, endDate, prevStartDate, prevEndDate, period } = DateHelper.getDatesForPeriod(periodType)

        const [value, prevValue] = await Promise.all([
            this.growthRepository.getCycle(startDate, endDate),
            this.growthRepository.getCycle(prevStartDate, prevEndDate)
        ])

        const { trend, percentage } = TrendHelper.calculate(value, prevValue)

        return {
            value,
            trend,
            percentage,
            period
        }
    }

    /**
     * Calculate discount metrics
     * Retrieves the total monetary value of discounts given across all services
     * 
     * @param {string} branchId - The branch identifier
     * @param {string} periodType - The period to query
     * @returns {Promise<any>} Object containing total discount value and detailed breakdown by service group
     */
    async getDiscount(branchId: string, periodType: string): Promise<{
        value: number
        trend: 'up' | 'down'
        percentage: number
        period: string
        details: { serviceGroup: string, discount: number }[]
    }> {
        const { startDate, endDate, prevStartDate, prevEndDate, period } = DateHelper.getDatesForPeriod(periodType)

        const [currentDetails, prevDetails] = await Promise.all([
            this.growthRepository.getDiscount(branchId, startDate, endDate),
            this.growthRepository.getDiscount(branchId, prevStartDate, prevEndDate)
        ])

        const currentValue = currentDetails.reduce((sum, item) => sum + item.discount, 0)
        const prevValue = prevDetails.reduce((sum, item) => sum + item.discount, 0)

        const { trend, percentage } = TrendHelper.calculate(currentValue, prevValue)

        return {
            value: currentValue,
            trend,
            percentage,
            period,
            details: currentDetails
        }
    }

    /**
     * Calculate Average Revenue Per User (ARPU) metrics
     * Retrieves total revenue and divides it by the total number of active services
     * 
     * @param {string} branchId - The branch identifier
     * @param {string} periodType - The period to query
     * @returns {Promise<any>} Object containing overall ARPU and detailed ARPU per service group
     */
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
        const { startDate, endDate, prevStartDate, prevEndDate, period } = DateHelper.getDatesForPeriod(periodType)
        
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

        const { trend, percentage } = TrendHelper.calculate(currentValue, prevValue)

        return {
            value: currentValue,
            trend,
            percentage,
            period,
            details: currentDetails
        }
    }

    /**
     * Calculate forecast revenue from opportunities
     * 
     * @param {string} periodType - The period to query
     * @returns {Promise<any>} Object containing forecast revenue, trend, and percentage
     */
    async getForecastRevenue(periodType: string): Promise<{
        value: number
        trend: 'up' | 'down'
        percentage: number
        period: string
    }> {
        const { startDate, endDate, prevStartDate, prevEndDate, period } = DateHelper.getDatesForPeriod(periodType)

        const [value, prevValue] = await Promise.all([
            this.growthRepository.getForecastRevenue(startDate, endDate),
            this.growthRepository.getForecastRevenue(prevStartDate, prevEndDate)
        ])

        const { trend, percentage } = TrendHelper.calculate(value, prevValue)

        return {
            value,
            trend,
            percentage,
            period
        }
    }

    /**
     * Calculate forecast MRC from opportunities
     * 
     * @param {string} periodType - The period to query
     * @returns {Promise<any>} Object containing forecast MRC, trend, and percentage
     */
    async getForecastMrc(periodType: string): Promise<{
        value: number
        trend: 'up' | 'down'
        percentage: number
        period: string
    }> {
        const { startDate, endDate, prevStartDate, prevEndDate, period } = DateHelper.getDatesForPeriod(periodType)

        const [value, prevValue] = await Promise.all([
            this.growthRepository.getForecastMrc(startDate, endDate),
            this.growthRepository.getForecastMrc(prevStartDate, prevEndDate)
        ])

        const { trend, percentage } = TrendHelper.calculate(value, prevValue)

        return {
            value,
            trend,
            percentage,
            period
        }
    }

    /**
     * Calculate forecast churn based on at-risk metrics
     * Aggregates MRC from customers who are blocked, contracts ending, have high tickets, or low usage
     * 
     * @param {string} branchId - The branch identifier
     * @param {string} periodType - The period to query
     * @returns {Promise<any>} Object containing forecast churn total, details, and customer lose
     */
    async getForecastChurn(branchId: string, periodType: string): Promise<{
        forecastMrc: { value: number; trend: 'up' | 'down'; percentage: number; period: string }
        details: { blocked: number; contractEnd: number; ticketIssues: number; lowUsage: number }
        customerLose: { service_group: string; total_churn: number }[]
    }> {
        const { startDate, endDate, prevStartDate, prevEndDate, period } = DateHelper.getDatesForPeriod(periodType)

        const [
            currentBlocked, currentContract, currentTicket, currentUsage, currentCustomerLose,
            prevBlocked, prevContract, prevTicket, prevUsage
        ] = await Promise.all([
            this.growthRepository.getForecastChurnBlocked(branchId, startDate, endDate),
            this.growthRepository.getForecastChurnContract(branchId, startDate, endDate),
            this.growthRepository.getForecastChurnTicket(branchId, startDate, endDate),
            this.growthRepository.getForecastChurnUsage(branchId, startDate, endDate),
            this.growthRepository.getCustomerLoseByServiceGroup(branchId, startDate, endDate),

            this.growthRepository.getForecastChurnBlocked(branchId, prevStartDate, prevEndDate),
            this.growthRepository.getForecastChurnContract(branchId, prevStartDate, prevEndDate),
            this.growthRepository.getForecastChurnTicket(branchId, prevStartDate, prevEndDate),
            this.growthRepository.getForecastChurnUsage(branchId, prevStartDate, prevEndDate)
        ])

        const calculateUniqueTotal = (lists: {csid: number, mrc: number}[][]) => {
            const uniqueMap = new Map<number, number>()
            for (const list of lists) {
                for (const item of list) {
                    uniqueMap.set(item.csid, item.mrc)
                }
            }
            let total = 0
            uniqueMap.forEach((mrc) => {
                total += mrc
            })
            return total
        }

        const sumList = (list: {csid: number, mrc: number}[]) => list.reduce((sum, item) => sum + item.mrc, 0)

        const totalCurrent = calculateUniqueTotal([currentBlocked, currentContract, currentTicket, currentUsage])
        const totalPrev = calculateUniqueTotal([prevBlocked, prevContract, prevTicket, prevUsage])

        const { trend, percentage } = TrendHelper.calculate(totalCurrent, totalPrev)

        return {
            forecastMrc: {
                value: totalCurrent,
                trend,
                percentage,
                period
            },
            details: {
                blocked: sumList(currentBlocked),
                contractEnd: sumList(currentContract),
                ticketIssues: sumList(currentTicket),
                lowUsage: sumList(currentUsage)
            },
            customerLose: currentCustomerLose.map(item => ({
                service_group: item.service_group || 'Unknown',
                total_churn: Number(item.total_churn)
            }))
        }
    }

    /**
     * Calculate forecast net MRC
     * Formula: Forecast New MRC - Forecast Churn MRC
     * 
     * @param {string} branchId - The branch identifier
     * @param {string} periodType - The period to query
     * @returns {Promise<any>} Object containing forecast net MRC, trend, and percentage
     */
    async getForecastNetMrc(branchId: string, periodType: string): Promise<{
        value: number
        trend: 'up' | 'down'
        percentage: number
        period: string
    }> {
        const { startDate, endDate, prevStartDate, prevEndDate, period } = DateHelper.getDatesForPeriod(periodType)

        const [
            currentNewMrc, prevNewMrc,
            currentBlocked, currentContract, currentTicket, currentUsage,
            prevBlocked, prevContract, prevTicket, prevUsage
        ] = await Promise.all([
            // Forecast New MRC
            this.growthRepository.getForecastMrc(startDate, endDate),
            this.growthRepository.getForecastMrc(prevStartDate, prevEndDate),

            // Forecast Churn MRC current
            this.growthRepository.getForecastChurnBlocked(branchId, startDate, endDate),
            this.growthRepository.getForecastChurnContract(branchId, startDate, endDate),
            this.growthRepository.getForecastChurnTicket(branchId, startDate, endDate),
            this.growthRepository.getForecastChurnUsage(branchId, startDate, endDate),

            // Forecast Churn MRC prev
            this.growthRepository.getForecastChurnBlocked(branchId, prevStartDate, prevEndDate),
            this.growthRepository.getForecastChurnContract(branchId, prevStartDate, prevEndDate),
            this.growthRepository.getForecastChurnTicket(branchId, prevStartDate, prevEndDate),
            this.growthRepository.getForecastChurnUsage(branchId, prevStartDate, prevEndDate)
        ])

        const calculateUniqueTotal = (lists: {csid: number, mrc: number}[][]) => {
            const uniqueMap = new Map<number, number>()
            for (const list of lists) {
                for (const item of list) {
                    uniqueMap.set(item.csid, item.mrc)
                }
            }
            let total = 0
            uniqueMap.forEach((mrc) => {
                total += mrc
            })
            return total
        }

        const currentChurnMrc = calculateUniqueTotal([currentBlocked, currentContract, currentTicket, currentUsage])
        const prevChurnMrc = calculateUniqueTotal([prevBlocked, prevContract, prevTicket, prevUsage])

        const currentNetMrc = currentNewMrc - currentChurnMrc
        const prevNetMrc = prevNewMrc - prevChurnMrc

        const { trend, percentage } = TrendHelper.calculate(currentNetMrc, prevNetMrc)

        return {
            value: currentNetMrc,
            trend,
            percentage,
            period
        }
    }
}
