export class HealthSerializer {
    static single(data: any) {
        return {
            churnRate: data.churnRate,
            sla: data.sla,
            collectionRate: data.collectionRate,
            tickets: data.tickets,
            arpu: data.arpu
        }
    }
}
