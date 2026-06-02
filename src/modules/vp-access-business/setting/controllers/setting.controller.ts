import { Context } from 'hono'
import { ISettingService } from '../interfaces/setting.service.interface'
import { ApiResponse } from '../../../../core/helpers/response'
import { SettingSerializer } from '../serializers/setting.serialize'

export class SettingController {
    constructor(private readonly service: ISettingService) {}
    
    async ping(c: Context) {
        return ApiResponse.success(c, { message: 'Setting module is ready' }, 'Ping success')
    }

    async getRevenue(c: Context) {
        const branchId = c.req.query('branchId') || '020'
        const currentYear = new Date().getFullYear()
        const year = c.req.query('year') ? parseInt(c.req.query('year') as string, 10) : currentYear

        const result = await this.service.getRevenue(branchId, year)
        
        return ApiResponse.success(c, SettingSerializer.revenue(result), 'Target revenue retrieved successfully')
    }
}
