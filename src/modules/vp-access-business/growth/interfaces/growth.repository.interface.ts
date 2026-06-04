export interface IGrowthRepository {
    getNewMrc(branchId: string, startDate: string, endDate: string): Promise<{ mrc: number; mrc_unpaid: number; mrc_paid: number }>
    getRevenue(branchId: string, startDate: string, endDate: string): Promise<number>
    getLeads(startDate: string, endDate: string): Promise<number>
    getOpportunity(startDate: string, endDate: string): Promise<number>
    getWinLose(startDate: string, endDate: string): Promise<{ win: number, lose: number }>
    getActivity(startDate: string, endDate: string): Promise<{ activity: number, amCount: number }>
    getPipelineValue(startDate: string, endDate: string): Promise<number>
    getCycle(startDate: string, endDate: string): Promise<number>
    getPipelineStage(startDate: string, endDate: string): Promise<any>
    getDiscount(branchId: string, startDate: string, endDate: string): Promise<{ serviceGroup: string, discount: number }[]>
    getTarget(year: number): Promise<any>
    getNewCustomer(branchId: string, startDate: string, endDate: string): Promise<number>
    getArpu(branchId: string, startDate: string, endDate: string): Promise<{ serviceGroup: string, jumlahService: number, totalRevenue: number, avgPerService: number }[]>
    getForecastRevenue(startDate: string, endDate: string): Promise<number>
    getForecastMrc(startDate: string, endDate: string): Promise<number>
    getForecastChurnBlocked(branchId: string, startDate: string, endDate: string): Promise<{ csid: number, mrc: number }[]>
    getForecastChurnContract(branchId: string, startDate: string, endDate: string): Promise<{ csid: number, mrc: number }[]>
    getForecastChurnTicket(branchId: string, startDate: string, endDate: string): Promise<{ csid: number, mrc: number }[]>
    getForecastChurnUsage(branchId: string, startDate: string, endDate: string): Promise<{ csid: number, mrc: number }[]>
    getCustomerLoseByServiceGroup(branchId: string, startDate: string, endDate: string): Promise<{ service_group: string, total_churn: number }[]>
}
