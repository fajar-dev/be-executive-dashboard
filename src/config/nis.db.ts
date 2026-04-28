import { createPool, type Pool } from 'mysql2/promise'
import { config } from './config'

export const nisPool: Pool = createPool({
    host: config.database.nis.host,
    port: Number(config.database.nis.port),
    user: config.database.nis.user,
    password: config.database.nis.pass,
    database: config.database.nis.name,
    connectionLimit: Number(config.database.nis.pool),
    waitForConnections: true,
    queueLimit: 0,
})

export async function nisCheckConnection() {
    try {
        const connection = await nisPool.getConnection()
        await connection.query('SELECT 1')
        connection.release()
        console.log('NIS Database connection OK')
        return true
    } catch (error) {
        console.error('NIS Database connection FAILED:', error)
        return false
    }
}
