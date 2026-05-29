export class ChurnSerializer {
    static single(data: {
        trend: 'up' | 'down'
        customers: number
        customersPrevious: number
        customersGrowth: number
        churnRate: number
        revenue: number
        period: string
    }) {
        return {
            trend: data.trend,
            customers: data.customers,
            customersPrevious: data.customersPrevious,
            customersGrowth: data.customersGrowth,
            churnRate: data.churnRate,
            revenue: data.revenue,
            period: data.period
        }
    }
}
