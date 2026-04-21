import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'

const routes = new Hono()

routes.get('/', (c) => {
    return c.json({
        message: "Hello World"
    })
})

export default routes
