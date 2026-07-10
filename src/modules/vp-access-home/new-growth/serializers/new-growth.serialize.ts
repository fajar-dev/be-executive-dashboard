/**
 * Serializer for new growth API responses
 */
export class NewGrowthSerializer {
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
}
