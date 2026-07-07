export interface ITotalServiceService {
    getSummary(branchId: string, year: number, pov: string): Promise<{ period: string; branch: string; service_group?: string; service?: string; manager_sales_name?: string; sales_name?: string; total_active: number; total_churn: number }[]>
    getDetail(branchId: string, year: number, period?: string): Promise<{ service_id: string; service: string; customer_name: string; address: string; service_group: string; branch: string; sales_name: string; manager_sales_name: string; status: string; active_at: string | null; churn_date: string | null; tenure_days: number | null }[]>
}
