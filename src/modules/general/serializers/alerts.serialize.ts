export class AlertsSerializer {
    static single(data: any) {
        return {
            issues: data.issues.map((i: any) => ({
                branch: i.branch,
                status: i.status,
                totalIssues: Number(i.total_issues),
                totalEffectedCustomers: Number(i.total_effected_customers),
                lastStartedAt: i.last_started_at
            })),
            overdue: data.overdue.map((o: any) => ({
                type: o.type,
                totalExpDays: Number(o.total_exp_days),
                totalInvoices: Number(o.total_invoices),
                amount: Number(o.amount)
            })),
            renewals: data.renewals.map((r: any) => ({
                serviceGroup: r.service_group,
                totalServices: Number(r.total_services),
                amount: Number(r.amount),
                totalInvoices: Number(r.total_invoices),
                totalRenewal: Number(r.total_renewal),
                totalNewSubscription: Number(r.total_new_subscription)
            }))
        }
    }
}
