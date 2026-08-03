import { SalesType } from '../../../nusawork/nusawork.service.interface'

export interface SalesUpsertPayload {
    id: number
    employeeId: string
    name: string
    email: string
    photoProfile: string
    jobPosition?: string
    organizationName?: string
    jobLevel?: string
    branchId?: string
    managerId?: number
    status?: string
    type: SalesType
}

/**
 * Interface defining contract for SalesRepository operations.
 */
export interface ISalesRepository {
    /**
     * Upsert a list of sales employees (both access_home and access_business).
     *
     * @param {SalesUpsertPayload[]} data - The list of employees to upsert.
     * @returns {Promise<void>} A promise that resolves when the operation is complete.
     */
    upsert(data: SalesUpsertPayload[]): Promise<void>
}
