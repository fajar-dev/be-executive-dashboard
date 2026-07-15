import { TargetRevenuePayload } from './setting.repository.interface'

export interface ISettingService {
    getRevenue(branchId: string, year: number): Promise<{ total: number, details: { month: number, total: number }[] }>
    getTarget(branch: string, year: number): Promise<TargetRevenuePayload | null>
    getTargetLog(branch?: string, year?: number): Promise<any[]>
    saveTarget(branch: string, year: number, payload: TargetRevenuePayload, userId: number): Promise<void>
}
