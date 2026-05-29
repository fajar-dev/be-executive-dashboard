import { type Pool } from 'mysql2/promise'
import { IGrowthRepository } from '../interfaces/growth.repository.interface'

export class GrowthRepository implements IGrowthRepository {
    constructor(
        private readonly nisDb: Pool
    ) {}

    // Tambahkan method repository di sini
}
