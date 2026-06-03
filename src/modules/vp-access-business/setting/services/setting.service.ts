import { ISettingService } from '../interfaces/setting.service.interface'
import { ISettingRepository, TargetRevenuePayload } from '../interfaces/setting.repository.interface'

export class SettingService implements ISettingService {
    constructor(private readonly settingRepository: ISettingRepository) {}

    async getRevenue(branchId: string, year: number): Promise<{ total: number, details: { month: number, total: number }[] }> {
        return this.settingRepository.getRevenue(branchId, year)
    }

    async getTarget(year: number): Promise<TargetRevenuePayload | null> {
        return this.settingRepository.getTarget(year)
    }

    async getTargetLog(year?: number): Promise<any[]> {
        return this.settingRepository.getTargetLog(year)
    }

    async saveTarget(year: number, payload: TargetRevenuePayload, userId: number): Promise<void> {
        return this.settingRepository.saveTarget(year, payload, userId)
    }
}
