import { TargetRevenuePayload } from './setting.repository.interface'

export interface ISettingService {
    getRevenue(branchId: string, year: number): Promise<{ total: number, details: { month: number, total: number }[] }>
    getTarget(year: number): Promise<TargetRevenuePayload | null>
    saveTarget(year: number, payload: TargetRevenuePayload, userId: number): Promise<void>
}
