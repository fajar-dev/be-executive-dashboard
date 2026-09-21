export class SalesPerformanceSerializer {
    /**
     * Serialize daily sales performance list.
     * 
     * @param {Array<{ name: string; photoProfile: string; data: number[] }>} data - Staff performance data.
     * @returns {Array<{ name: string; photoProfile: string; data: number[] }>} Serialized list.
     */
    static salesPerformance(data: any[]) {
        return data.map(item => ({
            id: item.id,
            employeeId: item.employeeId,
            name: item.name,
            photoProfile: item.photoProfile,
            organizationName: item.organizationName,
            type: item.type,
            data: item.data
        }))
    }

    /**
     * Serialize manager list.
     * 
     * @param {Array<{ id: number; name: string; employeeId: string; photoProfile: string }>} data - Manager data.
     * @returns {Array<{ id: number; name: string; employeeId: string; photoProfile: string }>} Serialized list.
     */
    static managers(data: Array<{ id: number; name: string; employeeId: string; photoProfile: string }>) {
        return data.map(item => ({
            id: item.id,
            name: item.name,
            employeeId: item.employeeId,
            photoProfile: item.photoProfile
        }))
    }

    /**
     * Serialize the weekly BDE performance summary.
     *
     * @param {{ week: any; month: string; rows: any[] }} data - Weekly summary payload.
     * @returns {{ week: any; month: string; rows: any[] }} Serialized payload.
     */
    static businessWeekly(data: { week: any; month: string; rows: any[] }) {
        return {
            week: data.week,
            month: data.month,
            rows: data.rows.map(item => ({
                id: item.id,
                employeeId: item.employeeId,
                name: item.name,
                photoProfile: item.photoProfile,
                organizationName: item.organizationName,
                activityThisWeek: item.activityThisWeek,
                mrcThisMonth: item.mrcThisMonth,
                target: item.target,
                achievementPct: item.achievementPct
            }))
        }
    }
}
