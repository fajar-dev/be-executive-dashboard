import { Context } from 'hono'
import { IRetentionService } from '../interfaces/retention.service.interface'
import { ApiResponse } from '../../../../core/helpers/response'

export class RetentionController {
    constructor(private readonly service: IRetentionService) {}

    // Tambahkan method controller di sini
}
