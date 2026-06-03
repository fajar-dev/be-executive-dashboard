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

    async getTarget(c: Context) {
        const currentYear = new Date().getFullYear()
        const year = c.req.query('year') ? parseInt(c.req.query('year') as string, 10) : currentYear

        const result = await this.service.getTarget(year)
        
        return ApiResponse.success(c, result, 'Target retrieved successfully')
    }

    async getTargetLog(c: Context) {
        const year = c.req.query('year') ? parseInt(c.req.query('year') as string, 10) : undefined

        const result = await this.service.getTargetLog(year)
        const serialized = SettingSerializer.targetLog(result)
        
        return ApiResponse.success(c, serialized, 'Target log retrieved successfully')
    }

    async saveTarget(c: Context) {
        const currentYear = new Date().getFullYear()
        const year = c.req.query('year') ? parseInt(c.req.query('year') as string, 10) : currentYear
        const payload = await c.req.json()
        const user = c.get('user')
        const userId = user?.id || 1 // Fallback to 1 if user ID not found in context
        await this.service.saveTarget(year, payload, userId)
        return ApiResponse.success(c, null, 'Target saved successfully')
    }
}
