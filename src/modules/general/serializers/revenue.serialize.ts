import { Formatter } from '../../../core/helpers/formatter'

export class RevenueSerializer {
    static single(data: number) {
        return {
            total: data,
            formatted: Formatter.currency(data)
        }
    }
}