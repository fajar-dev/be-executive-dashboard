export interface IUserRepository {
    findById(id: number): Promise<any | null>
    findByEmployeeId(employeeId: string): Promise<any | null>
    findByEmail(email: string): Promise<any | null>
}
