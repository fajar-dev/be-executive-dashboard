import { NusaworkService } from '../modules/nusawork/nusawork.service'
import { type IUserRepository } from '../modules/user/user.repository.interface'
import { ISalesRepository } from '../modules/public/sales-performance/interfaces/sales.repository.interface'

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

export async function syncSalesJob(salesRepository: ISalesRepository): Promise<void> {
    console.log('[SyncSales] Starting sync...')

    // Crawl both access_home and access_business sales, each stamped with its type.
    const [salesHome, salesBusiness] = await Promise.all([
        nusaworkService.getSalesHome(),
        nusaworkService.getSalesBusiness(),
    ])

    const sales = [...salesHome, ...salesBusiness]

    await salesRepository.upsert(
        sales.map(s => ({
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
            type: s.type,
        }))
    )

    console.log(`[SyncSales] Synced ${sales.length} sales (${salesHome.length} home, ${salesBusiness.length} business)`)
}
