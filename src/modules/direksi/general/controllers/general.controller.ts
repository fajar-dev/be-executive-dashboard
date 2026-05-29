import { Context } from 'hono'
import { IGeneralService } from '../interfaces/general.service.interface'
import { ApiResponse } from '../../../../core/helpers/response'
import { DateHelper } from '../../../../core/helpers/date'

import { NocSerializer } from '../serializers/noc.serialize'
import { RevenueSerializer } from '../serializers/revenue.serialize'
import { IspSerializer } from '../serializers/isp.serialize'
import { NusaWorkSerializer } from '../serializers/nusawork.serialize'
import { HomeConnectSerializer } from '../serializers/homeconnect.serialize'
import { RevenueMonthlySerializer } from '../serializers/revenuemonthly.serialize'
import { RevenuePeriodSerializer } from '../serializers/revenueperiod.serialize'
import { AlertsSerializer } from '../serializers/alerts.serialize'
import { HealthSerializer } from '../serializers/health.serialize'

export class GeneralController {
    constructor(private readonly service: IGeneralService) {}

    async getNocStatus(c: Context) {
        const stats = await this.service.getNocStatus()
        return ApiResponse.success(c, NocSerializer.single(stats), 'NOC status retrieved')
    }

    async getRevenueStats(c: Context) {
        const period = c.req.query('period') || DateHelper.getCurrentPeriod()
        const stats = await this.service.getRevenue(period)
        return ApiResponse.success(c, RevenueSerializer.single(stats), 'Revenue retrieved')
    }

    async getIspStats(c: Context) {
        const period = c.req.query('period') || DateHelper.getCurrentPeriod()
        const stats = await this.service.getIspStats(period)
        return ApiResponse.success(c, IspSerializer.single(stats), 'ISP stats retrieved')
    }

    async getNusaWorkStats(c: Context) {
        const period = c.req.query('period') || DateHelper.getCurrentPeriod()
        const stats = await this.service.getNusaWorkStats(period)
        return ApiResponse.success(c, NusaWorkSerializer.single(stats), 'NusaWork stats retrieved')
    }

    async getHomeConnectStats(c: Context) {
        const period = c.req.query('period') || DateHelper.getCurrentPeriod()
        const stats = await this.service.getHomeConnectStats(period)
        return ApiResponse.success(c, HomeConnectSerializer.single(stats), 'HomeConnect stats retrieved')
    }

    async getRevenuePeriod(c: Context) {
        const startPeriod = c.req.query('startPeriod') || DateHelper.getCurrentPeriod().substring(0, 4) + '01'
        const endPeriod = c.req.query('endPeriod') || DateHelper.getCurrentPeriod()
        const stats = await this.service.getRevenuePeriod(startPeriod, endPeriod)
        return ApiResponse.success(c, RevenuePeriodSerializer.list(stats), 'Revenue period retrieved')
    }

    async getRevenueMonthly(c: Context) {
        const period = c.req.query('period') || DateHelper.getCurrentPeriod()
        const stats = await this.service.getRevenueMonthly(period)
        return ApiResponse.success(c, RevenueMonthlySerializer.list(stats), 'Revenue trend retrieved')
    }

    async getAlerts(c: Context) {
        const stats = await this.service.getAlerts()
        return ApiResponse.success(c, AlertsSerializer.single(stats), 'Alerts retrieved')
    }

    async getHealthMetrics(c: Context) {
        const period = c.req.query('period') || DateHelper.getCurrentPeriod()
        const stats = await this.service.getHealthMetrics(period)
        return ApiResponse.success(c, HealthSerializer.single(stats), 'Health metrics retrieved')
    }
}
