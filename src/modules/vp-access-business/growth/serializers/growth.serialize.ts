export class GrowthSerializer {
    static newMrc(data: any) {
        return {
            value: data.value,
            trend: data.trend,
            percentage: data.percentage,
            period: data.period,
            details: {
                mrc: data.details.mrc,
                mrc_unpaid: data.details.mrc_unpaid,
                mrc_paid: data.details.mrc_paid
            }
        }
    }

    static revenue(data: any[]) {
        return data.map(item => ({
            period: item.period,
            month: item.month
        }))
    }

    static revenueAchievement(data: any) {
        return {
            target: data.target,
            revenue: data.revenue,
            percentage: data.percentage,
            trendPercentage: data.trendPercentage,
            trend: data.trend,
            period: data.period
        }
    }

    static metric(data: any) {
        return {
            value: data.value,
            trend: data.trend,
            percentage: data.percentage,
            period: data.period
        }
    }

    static winRate(data: any) {
        return {
            value: data.value,
            trend: data.trend,
            percentage: data.percentage,
            period: data.period,
            details: data.details
        }
    }

    static pipelineStage(data: any) {
        return data
    }

    static discount(data: any) {
        return {
            value: data.value,
            trend: data.trend,
            percentage: data.percentage,
            period: data.period,
            details: data.details
        }
    }

    static arpu(data: any) {
        return {
            value: data.value,
            trend: data.trend,
            percentage: data.percentage,
            period: data.period,
            details: data.details.map((item: any) => ({
                serviceGroup: item.serviceGroup,
                jumlahService: item.jumlahService,
                totalRevenue: item.totalRevenue,
                avgPerService: item.avgPerService
            }))
        }
    }

    static amSnapshot(data: any) {
        return {
            value: data.value,
            trend: data.trend,
            percentage: data.percentage,
            period: data.period
        }
    }
}
