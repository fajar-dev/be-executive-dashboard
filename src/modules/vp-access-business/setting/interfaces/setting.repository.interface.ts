export interface TargetRevenuePayload {
    year: number
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
    updated_by_name?: string
    reason?: string
}

export interface ISettingRepository {
    getRevenue(branchId: string, year: number): Promise<{ total: number, details: { month: number, total: number }[] }>
    getTarget(year: number): Promise<TargetRevenuePayload | null>
    saveTarget(year: number, payload: TargetRevenuePayload, userId: number): Promise<void>
}
