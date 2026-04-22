/**
 * Utility class for formatting values
 */
export class Formatter {
    /**
     * Format number as currency (default IDR)
     */
    static currency(value: number, currency: string = 'IDR'): string {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0
        }).format(value)
    }

    /**
     * Format number as percentage
     */
    static percentage(value: number): string {
        return `${Number(value.toFixed(2))}%`
    }

    /**
     * Format number as human readable (e.g. 1.000)
     */
    static number(value: number): string {
        return new Intl.NumberFormat('id-ID').format(value)
    }
}
