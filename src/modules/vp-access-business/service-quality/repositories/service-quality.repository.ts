import { type Pool } from 'mysql2/promise'
import { IServiceQualityRepository } from '../interfaces/service-quality.repository.interface'

export class ServiceQualityRepository implements IServiceQualityRepository {
    constructor(
        private readonly nisDb: Pool
    ) {}

    // Add repository methods here
}
