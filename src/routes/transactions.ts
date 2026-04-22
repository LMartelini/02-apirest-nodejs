import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { knex } from '../database';
import { randomUUID } from 'node:crypto';
import { checkSessionIdExists } from '../middlewares/check-session-id-exists';

// TESTES AUTOMATIZADOS

// testes unitários: testa uma unidade da sua aplicação, uma pequena parte de forma isolada

// testes de integração: testa a comunicação entre duas ou mais unidades

// teste e2e - ponta a ponta: testes que simulam um usuário operando na nossa aplicação


// Pirâmide de testes: E2E (não dependem de nenhuma tecnologia, não dependem de arquitetura)
// 


// cookies <-> formas da gente manter contexto entre as requisições, ou seja, a gente consegue identificar que uma requisição é do mesmo usuário que fez a requisição anterior, mesmo que sejam requisições diferentes, isso é muito útil para autenticação e autorização

export async function transactionsRoutes(app: FastifyInstance) {
    app.addHook('preHandler', async(request) => {
        console.log(`[${request.method}] ${request.url}`)
    })

    app.get('/', 
    {
        preHandler: [checkSessionIdExists],
    }, 
    async(request) => {

        const { sessionId } = request.cookies
        
        const transactions = await knex('transactions')
            .where('session_id', sessionId)
            .select()

        return { transactions }
    })

    app.get('/:id', 
        {
            preHandler: [checkSessionIdExists],
        },
        async (request) => {
        const getTransactionParamsSchema = z.object({
            id: z.string().uuid(),

        })

        const { id } = getTransactionParamsSchema.parse(request.params)

        const { sessionId } = request.cookies

        const transaction = await knex('transactions')
            .where({
                session_id: sessionId,
                id,
            })
            .first()

        return { transaction }
    })

    app.get('/summary', 
    {
        preHandler: [checkSessionIdExists],
    },
    async(request) => {
        const { sessionId } = request.cookies

        const summary = await knex('transactions')
            .where('session_id', sessionId)
            .sum('amount', { as: 'amount' })
            .first()

        return { summary }
    })

    app.post('/', async (request, reply) => {
        // { title, amount, type: credit or debit }
        
        const createTransactionBodySchema = z.object({
            title: z.string(),
            amount: z.number(),
            type: z.enum(['credit', 'debit']),
        })
    
        const { title, amount, type } = createTransactionBodySchema.parse(request.body) 
        // parse por padrão já lança throw caso a validação falhe, ou seja, caso o body não esteja de acordo com o schema definido

        let sessionId = request.cookies.sessionId

        if (!sessionId) {
            sessionId = randomUUID()

            reply.cookie('sessionId', sessionId, {
                path: '/',
                maxAge: 60 * 60 * 24 * 7, // 7 days
            })
        }

        await knex('transactions').insert({
            id: randomUUID(),
            title,
            amount: type === 'credit' ? amount : amount * -1, // se for crédito, o valor é positivo, se for débito, o valor é negativo
            session_id: sessionId,
        })


        // http codes()
        // ao criar normalmente utilize 201 - Recurso criado com sucesso

        return reply.status(201).send()
    })
}