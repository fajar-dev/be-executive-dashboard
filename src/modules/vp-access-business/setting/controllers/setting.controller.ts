import { Context } from 'hono'
import { ISettingService } from '../interfaces/setting.service.interface'
import { ApiResponse } from '../../../../core/helpers/response'

export class SettingController {
    constructor(private readonly service: ISettingService) {}
    
    async ping(c: Context) {
        return ApiResponse.success(c, { message: 'Setting module is ready' }, 'Ping success')
    }
}
