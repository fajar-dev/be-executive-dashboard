import { ISettingService } from '../interfaces/setting.service.interface'
import { ISettingRepository } from '../interfaces/setting.repository.interface'

export class SettingService implements ISettingService {
    constructor(private readonly settingRepository: ISettingRepository) {}
}
