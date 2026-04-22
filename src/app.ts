import fastify from 'fastify';
import { transactionsRoutes } from './routes/transactions';
import cookie from '@fastify/cookie'

export const app = fastify();


// GET, POST, PUT, PATCH, DELETE

// http://localhost:3333/hello

app.register(cookie)
app.register(transactionsRoutes, {
    prefix: 'transactions'
}) 