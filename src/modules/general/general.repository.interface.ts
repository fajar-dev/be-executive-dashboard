export interface IGeneralRepository {
    // NOC
    countNocOpen(): Promise<number>

    // Revenue
    sumRevenue(period: string): Promise<number>

    // ISP
    countIspActive(): Promise<number>
    countIspAdded(startDate: string, endDate: string): Promise<number>
    countIspChurn(period: string): Promise<number>

    // NusaWork
    countNusaWorkActive(): Promise<number>
    countNusaWorkGrowth(startDate: string, endDate: string): Promise<number>
    countNusaWorkCompanies(startDate: string): Promise<number>
    countNusaWorkTotal(): Promise<number>

    // HomeConnect
    getHomeConnectCurrent(): Promise<Array<{ status: string; total: number }>>
    getHomeConnectLastMonth(prevPeriodFormatted: string): Promise<Array<{ status: string; total: number }>>
    getHomeConnectConversion(): Promise<{ total_upgrade: number; total_free: number }>

    // Revenue Period & Monthly
    listRevenuePeriod(startPeriod: string, endPeriod: string): Promise<Array<{ period: string; name: string; revenue: number }>>
    listRevenueMonthly(period: string): Promise<Array<{ period: string; name: string; revenue: number }>>

    // Alerts
    getAlertIssues(): Promise<any[]>
    getAlertOverdue(): Promise<any[]>
    getAlertRenewals(): Promise<any[]>

    // Health
    getChurnRate(period: string): Promise<number>
    getSlaPercentage(startDate: string, nextMonthStartDate: string, activeDays: number): Promise<number>
    getCollectionRate(startDate: string, endDate: string): Promise<number>
    getTicketsSolved(startDate: string, endDate: string): Promise<number>
    getArpu(): Promise<number>
}
