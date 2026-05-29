import { IGrowthRepository } from '../interfaces/growth.repository.interface'
import { IGrowthService } from '../interfaces/growth.service.interface'

export class GrowthService implements IGrowthService {
    constructor(private readonly growthRepository: IGrowthRepository) {}

    // Tambahkan method service di sini
}
