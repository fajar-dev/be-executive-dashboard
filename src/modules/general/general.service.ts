import { DateHelper } from '../../core/helpers/date'
import { IGeneralRepository } from './general.repository.interface'
import { IGeneralService } from './general.service.interface'

export class GeneralService implements IGeneralService {
    constructor(private readonly generalRepository: IGeneralRepository) {}

    async getNocStatus(): Promise<number> {
        return this.generalRepository.countNocOpen()
    }

    async getRevenue(period: string) {
        const { currentPeriod } = DateHelper.getPeriodInfo(period)
        const prevPeriod = DateHelper.getPreviousPeriod(period)

        const [currentMonth, previousMonth] = await Promise.all([
            this.generalRepository.sumRevenue(currentPeriod),
            this.generalRepository.sumRevenue(prevPeriod)
        ])

        return { currentMonth, previousMonth }
    }

    async getIspStats(period: string) {
        const { currentPeriod, startDate, endDate } = DateHelper.getPeriodInfo(period)
        const prevStart = DateHelper.getPreviousMonthStart(period)
        const prevEnd = DateHelper.getPreviousMonthEnd(period)

        const [active, added, addedLastMonth, churn] = await Promise.all([
            this.generalRepository.countIspActive(),
            this.generalRepository.countIspAdded(startDate, endDate),
            this.generalRepository.countIspAdded(prevStart, prevEnd),
            this.generalRepository.countIspChurn(currentPeriod)
        ])

        return { active, added, addedLastMonth, churn }
    }

    async getNusaWorkStats(period: string) {
        const { startDate, endDate } = DateHelper.getPeriodInfo(period)

        const [active, growth, companies, total] = await Promise.all([
            this.generalRepository.countNusaWorkActive(),
            this.generalRepository.countNusaWorkGrowth(startDate, endDate),
            this.generalRepository.countNusaWorkCompanies(startDate),
            this.generalRepository.countNusaWorkTotal()
        ])

        return { active, growth, companies, total }
    }

    async getHomeConnectStats(period: string) {
        const prevPeriod = DateHelper.getPreviousPeriod(period)
        const prevPeriodFormatted = prevPeriod.substring(4, 6) + prevPeriod.substring(2, 4)

        const [currentRows, lastMonthRows, conversion] = await Promise.all([
            this.generalRepository.getHomeConnectCurrent(),
            this.generalRepository.getHomeConnectLastMonth(prevPeriodFormatted),
            this.generalRepository.getHomeConnectConversion()
        ])

        return {
            current: currentRows.reduce((acc, row) => ({ ...acc, [row.status]: Number(row.total) }), { AC: 0, FR: 0 }),
            lastMonth: lastMonthRows.reduce((acc, row) => ({ ...acc, [row.status]: Number(row.total) }), { AC: 0, FR: 0 }),
            conversion: {
                upgrade: conversion.total_upgrade,
                free: conversion.total_free
            }
        }
    }

    async getRevenuePeriod(startPeriod: string, endPeriod: string) {
        return this.generalRepository.listRevenuePeriod(startPeriod, endPeriod)
    }

    async getRevenueMonthly(period: string) {
        return this.generalRepository.listRevenueMonthly(period)
    }

    async getAlerts() {
        const [issues, overdue, renewals] = await Promise.all([
            this.generalRepository.getAlertIssues(),
            this.generalRepository.getAlertOverdue(),
            this.generalRepository.getAlertRenewals()
        ])

        return { issues, overdue, renewals }
    }

    async getHealthMetrics(period: string) {
        const { currentPeriod, startDate, endDate } = DateHelper.getPeriodInfo(period)
        const activeDays = DateHelper.getActiveDays(currentPeriod)

        const nextMonthDate = new Date(Number(currentPeriod.substring(0, 4)), Number(currentPeriod.substring(4, 6)), 1)
        const nextMonthStartDate = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, '0')}-01`

        const [churnRate, sla, collectionRate, tickets, arpu] = await Promise.all([
            this.generalRepository.getChurnRate(currentPeriod),
            this.generalRepository.getSlaPercentage(startDate, nextMonthStartDate, activeDays),
            this.generalRepository.getCollectionRate(startDate, endDate),
            this.generalRepository.getTicketsSolved(startDate, endDate),
            this.generalRepository.getArpu()
        ])

        return { churnRate, sla, collectionRate, tickets, arpu }
    }
}
