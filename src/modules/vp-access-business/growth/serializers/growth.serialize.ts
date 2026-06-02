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

    static leads(data: any) {
        return {
            value: data.value,
            trend: data.trend,
            percentage: data.percentage,
            period: data.period
        }
    }

    static opportunity(data: any) {
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

    static activity(data: any) {
        return {
            value: data.value,
            trend: data.trend,
            percentage: data.percentage,
            period: data.period
        }
    }

    static pipeline(data: any) {
        return {
            value: data.value,
            trend: data.trend,
            percentage: data.percentage,
            period: data.period
        }
    }
}
