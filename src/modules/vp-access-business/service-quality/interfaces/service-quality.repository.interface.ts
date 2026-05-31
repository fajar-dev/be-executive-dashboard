export interface IServiceQualityRepository {
    ticket(branchId: string, startDate: string, endDate: string): Promise<number>
    complaint(branchId: string, startDate: string, endDate: string): Promise<number>
}
