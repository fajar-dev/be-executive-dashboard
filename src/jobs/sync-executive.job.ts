import { NusaworkService } from '../modules/nusawork/nusawork.service'
import { type IUserRepository } from '../modules/user/user.repository.interface'
import { ISalesHomeRepository } from '../modules/public/sales-performance/interfaces/sales-home.repository.interface'

const nusaworkService = new NusaworkService()

export async function syncExecutiveJob(userRepository: IUserRepository): Promise<void> {
    console.log('[SyncExecutive] Starting sync...')

    const executives = await nusaworkService.getExecutive()

    await userRepository.upsertByEmployeeId(
        executives.map(e => ({
            employeeId: e.employeeId,
            name: e.name,
            email: e.email,
            photo: e.photoProfile,
            jobPosition: e.jobPosition,
        }))
    )

    console.log(`[SyncExecutive] Synced ${executives.length} executives`)
}

export async function syncAdminJob(userRepository: IUserRepository): Promise<void> {
    console.log('[SyncAdmin] Starting sync...')

    const admins = await nusaworkService.getAdmin()

    await userRepository.upsertByEmployeeId(
        admins.map(a => ({
            employeeId: a.employeeId,
            name: a.name,
            email: a.email,
            photo: a.photoProfile,
            jobPosition: a.jobPosition,
        }))
    )

    console.log(`[SyncAdmin] Synced ${admins.length} admins`)
}

export async function syncSalesHomeJob(salesHomeRepository: ISalesHomeRepository): Promise<void> {
    console.log('[SyncSalesHome] Starting sync...')

    const salesHome = await nusaworkService.getSalesHome()

    await salesHomeRepository.upsert(
        salesHome.map(s => ({
            id: s.id,
            employeeId: s.employeeId,
            name: s.name,
            email: s.email,
            photoProfile: s.photoProfile,
            jobPosition: s.jobPosition,
            organizationName: s.organizationName,
            jobLevel: s.jobLevel,
            branchId: s.branchId,
            managerId: s.managerId,
            status: s.status,
        }))
    )

    console.log(`[SyncSalesHome] Synced ${salesHome.length} sales home`)
}
