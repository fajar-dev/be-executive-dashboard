export class NocSerializer {
    static single(data: number) {
        return {
            openTickets: data,
            statusMessage: data > 0 ? `${data} area jaringan mengalami degradasi` : "Semua jaringan normal"
        }
    }
}
