export class AlertsSerializer {
    static single(data: any) {
        const result: any[] = []

        const issues = data.issues?.[0]
        if (issues?.total_issues) {
            result.push({
                type: 'danger',
                title: 'Gangguan Jaringan Aktif',
                content: `${issues.total_issues} NOC issue. ${issues.total_effected_customers ?? 0} pelanggan terdampak`
            })
        }

        const overdue = data.overdue?.[0]
        if (overdue?.total_invoices) {
            const amount = Number(overdue.total_amount || 0).toLocaleString('id-ID')
            result.push({
                type: 'warning',
                title: 'Invoice Jatuh Tempo',
                content: `Rp ${amount} outstanding dari ${overdue.total_invoices} invoice pada ${overdue.total_type ?? 0} jenis bisnis operasi`
            })
        }

        const renewal = data.renewals?.[0]
        if (renewal?.total_invoices) {
            const amount = Number(renewal.amount || 0).toLocaleString('id-ID')
            result.push({
                type: 'info',
                title: `Total Renewal - ${renewal.total_renewal ?? 0} perusahaan`,
                content: `${renewal.total_invoices} invoice. Total ARR: Rp ${amount}`
            })
        }

        return result
    }
}
