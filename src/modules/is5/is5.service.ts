import axios from 'axios'
import { config } from '../../config/config'
import { IIs5Service } from './is5.service.interface'

export class Is5Service implements IIs5Service {
    async auth(employeeId: string, password: string): Promise<boolean> {
        try {
            const response = await axios.post(config.is5.authUrl, {
                username: employeeId,
                password,
            }, {
                validateStatus: () => true
            })
            return response.status === 201
        } catch {
            return false
        }
    }
}
