import { Pool } from 'mysql2/promise'
import { ISettingRepository } from '../interfaces/setting.repository.interface'

export class SettingRepository implements ISettingRepository {
    constructor(
        private readonly nisDb: Pool,
        private readonly prospectDb: Pool
    ) {}
}
