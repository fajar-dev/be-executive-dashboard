export interface NusaworkEmployee {
    userId: number
    employeeId: string
    name: string
    email: string
    photoProfile: string
    jobPosition?: string
}

export interface INusaworkService {
    getEmployees(): Promise<any[]>
    getExecutive(): Promise<NusaworkEmployee[]>
    getAdmin(): Promise<NusaworkEmployee[]>
}
