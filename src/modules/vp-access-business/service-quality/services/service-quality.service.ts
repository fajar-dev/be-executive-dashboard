import { IServiceQualityService } from '../interfaces/service-quality.service.interface'
import { IServiceQualityRepository } from '../interfaces/service-quality.repository.interface'

export class ServiceQualityService implements IServiceQualityService {
    constructor(
        private readonly serviceQualityRepository: IServiceQualityRepository
    ) {}

    // Add service methods here
}
