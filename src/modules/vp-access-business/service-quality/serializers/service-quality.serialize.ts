export class ServiceQualitySerializer {
    static metric(data: any) {
        return {
            value: data.value,
            trend: data.trend,
            percentage: data.percentage,
            period: data.period
        }
    }
}
