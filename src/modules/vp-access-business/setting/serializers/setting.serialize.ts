export class SettingSerializer {
    static revenue(data: { total: number, details: { month: number, total: number }[] }) {
        return {
            total: data.total,
            details: data.details
        }
    }

    static targetLog(data: any[]) {
        return data.map(item => {
            let oldVal = item.old_value;
            if (typeof oldVal === 'string') {
                try { oldVal = JSON.parse(oldVal); } catch (e) { oldVal = null; }
            }
            
            let newVal = item.new_value;
            if (typeof newVal === 'string') {
                try { newVal = JSON.parse(newVal); } catch (e) { newVal = null; }
            }

            return {
                id: item.id,
                year: item.year,
                reason: item.reason,
                oldValue: oldVal && Object.keys(oldVal).length > 0 ? {
                    yearlyTarget: oldVal.yearly_target,
                    jan: oldVal.jan,
                    feb: oldVal.feb,
                    mar: oldVal.mar,
                    apr: oldVal.apr,
                    may: oldVal.may,
                    jun: oldVal.jun,
                    jul: oldVal.jul,
                    aug: oldVal.aug,
                    sep: oldVal.sep,
                    oct: oldVal.oct,
                    nov: oldVal.nov,
                    dec: oldVal.dec,
                } : null,
                newValue: newVal && Object.keys(newVal).length > 0 ? {
                    yearlyTarget: newVal.yearly_target,
                    jan: newVal.jan,
                    feb: newVal.feb,
                    mar: newVal.mar,
                    apr: newVal.apr,
                    may: newVal.may,
                    jun: newVal.jun,
                    jul: newVal.jul,
                    aug: newVal.aug,
                    sep: newVal.sep,
                    oct: newVal.oct,
                    nov: newVal.nov,
                    dec: newVal.dec,
                } : null,
                createdAt: item.created_at,
                updatedAt: item.updated_at,
                createdByName: item.created_by_name,
                updatedByName: item.updated_by_name
            }
        })
    }
}
