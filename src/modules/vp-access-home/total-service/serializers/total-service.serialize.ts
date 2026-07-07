/**
 * Serializer for total service API responses
 * Handles period format conversion from MMYY to YYYY-MM
 */
export class TotalServiceSerializer {
    /**
     * Convert period from MMYY format to YYYY-MM format
     * Example: '0125' → '2025-01'
     *
     * @param {string} period - Period in MMYY format
     * @returns {string} Period in YYYY-MM format
     */
    static convertPeriodToISO(period: string): string {
        const mm = period.substring(0, 2)
        const yy = period.substring(2, 4)
        const fullYear = Number(yy) >= 50 ? `19${yy}` : `20${yy}`
        return `${fullYear}-${mm}`
    }

    /**
     * Transform summary rows, converting period format from MMYY to YYYY-MM
     *
     * @param {Array} rows - Raw summary rows from service
     * @returns {Array} Transformed rows with ISO period format
     */
    static summary(rows: { period: string; [key: string]: unknown }[]): { period: string; [key: string]: unknown }[] {
        return rows.map(row => ({
            ...row,
            period: this.convertPeriodToISO(row.period)
        }))
    }

    /**
     * Transform detail rows for API response
     *
     * @param {Array} rows - Raw detail rows from service
     * @returns {Array} Transformed detail rows
     */
    static detail(rows: { [key: string]: unknown }[]): { [key: string]: unknown }[] {
        return rows
    }
}
