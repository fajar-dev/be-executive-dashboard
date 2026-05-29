import { IRetentionRepository } from '../interfaces/retention.repository.interface'
import { IRetentionService } from '../interfaces/retention.service.interface'

export class RetentionService implements IRetentionService {
    constructor(private readonly retentionRepository: IRetentionRepository) {}

    // Tambahkan method service di sini
}
