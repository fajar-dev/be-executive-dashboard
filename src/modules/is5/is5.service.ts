import axios from 'axios'
import { config } from '../../config/config'

export class Is5Service {
    async auth(employeeId: string, password: string) {
        try {
            const response = await axios.post(config.is5.authUrl, {
                username: employeeId,
                password,
            }, {
                validateStatus: () => true
            })
            return response.status === 201
        } catch (error) {
            return false
        }
    }
}
