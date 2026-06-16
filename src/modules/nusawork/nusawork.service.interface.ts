export interface NusaworkEmployee {
    userId: number
    employeeId: string
    name: string
    email: string
    photoProfile: string
    jobPosition?: string
}

export interface NusaworkSalesHome {
    id: number
    employeeId: string
    name: string
    email: string
    photoProfile: string
    jobPosition?: string
    organizationName?: string
    jobLevel?: string
    branchId?: string
    managerId?: number
    status?: string
}

export interface INusaworkService {
    getEmployees(): Promise<any[]>
    getExecutive(): Promise<NusaworkEmployee[]>
    getAdmin(): Promise<NusaworkEmployee[]>
    getSalesHome(): Promise<NusaworkSalesHome[]>
}
