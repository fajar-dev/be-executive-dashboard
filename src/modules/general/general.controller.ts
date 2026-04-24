import { Context } from 'hono'
import { GeneralService } from './general.service'
import { ApiResponse } from '../../core/helpers/response'
import { DateHelper } from '../../core/helpers/date'

import { NocSerializer } from './serializers/noc.serialize'
import { RevenueSerializer } from './serializers/revenue.serialize'
import { IspSerializer } from './serializers/isp.serialize'
import { NusaWorkSerializer } from './serializers/nusawork.serialize'
import { HomeConnectSerializer } from './serializers/homeconnect.serialize'
import { RevenueMonthlySerializer } from './serializers/revenuemonthly.serialize'
import { RevenuePeriodSerializer } from './serializers/revenueperiod.serialize'
import { AlertsSerializer } from './serializers/alerts.serialize'
import { HealthSerializer } from './serializers/health.serialize'

export class GeneralController {
    private service: GeneralService

    constructor(service: GeneralService) {
        this.service = service
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
    async getRevenueStats(c: Context) {
        try {
            const period = c.req.query('period') || DateHelper.getCurrentPeriod()
            const stats = await this.service.getRevenue(period)
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
            const stats = await this.service.getIspStats(period)
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
            const stats = await this.service.getNusaWorkStats(period)
            const data = NusaWorkSerializer.single(stats)
            return ApiResponse.success(c, data, 'NusaWork stats retrieved')
        } catch (error: any) {
            return ApiResponse.error(c, error.message)
        }
    }

    /**
     * GET /general/homeconnect
     */
    async getHomeConnectStats(c: Context) {
        try {
            const period = c.req.query('period') || DateHelper.getCurrentPeriod()
            const stats = await this.service.getHomeConnectStats(period)
            const data = HomeConnectSerializer.single(stats)
            return ApiResponse.success(c, data, 'HomeConnect stats retrieved')
        } catch (error: any) {
            return ApiResponse.error(c, error.message)
        }
    }

    /**
     * GET /general/revenue/period
     */
    async getRevenuePeriod(c: Context) {
        try {
            const startPeriod = c.req.query('startPeriod') || DateHelper.getCurrentPeriod().substring(0, 4) + '01' 
            const endPeriod = c.req.query('endPeriod') || DateHelper.getCurrentPeriod()
            const stats = await this.service.getRevenuePeriod(startPeriod, endPeriod)
            const data = RevenuePeriodSerializer.list(stats)
            return ApiResponse.success(c, data, 'Revenue period retrieved')
        } catch (error: any) {
            return ApiResponse.error(c, error.message)
        }
    }

    /**
     * GET /general/revenue/monthly
     */
    async getRevenueMonthly(c: Context) {
        try {
            const period = c.req.query('period') || DateHelper.getCurrentPeriod()
            const stats = await this.service.getRevenueMonthly(period)
            const data = RevenueMonthlySerializer.list(stats)
            return ApiResponse.success(c, data, 'Revenue trend retrieved')
        } catch (error: any) {
            return ApiResponse.error(c, error.message)
        }
    }

    /**
     * GET /general/alerts
     */
    async getAlerts(c: Context) {
        try {
            const stats = await this.service.getAlerts()
            const data = AlertsSerializer.single(stats)
            return ApiResponse.success(c, data, 'Alerts retrieved')
        } catch (error: any) {
            return ApiResponse.error(c, error.message)
        }
    }

    /**
     * GET /general/health
     */
    async getHealthMetrics(c: Context) {
        try {
            const period = c.req.query('period') || DateHelper.getCurrentPeriod()
            const stats = await this.service.getHealthMetrics(period)
            const data = HealthSerializer.single(stats)
            return ApiResponse.success(c, data, 'Health metrics retrieved')
        } catch (error: any) {
            return ApiResponse.error(c, error.message)
        }
    }
}
