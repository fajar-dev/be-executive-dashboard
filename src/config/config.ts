/**
 * Global Application Configuration
 * All environment variables are centralized here
 */
export const config = {
    app: {
        port: Number(process.env.PORT) || 3000,
        appUrl: process.env.APP_URL || 'http://localhost:4000',
        env: process.env.NODE_ENV || 'development',
        jwtSecret: process.env.JWT_SECRET || 'supersecretkey',
        jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'superrefreshsecretkey',
        apiKey: process.env.API_KEY || 'secretapikey',
    },
    database: {
        dashboard: {
            host: process.env.DASHBOARD_DB_HOST || '127.0.0.1',
            port: Number(process.env.DASHBOARD_DB_PORT) || 3306,
            user: process.env.DASHBOARD_DB_USER || 'root',
            pass: process.env.DASHBOARD_DB_PASS || '',
            name: process.env.DASHBOARD_DB_NAME || 'dashboard',
            pool: Number(process.env.DASHBOARD_DB_POOL) || 10,
        },
        isx: {
            host: process.env.ISX_DB_HOST || '127.0.0.1',
            port: Number(process.env.ISX_DB_PORT) || 3306,
            user: process.env.ISX_DB_USER || 'root',
            pass: process.env.ISX_DB_PASSWORD || '',
            name: process.env.ISX_DB_NAME || 'isx',
            pool: Number(process.env.ISX_DB_POOL) || 10,
        },
        nusafiber: {
            host: process.env.NUSAFIBER_DB_HOST || '127.0.0.1',
            port: Number(process.env.NUSAFIBER_DB_PORT) || 3306,
            user: process.env.NUSAFIBER_DB_USER || 'root',
            pass: process.env.NUSAFIBER_DB_PASSWORD || '',
            name: process.env.NUSAFIBER_DB_NAME || 'nusafiber',
            pool: Number(process.env.NUSAFIBER_DB_POOL) || 10,
        }
    },
    google: {
        clientId: process.env.GOOGLE_CLIENT_ID || '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    },
    is5: {
        authUrl: process.env.IS5_AUTH_URL || '',
    },
    feedback: {
        scriptUrl: process.env.FEEDBACK_URL || '',
    }
}