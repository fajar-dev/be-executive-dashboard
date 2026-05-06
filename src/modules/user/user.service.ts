import { NotFoundException } from '../../core/exceptions/base'
import { IUserRepository } from './user.repository.interface'
import { IUserService } from './user.service.interface'

export class UserService implements IUserService {
    constructor(private readonly userRepository: IUserRepository) {}

    async getById(id: number) {
        const user = await this.userRepository.findById(id)
        if (!user) throw new NotFoundException('User not found')
        return user
    }

    async getByEmId(employeeId: string) {
        const user = await this.userRepository.findByEmployeeId(employeeId)
        if (!user) throw new NotFoundException('User not found')
        return user
    }

    async getByEmail(email: string) {
        const user = await this.userRepository.findByEmail(email)
        if (!user) throw new NotFoundException('User not found')
        return user
    }
}
