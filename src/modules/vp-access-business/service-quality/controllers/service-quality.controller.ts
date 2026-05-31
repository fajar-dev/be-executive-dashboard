import type { Context } from 'hono'
import { IServiceQualityService } from '../interfaces/service-quality.service.interface'

export class ServiceQualityController {
    constructor(
        private readonly service: IServiceQualityService
    ) {}

    // Add controller methods here
}
