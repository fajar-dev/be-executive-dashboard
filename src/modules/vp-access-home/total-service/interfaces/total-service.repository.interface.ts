export interface ITotalServiceRepository {
    getOperationalSummary(branchId: string, year: number): Promise<{ Period: string; branch: string; service_group: string; service: string; total_active: number; total_churn: number }[]>
    getSalesSummary(branchId: string, year: number): Promise<{ Period: string; branch: string; manager_sales_name: string; sales_name: string; total_active: number; total_churn: number }[]>
    getDetail(branchId: string, year: number, period?: string): Promise<{ service_id: string; service: string; customer_name: string; address: string; service_group: string; branch: string; sales_name: string; manager_sales_name: string; status: string; active_at: string | null; churn_date: string | null; tenure_days: number | null }[]>
}
