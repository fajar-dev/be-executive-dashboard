import { IServiceQualityService } from '../interfaces/service-quality.service.interface'
import { IServiceQualityRepository } from '../interfaces/service-quality.repository.interface'
import { DateHelper } from '../../../../core/helpers/date'

export class ServiceQualityService implements IServiceQualityService {
    constructor(
        private readonly serviceQualityRepository: IServiceQualityRepository
    ) {}

    async getTicket(branchId: string, periodType: string): Promise<{ value: number; trend: 'up' | 'down'; percentage: number; period: string }> {
        const { startDate, endDate, prevStartDate, prevEndDate, period } = DateHelper.getDatesForPeriod(periodType)

        const [value, prevValue] = await Promise.all([
            this.serviceQualityRepository.ticket(branchId, startDate, endDate),
            this.serviceQualityRepository.ticket(branchId, prevStartDate, prevEndDate)
        ])

        let percentage = 0
        if (prevValue > 0) {
            percentage = ((value - prevValue) / prevValue) * 100
        } else if (value > 0) {
            percentage = 100
        }

        const trend = value >= prevValue ? 'up' : 'down'

        return {
            value,
            trend,
            percentage,
            period
        }
    }

    async getComplaint(branchId: string, periodType: string): Promise<{ value: number; trend: 'up' | 'down'; percentage: number; period: string }> {
        const { startDate, endDate, prevStartDate, prevEndDate, period } = DateHelper.getDatesForPeriod(periodType)

        const [value, prevValue] = await Promise.all([
            this.serviceQualityRepository.complaint(branchId, startDate, endDate),
            this.serviceQualityRepository.complaint(branchId, prevStartDate, prevEndDate)
        ])

        let percentage = 0
        if (prevValue > 0) {
            percentage = ((value - prevValue) / prevValue) * 100
        } else if (value > 0) {
            percentage = 100
        }

        const trend = value >= prevValue ? 'up' : 'down'

        return {
            value,
            trend,
            percentage,
            period
        }
    }

    async getSolved(branchId: string, periodType: string): Promise<{ value: number; trend: 'up' | 'down'; percentage: number; period: string }> {
        const { startDate, endDate, prevStartDate, prevEndDate, period } = DateHelper.getDatesForPeriod(periodType)

        const [value, prevValue] = await Promise.all([
            this.serviceQualityRepository.solved(branchId, startDate, endDate),
            this.serviceQualityRepository.solved(branchId, prevStartDate, prevEndDate)
        ])

        let percentage = 0
        if (prevValue > 0) {
            percentage = ((value - prevValue) / prevValue) * 100
        } else if (value > 0) {
            percentage = 100
        }

        const trend = value >= prevValue ? 'up' : 'down'

        return {
            value,
            trend,
            percentage,
            period
        }
    }

    async getSolvedPercentage(branchId: string, periodType: string): Promise<{ value: number; trend: 'up' | 'down'; percentage: number; period: string }> {
        const { startDate, endDate, prevStartDate, prevEndDate, period } = DateHelper.getDatesForPeriod(periodType)

        const [value, prevValue] = await Promise.all([
            this.serviceQualityRepository.solvedPercentage(branchId, startDate, endDate),
            this.serviceQualityRepository.solvedPercentage(branchId, prevStartDate, prevEndDate)
        ])

        let percentage = 0
        if (prevValue > 0) {
            percentage = ((value - prevValue) / prevValue) * 100
        } else if (value > 0) {
            percentage = 100
        }

        const trend = value >= prevValue ? 'up' : 'down'

        return {
            value,
            trend,
            percentage,
            period
        }
    }

    async getIssue(branchId: string, periodType: string): Promise<{ value: number; trend: 'up' | 'down'; percentage: number; period: string }> {
        const { startDate, endDate, prevStartDate, prevEndDate, period } = DateHelper.getDatesForPeriod(periodType)

        const [value, prevValue] = await Promise.all([
            this.serviceQualityRepository.issue(branchId, startDate, endDate),
            this.serviceQualityRepository.issue(branchId, prevStartDate, prevEndDate)
        ])

        let percentage = 0
        if (prevValue > 0) {
            percentage = ((value - prevValue) / prevValue) * 100
        } else if (value > 0) {
            percentage = 100
        }

        const trend = value >= prevValue ? 'up' : 'down'

        return {
            value,
            trend,
            percentage,
            period
        }
    }

    async getIncident(branchId: string, periodType: string): Promise<{ value: number; trend: 'up' | 'down'; percentage: number; period: string }> {
        const { startDate, endDate, prevStartDate, prevEndDate, period } = DateHelper.getDatesForPeriod(periodType)

        const [value, prevValue] = await Promise.all([
            this.serviceQualityRepository.incident(branchId, startDate, endDate),
            this.serviceQualityRepository.incident(branchId, prevStartDate, prevEndDate)
        ])

        let percentage = 0
        if (prevValue > 0) {
            percentage = ((value - prevValue) / prevValue) * 100
        } else if (value > 0) {
            percentage = 100
        }

        const trend = value >= prevValue ? 'up' : 'down'

        return {
            value,
            trend,
            percentage,
            period
        }
    }
}
