import { NusaworkService } from '../modules/nusawork/nusawork.service'
import { type IUserRepository } from '../modules/user/user.repository.interface'

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
        }))
    )

    console.log(`[SyncAdmin] Synced ${admins.length} admins`)
}
