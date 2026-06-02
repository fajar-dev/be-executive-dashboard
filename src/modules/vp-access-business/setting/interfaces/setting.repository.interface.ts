export interface ISettingRepository {
    getRevenue(branchId: string, year: number): Promise<number>
}
