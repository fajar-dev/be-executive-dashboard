import { ISettingService } from '../interfaces/setting.service.interface'
import { ISettingRepository } from '../interfaces/setting.repository.interface'

export class SettingService implements ISettingService {
    constructor(private readonly settingRepository: ISettingRepository) {}

    async getRevenue(branchId: string, year: number): Promise<{ total: number, details: { month: number, total: number }[] }> {
        return this.settingRepository.getRevenue(branchId, year)
    }
}
