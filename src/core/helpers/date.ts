/**
 * Utility class for Date related operations
 */
export class DateHelper {
    /**
     * Get period information (YYYYMM and YYYY-MM-01)
     * @param period Optional period in YYYYMM format
     */
    static getPeriodInfo(period?: string) {
        const currentPeriod = period || this.getCurrentPeriod()
        const startDate = `${currentPeriod.substring(0, 4)}-${currentPeriod.substring(4, 6)}-01`
        
        return { currentPeriod, startDate }
    }

    /**
     * Get current period in YYYYMM format
     */
    static getCurrentPeriod() {
        const now = new Date()
        return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`
    }
}
