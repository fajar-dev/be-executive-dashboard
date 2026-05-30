export interface IRetentionRepository {
    churnRevenue(branchId: string, startDate: string, endDate: string): Promise<number>
    churnRate(branchId: string, startDate: string, endDate: string): Promise<{ rate: number, churn: number, active: number }>
    customerLose(branchId: string, startDate: string, endDate: string): Promise<any[]>
    wirelessCustomer(branchId: string): Promise<number>
    wirelessMigration(branchId: string, startDate: string, endDate: string): Promise<number>
    migrationWirelessPercentage(branchId: string, startDate: string, endDate: string): Promise<number>
}
