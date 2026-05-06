export interface UserUpsertPayload {
    employeeId: string
    name: string
    email: string
    photo: string
}

export interface IUserRepository {
    findById(id: number): Promise<any | null>
    findByEmployeeId(employeeId: string): Promise<any | null>
    findByEmail(email: string): Promise<any | null>
    upsertByEmployeeId(data: UserUpsertPayload[]): Promise<void>
}
