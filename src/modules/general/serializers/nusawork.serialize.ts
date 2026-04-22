import { Formatter } from '../../../core/helpers/formatter'

export class NusaWorkSerializer {
    static single(data: any) {
        return {
            activeSubscriptions: data.active,
            monthlyGrowth: data.growth,
            totalCompanies: data.companies,
            adoptionRate: Formatter.percentage(data.companies > 0 ? (data.active / data.companies) * 100 : 0)
        }
    }
}
