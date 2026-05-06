export interface IIs5Service {
    auth(employeeId: string, password: string): Promise<boolean>
}
