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
    async getManagers(type?: string, branchId?: string): Promise<Array<{ id: number; name: string; employeeId: string; photoProfile: string }>> {
        return this.repository.getManagers(type, branchId)
    }

    /**
     * Retrieve the weekly BDE performance summary for access_business sales.
     * Weeks are Monday-based: "this week" runs Monday of the current week through
     * today; "last week" is the previous full Monday–Sunday. New MRC / achievement
     * use the current calendar month; forecast uses next month's close dates.
     *
     * @param {number} [managerId] - Optional manager ID to filter staff.
     * @param {string} [branchId] - Optional branch ID to filter staff.
     * @returns {Promise<{ week: { label: string; start: string; end: string }; month: string; rows: any[] }>}
     */
    async getBusinessWeekly(managerId?: number, branchId?: string): Promise<{ week: { label: string; start: string; end: string }; month: string; rows: any[] }> {
        const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        const monthName = (d: Date) => d.toLocaleDateString('id-ID', { month: 'long' })
        const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x }

        const now = new Date()
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        // Monday-based offset (0 = Monday .. 6 = Sunday)
        const offset = (today.getDay() + 6) % 7
        const thisWeekStart = addDays(today, -offset)
        const thisWeekEnd = today
        const lastWeekEnd = addDays(thisWeekStart, -1)
        const lastWeekStart = addDays(thisWeekStart, -7)
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1)
        const nextMonthEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0)

        const staffList = (await this.repository.getStaffList(managerId, branchId, 'access_business'))
            .filter(s => s.type === 'access_business')

        const week = {
            label: `${monthName(thisWeekStart)} Minggu ${Math.ceil(thisWeekStart.getDate() / 7)}`,
            start: fmt(thisWeekStart),
            end: fmt(thisWeekEnd)
        }
        const month = monthName(monthStart)

        if (!staffList.length) return { week, month, rows: [] }

        const emails = staffList.map(s => s.email).filter(Boolean)
        const [mrc, activity, forecast] = await Promise.all([
            this.repository.getBusinessWeeklyMrc(
                fmt(lastWeekStart), fmt(monthEnd),
                fmt(thisWeekStart), fmt(thisWeekEnd),
                fmt(lastWeekStart), fmt(lastWeekEnd),
                fmt(monthStart), fmt(monthEnd)
            ),
            this.repository.getBusinessWeeklyActivity(
                emails, fmt(thisWeekStart), fmt(thisWeekEnd), fmt(lastWeekStart), fmt(lastWeekEnd)
            ),
            this.repository.getBusinessForecastByOwner(emails, fmt(nextMonthStart), fmt(nextMonthEnd))
        ])

        const mrcMap = new Map(mrc.map(m => [m.salesId, m]))
        const actMap = new Map(activity.map(a => [a.email, a]))
        const fcMap = new Map(forecast.map(f => [f.email, f.forecast]))

        const rows = staffList.map(staff => {
            const m = mrcMap.get(staff.employeeId)
            const a = actMap.get(staff.email)
            const mrcThisMonth = m?.mrcMonth || 0
            const mrcThisWeek = m?.mrcThisWeek || 0
            const mrcLastWeek = m?.mrcLastWeek || 0
            const activityThisWeek = a?.actThisWeek || 0
            const activityLastWeek = a?.actLastWeek || 0

            // Monthly target per BDE: Medan branches 8.5M, all others 6.5M.
            const target = /medan/i.test(staff.organizationName) ? 8_500_000 : 6_500_000
            const achievementPct = target > 0 ? (mrcThisMonth / target) * 100 : null

            // Effectivity: week-over-week % change of (New MRC / activity).
            const ratioThis = activityThisWeek > 0 ? mrcThisWeek / activityThisWeek : 0
            const ratioLast = activityLastWeek > 0 ? mrcLastWeek / activityLastWeek : 0
            const effectivity = ratioLast > 0 ? (ratioThis / ratioLast - 1) * 100 : null

            return {
                id: staff.id,
                employeeId: staff.employeeId,
                name: staff.name,
                photoProfile: staff.photoProfile,
                organizationName: staff.organizationName,
                activityThisWeek,
                activityLastWeek,
                mrcThisMonth,
                effectivity,
                target,
                achievementPct,
                forecastNextMonth: fcMap.get(staff.email) || 0
            }
        })

        rows.sort((x, y) => y.mrcThisMonth - x.mrcThisMonth)

        return { week, month, rows }
    }
}
