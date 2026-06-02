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
}
