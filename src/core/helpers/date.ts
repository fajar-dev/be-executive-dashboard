/**
 * Utility class for Date related operations
 */
export class DateHelper {
    /**
     * Get period information (YYYYMM and YYYY-MM-01)
     * @param period Optional period in YYYYMM format
     */
    static getPeriodInfo(period?: string) {
        const currentPeriod = period || this.getCurrentPeriod() // current period in YYYYMM format
        const startDate = `${currentPeriod.substring(0, 4)}-${currentPeriod.substring(4, 6)}-01` // start date of the period format YYYY-MM-DD
        const endDate = `${currentPeriod.substring(0, 4)}-${currentPeriod.substring(4, 6)}-${new Date(Number(currentPeriod.substring(0, 4)), Number(currentPeriod.substring(4, 6)), 0).getDate()}` // end date of the period format YYYY-MM-DD

        return { currentPeriod, startDate, endDate }
    }

    /**
     * Get current period in YYYYMM format
     */
    static getCurrentPeriod() {
        const now = new Date()
        return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`
    }

    /**
     * Get previous period in YYYYMM format
     */
    static getPreviousPeriod(period?: string) {
        const { currentPeriod } = this.getPeriodInfo(period)
        const year = Number(currentPeriod.substring(0, 4))
        const month = Number(currentPeriod.substring(4, 6))
        const prevMonth = month === 1 ? 12 : month - 1
        const prevYear = month === 1 ? year - 1 : year
        return `${prevYear}${String(prevMonth).padStart(2, '0')}`
    }

    /**
     * Get previous month start date in YYYY-MM-DD format
     */
    static getPreviousMonthStart(period?: string) {
        const { currentPeriod } = this.getPeriodInfo(period)
        const year = Number(currentPeriod.substring(0, 4))
        const month = Number(currentPeriod.substring(4, 6))
        const prevMonth = month === 1 ? 12 : month - 1
        const prevYear = month === 1 ? year - 1 : year
        return `${prevYear}-${String(prevMonth).padStart(2, '0')}-01`
    }

    /**
     * Get previous month end date in YYYY-MM-DD format
     */
    static getPreviousMonthEnd(period?: string) {
        const { currentPeriod } = this.getPeriodInfo(period)
        const year = Number(currentPeriod.substring(0, 4))
        const month = Number(currentPeriod.substring(4, 6))
        const prevMonth = month === 1 ? 12 : month - 1
        const prevYear = month === 1 ? year - 1 : year
        return `${prevYear}-${String(prevMonth).padStart(2, '0')}-${new Date(prevYear, prevMonth, 0).getDate()}`
    }

    private static monthNames = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ]

    /**
     * Get Indonesian month name from YYYY-MM or YYYYMM format
     */
    static getMonthName(period: string) {
        let monthStr = ''
        if (period.includes('-')) {
            monthStr = period.split('-')[1]
        } else if (period.length === 6) {
            monthStr = period.substring(4, 6)
        }

        const month = parseInt(monthStr)
        return this.monthNames[month - 1] || ''
    }

    /**
     * Get number of active days in the period
     * If current period, return current day
     * If past period, return total days in month
     */
    static getActiveDays(period: string) {
        if (period === this.getCurrentPeriod()) {
            return new Date().getDate()
        }

        const year = Number(period.substring(0, 4))
        const month = Number(period.substring(4, 6))
        return new Date(year, month, 0).getDate()
    }
}
