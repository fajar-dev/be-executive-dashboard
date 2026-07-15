export class SettingSerializer {
    static revenue(data: { total: number, details: { month: number, total: number }[] }) {
        return {
            total: data.total,
            details: data.details
        }
    }

    static target(data: any) {
        if (!data) return null
        return {
            year: data.year,
            branch: data.branch,
            yearlyTarget: data.yearly_target,
            jan: data.jan,
            feb: data.feb,
            mar: data.mar,
            apr: data.apr,
            may: data.may,
            jun: data.jun,
            jul: data.jul,
            aug: data.aug,
            sep: data.sep,
            oct: data.oct,
            nov: data.nov,
            dec: data.dec,
            isLocked: data.is_locked,
            updatedAt: data.updated_at,
            updatedBy: data.updated_by
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
                branch: item.branch,
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
                createdBy: item.c_id ? {
                    id: item.c_id,
                    name: item.c_name,
                    email: item.c_email,
                    photo: item.c_photo,
                    jobPosition: item.c_job_position
                } : null,
                updatedBy: item.u_id ? {
                    id: item.u_id,
                    name: item.u_name,
                    email: item.u_email,
                    photo: item.u_photo,
                    jobPosition: item.u_job_position
                } : null
            }
        })
    }
}
