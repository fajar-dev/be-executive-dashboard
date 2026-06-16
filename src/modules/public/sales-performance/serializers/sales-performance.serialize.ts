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
}
