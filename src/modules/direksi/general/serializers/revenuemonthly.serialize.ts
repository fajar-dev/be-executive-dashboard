export class RevenueMonthlySerializer {
    static list(data: any[]) {
        const total = data.reduce((acc, item) => acc + item.revenue, 0)

        return data.map(item => {
            const percentage = total > 0 ? (item.revenue / total) * 100 : 0

            return {
                name: item.name,
                revenue: item.revenue,
                percentage: percentage
            }
        })
    }
}
