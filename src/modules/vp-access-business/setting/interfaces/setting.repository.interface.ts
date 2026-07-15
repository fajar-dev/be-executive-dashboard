export interface UserReference {
    id: number
    name: string
    email: string
    photo: string | null
    jobPosition: string | null
}

export interface TargetRevenuePayload {
    year: number
    branch?: string
    yearly_target: number
    jan: number
    feb: number
    mar: number
    apr: number
    may: number
    jun: number
    jul: number
    aug: number
    sep: number
    oct: number
    nov: number
    dec: number
    is_locked: boolean
    updated_at?: Date | string
    updated_by?: UserReference | null
    reason?: string
}

export interface ISettingRepository {
    getRevenue(branchId: string, year: number): Promise<{ total: number, details: { month: number, total: number }[] }>
    getTarget(branch: string, year: number): Promise<TargetRevenuePayload | null>
    getTargetLog(branch?: string, year?: number): Promise<any[]>
    saveTarget(branch: string, year: number, payload: TargetRevenuePayload, userId: number): Promise<void>
}
