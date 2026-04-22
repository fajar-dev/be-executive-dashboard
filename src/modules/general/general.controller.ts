import { Context } from 'hono'
import { GeneralService } from './general.service'
import { ApiResponse } from '../../core/helpers/response'
import { DateHelper } from '../../core/helpers/date'

import { NocSerializer } from './serializers/noc.serialize'
import { RevenueSerializer } from './serializers/revenue.serialize'
import { IspSerializer } from './serializers/isp.serialize'
import { NusaWorkSerializer } from './serializers/nusawork.serialize'

export class GeneralController {
    private service: GeneralService

    constructor() {
        this.service = new GeneralService()
    }

    /**
     * GET /general/noc
     */
    async getNocStatus(c: Context) {
        try {
            const stats = await this.service.getNocStatus()
            const data = NocSerializer.single(stats)
            return ApiResponse.success(c, data, 'NOC status retrieved')
        } catch (error: any) {
            return ApiResponse.error(c, error.message)
        }
    }

    /**
     * GET /general/revenue
     */
    async getRevenue(c: Context) {
        try {
            const period = c.req.query('period') || DateHelper.getCurrentPeriod()
            const branchId = c.req.query('branchId') || '020'
            const stats = await this.service.getRevenue(period, branchId)
            const data = RevenueSerializer.single(stats)
            return ApiResponse.success(c, data, 'Revenue retrieved')
        } catch (error: any) {
            return ApiResponse.error(c, error.message)
        }
    }

    /**
     * GET /general/isp
     */
    async getIspStats(c: Context) {
        try {
            const period = c.req.query('period') || DateHelper.getCurrentPeriod()
            const branchId = c.req.query('branchId') || '020'
            const stats = await this.service.getIspStats(period, branchId)
            const data = IspSerializer.single(stats)
            return ApiResponse.success(c, data, 'ISP stats retrieved')
        } catch (error: any) {
            return ApiResponse.error(c, error.message)
        }
    }

    /**
     * GET /general/nusawork
     */
    async getNusaWorkStats(c: Context) {
        try {
            const period = c.req.query('period') || DateHelper.getCurrentPeriod()
            const branchId = c.req.query('branchId') || '020'
            const stats = await this.service.getNusaWorkStats(period, branchId)
            const data = NusaWorkSerializer.single(stats)
            return ApiResponse.success(c, data, 'NusaWork stats retrieved')
        } catch (error: any) {
            return ApiResponse.error(c, error.message)
        }
    }
}
