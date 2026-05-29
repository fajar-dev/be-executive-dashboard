export interface IGeneralService {
    getNocStatus(): Promise<number>
    getRevenue(period: string): Promise<{ currentMonth: number; previousMonth: number }>
    getIspStats(period: string): Promise<{ active: number; added: number; addedLastMonth: number; churn: number }>
    getNusaWorkStats(period: string): Promise<{ active: number; growth: number; companies: number; total: number }>
    getHomeConnectStats(period: string): Promise<any>
    getRevenuePeriod(startPeriod: string, endPeriod: string): Promise<Array<{ period: string; name: string; revenue: number }>>
    getRevenueMonthly(period: string): Promise<Array<{ period: string; name: string; revenue: number }>>
    getAlerts(): Promise<{ issues: any[]; overdue: any[]; renewals: any[]; cluster: any[] }>
    getHealthMetrics(period: string): Promise<{ churnRate: number; sla: number; collectionRate: number; tickets: number; arpu: number }>
}
