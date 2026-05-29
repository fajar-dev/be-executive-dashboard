import { Context } from 'hono'
import { IGrowthService } from '../interfaces/growth.service.interface'
import { ApiResponse } from '../../../../core/helpers/response'

export class GrowthController {
    constructor(private readonly service: IGrowthService) {}

    // Tambahkan method controller di sini
}
