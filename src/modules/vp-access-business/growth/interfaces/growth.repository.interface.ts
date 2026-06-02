export interface IGrowthRepository {
    getNewMrc(branchId: string, startDate: string, endDate: string): Promise<{ mrc: number; mrc_unpaid: number; mrc_paid: number }>
    getRevenue(branchId: string, startDate: string, endDate: string): Promise<number>
    getLeads(startDate: string, endDate: string): Promise<number>
}
