import { createPool, type Pool } from 'mysql2/promise'
import { config } from './config'

export const nusafiberPool: Pool = createPool({
    host: config.database.nusafiber.host,
    port: Number(config.database.nusafiber.port),
    user: config.database.nusafiber.user,
    password: config.database.nusafiber.pass,
    database: config.database.nusafiber.name,
    connectionLimit: Number(config.database.nusafiber.pool),
    waitForConnections: true,
    queueLimit: 0,
})

export async function nusafiberCheckConnection() {
    try {
        const connection = await nusafiberPool.getConnection()
        await connection.query('SELECT 1')
        connection.release()
        console.log('NusaFiber Database connection OK')
        return true
    } catch (error) {
        console.error('NusaFiber Database connection FAILED:', error)
        return false
    }
}
