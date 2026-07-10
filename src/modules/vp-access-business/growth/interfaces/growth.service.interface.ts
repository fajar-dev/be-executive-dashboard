export interface IGrowthService {
    getNewMrc(branchId: string, periodType: string): Promise<{
        value: number
        trend: 'up' | 'down'
        percentage: number
        period: string
        details: { mrc: number; mrc_unpaid: number; mrc_paid: number }
    }>
    getTotalMrcYtd(branchId: string): Promise<{
        value: number
        trend: 'up' | 'down'
        percentage: number
        period: string
    }>
    getRevenue(branchId: string): Promise<any[]>
    getRevenueAchievement(branchId: string, periodType: string): Promise<{
        target: number
        revenue: number
        percentage: number
        trendPercentage: number
        trend: 'up' | 'down'
        period: string
    }>
    getLeads(periodType: string): Promise<{
        value: number
        trend: 'up' | 'down'
        percentage: number
        period: string
    }>
    getNewCustomer(branchId: string, periodType: string): Promise<{
        value: number
        trend: 'up' | 'down'
        percentage: number
        period: string
    }>
    getOpportunity(periodType: string): Promise<{
        value: number
        trend: 'up' | 'down'
        percentage: number
        period: string
    }>
    getWinRate(periodType: string): Promise<{
        value: number
        trend: 'up' | 'down'
        percentage: number
        period: string
        details: {
            win: { value: number; trend: 'up' | 'down'; percentage: number }
            lose: { value: number; trend: 'up' | 'down'; percentage: number }
        }
    }>
    getActivity(periodType: string): Promise<{
        value: number
        trend: 'up' | 'down'
        percentage: number
        period: string
    }>
    getPipelineValue(periodType: string): Promise<{
        value: number
        trend: 'up' | 'down'
        percentage: number
        period: string
    }>
    getCycle(periodType: string): Promise<{
        value: number
        trend: 'up' | 'down'
        percentage: number
        period: string
    }>
    getPipelineStage(periodType: string): Promise<any>
    getDiscount(branchId: string, periodType: string): Promise<{
        value: number
        trend: 'up' | 'down'
        percentage: number
        period: string
        details: { serviceGroup: string, discount: number }[]
    }>
    getArpu(branchId: string, periodType: string): Promise<{
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
    }>
    getForecastRevenue(periodType: string): Promise<{
        value: number
        trend: 'up' | 'down'
        percentage: number
        period: string
    }>
    getForecastMrc(periodType: string): Promise<{
        value: number
        trend: 'up' | 'down'
        percentage: number
        period: string
    }>
    getAmSnapshot(periodType: string): Promise<{
        value: number
        trend: 'up' | 'down'
        percentage: number
        period: string
    }>
}
