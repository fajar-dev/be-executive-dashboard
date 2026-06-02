export interface ISettingRepository {
    getRevenue(branchId: string, year: number): Promise<{ total: number, details: { month: number, total: number }[] }>
}
