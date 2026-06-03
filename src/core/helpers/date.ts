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

    /**
     * Get breakdown of period (month, year, quarter)
     */
    static getPeriodBreakdown(period?: string) {
        const currentPeriod = period || this.getCurrentPeriod()
        const year = Number(currentPeriod.substring(0, 4))
        const month = Number(currentPeriod.substring(4, 6))
        const quarter = Math.ceil(month / 3)
        const monthName = this.getMonthName(currentPeriod)

        return { month, year, quarter, monthName }
    }

    /**
     * Get active quarter start and end dates in YYYY-MM-DD format
     * If no period provided, uses current quarter
     */
    static getActiveQuarter(period?: string): { startDate: string; endDate: string } {
        const currentPeriod = period || this.getCurrentPeriod()
        const year = Number(currentPeriod.substring(0, 4))
        const month = Number(currentPeriod.substring(4, 6))
        const quarter = Math.ceil(month / 3)
        
        let startDate = ''
        let endDate = ''

        switch (quarter) {
            case 1:
                startDate = `${year}-01-01`
                endDate = `${year}-03-31`
                break
            case 2:
                startDate = `${year}-04-01`
                endDate = `${year}-06-30`
                break
            case 3:
                startDate = `${year}-07-01`
                endDate = `${year}-09-30`
                break
            case 4:
                startDate = `${year}-10-01`
                endDate = `${year}-12-31`
                break
        }

        return { startDate, endDate }
    }

    /**
     * Get active year start and end dates in YYYY-MM-DD format
     * If no period provided, uses current year
     */
    static getActiveYear(period?: string): { startDate: string; endDate: string } {
        const currentPeriod = period || this.getCurrentPeriod()
        const year = currentPeriod.substring(0, 4)
        return {
            startDate: `${year}-01-01`,
            endDate: `${year}-12-31`
        }
    }

    /**
     * Get previous quarter start and end dates in YYYY-MM-DD format
     */
    static getPreviousQuarterDates(period?: string): { startDate: string; endDate: string } {
        const currentPeriod = period || this.getCurrentPeriod()
        let year = Number(currentPeriod.substring(0, 4))
        const month = Number(currentPeriod.substring(4, 6))
        let quarter = Math.ceil(month / 3)
        
        quarter -= 1
        if (quarter === 0) {
            quarter = 4
            year -= 1
        }
        
        let startDate = ''
        let endDate = ''

        switch (quarter) {
            case 1:
                startDate = `${year}-01-01`
                endDate = `${year}-03-31`
                break
            case 2:
                startDate = `${year}-04-01`
                endDate = `${year}-06-30`
                break
            case 3:
                startDate = `${year}-07-01`
                endDate = `${year}-09-30`
                break
            case 4:
                startDate = `${year}-10-01`
                endDate = `${year}-12-31`
                break
        }

        return { startDate, endDate }
    }

    /**
     * Get previous year start and end dates in YYYY-MM-DD format
     */
    static getPreviousYearDates(period?: string): { startDate: string; endDate: string } {
        const currentPeriod = period || this.getCurrentPeriod()
        const prevYear = Number(currentPeriod.substring(0, 4)) - 1
        return {
            startDate: `${prevYear}-01-01`,
            endDate: `${prevYear}-12-31`
        }
    }

    /**
     * Get full dates info for a given period type (last, year, quarter, month)
     */
    static getDatesForPeriod(periodType: string) {
        let startDate = ''
        let endDate = ''
        let prevStartDate = ''
        let prevEndDate = ''
        let period = ''

        const currentPeriod = this.getCurrentPeriod()
        const currentYear = Number(currentPeriod.substring(0, 4))
        const currentMonth = Number(currentPeriod.substring(4, 6))

        if (periodType === 'last') {
            startDate = this.getPreviousMonthStart()
            endDate = this.getPreviousMonthEnd()

            const prevPeriodStr = this.getPreviousPeriod()
            prevStartDate = this.getPreviousMonthStart(prevPeriodStr)
            prevEndDate = this.getPreviousMonthEnd(prevPeriodStr)
            
            period = this.getMonthName(this.getPreviousPeriod())
        } else if (periodType === 'year') {
            const periodInfo = this.getActiveYear()
            startDate = periodInfo.startDate
            endDate = periodInfo.endDate

            const prevInfo = this.getPreviousYearDates()
            prevStartDate = prevInfo.startDate
            prevEndDate = prevInfo.endDate
            
            period = String(currentYear)
        } else if (periodType === 'quarter') {
            const periodInfo = this.getActiveQuarter()
            startDate = periodInfo.startDate
            endDate = periodInfo.endDate

            const prevInfo = this.getPreviousQuarterDates()
            prevStartDate = prevInfo.startDate
            prevEndDate = prevInfo.endDate
            
            period = `Q${Math.ceil(currentMonth / 3)}`
        } else {
            // Default to month
            const periodInfo = this.getPeriodInfo()
            startDate = periodInfo.startDate
            endDate = periodInfo.endDate

            prevStartDate = this.getPreviousMonthStart()
            prevEndDate = this.getPreviousMonthEnd()
            
            period = 'Bulan Ini'
        }

        return { startDate, endDate, prevStartDate, prevEndDate, period }
    }
}
