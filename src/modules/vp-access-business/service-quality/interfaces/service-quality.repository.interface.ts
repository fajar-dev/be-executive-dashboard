export interface IServiceQualityRepository {
    ticket(branchId: string, startDate: string, endDate: string): Promise<number>
    complaint(branchId: string, startDate: string, endDate: string): Promise<number>
    solved(branchId: string, startDate: string, endDate: string): Promise<number>
    solvedPercentage(branchId: string, startDate: string, endDate: string): Promise<number>
    issue(branchId: string, startDate: string, endDate: string): Promise<number>
}
