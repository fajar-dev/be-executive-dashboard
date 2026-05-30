export interface IRetentionService {
    getChurnRevenue(branchId: string, periodType: string): Promise<{
        trend: 'up' | 'down'
        percentage: number
        revenue: number
        period: string
    }>
    getCustomerLose(branchId: string, periodType: string): Promise<{
        total: { value: number; trend: 'up' | 'down'; percentage: number; period: string }
        detail: { service_group: string; value: number; trend: 'up' | 'down'; percentage: number }[]
    }>
    getWirelessMigration(branchId: string, periodType: string): Promise<{
        totalCustomer: { value: number; trend: 'up' | 'down'; percentage: number; period: string }
        migrated: { value: number; trend: 'up' | 'down'; percentage: number; period: string }
        migrationRate: { value: number; trend: 'up' | 'down'; percentage: number; migratedValue: number; totalValue: number; period: string }
    }>
    getChurnRate(branchId: string): Promise<any[]>
    getContractExpiring(branchId: string): Promise<{ total: number; total_30: number; total_60: number; total_90: number }>
}
