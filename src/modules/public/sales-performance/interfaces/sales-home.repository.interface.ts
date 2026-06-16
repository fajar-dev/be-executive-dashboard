export interface SalesHomeUpsertPayload {
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
}

/**
 * Interface defining contract for SalesHomeRepository operations.
 */
export interface ISalesHomeRepository {
    /**
     * Upsert a list of sales home employees.
     * 
     * @param {SalesHomeUpsertPayload[]} data - The list of employees to upsert.
     * @returns {Promise<void>} A promise that resolves when the operation is complete.
     */
    upsert(data: SalesHomeUpsertPayload[]): Promise<void>
}
