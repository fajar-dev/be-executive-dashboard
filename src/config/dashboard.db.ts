import { createPool, type Pool } from 'mysql2/promise'
import { config } from './config'

export const dashboardPool: Pool = createPool({
    host: config.database.dashboard.host,
    port: Number(config.database.dashboard.port),
    user: config.database.dashboard.user,
    password: config.database.dashboard.pass,
    database: config.database.dashboard.name,
    connectionLimit: Number(config.database.dashboard.pool),
    waitForConnections: true,
    queueLimit: 0,
})

export async function dashboardCheckConnection() {
    try {
        const connection = await dashboardPool.getConnection()
        await connection.query('SELECT 1')
        connection.release()
        console.log('Dashboard Database connection OK')
        return true
    } catch (error) {
        console.error('Dashboard Database connection FAILED:', error)
        return false
    }
}
