export interface NusaworkEmployee {
    userId: number
    employeeId: string
    name: string
    email: string
    photoProfile: string
    jobPosition?: string
}

export type SalesType = 'access_home' | 'access_business'

export interface NusaworkSales {
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
    type: SalesType
}

export interface INusaworkService {
    getEmployees(): Promise<any[]>
    getExecutive(): Promise<NusaworkEmployee[]>
    getAdmin(): Promise<NusaworkEmployee[]>
    getSalesHome(): Promise<NusaworkSales[]>
    getSalesBusiness(): Promise<NusaworkSales[]>
}
