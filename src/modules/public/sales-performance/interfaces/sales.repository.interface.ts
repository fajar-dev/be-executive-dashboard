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
     * Replace the entire sales table with a fresh list (both access_home and access_business).
     * Existing rows are deleted before the new list is inserted.
     *
     * @param {SalesUpsertPayload[]} data - The full list of employees to store.
     * @returns {Promise<void>} A promise that resolves when the operation is complete.
     */
    replaceAll(data: SalesUpsertPayload[]): Promise<void>
}
