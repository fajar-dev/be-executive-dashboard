export interface IRetentionService {
    getChurnMetrics(branchId: string, periodType: string): Promise<{
        trend: 'up' | 'down'
        customers: number
        customersPrevious: number
        customersGrowth: number
        churnRate: number
        revenue: number
        period: string
    }>
}
