import { Hono } from 'hono'
import { cors } from 'hono/cors'
import api from './routes/api'
import { ApiResponse } from './core/helpers/response'
import { BaseException } from './core/exceptions/base'
import { config } from './config/config'
import { dashboardCheckConnection } from './config/dashboard.db'
import { isxCheckConnection } from './config/isx.db'
import { nusafiberCheckConnection } from './config/nusafiber.db'
import { swaggerUI } from '@hono/swagger-ui'
import { serveStatic } from 'hono/bun'

// Check Database Connections
dashboardCheckConnection()
isxCheckConnection()
// nusafiberCheckConnection()

const app = new Hono()

// CORS
app.use('*', cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}))

// Application Routes
app.route('/api', api)


// Swagger UI
app.get('/api/swagger.yaml', serveStatic({ path: './swagger.yaml' }))
app.get('/api/docs', swaggerUI({ url: '/api/swagger.yaml' }))


// Global Error Handler
app.onError((err, c) => {
    if (err instanceof BaseException) {
        console.error(`[Exception] ${err.status} - ${err.message}`)
        return ApiResponse.error(c, err.message, err.status, err.context)
    }

    console.error("error: ", err.message)

    const errors = config.app.env !== "production" ? { 
        message: err.message, 
        stack: err.stack 
    } : null

    return ApiResponse.error(c, "Internal Server Error", 500, errors)
})

export default {
  port: config.app.port,
  fetch: app.fetch,
  idleTimeout: 60, // seconds
};