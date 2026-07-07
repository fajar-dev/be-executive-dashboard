export interface IRevenueRepository {
    getRevenueSummary(branchId: string, year: number): Promise<{ period: string; branch: string; total: number }[]>
    getHomepaidSummary(branchId: string, year: number): Promise<{ period: string; branch: string; total: number }[]>
    getDetail(branchId: string, year: number, period?: string): Promise<{ service_id: string; service: string; customer_name: string; address: string; billing_date: string; service_group: string; branch: string; sales_name: string; manager_sales_name: string; inv_desc: string; receipt_id: string | null; total: number }[]>
    getBillingSummary(branchId: string, year: number): Promise<{ total_paid: number; total_all: number }>
    getTotal(branchId: string, year: number): Promise<number>
}
