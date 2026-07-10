export interface INewGrowthRepository {
    getSalesSummary(branchId: string, year: number): Promise<{ period: string; branch: string; manager_sales_name: string; sales_name: string; total_new: number; total_homeconnect: number; total_block: number; total_homepaid: number }[]>
    getOperationalSummary(branchId: string, year: number): Promise<{ period: string; branch: string; service_group: string; service: string; total_new: number; total_homeconnect: number; total_block: number; total_homepaid: number }[]>
    getDetail(branchId: string, year: number, period?: string): Promise<{ service_id: string; service: string; customer_name: string; address: string; service_group: string; branch: string; sales_name: string; manager_sales_name: string; status: string; activated_at: string | null }[]>
}
