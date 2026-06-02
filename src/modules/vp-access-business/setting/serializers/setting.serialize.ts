export class SettingSerializer {
    static revenue(data: { total: number, details: { month: number, total: number }[] }) {
        return {
            total: data.total,
            details: data.details
        }
    }
}
