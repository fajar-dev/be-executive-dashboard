export class NusaWorkSerializer {
    static single(data: any) {
        const previousUsers = data.active - data.growth
        const growthPercentage = previousUsers > 0 ? (data.growth / previousUsers) * 100 : 0
        const trend = data.growth >= 0 ? 'up' : 'down'
        return {
            trend: trend,
            users: data.active,
            usersPrevious: previousUsers,
            usersGrowth: data.growth,
            usersPercentage: growthPercentage,
            stableCompanies: data.companies,
            totalCompanies: data.total
        }
    }
}
