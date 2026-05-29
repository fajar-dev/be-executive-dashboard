export interface IRetentionRepository {
    churnRevenue(branchId: string, startDate: string, endDate: string): Promise<number>
    churnRate(branchId: string, startDate: string, endDate: string): Promise<{ rate: number, totalChurn: number, totalActive: number }>
}
