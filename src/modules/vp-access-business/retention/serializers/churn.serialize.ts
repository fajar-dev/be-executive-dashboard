export class ChurnRevenueSerializer {
    static single(data: {
        trend: 'up' | 'down'
        percentage: number
        revenue: number
        period: string
    }) {
        return {
            trend: data.trend,
            percentage: data.percentage,
            revenue: data.revenue,
            period: data.period
        }
    }
}
