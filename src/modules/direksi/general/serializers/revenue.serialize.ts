export class RevenueSerializer {
    static single(data: any) {
        const percentage = data.previousMonth > 0 ? ((data.currentMonth - data.previousMonth) / data.previousMonth) * 100 : 0
        const trend = data.currentMonth >= data.previousMonth ? 'up' : 'down'
        const revenueGrowth = data.currentMonth - data.previousMonth

        return {
            trend: trend,
            revenueCurrent: data.currentMonth,
            revenuePrevious: data.previousMonth,
            revenueGrowth: revenueGrowth,
            revenuePercentage: percentage,
        }
    }
}