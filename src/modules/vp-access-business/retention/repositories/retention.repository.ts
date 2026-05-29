import { type Pool } from 'mysql2/promise'
import { IRetentionRepository } from '../interfaces/retention.repository.interface'

export class RetentionRepository implements IRetentionRepository {
    constructor(
        private readonly nisDb: Pool
    ) {}

    // Tambahkan method repository di sini
}
