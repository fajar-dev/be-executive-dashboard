/**
 * Serializer for revenue API responses
 */
export class RevenueSerializer {
    /**
     * Transform summary rows for API response
     *
     * @param {Array} rows - Raw summary rows from service
     * @returns {Array} Transformed summary rows
     */
    static summary(rows: { [key: string]: unknown }[]): { [key: string]: unknown }[] {
        return rows
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

    /**
     * Transform billing summary for API response
     *
     * @param {Object} data - Raw billing summary from service
     * @returns {Object} Transformed billing summary
     */
    static billingSummary(data: { total_paid: number; total_all: number }): { total_paid: number; total_all: number } {
        return data
    }
}
