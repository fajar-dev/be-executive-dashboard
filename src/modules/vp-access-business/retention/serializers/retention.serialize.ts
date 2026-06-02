export class RetentionSerializer {
    static churnRevenue(data: any) {
        return {
            trend: data.trend,
            percentage: data.percentage,
            revenue: data.revenue,
            period: data.period
        }
    }

    static customerLose(data: any) {
        return {
            total: {
                value: data.total.value,
                trend: data.total.trend,
                percentage: data.total.percentage,
                period: data.total.period
            },
            detail: data.detail.map((d: any) => ({
                service_group: d.service_group,
                value: d.value,
                trend: d.trend,
                percentage: d.percentage
            }))
        }
    }

    static wirelessMigration(data: any) {
        return {
            totalCustomer: {
                value: data.totalCustomer.value,
                trend: data.totalCustomer.trend,
                percentage: data.totalCustomer.percentage,
                period: data.totalCustomer.period
            },
            migrated: {
                value: data.migrated.value,
                trend: data.migrated.trend,
                percentage: data.migrated.percentage,
                period: data.migrated.period
            },
            migrationRate: {
                value: data.migrationRate.value,
                trend: data.migrationRate.trend,
                percentage: data.migrationRate.percentage,
                migratedValue: data.migrationRate.migratedValue,
                totalValue: data.migrationRate.totalValue,
                period: data.migrationRate.period
            }
        }
    }

    static churnRate(data: any[]) {
        return data.map(item => ({
            period: item.period,
            month: item.month
        }))
    }

    static contractExpiring(data: any) {
        return {
            total: data.total,
            total_30: data.total_30,
            total_60: data.total_60,
            total_90: data.total_90
        }
    }

    static ticket(data: any) {
        return {
            value: data.value,
            trend: data.trend,
            percentage: data.percentage,
            period: data.period
        }
    }

    static usage(data: any) {
        return {
            value: data.value,
            trend: data.trend,
            percentage: data.percentage,
            period: data.period
        }
    }

    static payment(data: any) {
        return {
            monthly: data.monthly,
            annual: data.annual
        }
    }
}
