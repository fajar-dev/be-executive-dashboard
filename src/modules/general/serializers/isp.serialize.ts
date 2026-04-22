import { Formatter } from '../../../core/helpers/formatter'

export class IspSerializer {
    static single(data: any) {
        return {
            activeCustomers: data.active,
            newCustomers: data.added,
            churnedCustomers: data.churn,
            growthRate: Formatter.percentage(data.active > 0 ? ((data.added - data.churn) / data.active) * 100 : 0)
        }
    }
}
