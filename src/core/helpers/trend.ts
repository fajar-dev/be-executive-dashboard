export class TrendHelper {
    /**
     * Calculate trend and percentage based on current and previous values
     * @param current The current period value
     * @param previous The previous period value
     * @param useAbsolute Whether to use absolute values (e.g., for revenue/loss comparison)
     */
    static calculate(current: number, previous: number, useAbsolute: boolean = false): { trend: 'up' | 'down', percentage: number } {
        const valCurrent = useAbsolute ? Math.abs(current) : current
        const valPrevious = useAbsolute ? Math.abs(previous) : previous

        let percentage = 0
        if (valPrevious > 0) {
            percentage = ((valCurrent - valPrevious) / valPrevious) * 100
        } else if (valCurrent > 0) {
            percentage = 100
        }

        const trend = valCurrent >= valPrevious ? 'up' : 'down'

        return { trend, percentage }
    }
}
