export class HomeConnectSerializer {
    static single(data: any) {
        const currentAC = data.current?.AC || 0
        const currentFR = data.current?.FR || 0
        const currentTotal = currentAC + currentFR

        const previousAC = data.lastMonth?.AC || 0
        const previousFR = data.lastMonth?.FR || 0
        const previousTotal = previousAC + previousFR

        const activePercentage = currentTotal > 0 ? (currentAC / currentTotal) * 100 : 0
        const trend = currentTotal >= previousTotal ? 'up' : 'down'

        return {
            trend: trend,
            active: currentTotal,
            activePrevious: previousTotal,
            activeGrowth: currentTotal - previousTotal,
            paid: currentAC,
            paidPercentage: activePercentage,
        }
    }
}
