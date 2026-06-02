export interface IGrowthRepository {
    getNewMrc(branchId: string, startDate: string, endDate: string): Promise<{ mrc: number; mrc_unpaid: number; mrc_paid: number }>
    getRevenue(branchId: string, startDate: string, endDate: string): Promise<number>
    getLeads(startDate: string, endDate: string): Promise<number>
    getOpportunity(startDate: string, endDate: string): Promise<number>
    getWinLose(startDate: string, endDate: string): Promise<{ win: number, lose: number }>
    getActivity(startDate: string, endDate: string): Promise<{ activity: number, amCount: number }>
    getPipeline(startDate: string, endDate: string): Promise<number>
    getCycle(startDate: string, endDate: string): Promise<number>
    getDiscount(branchId: string, startDate: string, endDate: string): Promise<{ serviceGroup: string, discount: number }[]>
}
