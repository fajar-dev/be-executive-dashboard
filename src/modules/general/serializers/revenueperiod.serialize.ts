import { DateHelper } from '../../../core/helpers/date'

export class RevenuePeriodSerializer {
    static list(data: any[]) {
        const grouped: any = {}

        data.forEach(item => {
            const period = item.period
            const monthName = DateHelper.getMonthName(period)

            if (!grouped[period]) {
                grouped[period] = {
                    period: period,
                    monthName: monthName,
                    data: []
                }
            }

            grouped[period].data.push({
                name: item.name || 'Other',
                revenue: item.revenue
            })
        })

        return Object.values(grouped)
    }
}
