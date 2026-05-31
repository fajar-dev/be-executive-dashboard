export interface IServiceQualityRepository {
    ticket(branchId: string, startDate: string, endDate: string): Promise<number>
}
