import { createPool, type Pool } from 'mysql2/promise'
import { config } from './config'

export const isxPool: Pool = createPool({
    host: config.database.isx.host,
    port: Number(config.database.isx.port),
    user: config.database.isx.user,
    password: config.database.isx.pass,
    database: config.database.isx.name,
    connectionLimit: Number(config.database.isx.pool),
    waitForConnections: true,
    queueLimit: 0,
})

export async function isxCheckConnection() {
    try {
        const connection = await isxPool.getConnection()
        await connection.query('SELECT 1')
        connection.release()
        console.log('ISX Database connection OK')
        return true
    } catch (error) {
        console.error('ISX Database connection FAILED:', error)
        return false
    }
}
