export interface IUserService {
    getById(id: number): Promise<any>
    getByEmId(employeeId: string): Promise<any>
    getByEmail(email: string): Promise<any>
}
