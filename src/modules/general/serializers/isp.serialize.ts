export class IspSerializer {
    static single(data: any) {
        const trend = data.added >= data.addedLastMonth ? 'up' : 'down'

        return {
            trend,
            customers: data.active,
            newCustomers: data.added,
            newCustomersPrevious: data.addedLastMonth,
            newCustomersGrowth: data.added - data.addedLastMonth,
            churnedCustomers: data.churn,
            churnedCustomersPercentage: data.active > 0 ? (data.churn / data.active) * 100 : 0,
        }
    }
}
