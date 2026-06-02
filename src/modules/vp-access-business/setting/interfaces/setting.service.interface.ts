export interface ISettingService {
    getRevenue(branchId: string, year: number): Promise<number>
}
