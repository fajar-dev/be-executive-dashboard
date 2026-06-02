export interface IGrowthService {
    getNewMrc(branchId: string, periodType: string): Promise<{
        value: number
        trend: 'up' | 'down'
        percentage: number
        period: string
        details: { mrc: number; mrc_unpaid: number; mrc_paid: number }
    }>
    getRevenue(branchId: string): Promise<any[]>
    getLeads(periodType: string): Promise<{
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
}
