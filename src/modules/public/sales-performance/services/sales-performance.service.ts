import { ISalesPerformanceRepository } from '../interfaces/sales-performance.repository.interface'
import { ISalesPerformanceService } from '../interfaces/sales-performance.service.interface'

export class SalesPerformanceService implements ISalesPerformanceService {
    constructor(private readonly repository: ISalesPerformanceRepository) {}

    /**
     * Retrieve daily sales performance data per staff member.
     * Fetches staff list and daily activation counts, then maps to a per-day array.
     * 
     * @param {number} month - Month number (1-12).
     * @param {number} year - Full year (e.g. 2026).
     * @param {number} [managerId] - Optional manager ID to filter staff.
     * @param {string} [branchId] - Optional branch ID to filter staff.
     * @param {string} [type] - Optional sales type to filter staff.
     * @returns {Promise<Array<{ name: string; photoProfile: string; data: number[] }>>} Daily performance per staff.
     */
    async getSalesPerformance(month: number, year: number, managerId?: number, branchId?: string, type?: string): Promise<Array<{ name: string; photoProfile: string; data: number[] }>> {
        const staffList = await this.repository.getStaffList(managerId, branchId, type)

        if (!staffList.length) return []

        // access_home counts come from NIS (keyed by employee_id);
        // access_business counts come from NusaProspect (keyed by email).
        const homeStaff = staffList.filter(s => s.type !== 'access_business')
        const businessStaff = staffList.filter(s => s.type === 'access_business')

        const [homeRegistrations, businessActivity] = await Promise.all([
            homeStaff.length
                ? this.repository.getHomeDailyRegistration(homeStaff.map(s => s.employeeId), month, year)
                : Promise.resolve([]),
            businessStaff.length
                ? this.repository.getBusinessDailyActivity(businessStaff.map(s => s.email).filter(Boolean), month, year)
                : Promise.resolve([])
        ])

        // Build lookups: home by employeeId, business by email -> { day -> count }
        const homeMap = new Map<string, Map<number, number>>()
        for (const row of homeRegistrations) {
            if (!homeMap.has(row.salesId)) homeMap.set(row.salesId, new Map())
            homeMap.get(row.salesId)!.set(row.day, row.count)
        }
        const businessMap = new Map<string, Map<number, number>>()
        for (const row of businessActivity) {
            if (!businessMap.has(row.email)) businessMap.set(row.email, new Map())
            businessMap.get(row.email)!.set(row.day, row.count)
        }

        const daysInMonth = new Date(year, month, 0).getDate()

        const results = staffList.map(staff => {
            const dayMap = staff.type === 'access_business'
                ? (businessMap.get(staff.email) || new Map())
                : (homeMap.get(staff.employeeId) || new Map())
            const data: number[] = []

            for (let d = 1; d <= daysInMonth; d++) {
                data.push(dayMap.get(d) || 0)
            }

            return {
                id: staff.id,
                employeeId: staff.employeeId,
                name: staff.name,
                photoProfile: staff.photoProfile,
                organizationName: staff.organizationName,
                type: staff.type,
                data
            }
        })

        // Sort by total activations descending
        return results.sort((a, b) => {
            const totalA = a.data.reduce((sum, v) => sum + v, 0)
            const totalB = b.data.reduce((sum, v) => sum + v, 0)
            return totalB - totalA
        })
    }

    /**
     * Retrieve the detail list behind one cell (a sales member on a specific day).
     * Home -> registrations that day; Business -> activities that day.
     *
     * @param {number} salesId - Sales table id (dashboard).
     * @param {number} month - Month number (1-12).
     * @param {number} year - Full year (e.g. 2026).
     * @param {number} day - Day of month (1-31).
     * @returns {Promise<{ type: string; items: any[] }>} Detail list keyed by sales type.
     */
    async getDetail(salesId: number, month: number, year: number, day: number): Promise<{ type: string; items: any[] }> {
        const sales = await this.repository.getSalesById(salesId)
        if (!sales) return { type: '', items: [] }

        const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`

        if (sales.type === 'access_business') {
            const items = await this.repository.getBusinessActivityDetail(sales.email, date)
            return { type: 'access_business', items }
        }

        const items = await this.repository.getHomeRegistrationDetail(sales.employeeId, date)
        return { type: 'access_home', items }
    }

    /**
     * Retrieve list of managers from the sales table, optionally filtered by type.
     *
     * @param {string} [type] - Optional sales type to filter by.
     * @returns {Promise<Array<{ id: number; name: string; employeeId: string; photoProfile: string }>>} Manager list.
     */
    async getManagers(type?: string): Promise<Array<{ id: number; name: string; employeeId: string; photoProfile: string }>> {
        return this.repository.getManagers(type)
    }
}
