import { IServiceQualityService } from '../interfaces/service-quality.service.interface'
import { IServiceQualityRepository } from '../interfaces/service-quality.repository.interface'
import { DateHelper } from '../../../../core/helpers/date'
import { TrendHelper } from '../../../../core/helpers/trend'

/**
 * Service class for handling service quality business logic
 * Orchestrates data retrieval for tickets, complaints, and incident metrics
 */
export class ServiceQualityService implements IServiceQualityService {
    constructor(
        private readonly serviceQualityRepository: IServiceQualityRepository
    ) {}

    /**
     * Calculate total ticket metrics
     * 
     * @param {string} branchId - The branch identifier
     * @param {string} periodType - The period to query ('month', 'quarter', 'year', 'last')
     * @returns {Promise<{value: number, trend: 'up' | 'down', percentage: number, period: string}>}
     */
    async getTicket(branchId: string, periodType: string): Promise<{ value: number; trend: 'up' | 'down'; percentage: number; period: string }> {
        const { startDate, endDate, prevStartDate, prevEndDate, period } = DateHelper.getDatesForPeriod(periodType)

        const [value, prevValue] = await Promise.all([
            this.serviceQualityRepository.ticket(branchId, startDate, endDate),
            this.serviceQualityRepository.ticket(branchId, prevStartDate, prevEndDate)
        ])

        const { trend, percentage } = TrendHelper.calculate(value, prevValue)

        return {
            value,
            trend,
            percentage,
            period
        }
    }

    /**
     * Calculate complaint metrics
     * 
     * @param {string} branchId - The branch identifier
     * @param {string} periodType - The period to query
     * @returns {Promise<{value: number, trend: 'up' | 'down', percentage: number, period: string}>}
     */
    async getComplaint(branchId: string, periodType: string): Promise<{ value: number; trend: 'up' | 'down'; percentage: number; period: string }> {
        const { startDate, endDate, prevStartDate, prevEndDate, period } = DateHelper.getDatesForPeriod(periodType)

        const [value, prevValue] = await Promise.all([
            this.serviceQualityRepository.complaint(branchId, startDate, endDate),
            this.serviceQualityRepository.complaint(branchId, prevStartDate, prevEndDate)
        ])

        const { trend, percentage } = TrendHelper.calculate(value, prevValue)

        return {
            value,
            trend,
            percentage,
            period
        }
    }

    /**
     * Calculate solved tickets metrics
     * 
     * @param {string} branchId - The branch identifier
     * @param {string} periodType - The period to query
     * @returns {Promise<{value: number, trend: 'up' | 'down', percentage: number, period: string}>}
     */
    async getSolved(branchId: string, periodType: string): Promise<{ value: number; trend: 'up' | 'down'; percentage: number; period: string }> {
        const { startDate, endDate, prevStartDate, prevEndDate, period } = DateHelper.getDatesForPeriod(periodType)

        const [value, prevValue] = await Promise.all([
            this.serviceQualityRepository.solved(branchId, startDate, endDate),
            this.serviceQualityRepository.solved(branchId, prevStartDate, prevEndDate)
        ])

        const { trend, percentage } = TrendHelper.calculate(value, prevValue)

        return {
            value,
            trend,
            percentage,
            period
        }
    }

    /**
     * Calculate ticket resolution percentage
     * 
     * @param {string} branchId - The branch identifier
     * @param {string} periodType - The period to query
     * @returns {Promise<{value: number, trend: 'up' | 'down', percentage: number, period: string}>}
     */
    async getSolvedPercentage(branchId: string, periodType: string): Promise<{ value: number; trend: 'up' | 'down'; percentage: number; period: string }> {
        const { startDate, endDate, prevStartDate, prevEndDate, period } = DateHelper.getDatesForPeriod(periodType)

        const [value, prevValue] = await Promise.all([
            this.serviceQualityRepository.solvedPercentage(branchId, startDate, endDate),
            this.serviceQualityRepository.solvedPercentage(branchId, prevStartDate, prevEndDate)
        ])

        const { trend, percentage } = TrendHelper.calculate(value, prevValue)

        return {
            value,
            trend,
            percentage,
            period
        }
    }

    /**
     * Calculate issue (general technical problem) metrics
     * 
     * @param {string} branchId - The branch identifier
     * @param {string} periodType - The period to query
     * @returns {Promise<{value: number, trend: 'up' | 'down', percentage: number, period: string}>}
     */
    async getIssue(branchId: string, periodType: string): Promise<{ value: number; trend: 'up' | 'down'; percentage: number; period: string }> {
        const { startDate, endDate, prevStartDate, prevEndDate, period } = DateHelper.getDatesForPeriod(periodType)

        const [value, prevValue] = await Promise.all([
            this.serviceQualityRepository.issue(branchId, startDate, endDate),
            this.serviceQualityRepository.issue(branchId, prevStartDate, prevEndDate)
        ])

        const { trend, percentage } = TrendHelper.calculate(value, prevValue)

        return {
            value,
            trend,
            percentage,
            period
        }
    }

    /**
     * Calculate incident (critical outage) metrics
     * 
     * @param {string} branchId - The branch identifier
     * @param {string} periodType - The period to query
     * @returns {Promise<{value: number, trend: 'up' | 'down', percentage: number, period: string}>}
     */
    async getIncident(branchId: string, periodType: string): Promise<{ value: number; trend: 'up' | 'down'; percentage: number; period: string }> {
        const { startDate, endDate, prevStartDate, prevEndDate, period } = DateHelper.getDatesForPeriod(periodType)

        const [value, prevValue] = await Promise.all([
            this.serviceQualityRepository.incident(branchId, startDate, endDate),
            this.serviceQualityRepository.incident(branchId, prevStartDate, prevEndDate)
        ])

        const { trend, percentage } = TrendHelper.calculate(value, prevValue)

        return {
            value,
            trend,
            percentage,
            period
        }
    }
}
