import { createPool, type Pool } from 'mysql2/promise'
import { config } from './config'

export const nusaprospectPool: Pool = createPool({
    host: config.database.nusaprospect.host,
    port: Number(config.database.nusaprospect.port),
    user: config.database.nusaprospect.user,
    password: config.database.nusaprospect.pass,
    database: config.database.nusaprospect.name,
    connectionLimit: Number(config.database.nusaprospect.pool),
    waitForConnections: true,
    queueLimit: 0,
})

export async function nusaprospectCheckConnection() {
    try {
        const connection = await nusaprospectPool.getConnection()
        await connection.query('SELECT 1')
        connection.release()
        console.log('NusaProspect Database connection OK')
        return true
    } catch (error) {
        console.error('NusaProspect Database connection FAILED:', error)
        return false
    }
}
