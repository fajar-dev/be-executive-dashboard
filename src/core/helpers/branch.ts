/**
 * Helper for building the branch WHERE fragment used by VP Access Business dashboards.
 *
 * BranchId is always '020' (hardcoded in each query). The branch filter is expressed
 * through DisplayBranchId, driven by the `displayBranchId` request value:
 *   - '' or 'all'  -> no DisplayBranchId filter (all branches under HO)
 *   - 'null'       -> DisplayBranchId IS NULL (Medan / HO)
 *   - '025'|'062'|'027'|'029' -> DisplayBranchId = value (Jakarta, Bali, Binjai, Tanjung Morawa)
 */
export class BranchHelper {
    /**
     * Build the parameterized DisplayBranchId WHERE fragment.
     * The fragment references the Customer table alias `c` and expects three positional
     * params bound to the same `displayBranchId` value (spread `params` where the old
     * single branch param used to sit).
     *
     * @param {string} displayBranchId - The raw selector ('', 'all', 'null', or a branch code)
     * @returns {{ sql: string, params: string[] }} SQL fragment and its bind params
     */
    static displayFilter(displayBranchId: string): { sql: string, params: string[] } {
        const value = displayBranchId ?? ''
        return {
            sql: `(? IN ('', 'all') OR (? = 'null' AND c.DisplayBranchId IS NULL) OR c.DisplayBranchId = ?)`,
            params: [value, value, value]
        }
    }
}
